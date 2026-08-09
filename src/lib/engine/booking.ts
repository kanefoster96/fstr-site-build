import "server-only";
import type { DataStore, Slot, Booking, Pence, CreatedVia } from "../types";
import { reserveToken, cancelReservation, spendSilverPair, TokenError } from "./tokens";
import { markGiftRedeemed } from "./gifts";
import { hoursBetween } from "../format";
import { revealedWeekdays, isLastMinute, beforeCutoff } from "./schedule";

/** Booking rules (§5). */

let bookingCounter = 0;
function bookingId(): string {
  return `bk_${Date.now().toString(36)}_${++bookingCounter}`;
}

/**
 * Weekday slots a member can book now: published, unbooked, released, upcoming,
 * and EITHER on a currently-open weekday (staged, backwards-from-Friday) OR
 * within the last-minute window — so hidden days still get taken close-in.
 */
export function memberVisibleSlots(db: DataStore, priorityHours = 0): Slot[] {
  const now = Date.parse(db.clock.now);
  const open = revealedWeekdays(db);
  const early = priorityHours * 3600_000; // 6/12-month members get 24h early
  return db.slots
    .filter(
      (s) =>
        s.published &&
        !s.booked &&
        s.day_type === "weekday" &&
        Date.parse(s.starts_at) > now &&
        Date.parse(s.release_at) - early <= now &&
        beforeCutoff(db, s.starts_at) &&
        (open.includes(new Date(s.starts_at).getUTCDay()) || isLastMinute(db, s.starts_at)),
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

/**
 * Saturday slots a member can see now. The first 3 (emergency=false) book with a
 * token alone; the rest are emergency overflow (token + £10).
 */
export function weekendVisibleSlots(db: DataStore): Slot[] {
  const now = Date.parse(db.clock.now);
  return db.slots
    .filter(
      (s) =>
        s.published &&
        !s.booked &&
        s.day_type === "weekend" &&
        Date.parse(s.starts_at) > now &&
        Date.parse(s.release_at) <= now &&
        beforeCutoff(db, s.starts_at),
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

/**
 * One-off slots: weekday slots released ≤7 days out (members get first look),
 * plus Saturday priority slots once they've gone public (past member-only).
 */
export function oneOffVisibleSlots(db: DataStore): Slot[] {
  const now = Date.parse(db.clock.now);
  const weekday = memberVisibleSlots(db).filter(
    (s) => !s.member_only_until || Date.parse(s.member_only_until) <= now,
  );
  const weekend = weekendVisibleSlots(db).filter(
    (s) => !s.member_only_until || Date.parse(s.member_only_until) <= now,
  );
  return [...weekday, ...weekend].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
}

/** Book a member slot with a token — consumes it immediately (§5). */
export function bookWithToken(
  db: DataStore,
  memberId: string,
  slotId: string,
  tokenId: string,
  opts: { beard?: boolean; via?: CreatedVia; giftId?: string } = {},
): Booking {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) throw new TokenError("Slot not found.");
  if (slot.booked) throw new TokenError("That slot's just gone.");
  // Emergency Saturday overflow needs the +£10 upgrade; the 3 token slots don't.
  if (slot.day_type === "weekend" && slot.emergency) {
    throw new TokenError("That's an emergency Saturday slot — token + £10.");
  }
  if (!beforeCutoff(db, slot.starts_at)) {
    throw new TokenError("Booking closes at midday the day before.");
  }

  const id = bookingId();
  const beard = !!opts.beard;
  slot.booked = true;
  if (beard) slot.duration_mins = 60;

  const booking: Booking = {
    id,
    member_id: memberId,
    token_id: tokenId,
    slot_id: slotId,
    kind: "member", // token-funded cut; slot.day_type marks weekday vs Saturday
    status: "confirmed",
    price_paid: 0,
    created_via: opts.via ?? "calendar",
    created_at: db.clock.now,
    beard_addon: beard,
  };
  db.bookings.push(booking);
  reserveToken(db, tokenId, id, memberId);
  if (opts.giftId) markGiftRedeemed(db, opts.giftId);
  return booking;
}

/** Book a weekday slot by pairing two silver (expired) coins — both are spent. */
export function bookWithSilverPair(
  db: DataStore,
  memberId: string,
  slotId: string,
  tokenIds: [string, string],
  opts: { via?: CreatedVia } = {},
): Booking {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) throw new TokenError("Slot not found.");
  if (slot.booked) throw new TokenError("That slot's just gone.");
  if (slot.day_type === "weekend") {
    throw new TokenError("Weekend slots aren't bookable with silver coins.");
  }
  if (!beforeCutoff(db, slot.starts_at)) {
    throw new TokenError("Booking closes at midday the day before.");
  }
  const [a, b] = tokenIds;

  const id = bookingId();
  slot.booked = true;
  const booking: Booking = {
    id,
    member_id: memberId,
    token_id: a,
    combined_token_id: b,
    slot_id: slotId,
    kind: "member",
    status: "confirmed",
    price_paid: 0,
    created_via: opts.via ?? "calendar",
    created_at: db.clock.now,
  };
  db.bookings.push(booking);
  spendSilverPair(db, a, b, memberId, id);
  return booking;
}

/**
 * Saturday with a token + £10 upgrade (§5/§6). Reserves the token AND records
 * the £10 surcharge as a mock charge. Weekend slots are never free with a token
 * alone — the surcharge is the point.
 */
export function bookWeekendUpgrade(
  db: DataStore,
  memberId: string,
  slotId: string,
  tokenId: string,
  opts: { beard?: boolean; via?: CreatedVia } = {},
): Booking {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) throw new TokenError("Slot not found.");
  if (slot.booked) throw new TokenError("That slot's just gone.");
  if (slot.day_type !== "weekend") throw new TokenError("That's not a weekend slot.");
  if (!beforeCutoff(db, slot.starts_at)) {
    throw new TokenError("Booking closes at midday the day before.");
  }

  const beard = !!opts.beard; // free beard trim — just extends the session
  const surcharge = db.settings.weekend_upgrade_surcharge;
  const id = bookingId();
  slot.booked = true;
  if (beard) slot.duration_mins = 60;

  const booking: Booking = {
    id,
    member_id: memberId,
    token_id: tokenId,
    slot_id: slotId,
    kind: "weekend_upgrade",
    status: "confirmed",
    price_paid: surcharge,
    created_via: opts.via ?? "calendar",
    created_at: db.clock.now,
    beard_addon: beard,
  };
  db.bookings.push(booking);
  reserveToken(db, tokenId, id, memberId);
  return booking;
}

/** One-off booking — £35 mock charge, non-refundable inside 24h (§5). */
export function bookOneOff(
  db: DataStore,
  slotId: string,
  contact: { name: string; email: string; phone: string },
  opts: { beard?: boolean } = {},
): Booking {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) throw new TokenError("Slot not found.");
  if (slot.booked) throw new TokenError("That slot's just gone.");
  if (!beforeCutoff(db, slot.starts_at)) {
    throw new TokenError("Booking closes at midday the day before.");
  }

  const beard = !!opts.beard; // free beard trim — just extends the session
  const price: Pence = db.settings.oneoff_price;
  slot.booked = true;
  if (beard) slot.duration_mins = 60;

  const booking: Booking = {
    id: bookingId(),
    member_id: null,
    token_id: null,
    slot_id: slotId,
    kind: slot.day_type === "weekend" ? "weekend_oneoff" : "one_off",
    status: "confirmed",
    price_paid: price,
    created_via: "calendar",
    created_at: db.clock.now,
    beard_addon: beard,
    contact_name: contact.name,
    contact_email: contact.email,
    contact_phone: contact.phone,
  };
  db.bookings.push(booking);
  return booking;
}

/**
 * Prebook a future slot before the token exists (§5). Holds the slot PENDING;
 * when the next billing payment lands, the minted token auto-attaches and the
 * booking flips to CONFIRMED. One prebook per future token.
 */
export function createPrebook(db: DataStore, memberId: string, slotId: string): Booking {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot) throw new TokenError("Slot not found.");
  if (slot.booked) throw new TokenError("That slot's just gone.");
  const existing = db.bookings.find(
    (b) => b.member_id === memberId && b.kind === "prebook_pending" && b.status === "pending",
  );
  if (existing) throw new TokenError("You've already got a prebook held. One per future token.");

  slot.booked = true;
  const booking: Booking = {
    id: bookingId(),
    member_id: memberId,
    token_id: null,
    slot_id: slotId,
    kind: "prebook_pending",
    status: "pending",
    price_paid: 0,
    created_via: "prebook",
    created_at: db.clock.now,
  };
  db.bookings.push(booking);
  return booking;
}

/** Cancel a member booking, applying the ≥24h rule to its token (§4.5). */
export function cancelBooking(db: DataStore, bookingId: string, actor: string): { forfeited: boolean } {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new TokenError("Booking not found.");
  const slot = db.slots.find((s) => s.id === booking.slot_id);
  if (!slot) throw new TokenError("Slot not found.");

  booking.status = "cancelled";
  slot.booked = false;

  // Silver-pair bookings spent two already-lapsed coins — nothing to return.
  if (booking.combined_token_id) return { forfeited: true };

  if (booking.token_id) {
    // Delegate the token side to the token engine's cancel rule.
    const res = cancelReservation(db, booking.token_id, slot.starts_at, actor, false);
    return { forfeited: res.forfeited };
  }
  return { forfeited: false };
}

export function withinCancelCutoff(db: DataStore, slotStartsAt: string): boolean {
  return hoursBetween(db.clock.now, slotStartsAt) < db.settings.rules.cancel_cutoff_hours;
}
