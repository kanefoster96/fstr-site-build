"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "@/lib/data/db";
import { redeemToken } from "@/lib/engine/tokens";
import { memberVisibleSlots, createPrebook } from "@/lib/engine/booking";

/** Find the member's usual (dow+time) next open slot, else the soonest. */
function nextUsualSlotId(db: import("@/lib/types").DataStore, memberId: string): string | null {
  const visible = memberVisibleSlots(db);
  if (visible.length === 0) return null;
  const hist = db.bookings.filter(
    (b) => b.member_id === memberId && (b.status === "completed" || b.status === "confirmed"),
  );
  const tally = new Map<string, number>();
  for (const b of hist) {
    const s = db.slots.find((x) => x.id === b.slot_id);
    if (!s) continue;
    const d = new Date(s.starts_at);
    const key = `${d.getUTCDay()}|${s.starts_at.slice(11, 16)}`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (best) {
    const [dow, time] = best.split("|");
    const match = visible.find(
      (s) => new Date(s.starts_at).getUTCDay() === Number(dow) && s.starts_at.slice(11, 16) === time,
    );
    if (match) return match.id;
  }
  return visible[visible.length - 1].id; // furthest out — a "next time" slot
}

export async function redeemAction(formData: FormData) {
  const tokenId = String(formData.get("token_id"));
  const note = String(formData.get("note") ?? "").trim();
  const prebook = formData.get("prebook") === "on";

  const result = await mutate((db) => {
    redeemToken(db, tokenId, "barber");
    const booking = db.bookings.find((b) => b.token_id === tokenId);
    if (booking) {
      booking.status = "completed";
      if (note) booking.reason = note;
    }
    let prebooked = false;
    if (prebook) {
      const memberId = db.tokens.find((t) => t.id === tokenId)?.member_id;
      if (memberId) {
        const slotId = nextUsualSlotId(db, memberId);
        if (slotId) {
          try {
            createPrebook(db, memberId, slotId);
            prebooked = true;
          } catch {
            /* already has a prebook, or slot gone */
          }
        }
      }
    }
    return prebooked;
  });

  revalidatePath("/admin/scan");
  revalidatePath("/admin");
  revalidatePath("/me");
  redirect(`/admin/scan?done=1${result ? "&prebooked=1" : ""}`);
}
