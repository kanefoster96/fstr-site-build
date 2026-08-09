import "server-only";
import type { DataStore, Member } from "../types";
import { daysBetween } from "../format";
import { mintToken, heldCount, logToken } from "./tokens";
import { sendMail } from "../adapters/mail";
import { streakMilestoneEmail } from "../emails";

/**
 * Gamification (§11) — one currency, two uses, everything else decoration:
 * streaks, milestone rewards, and the referral loop. Automated so advancing
 * the dev clock produces the badges and bonus tokens on schedule.
 */

const MONTH_DAYS = 30.44;

/** Bonus tokens queue if the wallet's full, then release as room frees. */
function queueBonus(member: Member, n = 1): void {
  member.pending_bonus = (member.pending_bonus ?? 0) + n;
}

function releaseQueuedBonus(db: DataStore, member: Member): number {
  let released = 0;
  while ((member.pending_bonus ?? 0) > 0 && heldCount(db, member.id) < db.settings.rules.max_held) {
    const t = mintToken(db, member.id, "referral_reward");
    logToken(db, t.id, "issued", "system", { bonus: true });
    member.pending_bonus = (member.pending_bonus ?? 0) - 1;
    released++;
  }
  return released;
}

/**
 * Recompute a member's streak and award milestone badges/rewards.
 * 6 months → priority booking (sees releases 24h early).
 * 12 months → a free cut (bonus token, queues if the wallet's full).
 */
export function refreshMember(db: DataStore, member: Member): void {
  if (member.role !== "member") return;
  const sub = db.subscriptions.find((s) => s.member_id === member.id);
  if (!sub || sub.status === "cancelled") {
    releaseQueuedBonus(db, member);
    return;
  }
  const months = Math.floor(daysBetween(sub.started_at, db.clock.now) / MONTH_DAYS);
  member.streak_months = Math.max(member.streak_months ?? 0, months);

  const prev = new Set(member.badges ?? []);
  const badges = new Set(member.badges ?? []);
  if ((member.seat_number ?? 999) <= 50) badges.add("Founding Member");
  if (months >= 6) badges.add("6 Months");
  if (months >= 12 && !badges.has("12 Months")) {
    badges.add("12 Months");
    queueBonus(member, 1); // a free cut on your first year
  }
  member.badges = [...badges];
  // Celebrate a newly-earned milestone once.
  for (const milestone of ["6 Months", "12 Months"]) {
    if (!prev.has(milestone) && badges.has(milestone)) {
      sendMail(db, "streak_milestone", member.email, streakMilestoneEmail(member.name, milestone));
    }
  }
  releaseQueuedBonus(db, member);
}

/** Whether a member gets priority (24h early) slot access. */
export function hasPriority(member: Member | undefined): boolean {
  const b = member?.badges ?? [];
  return b.includes("6 Months") || b.includes("12 Months");
}

/** Reward a member for a referral: a bonus token + the Referrer badge. */
export function rewardReferral(db: DataStore, gifterId: string): void {
  const m = db.members.find((x) => x.id === gifterId);
  if (!m) return;
  const badges = new Set(m.badges ?? []);
  badges.add("Referrer");
  m.badges = [...badges];
  queueBonus(m, 1);
  releaseQueuedBonus(db, m);
}

/**
 * When someone becomes a member, check whether they arrived via a gift — if so,
 * the gifter earns a referral reward. Matches on the recipient's email.
 */
export function maybeRewardReferrer(db: DataStore, newMemberEmail: string): void {
  const email = newMemberEmail.trim().toLowerCase();
  if (!email) return;
  const gift = db.gifts.find(
    (g) => !g.converted && g.to_contact.trim().toLowerCase() === email,
  );
  if (gift) {
    gift.converted = true;
    rewardReferral(db, gift.from_member_id);
  }
}

/** Run streak/bonus upkeep across all members (called on each clock tick). */
export function refreshAll(db: DataStore): void {
  for (const m of db.members) refreshMember(db, m);
}
