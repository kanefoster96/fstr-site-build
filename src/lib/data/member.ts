import "server-only";
import { getDb } from "./db";
import type { Token, Booking, Slot, Gift, Pence } from "../types";
import { daysBetween, firstOfNextMonth } from "../format";

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
}

export async function getWallet(memberId: string): Promise<Wallet | null> {
  const db = await getDb();
  const m = db.members.find((x) => x.id === memberId);
  if (!m) return null;
  const sub = db.subscriptions.find((s) => s.member_id === memberId);
  const now = db.clock.now;
  const lifeDays = db.settings.rules.token_life_days;

  const tokens: WalletToken[] = db.tokens
    .filter((t) => t.member_id === memberId && t.state !== "EXPIRED" && t.state !== "REDEEMED")
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
    nextTokenDrops: firstOfNextMonth(now),
  };
}
