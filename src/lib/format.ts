import type { Pence, ISODate } from "./types";

/** Money is stored in pence. Render as £X or £X.YY, always ready for mono. */
export function gbp(pence: Pence): string {
  const pounds = pence / 100;
  return Number.isInteger(pounds)
    ? `£${pounds}`
    : `£${pounds.toFixed(2)}`;
}

const MS_DAY = 24 * 60 * 60 * 1000;

export function addDays(iso: ISODate, days: number): ISODate {
  return new Date(new Date(iso).getTime() + days * MS_DAY).toISOString();
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / MS_DAY);
}

export function hoursBetween(from: ISODate, to: ISODate): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / (60 * 60 * 1000);
}

/** "12 days", "1 day", "today" — for expiry countdowns. */
export function daysLeftLabel(now: ISODate, expires: ISODate): string {
  const d = daysBetween(now, expires);
  if (d < 0) return "expired";
  if (d === 0) return "today";
  if (d === 1) return "1 day";
  return `${d} days`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function fmtDay(iso: ISODate): string {
  const d = new Date(iso);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function fmtTime(iso: ISODate): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmtDateTime(iso: ISODate): string {
  return `${fmtDay(iso)} · ${fmtTime(iso)}`;
}

export function fmtMonthDay(iso: ISODate): string {
  const d = new Date(iso);
  const n = d.getUTCDate();
  const suffix =
    n % 10 === 1 && n !== 11 ? "st"
      : n % 10 === 2 && n !== 12 ? "nd"
      : n % 10 === 3 && n !== 13 ? "rd"
      : "th";
  return `${n}${suffix} ${MONTHS[d.getUTCMonth()]}`;
}

/** First day of next month at the billing hour — "next token drops 1 Sept". */
export function firstOfNextMonth(iso: ISODate): ISODate {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 9, 0, 0)).toISOString();
}
