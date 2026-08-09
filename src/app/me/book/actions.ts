"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { bookWithToken, bookWeekendUpgrade, bookOneOff } from "@/lib/engine/booking";
import { sendMail } from "@/lib/adapters/mail";
import { bookingConfirmedEmail } from "@/lib/emails";

function soonestToken(db: import("@/lib/types").DataStore, memberId: string) {
  return db.tokens
    .filter((t) => t.member_id === memberId && t.state === "ISSUED")
    .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
}

export async function bookSlotAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const slotId = String(formData.get("slot_id"));
  const beard = formData.get("beard") === "on";
  const memberId = session.member.id;
  const name = session.member.name;
  const email = session.member.email;

  const err = await mutate((db) => {
    const token = soonestToken(db, memberId);
    if (!token) return "no-token";
    const slot = db.slots.find((s) => s.id === slotId);
    try {
      bookWithToken(db, memberId, slotId, token.id, { beard, via: "calendar" });
      if (slot) sendMail(db, "booking_confirmed", email, bookingConfirmedEmail(name, slot.starts_at, beard));
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  });

  revalidatePath("/me");
  revalidatePath("/me/book");
  if (err === "no-token") redirect("/me/book?error=no-token");
  redirect("/me?booked=1");
}

/** Saturday priority slot with a token + £10 upgrade. */
export async function bookWeekendUpgradeAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const slotId = String(formData.get("slot_id"));
  const beard = formData.get("beard") === "on";
  const memberId = session.member.id;
  const name = session.member.name;
  const email = session.member.email;

  const err = await mutate((db) => {
    const token = soonestToken(db, memberId);
    if (!token) return "no-token";
    const slot = db.slots.find((s) => s.id === slotId);
    try {
      bookWeekendUpgrade(db, memberId, slotId, token.id, { beard, via: "calendar" });
      if (slot) sendMail(db, "booking_confirmed", email, bookingConfirmedEmail(name, slot.starts_at, beard));
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  });

  revalidatePath("/me");
  revalidatePath("/me/book");
  if (err === "no-token") redirect("/me/book?error=no-token-weekend");
  redirect("/me?booked=weekend");
}

/** Saturday priority slot paid in full (£35, no token). */
export async function bookWeekendPaidAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const slotId = String(formData.get("slot_id"));
  const beard = formData.get("beard") === "on";
  const m = session.member;

  await mutate((db) => {
    const slot = db.slots.find((s) => s.id === slotId);
    try {
      bookOneOff(db, slotId, { name: m.name, email: m.email, phone: m.phone }, { beard });
      if (slot) sendMail(db, "booking_confirmed", m.email, bookingConfirmedEmail(m.name, slot.starts_at, beard));
    } catch {
      /* slot gone */
    }
  });

  revalidatePath("/me");
  revalidatePath("/me/book");
  redirect("/me?booked=weekend");
}
