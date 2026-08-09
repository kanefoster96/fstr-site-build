"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { postMessage, offerSlot } from "@/lib/engine/chat";

export async function sendBarberMessage(formData: FormData) {
  const chatId = String(formData.get("chat_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await mutate((db) => postMessage(db, chatId, "barber", body));
  revalidatePath("/admin/inbox");
  revalidatePath("/me/chat");
}

export async function offerSlotAction(formData: FormData) {
  const chatId = String(formData.get("chat_id"));
  const slotId = String(formData.get("slot_id"));
  await mutate((db) => offerSlot(db, chatId, slotId));
  revalidatePath("/admin/inbox");
  revalidatePath("/me/chat");
}
