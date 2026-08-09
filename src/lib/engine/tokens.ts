import "server-only";
import type { DataStore, Token, TokenEvent, TokenState, TokenSource } from "../types";
import { addDays, hoursBetween } from "../format";

/**
 * Token state machine (§3). Five states, no others. Every transition is
 * validated here (server-side) and appended to token_events. Callers mutate
 * the store through these functions only — never by hand — so the audit trail
 * explains every coin's life.
 *
 *   ISSUED ──book──▶ RESERVED ──redeem──▶ REDEEMED
 *     │  ▲               │
 *     │  └──cancel ≥24h──┘   (cancel <24h / no-show ─▶ REDEEMED, reason logged)
 *     │
 *     ├──gift──▶ GIFTED ──recipient books──▶ RESERVED
 *     │             └──14-day lapse──▶ back to ISSUED (returned to sender)
 *     │
 *     └──day 60 (unfrozen)──▶ EXPIRED
 */

let eventCounter = 0;
function eventId(): string {
  return `ev_${Date.now().toString(36)}_${++eventCounter}`;
}

export function logToken(
  db: DataStore,
  token_id: string,
  event: TokenEvent["event"],
  actor: string,
  metadata?: Record<string, unknown>,
): void {
  db.token_events.push({
    id: eventId(),
    token_id,
    event,
    actor,
    timestamp: db.clock.now,
    metadata,
  });
}

export class TokenError extends Error {}

/** Count what a member "holds": ISSUED + outstanding GIFTED (RESERVED excluded, §4.3). */
export function heldCount(db: DataStore, memberId: string): number {
  return db.tokens.filter(
    (t) => t.member_id === memberId && (t.state === "ISSUED" || t.state === "GIFTED"),
  ).length;
}

let mintCounter = 0;

/** §4.1 — mint exactly one token, 60-day life from issue. */
export function mintToken(
  db: DataStore,
  memberId: string,
  source: TokenSource = "subscription",
): Token {
  const id = `tok_${Date.now().toString(36)}_${++mintCounter}`;
  const token: Token = {
    id,
    member_id: memberId,
    state: "ISSUED",
    issued_at: db.clock.now,
    expires_at: addDays(db.clock.now, db.settings.rules.token_life_days),
    frozen_at: null,
    booking_id: null,
    gift_id: null,
    source,
  };
  db.tokens.push(token);
  logToken(db, id, "issued", "system", { source });
  return token;
}

function find(db: DataStore, tokenId: string): Token {
  const t = db.tokens.find((x) => x.id === tokenId);
  if (!t) throw new TokenError(`Token ${tokenId} not found`);
  return t;
}

function assertState(t: Token, ...allowed: TokenState[]): void {
  if (!allowed.includes(t.state)) {
    throw new TokenError(`Token ${t.id} is ${t.state}; expected ${allowed.join(" or ")}`);
  }
}

/** ISSUED/GIFTED → RESERVED. Booking freezes the clock (§4.4). */
export function reserveToken(
  db: DataStore,
  tokenId: string,
  bookingId: string,
  actor: string,
): Token {
  const t = find(db, tokenId);
  assertState(t, "ISSUED", "GIFTED");
  t.state = "RESERVED";
  t.booking_id = bookingId;
  t.frozen_at = db.clock.now;
  logToken(db, t.id, "reserved", actor, { booking_id: bookingId });
  logToken(db, t.id, "frozen", "system");
  return t;
}

/** RESERVED → REDEEMED (QR scan at the chair). */
export function redeemToken(db: DataStore, tokenId: string, actor: string): Token {
  const t = find(db, tokenId);
  assertState(t, "RESERVED");
  t.state = "REDEEMED";
  logToken(db, t.id, "redeemed", actor, { via: "qr" });
  return t;
}

/**
 * Cancellation (§4.5).
 * ≥24h before slot → back to ISSUED with max(original expiry, now + 7 days).
 * <24h or no-show → REDEEMED with reason logged.
 */
export function cancelReservation(
  db: DataStore,
  tokenId: string,
  slotStartsAt: string,
  actor: string,
  noShow = false,
): { token: Token; forfeited: boolean } {
  const t = find(db, tokenId);
  assertState(t, "RESERVED");
  const hours = hoursBetween(db.clock.now, slotStartsAt);
  const withinCutoff = hours < db.settings.rules.cancel_cutoff_hours;

  if (noShow || withinCutoff) {
    t.state = "REDEEMED";
    const reason = noShow ? "no_show" : "late_cancel";
    logToken(db, t.id, "redeemed", actor, { reason });
    t.booking_id = null;
    return { token: t, forfeited: true };
  }

  // Return to ISSUED, unfreeze, extend expiry floor to now + 7 days.
  t.state = "ISSUED";
  const floor = addDays(db.clock.now, db.settings.rules.cancel_extend_days);
  if (new Date(floor) > new Date(t.expires_at)) t.expires_at = floor;
  t.frozen_at = null;
  t.booking_id = null;
  logToken(db, t.id, "unfrozen", "system");
  logToken(db, t.id, "cancelled", actor, { new_expiry: t.expires_at });
  return { token: t, forfeited: false };
}

/** Barber goodwill reinstatement — one per member per year (§4.5). */
export function reinstateToken(db: DataStore, tokenId: string, actor: string): Token {
  const t = find(db, tokenId);
  assertState(t, "REDEEMED", "EXPIRED");
  t.state = "ISSUED";
  t.frozen_at = null;
  t.booking_id = null;
  const floor = addDays(db.clock.now, db.settings.rules.cancel_extend_days);
  if (new Date(floor) > new Date(t.expires_at)) t.expires_at = floor;
  logToken(db, t.id, "reinstated", actor);
  return t;
}

/** Advance the whole store's clock and process time-based transitions. */
export function expireDueTokens(db: DataStore): string[] {
  const expired: string[] = [];
  for (const t of db.tokens) {
    if (t.state === "ISSUED" && !t.frozen_at) {
      if (new Date(db.clock.now) >= new Date(t.expires_at)) {
        t.state = "EXPIRED";
        logToken(db, t.id, "expired", "system");
        expired.push(t.id);
      }
    }
  }
  return expired;
}
