"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { addDays } from "@/lib/format";
import { sendMail } from "@/lib/adapters/mail";
import { waitlistSeatEmail } from "@/lib/emails";

/** Notify a waitlisted contact that a seat's free — 48h to claim (§6). */
export async function notifyWaitlistAction(formData: FormData) {
  const id = String(formData.get("waitlist_id"));
  await mutate((db) => {
    const w = db.waitlist.find((x) => x.id === id);
    if (!w) return;
    w.notified_at = db.clock.now;
    w.claim_deadline = addDays(db.clock.now, 2); // 48h
    if (w.email) sendMail(db, "waitlist_seat", w.email, waitlistSeatEmail(w.contact, db.settings.waitlist_price));
  });
  revalidatePath("/admin/members");
  revalidatePath("/dev/mail");
}
