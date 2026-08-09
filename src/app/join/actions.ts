"use server";

import { redirect } from "next/navigation";
import { mutate } from "@/lib/data/db";
import { join } from "@/lib/engine/membership";
import { invoicePaid } from "@/lib/adapters/payments";
import { setSession } from "@/lib/auth";
import type { AvailabilityFlag } from "@/lib/types";

export async function joinAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const availability = formData.getAll("availability").map(String) as AvailabilityFlag[];

  if (!name || !email) {
    redirect("/join?error=missing");
  }

  const outcome = await mutate((db) => {
    const result = join(db, { name, email, phone, availability });
    if (!result) {
      // Membership full → waitlist.
      db.waitlist.push({
        id: `wl_${Date.now().toString(36)}`,
        contact: name,
        email,
        availability_profile: availability,
        created_at: db.clock.now,
        notified_at: null,
      });
      return { full: true as const };
    }
    // Mock Stripe checkout success → first billing event mints the first token.
    invoicePaid(db, result.member.id, true);
    return { full: false as const, memberId: result.member.id };
  });

  if (outcome.full) {
    redirect("/join?waitlisted=1");
  }
  await setSession(outcome.memberId, "member");
  redirect("/me?welcome=1");
}
