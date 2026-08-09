import "server-only";
import { getDb } from "./db";
import type { Token, Booking, Slot, Gift, Pence } from "../types";
import { daysBetween, firstOfNextMonth } from "../format";
import { memberVisibleSlots } from "../engine/booking";

export interface WalletToken extends Token {
  lifeFraction: number; // 0..1 remaining, for the countdown ring
  daysLeft: number;
  slot?: Slot;
  gift?: Gift;
}

export interface Wallet {
  memberId: string;
  name: string;
  seat: number | null;
  tokens: WalletToken[];
  held: number; // ISSUED + GIFTED outstanding
  nextBooking?: { booking: Booking; slot: Slot; token?: Token };
  prebook?: { booking: Booking; slot: Slot };
  lockedRate: Pence;
  currentRate: Pence;
  savePerCut: Pence;
  savedThisYear: Pence;
  cutsCount: number;
  streakMonths: number;
  badges: string[];
  nextTokenDrops: string;
  // Plan / holding
  cycleWeeks: number;
  maxHeld: number;
  activeCap: number; // 2
  storeCap: number; // 3
  atCap: boolean; // held >= maxHeld
  showPlanNudge: boolean; // held >= plan_prompt_threshold
  planLocked: boolean; // already changed this cycle
  nextBillingAt: string;
  plans: number[];
  // Guest / trial (onboarding)
  subscribed: boolean;
  trialCredit: Pence;
  trialCreditValid: boolean;
  hasTrialBooking: boolean;
}

export async function getWallet(memberId: string): Promise<Wallet | null> {
  const db = await getDb();
  const m = db.members.find((x) => x.id === memberId);
  if (!m) return null;
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  const now = db.clock.now;
  const lifeDays = db.settings.rules.token_life_days;

  const tokens: WalletToken[] = db.tokens
    .filter((t) => t.member_id === memberId && t.state !== "REDEEMED")
    .map((t) => {
      const daysLeft = t.frozen_at ? daysBetween(now, t.expires_at) : daysBetween(now, t.expires_at);
      return {
        ...t,
        daysLeft,
        lifeFraction: Math.max(0, Math.min(1, daysLeft / lifeDays)),
        slot: t.booking_id
          ? db.slots.find((s) => db.bookings.find((b) => b.id === t.booking_id)?.slot_id === s.id)
          : undefined,
        gift: t.gift_id ? db.gifts.find((g) => g.id === t.gift_id) : undefined,
      };
    })
    .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at));

  const held = tokens.filter((t) => t.state === "ISSUED" || t.state === "GIFTED").length;

  // Next confirmed booking
  const upcoming = db.bookings
    .filter(
      (b) =>
        b.member_id === memberId &&
        (b.status === "confirmed" || b.status === "pending") &&
        b.kind !== "prebook_pending",
    )
    .map((b) => ({ booking: b, slot: db.slots.find((s) => s.id === b.slot_id)! }))
    .filter((x) => x.slot && Date.parse(x.slot.starts_at) >= Date.parse(now))
    .sort((a, b) => Date.parse(a.slot.starts_at) - Date.parse(b.slot.starts_at))[0];

  const prebookRaw = db.bookings.find(
    (b) => b.member_id === memberId && b.kind === "prebook_pending" && b.status === "pending",
  );
  const prebook = prebookRaw
    ? { booking: prebookRaw, slot: db.slots.find((s) => s.id === prebookRaw.slot_id)! }
    : undefined;

  const cutsCount = db.tokens.filter((t) => t.member_id === memberId && t.state === "REDEEMED").length;
  const lockedRate = sub?.price_locked ?? db.settings.current_rate;
  const currentRate = db.settings.current_rate;
  const savePerCut = Math.max(0, currentRate - lockedRate);

  return {
    memberId,
    name: m.name,
    seat: m.seat_number,
    tokens,
    held,
    nextBooking: upcoming
      ? {
          booking: upcoming.booking,
          slot: upcoming.slot,
          token: db.tokens.find((t) => t.id === upcoming.booking.token_id),
        }
      : undefined,
    prebook: prebook && prebook.slot ? prebook : undefined,
    lockedRate,
    currentRate,
    savePerCut,
    savedThisYear: cutsCount * Math.max(0, db.settings.oneoff_price - lockedRate),
    cutsCount,
    streakMonths: m.streak_months ?? 0,
    badges: m.badges ?? [],
    nextTokenDrops: sub?.next_billing_at ?? firstOfNextMonth(now),
    cycleWeeks: sub?.cycle_weeks ?? db.settings.default_cycle_weeks,
    maxHeld: db.settings.rules.max_held,
    activeCap: db.settings.rules.active_display,
    storeCap: db.settings.rules.store_cap,
    atCap: held >= db.settings.rules.max_held,
    showPlanNudge: held >= db.settings.rules.plan_prompt_threshold,
    planLocked: sub?.plan_locked_until_next_billing ?? false,
    nextBillingAt: sub?.next_billing_at ?? firstOfNextMonth(now),
    plans: db.settings.plans,
    subscribed: !!sub && sub.status !== "cancelled",
    trialCredit: m.trial_credit ?? 0,
    trialCreditValid:
      !!m.trial_credit &&
      !!m.trial_credit_expires &&
      new Date(now) < new Date(m.trial_credit_expires),
    hasTrialBooking: db.bookings.some(
      (b) => b.member_id === memberId && (b.kind === "one_off" || b.kind === "weekend_oneoff") && b.status === "confirmed",
    ),
  };
}

export interface UsualSlot {
  label: string; // "Thursday 11:30"
  dow: number;
  time: string; // "11:30"
  slot?: Slot; // the next matching bookable slot, if any
}

/**
 * "Your usual" — the member's most-booked day-of-week + time from history, and
 * the next matching open slot. Powers the one-tap rebook so they never have to
 * think about it.
 */
export async function getUsual(memberId: string): Promise<UsualSlot | null> {
  const db = await getDb();
  const history = db.bookings.filter(
    (b) => b.member_id === memberId && (b.status === "completed" || b.status === "confirmed"),
  );
  if (history.length === 0) return null;

  const tally = new Map<string, number>();
  for (const b of history) {
    const slot = db.slots.find((s) => s.id === b.slot_id);
    if (!slot) continue;
    const d = new Date(slot.starts_at);
    const key = `${d.getUTCDay()}|${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  if (tally.size === 0) return null;

  const [bestKey] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const [dowStr, time] = bestKey.split("|");
  const dow = Number(dowStr);

  const nextSlot = memberVisibleSlots(db)
    .filter(
      (s) => new Date(s.starts_at).getUTCDay() === dow && s.starts_at.slice(11, 16) === time,
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];

  return { label: `${fullDow(dow)} ${time}`, dow, time, slot: nextSlot };
}

export interface ComingUpSlot {
  slot: Slot;
  isUsual: boolean;
}

/** The soonest bookable slots, with the member's usual flagged. */
export async function getComingUp(memberId: string, limit = 6): Promise<ComingUpSlot[]> {
  const db = await getDb();
  const usual = await getUsual(memberId);
  return memberVisibleSlots(db)
    .slice(0, limit)
    .map((slot) => ({
      slot,
      isUsual:
        !!usual &&
        new Date(slot.starts_at).getUTCDay() === usual.dow &&
        slot.starts_at.slice(11, 16) === usual.time,
    }));
}

function fullDow(d: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
}
