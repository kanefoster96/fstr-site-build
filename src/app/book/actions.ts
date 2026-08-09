"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { bookOneOff } from "@/lib/engine/booking";
import { fromPrice } from "@/lib/engine/membership";
import { sendMail } from "@/lib/adapters/mail";
import { oneOffFollowUpEmail } from "@/lib/emails";

export async function bookOneOffAction(formData: FormData) {
  const slotId = String(formData.get("slot_id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const beard = formData.get("beard") === "on";

  if (!name || !email || !slotId) redirect("/book?error=missing");

  const result = await mutate((db) => {
    try {
      bookOneOff(db, slotId, { name, email, phone }, { beard });
      // Every completed one-off gets the membership pitch (§5).
      sendMail(db, "oneoff_followup", email, oneOffFollowUpEmail(fromPrice(db)));
      return { ok: true as const };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });

  revalidatePath("/book");
  if ("ok" in result) redirect("/book?booked=1");
  redirect("/book?error=slot");
}
