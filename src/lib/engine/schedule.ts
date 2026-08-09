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

/** The weekdays currently revealed to members, demand-driven. */
export function revealedWeekdays(db: DataStore): number[] {
  const base = db.settings.base_open_days.filter((d) => db.settings.open_days.includes(d));
  const revealed = [...base];
  for (const day of db.settings.reveal_order) {
    if (!db.settings.open_days.includes(day)) continue;
    if (weekdayFillRate(db, revealed) >= db.settings.reveal_threshold) {
      revealed.push(day);
    } else {
      break;
    }
  }
  return [...new Set(revealed)].sort((a, b) => a - b);
}

export interface RevealState {
  revealed: number[]; // e.g. [3,4,5] or [2,3,4,5]
  nextDay: number | null; // the day waiting to unlock, or null if full
  fill: number; // current fill of the revealed set (0..1)
  threshold: number;
}

/** For UI: what's open, what's next, and how close it is to unlocking. */
export function getRevealState(db: DataStore): RevealState {
  const revealed = revealedWeekdays(db);
  const remaining = db.settings.reveal_order.filter(
    (d) => db.settings.open_days.includes(d) && !revealed.includes(d),
  );
  return {
    revealed,
    nextDay: remaining[0] ?? null,
    fill: weekdayFillRate(db, revealed),
    threshold: db.settings.reveal_threshold,
  };
}

export const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
