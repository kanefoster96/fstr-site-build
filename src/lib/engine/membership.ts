import "server-only";
import type { DataStore, Member, Subscription, AvailabilityFlag, Pence } from "../types";
import { addDays } from "../format";

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
    avatar_url: null,
    availability_profile: input.availability,
    joined_at: db.clock.now,
    seat_number: seat,
    status: "active",
    role: "member",
    streak_months: 0,
    badges: seat <= 50 ? ["Founding Member"] : [],
  };
  const subscription: Subscription = {
    id: `sub_${id}`,
    member_id: id,
    tier: "monthly",
    price_locked: rate,
    billing_day: new Date(db.clock.now).getUTCDate(),
    status: "active",
    started_at: db.clock.now,
    cancel_effective_at: null,
    reclaim_deadline: null,
    past_due_since: null,
    retry_count: 0,
  };
  db.members.push(member);
  db.subscriptions.push(subscription);
  return { member, subscription, seat, rate };
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
