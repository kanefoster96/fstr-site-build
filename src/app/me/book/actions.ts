"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { bookWithToken } from "@/lib/engine/booking";
import { sendMail } from "@/lib/adapters/mail";
import { bookingConfirmedEmail } from "@/lib/emails";

export async function bookSlotAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const slotId = String(formData.get("slot_id"));
  const beard = formData.get("beard") === "on";
  const memberId = session.member.id;

  const err = await mutate((db) => {
    // Pick the member's soonest-expiring available token.
    const token = db.tokens
      .filter((t) => t.member_id === memberId && t.state === "ISSUED")
      .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
    if (!token) return "no-token";
    const slot = db.slots.find((s) => s.id === slotId);
    try {
      bookWithToken(db, memberId, slotId, token.id, { beard, via: "calendar" });
      if (slot) {
        sendMail(db, "booking_confirmed", db.members.find((m) => m.id === memberId)!.email,
          bookingConfirmedEmail(session.member!.name, slot.starts_at, beard));
      }
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
