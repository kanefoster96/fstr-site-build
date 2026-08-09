import "server-only";
import type { DataStore, Slot, Booking, Pence, CreatedVia } from "../types";
import { reserveToken, cancelReservation, TokenError } from "./tokens";
import { markGiftRedeemed } from "./gifts";
import { hoursBetween } from "../format";

/** Booking rules (§5). */

let bookingCounter = 0;
function bookingId(): string {
  return `bk_${Date.now().toString(36)}_${++bookingCounter}`;
}

/** Slots a member can see now: published, unbooked, released, upcoming. */
export function memberVisibleSlots(db: DataStore): Slot[] {
  const now = Date.parse(db.clock.now);
  return db.slots
    .filter(
      (s) =>
        s.published &&
        !s.booked &&
        Date.parse(s.starts_at) > now &&
        Date.parse(s.release_at) <= now,
    )
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

/** One-offs: only slots released ≤7 days out, and not member-only right now. */
export function oneOffVisibleSlots(db: DataStore): Slot[] {
  const now = Date.parse(db.clock.now);
  return memberVisibleSlots(db).filter(
    (s) => !s.member_only_until || Date.parse(s.member_only_until) <= now,
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
  if (slot.day_type === "weekend") {
    throw new TokenError("Weekend slots aren't bookable with a token alone.");
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
    kind: "member",
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

  const beard = !!opts.beard;
  const price: Pence =
    db.settings.oneoff_price + (beard ? db.settings.beard_addon_price : 0);
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

/** Cancel a member booking, applying the ≥24h rule to its token (§4.5). */
export function cancelBooking(db: DataStore, bookingId: string, actor: string): { forfeited: boolean } {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new TokenError("Booking not found.");
  const slot = db.slots.find((s) => s.id === booking.slot_id);
  if (!slot) throw new TokenError("Slot not found.");

  booking.status = "cancelled";
  slot.booked = false;

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
