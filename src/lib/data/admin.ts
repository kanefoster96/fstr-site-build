import "server-only";
import { getDb } from "./db";
import type { Booking, Slot, Member, Token } from "../types";

export interface TodayCard {
  booking: Booking;
  slot: Slot;
  member?: Member;
  token?: Token;
}

export async function getTodayBookings(): Promise<TodayCard[]> {
  const db = await getDb();
  const today = new Date(db.clock.now);
  const y = today.getUTCFullYear(), m = today.getUTCMonth(), d = today.getUTCDate();
  return db.bookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .map((b) => ({ booking: b, slot: db.slots.find((s) => s.id === b.slot_id)! }))
    .filter((x) => {
      if (!x.slot) return false;
      const sd = new Date(x.slot.starts_at);
      return sd.getUTCFullYear() === y && sd.getUTCMonth() === m && sd.getUTCDate() === d;
    })
    .sort((a, b) => Date.parse(a.slot.starts_at) - Date.parse(b.slot.starts_at))
    .map((x) => ({
      booking: x.booking,
      slot: x.slot,
      member: x.booking.member_id ? db.members.find((mm) => mm.id === x.booking.member_id) : undefined,
      token: x.booking.token_id ? db.tokens.find((t) => t.id === x.booking.token_id) : undefined,
    }));
}

export interface AdminNumbers {
  mrr: number;
  seatsFilled: number;
  totalSeats: number;
  liability: number; // unredeemed tokens = cuts owed
  liabilityLevel: "ok" | "amber" | "red";
  weekendBooked: number;
  hoursThisWeek: number;
  giftsSent: number;
  chatBookings: number;
}

export async function getAdminNumbers(): Promise<AdminNumbers> {
  const db = await getDb();
  const activeSubs = db.subscriptions.filter((s) => s.status === "active");
  const mrr = activeSubs.reduce((sum, s) => sum + s.price_locked, 0);
  const seatsFilled = db.members.filter(
    (m) => m.role === "member" && m.seat_number != null && (m.status === "active" || m.status === "paused"),
  ).length;
  const liability = db.tokens.filter((t) => t.state === "ISSUED" || t.state === "RESERVED" || t.state === "GIFTED").length;
  const rules = db.settings.rules;
  const liabilityLevel = liability > rules.liability_red ? "red" : liability > rules.liability_amber ? "amber" : "ok";

  // This week's booked minutes → hours (vs 20–30 target).
  const now = Date.parse(db.clock.now);
  const weekEnd = now + 7 * 864e5;
  const weekBookings = db.bookings.filter((b) => {
    const slot = db.slots.find((s) => s.id === b.slot_id);
    if (!slot) return false;
    const t = Date.parse(slot.starts_at);
    return (b.status === "confirmed" || b.status === "completed") && t >= now && t <= weekEnd;
  });
  const minutes = weekBookings.reduce((sum, b) => {
    const slot = db.slots.find((s) => s.id === b.slot_id);
    return sum + (slot?.duration_mins ?? 45);
  }, 0);

  const weekendBooked = db.bookings.filter((b) => {
    const slot = db.slots.find((s) => s.id === b.slot_id);
    return slot?.day_type === "weekend" && (b.status === "confirmed" || b.status === "completed") && Date.parse(slot.starts_at) >= now;
  }).length;

  return {
    mrr,
    seatsFilled,
    totalSeats: db.settings.total_seats,
    liability,
    liabilityLevel,
    weekendBooked,
    hoursThisWeek: Math.round((minutes / 60) * 10) / 10,
    giftsSent: db.gifts.length,
    chatBookings: db.bookings.filter((b) => b.created_via === "chat").length,
  };
}
