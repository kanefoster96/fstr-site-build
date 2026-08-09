import type { DataStore, Slot } from "../types";

/**
 * Booking schedule (updated rules).
 * Hours: Mon–Sat 9:30–14:30. Slots are 45 minutes with a 15-minute end
 * buffer, so starts sit on the hour: 09:30, 10:30, 11:30, 12:30, 13:30.
 * (13:30 + 45 = 14:15, +15 buffer = 14:30.)
 *
 * Staged opening: Wed–Fri are visible by default. When the currently-open set
 * of weekdays is >= 85% booked, the next weekday reveals — Tuesday, then
 * Monday. It's computed live from real bookings, not a manual toggle.
 */

/** Derive start times from the day window + slot length + buffer. */
export function slotStartTimes(db: DataStore): string[] {
  const [sh, sm] = db.settings.day_start.split(":").map(Number);
  const [eh, em] = db.settings.day_end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const block = db.settings.slot_length_mins + db.settings.slot_buffer_mins; // 60
  const times: string[] = [];
  for (let t = startMins; t + db.settings.slot_length_mins <= endMins; t += block) {
    times.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return times;
}

export function isWeekendDow(db: DataStore, dow: number): boolean {
  return (
    (db.settings.weekend_day === "saturday" && dow === 6) ||
    (db.settings.weekend_day === "sunday" && dow === 0)
  );
}

/** Upcoming, released (bookable) weekday slots on the given days-of-week. */
function upcomingWeekdaySlots(db: DataStore, days: number[]): Slot[] {
  const now = Date.parse(db.clock.now);
  return db.slots.filter(
    (s) =>
      s.published &&
      s.day_type === "weekday" &&
      Date.parse(s.starts_at) > now &&
      Date.parse(s.release_at) <= now &&
      days.includes(new Date(s.starts_at).getUTCDay()),
  );
}

/** Booked fraction (0..1) of upcoming weekday slots across `days`. */
export function weekdayFillRate(db: DataStore, days: number[]): number {
  const slots = upcomingWeekdaySlots(db, days);
  if (slots.length === 0) return 0;
  const booked = slots.filter((s) => s.booked).length;
  return booked / slots.length;
}

/** Fill fraction for a single weekday. */
export function dayFillRate(db: DataStore, day: number): number {
  return weekdayFillRate(db, [day]);
}

/**
 * The weekdays currently open to members. The week fills backwards from Friday
 * (the anchor, always shown): each earlier day appears only once the day after
 * it is >= reveal_threshold booked.
 */
export function revealedWeekdays(db: DataStore): number[] {
  const order = db.settings.fill_order.filter((d) => db.settings.open_days.includes(d));
  if (order.length === 0) return [];
  const revealed = [order[0]]; // Friday anchor
  for (let i = 1; i < order.length; i++) {
    const later = order[i - 1];
    if (dayFillRate(db, later) >= db.settings.reveal_threshold) {
      revealed.push(order[i]);
    } else {
      break;
    }
  }
  return revealed.sort((a, b) => a - b);
}

/** A slot close enough to now that last-minute bookers can always take it. */
export function isLastMinute(db: DataStore, startsAt: string): boolean {
  const delta = Date.parse(startsAt) - Date.parse(db.clock.now);
  return delta >= 0 && delta <= db.settings.last_minute_days * 864e5;
}

export type DayStatus = "open" | "last_minute" | "unavailable";

/** Member-facing status for a weekday: open, quietly last-minute, or taken. */
export function weekdayStatus(db: DataStore, day: number): DayStatus {
  if (revealedWeekdays(db).includes(day)) return "open";
  const now = Date.parse(db.clock.now);
  const hasLastMinute = db.slots.some(
    (s) =>
      s.day_type === "weekday" &&
      !s.booked &&
      new Date(s.starts_at).getUTCDay() === day &&
      Date.parse(s.starts_at) > now &&
      Date.parse(s.release_at) <= now &&
      isLastMinute(db, s.starts_at),
  );
  return hasLastMinute ? "last_minute" : "unavailable";
}

export interface RevealState {
  revealed: number[]; // open weekdays, e.g. [4,5] or [1,2,3,4,5]
  nextDay: number | null; // the earlier day not yet open (barber view only)
  nextDayGateFill: number; // fill of the day that gates nextDay (0..1)
  threshold: number;
}

/** For the barber diary: what's open and what gates the next earlier day. */
export function getRevealState(db: DataStore): RevealState {
  const revealed = revealedWeekdays(db);
  const order = db.settings.fill_order.filter((d) => db.settings.open_days.includes(d));
  const nextIdx = revealed.length; // index into order of the next earlier day
  const nextDay = nextIdx < order.length ? order[nextIdx] : null;
  const gateDay = nextDay != null ? order[nextIdx - 1] : null;
  return {
    revealed,
    nextDay,
    nextDayGateFill: gateDay != null ? dayFillRate(db, gateDay) : 0,
    threshold: db.settings.reveal_threshold,
  };
}

export const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
