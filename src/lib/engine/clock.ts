import "server-only";
import type { DataStore } from "../types";
import { addDays, daysBetween } from "../format";
import { expireDueTokens } from "./tokens";
import { returnLapsedGifts } from "./gifts";
import { invoicePaid, processPaymentTimeline } from "../adapters/payments";
import { refreshAll } from "./gamification";
import { memberVisibleSlots } from "./booking";
import { sendMail } from "../adapters/mail";
import { nudgeEmail, reminder24hEmail } from "../emails";

const STUDIO_ADDRESS = "14 Coast View, Wallsend NE28 · blue door, ring once";

/** Nudge unbooked tokens at day 10/20/50, and remind bookings 24h out. */
function processNotifications(db: DataStore): void {
  const nudgeMarks = [10, 20, 50];
  for (const t of db.tokens) {
    if (t.state !== "ISSUED" || t.frozen_at) continue;
    const age = daysBetween(t.issued_at, db.clock.now);
    if (nudgeMarks.includes(age)) {
      const m = db.members.find((x) => x.id === t.member_id);
      if (!m) continue;
      const available = memberVisibleSlots(db).length;
      sendMail(db, "nudge", m.email, nudgeEmail(m.name, age, available, t.expires_at), { day: age });
    }
  }
  for (const b of db.bookings) {
    if (b.status !== "confirmed" || !b.member_id) continue;
    const slot = db.slots.find((s) => s.id === b.slot_id);
    if (!slot) continue;
    if (daysBetween(db.clock.now, slot.starts_at) === 1) {
      const m = db.members.find((x) => x.id === b.member_id);
      if (m) sendMail(db, "reminder_24h", m.email, reminder24hEmail(m.name, slot.starts_at, STUDIO_ADDRESS), { booking: b.id });
    }
  }
}

/**
 * The mock clock (§3). Advancing it drives every time-based rule so expiry,
 * nudges, billing cycles and the 60/14-day windows can all be demonstrated.
 * Advancing 90 days must produce zero orphaned tokens and zero silent
 * expiries — every transition is logged to token_events.
 */
export interface TickReport {
  expired: string[];
  giftsReturned: string[];
  billed: string[];
  timeline: string[];
}

/** Advance one day and process all due transitions for that day. */
function tickOneDay(db: DataStore): TickReport {
  db.clock.now = addDays(db.clock.now, 1);

  const billed: string[] = [];
  // Billing runs on each subscription's cadence (every cycle_weeks weeks).
  for (const sub of db.subscriptions) {
    if (sub.status !== "active") continue;
    if (new Date(db.clock.now) >= new Date(sub.next_billing_at)) {
      const r = invoicePaid(db, sub.member_id, false);
      if (r.minted) billed.push(sub.member_id);
      // Advance the cycle and free up the once-per-cycle plan change.
      sub.last_billing_at = db.clock.now;
      sub.next_billing_at = addDays(db.clock.now, sub.cycle_weeks * 7);
      sub.plan_locked_until_next_billing = false;
    }
  }

  const expired = expireDueTokens(db);
  const giftsReturned = returnLapsedGifts(db);
  const timeline = processPaymentTimeline(db);
  refreshAll(db); // streaks, milestone badges, queued bonus tokens
  processNotifications(db); // day 10/20/50 nudges + 24h reminders

  return { expired, giftsReturned, billed, timeline };
}

export function advanceDays(db: DataStore, days: number): TickReport {
  const agg: TickReport = { expired: [], giftsReturned: [], billed: [], timeline: [] };
  for (let i = 0; i < Math.max(0, days); i++) {
    const r = tickOneDay(db);
    agg.expired.push(...r.expired);
    agg.giftsReturned.push(...r.giftsReturned);
    agg.billed.push(...r.billed);
    agg.timeline.push(...r.timeline);
  }
  return agg;
}
