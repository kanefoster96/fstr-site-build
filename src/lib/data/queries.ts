import "server-only";
import { getDb } from "./db";
import type { Member, Settings, Pence } from "../types";

export interface SeatSummary {
  total: number;
  filled: number;
  left: number;
  founding_left: number; // seats remaining in the Founding 50 band
  waitlist_count: number;
  current_rate: Pence;
  founding_rate: Pence;
}

export async function getSettings(): Promise<Settings> {
  return (await getDb()).settings;
}

export async function getSeatSummary(): Promise<SeatSummary> {
  const db = await getDb();
  const active = db.members.filter(
    (m) => m.role === "member" && (m.status === "active" || m.status === "paused") && m.seat_number != null,
  );
  const filled = active.length;
  const total = db.settings.total_seats;
  const foundingFilled = active.filter((m) => (m.seat_number ?? 999) <= 50).length;
  const foundingBand = db.settings.pricing_ladder[0];
  return {
    total,
    filled,
    left: Math.max(0, total - filled),
    founding_left: Math.max(0, 50 - foundingFilled),
    waitlist_count: db.waitlist.filter((w) => w.notified_at == null).length,
    current_rate: db.settings.current_rate,
    founding_rate: foundingBand.price,
  };
}

/** The honest availability grid shown before payment on /join. */
export async function getAvailabilityShape(): Promise<{
  open_days: number[];
  weekday_daily_cap: number;
  weekend_day: string;
  weekend_slots_max: number;
}> {
  const s = (await getDb()).settings;
  return {
    open_days: s.open_days,
    weekday_daily_cap: s.weekday_daily_cap,
    weekend_day: s.weekend_day,
    weekend_slots_max: s.weekend_slots_max,
  };
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return (await getDb()).members.find((m) => m.id === id);
}
