"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { findGiftByCode } from "@/lib/engine/gifts";
import { bookWithToken } from "@/lib/engine/booking";

export async function redeemGiftAction(formData: FormData) {
  const code = String(formData.get("code"));
  const slotId = String(formData.get("slot_id"));
  const name = String(formData.get("name") ?? "").trim();

  const result = await mutate((db) => {
    const gift = findGiftByCode(db, code);
    if (!gift) return { error: "not-found" as const };
    if (gift.status === "booked" || gift.redeemed_at) return { error: "used" as const };
    if (gift.status === "returned" || gift.status === "expired") return { error: "lapsed" as const };
    const token = db.tokens.find((t) => t.id === gift.token_id);
    if (!token || token.state !== "GIFTED") return { error: "lapsed" as const };
    try {
      // The gifted token is reserved against the chosen slot for the recipient.
      bookWithToken(db, token.member_id, slotId, token.id, { via: "calendar", giftId: gift.id });
      return { ok: true as const };
    } catch (e) {
      return { error: "slot" as const, message: (e as Error).message };
    }
  });

  revalidatePath(`/gift/${code}`);
  if ("ok" in result) redirect(`/gift/${code}?booked=1`);
  redirect(`/gift/${code}?error=${result.error}`);
}
