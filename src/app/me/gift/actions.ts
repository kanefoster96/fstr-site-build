"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { giftToken } from "@/lib/engine/gifts";
import { sendMail } from "@/lib/adapters/mail";
import { giftSentEmail, giftReceivedEmail } from "@/lib/emails";
import { redirect } from "next/navigation";

export async function giftTokenAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const toContact = String(formData.get("to_contact") ?? "").trim();
  const memberId = session.member.id;
  const memberName = session.member.name;

  const result = await mutate((db) => {
    const token = db.tokens
      .filter((t) => t.member_id === memberId && t.state === "ISSUED")
      .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
    if (!token) return { error: "no-token" as const };
    const gift = giftToken(db, token.id, memberId, toContact || "a mate");
    sendMail(db, "gift_sent", session.member!.email, giftSentEmail(memberName, gift.to_contact, gift.code));
    if (toContact.includes("@")) {
      sendMail(db, "gift_received", toContact, giftReceivedEmail(memberName, gift.code, gift.expires_at));
    }
    return { code: gift.code };
  });

  revalidatePath("/me");
  revalidatePath("/me/gift");
  if ("error" in result) redirect("/me/gift?error=no-token");
  redirect(`/me/gift?sent=${result.code}`);
}
