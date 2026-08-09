"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { postMessage, acceptOffer, declineOffer } from "@/lib/engine/chat";

async function ensureChatId(): Promise<string | null> {
  const session = await getSession();
  if (!session.member) return null;
  const memberId = session.member.id;
  return mutate((db) => {
    let chat = db.chats.find((c) => c.member_id === memberId);
    if (!chat) {
      chat = {
        id: `chat_${Date.now().toString(36)}`,
        member_id: memberId,
        created_at: db.clock.now,
        last_message_at: db.clock.now,
      };
      db.chats.push(chat);
    }
    return chat.id;
  });
}

export async function sendMemberMessage(formData: FormData) {
  const session = await getSession();
  if (!session.member) return;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const chatId = await ensureChatId();
  if (!chatId) return;
  await mutate((db) => postMessage(db, chatId, session.member!.id, body));
  revalidatePath("/me/chat");
  revalidatePath("/admin/inbox");
}

export async function acceptOfferAction(formData: FormData) {
  const messageId = String(formData.get("message_id"));
  await mutate((db) => acceptOffer(db, messageId));
  revalidatePath("/me/chat");
  revalidatePath("/me");
  revalidatePath("/admin/inbox");
}

export async function declineOfferAction(formData: FormData) {
  const messageId = String(formData.get("message_id"));
  await mutate((db) => declineOffer(db, messageId));
  revalidatePath("/me/chat");
  revalidatePath("/admin/inbox");
}
