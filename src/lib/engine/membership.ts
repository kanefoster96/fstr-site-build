import "server-only";
import type { DataStore, Member, Subscription, AvailabilityFlag, Pence } from "../types";
import { addDays } from "../format";
import { maybeRewardReferrer, refreshMember } from "./gamification";

/** Seats, scarcity, the pricing ladder (§6). */

export function priceForSeat(db: DataStore, seat: number): Pence {
  const band = db.settings.pricing_ladder.find((b) => seat >= b.from_seat && seat <= b.to_seat);
  return band?.price ?? db.settings.current_rate;
}

export function seatsFilled(db: DataStore): number {
  return db.members.filter(
    (m) => m.role === "member" && m.seat_number != null && (m.status === "active" || m.status === "paused"),
  ).length;
}

/** Lowest free seat number, or null if full. */
export function nextFreeSeat(db: DataStore): number | null {
  const taken = new Set(
    db.members
      .filter((m) => m.role === "member" && m.seat_number != null && m.status !== "cancelled")
      .map((m) => m.seat_number as number),
  );
  for (let s = 1; s <= db.settings.total_seats; s++) {
    if (!taken.has(s)) return s;
  }
  return null;
}

export interface JoinInput {
  name: string;
  email: string;
  phone: string;
  availability: AvailabilityFlag[];
  cycleWeeks?: number;
  avatarUrl?: string | null;
  usualCut?: string;
  frequencyWeeks?: number;
}

export interface JoinResult {
  member: Member;
  subscription: Subscription;
  seat: number;
  rate: Pence;
}

/**
 * Create an account and open a subscription. The first token is minted by the
 * first successful billing webhook (invoice.paid), not here — so the token
 * lifecycle always begins from a real payment event, exactly as it will with
 * Stripe. Returns null seat if membership is full (caller routes to waitlist).
 */
export function join(db: DataStore, input: JoinInput): JoinResult | null {
  const seat = nextFreeSeat(db);
  if (seat == null) return null;
  const rate = priceForSeat(db, seat);
  const id = `mem_${seat}_${Date.now().toString(36)}`;
  const member: Member = {
    id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    avatar_url: input.avatarUrl ?? null,
    availability_profile: input.availability,
    joined_at: db.clock.now,
    seat_number: seat,
    status: "active",
    role: "member",
    usual_cut: input.usualCut,
    cut_frequency_weeks: input.frequencyWeeks,
    streak_months: 0,
    badges: seat <= 50 ? ["Founding Member"] : [],
  };
  const cycle = input.cycleWeeks ?? db.settings.default_cycle_weeks;
  const subscription: Subscription = {
    id: `sub_${id}`,
    member_id: id,
    tier: "monthly",
    price_locked: rate,
    billing_day: new Date(db.clock.now).getUTCDate(),
    cycle_weeks: cycle,
    last_billing_at: db.clock.now,
    next_billing_at: addDays(db.clock.now, cycle * 7),
    plan_locked_until_next_billing: false,
    status: "active",
    started_at: db.clock.now,
    cancel_effective_at: null,
    reclaim_deadline: null,
    past_due_since: null,
    retry_count: 0,
  };
  db.members.push(member);
  db.subscriptions.push(subscription);
  maybeRewardReferrer(db, member.email); // arrived via a mate's gift?
  refreshMember(db, member);
  return { member, subscription, seat, rate };
}

export interface GuestInput {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  usualCut?: string;
  frequencyWeeks?: number;
}

/**
 * Create an account with a login but no subscription yet — a "guest" who
 * skipped or is trying a one-off. They get a personalised dashboard (0 tokens,
 * available dates, prompt to book) and can upgrade to membership any time.
 */
export function createGuestAccount(db: DataStore, input: GuestInput): Member {
  const id = `mem_guest_${Date.now().toString(36)}_${db.members.length}`;
  const member: Member = {
    id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? "",
    avatar_url: input.avatarUrl ?? null,
    availability_profile: [],
    joined_at: db.clock.now,
    seat_number: null, // no seat until they subscribe
    status: "active",
    role: "member",
    usual_cut: input.usualCut,
    cut_frequency_weeks: input.frequencyWeeks,
    streak_months: 0,
    badges: [],
  };
  db.members.push(member);
  return member;
}

export function hasSubscription(db: DataStore, memberId: string): boolean {
  return db.subscriptions.some((s) => s.member_id === memberId && s.status !== "cancelled");
}

/** Record the credit a one-off trial earns toward a same-day membership. */
export function grantTrialCredit(db: DataStore, memberId: string, credit: Pence): void {
  const m = db.members.find((x) => x.id === memberId);
  if (m) {
    m.trial_credit = credit;
    m.trial_credit_expires = addDays(db.clock.now, 1);
  }
}

/**
 * Upgrade a guest to full membership: assign a seat + subscription at the
 * chosen cadence. Returns null if membership is full.
 */
export function upgradeToMembership(
  db: DataStore,
  memberId: string,
  cycleWeeks?: number,
): { seat: number; rate: Pence } | null {
  const m = db.members.find((x) => x.id === memberId);
  if (!m) return null;
  if (hasSubscription(db, memberId)) {
    const sub = db.subscriptions.find((s) => s.member_id === memberId)!;
    return { seat: m.seat_number ?? 0, rate: sub.price_locked };
  }
  const seat = nextFreeSeat(db);
  if (seat == null) return null;
  const rate = priceForSeat(db, seat);
  const cycle = cycleWeeks ?? db.settings.default_cycle_weeks;
  m.seat_number = seat;
  if (seat <= 50 && !(m.badges ?? []).includes("Founding Member")) {
    m.badges = [...(m.badges ?? []), "Founding Member"];
  }
  db.subscriptions.push({
    id: `sub_${memberId}`,
    member_id: memberId,
    tier: "monthly",
    price_locked: rate,
    billing_day: new Date(db.clock.now).getUTCDate(),
    cycle_weeks: cycle,
    last_billing_at: db.clock.now,
    next_billing_at: addDays(db.clock.now, cycle * 7),
    plan_locked_until_next_billing: false,
    status: "active",
    started_at: db.clock.now,
    cancel_effective_at: null,
    reclaim_deadline: null,
    past_due_since: null,
    retry_count: 0,
  });
  maybeRewardReferrer(db, m.email); // trial user who was gifted → reward gifter
  refreshMember(db, m);
  return { seat, rate };
}

/** Cancel flow numbers, computed live for the retention screen (§7). */
export function cancelStats(db: DataStore, memberId: string): {
  lockedRate: Pence;
  currentRate: Pence;
  yearlyDelta: Pence;
  cutsHad: number;
  saved: Pence;
} {
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  const lockedRate = sub?.price_locked ?? db.settings.current_rate;
  const currentRate = db.settings.current_rate;
  const cutsHad = db.tokens.filter((t) => t.member_id === memberId && t.state === "REDEEMED").length;
  return {
    lockedRate,
    currentRate,
    yearlyDelta: (currentRate - lockedRate) * 12,
    cutsHad,
    saved: cutsHad * Math.max(0, db.settings.oneoff_price - lockedRate),
  };
}

export class PlanError extends Error {}

/**
 * Change billing cadence (2/3/4/5/6-week plan). Allowed once per billing cycle.
 * Recomputes the next mint from the last billing date so switching to a shorter
 * plan brings the next token sooner, a longer plan pushes it out.
 */
export function changePlan(db: DataStore, memberId: string, cycleWeeks: number): Subscription {
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  if (!sub) throw new PlanError("No subscription.");
  if (!db.settings.plans.includes(cycleWeeks)) throw new PlanError("That plan isn't offered.");
  if (sub.plan_locked_until_next_billing) {
    throw new PlanError("You can change plan once per cycle — next change after your next token.");
  }
  if (cycleWeeks === sub.cycle_weeks) return sub;
  sub.cycle_weeks = cycleWeeks;
  sub.plan_locked_until_next_billing = true;
  const base = sub.last_billing_at ?? db.clock.now;
  const next = addDays(base, cycleWeeks * 7);
  // Never schedule a mint in the past — if the new date has passed, mint next day.
  sub.next_billing_at = new Date(next) < new Date(db.clock.now) ? addDays(db.clock.now, 1) : next;
  return sub;
}

export function pauseMembership(db: DataStore, memberId: string): void {
  const m = db.members.find((x) => x.id === memberId);
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  if (m) m.status = "paused";
  if (sub) sub.status = "paused";
}

export function cancelMembership(db: DataStore, memberId: string): void {
  const m = db.members.find((x) => x.id === memberId);
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  // Tokens are kept (§4.7) — unexpired tokens remain usable to their expiry.
  if (sub) {
    sub.status = "cancelled";
    sub.cancel_effective_at = db.clock.now;
    sub.reclaim_deadline = addDays(db.clock.now, db.settings.rules.reclaim_window_days);
  }
  if (m) m.status = "cancelled"; // seat releases after the reclaim window
}
