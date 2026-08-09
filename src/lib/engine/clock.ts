import "server-only";
import type { DataStore } from "../types";
import { addDays } from "../format";
import { expireDueTokens } from "./tokens";
import { returnLapsedGifts } from "./gifts";
import { invoicePaid, processPaymentTimeline } from "../adapters/payments";

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
