import "server-only";
import type { DataStore, Subscription } from "../types";
import { mintToken, heldCount, logToken } from "../engine/tokens";
import { sendMail } from "./mail";
import {
  tokenMintedEmail,
  paymentFailedEmail,
  welcomeEmail,
} from "../emails";
import { fmtMonthDay, addDays } from "../format";

/**
 * PaymentsAdapter (mock Stripe). We simulate the webhook events that Stripe
 * would send — invoice.paid and invoice.payment_failed — and let them drive
 * the whole token lifecycle. The /dev panel fires these manually so the flow
 * can be demonstrated end-to-end. Swap this for real Stripe + a webhook route
 * later; the event handlers below are the contract.
 */

export interface WebhookResult {
  ok: boolean;
  message: string;
  minted?: string;
}

/** invoice.paid — §4.1 mint one token; §4.3 never charge into a full wallet. */
export function invoicePaid(db: DataStore, memberId: string, isFirst = false): WebhookResult {
  const member = db.members.find((m) => m.id === memberId);
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  if (!member || !sub) return { ok: false, message: "No such member/subscription." };

  // Clear any past-due state on a successful charge.
  if (sub.status === "past_due") {
    sub.status = "active";
    sub.past_due_since = null;
    sub.retry_count = 0;
  }

  // §4.3 — if the member already holds 2, pause billing for this cycle.
  if (heldCount(db, memberId) >= db.settings.rules.max_held) {
    // Represent "nothing charged, nothing minted" — log against the newest token.
    const newest = db.tokens
      .filter((t) => t.member_id === memberId)
      .sort((a, b) => Date.parse(b.issued_at) - Date.parse(a.issued_at))[0];
    if (newest) {
      logToken(db, newest.id, "billing_paused_wallet_full", "system", {
        held: heldCount(db, memberId),
      });
    }
    return {
      ok: true,
      message: `Account full (${db.settings.rules.max_held} held) — nothing charged, nothing minted this cycle. Suggest switching to a longer plan.`,
    };
  }

  const token = mintToken(db, memberId, "subscription");

  // Attach to a pending prebook if one is waiting (§5 prebook).
  const prebook = db.bookings.find(
    (b) => b.member_id === memberId && b.kind === "prebook_pending" && b.status === "pending",
  );
  if (prebook) {
    prebook.token_id = token.id;
    prebook.status = "confirmed";
    prebook.kind = "member";
    token.state = "RESERVED";
    token.frozen_at = db.clock.now;
    token.booking_id = prebook.id;
    logToken(db, token.id, "reserved", "system", { via: "prebook_autoattach" });
    logToken(db, token.id, "frozen", "system");
  }

  const available = db.slots.filter(
    (s) => s.published && !s.booked && Date.parse(s.starts_at) > Date.parse(db.clock.now),
  ).length;

  if (isFirst && member.seat_number) {
    sendMail(db, "welcome", member.email, welcomeEmail(member.name, member.seat_number, sub.price_locked));
  }
  sendMail(
    db,
    "token_minted",
    member.email,
    tokenMintedEmail(member.name, fmtMonthDay(db.clock.now), available),
    { token_id: token.id },
  );

  return { ok: true, message: `Minted 1 token (${token.id}).`, minted: token.id };
}

/** invoice.payment_failed — §7 failure timeline. */
export function invoicePaymentFailed(db: DataStore, memberId: string): WebhookResult {
  const member = db.members.find((m) => m.id === memberId);
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  if (!member || !sub) return { ok: false, message: "No such member/subscription." };

  sub.status = "past_due";
  sub.past_due_since = sub.past_due_since ?? db.clock.now;
  sub.retry_count = (sub.retry_count ?? 0) + 1;

  const retryDays = db.settings.rules.retry_days;
  const nextRetry = retryDays[Math.min(sub.retry_count - 1, retryDays.length - 1)] ?? 7;

  // Any PENDING prebooking is flagged; second failure releases the slot.
  const prebook = db.bookings.find(
    (b) => b.member_id === memberId && b.kind === "prebook_pending" && b.status === "pending",
  );
  let prebookAtRisk = false;
  if (prebook) {
    prebookAtRisk = true;
    if (sub.retry_count >= 2) {
      const slot = db.slots.find((s) => s.id === prebook.slot_id);
      if (slot) slot.booked = false;
      prebook.status = "cancelled";
      prebook.reason = "Payment failed twice — slot released to the pool.";
    }
  }

  sendMail(
    db,
    "payment_failed",
    member.email,
    paymentFailedEmail(member.name, nextRetry, prebookAtRisk),
  );

  return {
    ok: true,
    message: `Payment failed (attempt ${sub.retry_count}). ${
      prebookAtRisk && sub.retry_count >= 2 ? "Prebook slot released." : `Retry in ${nextRetry} days.`
    }`,
  };
}

/** Day-10 unresolved → membership pauses, seat returns to market (§7). */
export function processPaymentTimeline(db: DataStore): string[] {
  const notes: string[] = [];
  for (const sub of db.subscriptions) {
    if (sub.status === "past_due" && sub.past_due_since) {
      const days = (Date.parse(db.clock.now) - Date.parse(sub.past_due_since)) / 864e5;
      if (days >= db.settings.rules.pause_membership_day) {
        sub.status = "paused";
        sub.reclaim_deadline = addDays(db.clock.now, db.settings.rules.reclaim_window_days);
        const m = db.members.find((x) => x.id === sub.member_id);
        if (m) {
          m.status = "paused";
          notes.push(`${m.name}: unpaid ${Math.floor(days)}d → paused, seat returned to market.`);
        }
      }
    }
  }
  return notes;
}
