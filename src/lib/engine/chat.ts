import "server-only";
import type { DataStore, Message, Slot, SlotSuggestion } from "../types";
import { memberVisibleSlots, bookWithToken } from "./booking";
import { sendMail } from "../adapters/mail";
import { bookingConfirmedEmail } from "../emails";

/** Chat-to-book (§9). Lightweight time parsing highlights when a member is
 *  asking about, so the barber gets a pre-filtered slot picker beside the thread. */

let msgCounter = 0;
function msgId(): string {
  return `msg_${Date.now().toString(36)}_${++msgCounter}`;
}

const DOW: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

export interface TimeHint {
  dayOfWeek?: number;
  partOfDay?: "morning" | "afternoon" | "evening";
  nextWeek?: boolean;
  afterHour?: number;
  raw: string[];
}

/** Detect time expressions like "Thursday", "next week", "after 1", "morning". */
export function parseTimeHints(text: string): TimeHint {
  const t = text.toLowerCase();
  const raw: string[] = [];
  const hint: TimeHint = { raw };

  for (const [word, dow] of Object.entries(DOW)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) {
      hint.dayOfWeek = dow;
      raw.push(word);
      break;
    }
  }
  if (/\bmorning\b/.test(t)) { hint.partOfDay = "morning"; raw.push("morning"); }
  else if (/\bafternoon\b/.test(t)) { hint.partOfDay = "afternoon"; raw.push("afternoon"); }
  else if (/\bevening\b/.test(t)) { hint.partOfDay = "evening"; raw.push("evening"); }
  if (/\bnext week\b/.test(t)) { hint.nextWeek = true; raw.push("next week"); }
  const after = t.match(/after (\d{1,2})/);
  if (after) { hint.afterHour = Number(after[1]) + (Number(after[1]) < 8 ? 12 : 0); raw.push(after[0]); }

  return hint;
}

/** Slots matching a hint, for the barber's mini picker. */
export function slotsForHint(db: DataStore, hint: TimeHint): Slot[] {
  let slots = memberVisibleSlots(db).filter((s) => s.day_type === "weekday");
  const nowD = new Date(db.clock.now);
  if (hint.dayOfWeek != null) {
    slots = slots.filter((s) => new Date(s.starts_at).getUTCDay() === hint.dayOfWeek);
  }
  if (hint.nextWeek) {
    const weekStart = Date.parse(db.clock.now) + 3 * 864e5;
    const weekEnd = weekStart + 10 * 864e5;
    slots = slots.filter((s) => {
      const t = Date.parse(s.starts_at);
      return t >= weekStart && t <= weekEnd;
    });
  }
  if (hint.partOfDay === "morning") slots = slots.filter((s) => new Date(s.starts_at).getUTCHours() < 12);
  if (hint.partOfDay === "afternoon") slots = slots.filter((s) => new Date(s.starts_at).getUTCHours() >= 12);
  if (hint.afterHour != null) slots = slots.filter((s) => new Date(s.starts_at).getUTCHours() >= hint.afterHour!);
  void nowD;
  return slots.slice(0, 6);
}

export function postMessage(
  db: DataStore,
  chatId: string,
  sender: string,
  body: string,
  suggestion?: SlotSuggestion,
): Message {
  const msg: Message = {
    id: msgId(),
    chat_id: chatId,
    sender,
    body,
    created_at: db.clock.now,
    slot_suggestion: suggestion ?? null,
    offer_status: suggestion ? "pending" : null,
    booking_id: null,
  };
  db.messages.push(msg);
  const chat = db.chats.find((c) => c.id === chatId);
  if (chat) {
    chat.last_message_at = db.clock.now;
    if (sender === "barber") chat.unread_for_member = true;
    else chat.unread_for_barber = true;
  }
  return msg;
}

/** Barber offers a slot — drops a booking-offer card into the thread (§9). */
export function offerSlot(db: DataStore, chatId: string, slotId: string): Message | null {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot || slot.booked) return null;
  const suggestion: SlotSuggestion = {
    slot_id: slot.id,
    starts_at: slot.starts_at,
    duration_mins: slot.duration_mins,
    price: 0,
    requires_token: true,
  };
  return postMessage(db, chatId, "barber", `${slotLabel(slot)} — book it?`, suggestion);
}

/** Member accepts an offer — token reserved, booking confirmed in-thread (§9). */
export function acceptOffer(db: DataStore, messageId: string): { ok: boolean; reason?: string } {
  const msg = db.messages.find((m) => m.id === messageId);
  if (!msg || !msg.slot_suggestion) return { ok: false, reason: "No offer." };
  const chat = db.chats.find((c) => c.id === msg.chat_id);
  if (!chat) return { ok: false, reason: "No chat." };

  const token = db.tokens
    .filter((t) => t.member_id === chat.member_id && t.state === "ISSUED")
    .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
  if (!token) {
    msg.offer_status = "declined";
    return { ok: false, reason: "no-token" };
  }
  try {
    const booking = bookWithToken(db, chat.member_id, msg.slot_suggestion.slot_id, token.id, { via: "chat" });
    msg.offer_status = "accepted";
    msg.booking_id = booking.id;
    const member = db.members.find((m) => m.id === chat.member_id)!;
    const slot = db.slots.find((s) => s.id === msg.slot_suggestion!.slot_id)!;
    postMessage(db, chat.id, "barber", `Sorted — you're booked in for ${slotLabel(slot)}. See you then.`);
    sendMail(db, "booking_confirmed", member.email, bookingConfirmedEmail(member.name, slot.starts_at, false));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export function declineOffer(db: DataStore, messageId: string): void {
  const msg = db.messages.find((m) => m.id === messageId);
  if (msg) msg.offer_status = "declined";
}

function slotLabel(slot: Slot): string {
  const d = new Date(slot.starts_at);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${hh}:${mm} — ${slot.duration_mins} min`;
}
