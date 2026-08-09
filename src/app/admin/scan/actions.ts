"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "@/lib/data/db";
import { redeemToken } from "@/lib/engine/tokens";

export async function redeemAction(formData: FormData) {
  const tokenId = String(formData.get("token_id"));
  const note = String(formData.get("note") ?? "").trim();
  await mutate((db) => {
    redeemToken(db, tokenId, "barber");
    const booking = db.bookings.find((b) => b.token_id === tokenId);
    if (booking) {
      booking.status = "completed";
      if (note) booking.reason = note;
    }
  });
  revalidatePath("/admin/scan");
  revalidatePath("/admin");
  redirect("/admin/scan?done=1");
}
