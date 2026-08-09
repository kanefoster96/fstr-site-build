"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { setSession } from "@/lib/auth";
import {
  join,
  createGuestAccount,
  grantTrialCredit,
} from "@/lib/engine/membership";
import { invoicePaid } from "@/lib/adapters/payments";
import { bookWithToken } from "@/lib/engine/booking";
import { mintToken } from "@/lib/engine/tokens";
import { sendMail } from "@/lib/adapters/mail";
import { bookingConfirmedEmail, oneOffFollowUpEmail } from "@/lib/emails";

export interface OnboardData {
  name: string;
  email: string;
  avatarUrl: string | null;
  frequencyWeeks: number;
  planWeeks: number;
  usualCut: string;
  slotId: string | null;
}

/** Start a membership: account + subscription at the chosen cadence, first
 *  token minted, and their chosen first cut booked. */
export async function completeMembership(data: OnboardData) {
  const outcome = await mutate((db) => {
    const result = join(db, {
      name: data.name,
      email: data.email,
      phone: "",
      availability: [],
      cycleWeeks: data.planWeeks,
      avatarUrl: data.avatarUrl,
      usualCut: data.usualCut || undefined,
      frequencyWeeks: data.frequencyWeeks,
    });
    if (!result) return { full: true as const };

    const paid = invoicePaid(db, result.member.id, true); // mints first token
    // Book their chosen first slot with the fresh token, if they picked one.
    if (data.slotId && paid.minted) {
      try {
        bookWithToken(db, result.member.id, data.slotId, paid.minted, { via: "calendar" });
        const slot = db.slots.find((s) => s.id === data.slotId);
        if (slot) sendMail(db, "booking_confirmed", data.email, bookingConfirmedEmail(data.name, slot.starts_at, false));
      } catch {
        /* slot taken meanwhile — token stays available */
      }
    }
    return { full: false as const, memberId: result.member.id };
  });

  if (outcome.full) redirect("/join?waitlisted=1");
  await setSession(outcome.memberId, "member");
  revalidatePath("/me");
  redirect("/me?welcome=1");
}

/** Try a one-off (£35). The £35 buys a single token there and then — which is
 *  spent immediately on the chosen first cut — so the flow is identical to a
 *  member's: pay, earn a token, spend it. No subscription; banks a credit toward
 *  a same-day membership. */
export async function completeOneOff(data: OnboardData) {
  const memberId = await mutate((db) => {
    const member = createGuestAccount(db, {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
      usualCut: data.usualCut || undefined,
      frequencyWeeks: data.frequencyWeeks,
    });

    // The £35 mints one token (recorded as a paid one-off purchase).
    const token = mintToken(db, member.id, "one_off");

    if (data.slotId) {
      try {
        const booking = bookWithToken(db, member.id, data.slotId, token.id, { via: "calendar" });
        booking.price_paid = db.settings.oneoff_price; // the £35 they actually paid
        const slot = db.slots.find((s) => s.id === data.slotId);
        if (slot) sendMail(db, "booking_confirmed", data.email, bookingConfirmedEmail(data.name, slot.starts_at, false));
      } catch {
        /* slot gone — the token stays in their wallet to book later */
      }
    }
    // Credit = the extra a one-off costs over a cycle, applied if they join today.
    const credit = Math.max(0, db.settings.oneoff_price - db.settings.current_rate);
    grantTrialCredit(db, member.id, credit);
    sendMail(db, "oneoff_followup", data.email, oneOffFollowUpEmail(db.settings.current_rate));
    return member.id;
  });

  await setSession(memberId, "member");
  revalidatePath("/me");
  redirect("/me?trial=1");
}

/** Skip payment for now — create the account and land on the dashboard. */
export async function completeSkip(data: OnboardData) {
  const memberId = await mutate((db) =>
    createGuestAccount(db, {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
      usualCut: data.usualCut || undefined,
      frequencyWeeks: data.frequencyWeeks,
    }).id,
  );
  await setSession(memberId, "member");
  revalidatePath("/me");
  redirect("/me?explore=1");
}
