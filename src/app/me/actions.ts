"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { bookWithToken, createPrebook } from "@/lib/engine/booking";
import { changePlan, PlanError, upgradeToMembership } from "@/lib/engine/membership";
import { invoicePaid } from "@/lib/adapters/payments";
import { giftToken } from "@/lib/engine/gifts";
import { sendMail } from "@/lib/adapters/mail";
import { bookingConfirmedEmail, giftSentEmail, giftReceivedEmail } from "@/lib/emails";

/**
 * One-tap booking from the wallet. If the member has an available token we book
 * the slot straight away; if not, we hold it as a prebook that auto-confirms
 * when their next token lands. Either way they don't have to think about it.
 */
export async function quickBookAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const slotId = String(formData.get("slot_id"));
  const m = session.member;

  const outcome = await mutate((db) => {
    const token = db.tokens
      .filter((t) => t.member_id === m.id && t.state === "ISSUED")
      .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
    const slot = db.slots.find((s) => s.id === slotId);
    try {
      if (token) {
        bookWithToken(db, m.id, slotId, token.id, { via: "calendar" });
        if (slot) sendMail(db, "booking_confirmed", m.email, bookingConfirmedEmail(m.name, slot.starts_at, false));
        return "booked";
      }
      createPrebook(db, m.id, slotId);
      return "prebooked";
    } catch (e) {
      return (e as Error).message;
    }
  });

  revalidatePath("/me");
  revalidatePath("/me/book");
  redirect(`/me?done=${encodeURIComponent(outcome)}`);
}

/** Guest/trial → membership. Applies any valid same-day trial credit to the
 *  first token, then mints it. */
export async function upgradeMembershipAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const weeks = Number(formData.get("cycle_weeks") || 0) || undefined;
  const m = session.member;

  const outcome = await mutate((db) => {
    const res = upgradeToMembership(db, m.id, weeks);
    if (!res) return { full: true as const };
    const member = db.members.find((x) => x.id === m.id);
    let credited = 0;
    if (member?.trial_credit && member.trial_credit_expires && new Date(db.clock.now) < new Date(member.trial_credit_expires)) {
      credited = member.trial_credit;
    }
    if (member) {
      member.trial_credit = 0;
      member.trial_credit_expires = null;
    }
    invoicePaid(db, m.id, true); // mints the first token + welcome
    return { full: false as const, credited };
  });

  revalidatePath("/me");
  if (outcome.full) redirect("/join?waitlisted=1");
  redirect(`/me?welcome=1${outcome.credited ? `&credit=${outcome.credited}` : ""}`);
}

/** Change billing cadence (2/3/4/5/6-week plan), once per cycle. */
export async function changePlanAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const weeks = Number(formData.get("cycle_weeks"));
  const from = String(formData.get("from") ?? "me");

  const result = await mutate((db) => {
    try {
      changePlan(db, session.member!.id, weeks);
      return { ok: true as const };
    } catch (e) {
      if (e instanceof PlanError) return { error: e.message };
      throw e;
    }
  });

  revalidatePath("/me");
  revalidatePath("/me/profile");
  const base = from === "profile" ? "/me/profile" : "/me";
  if ("error" in result) redirect(`${base}?plan=locked`);
  redirect(`${base}?plan=${weeks}`);
}

/** One-tap gift of the soonest available token. */
export async function quickGiftAction(formData: FormData) {
  const session = await getSession();
  if (!session.member) redirect("/join");
  const to = String(formData.get("to_contact") ?? "").trim();
  const m = session.member;

  const outcome = await mutate((db) => {
    const token = db.tokens
      .filter((t) => t.member_id === m.id && t.state === "ISSUED")
      .sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at))[0];
    if (!token) return { error: "no-token" as const };
    const gift = giftToken(db, token.id, m.id, to || "a mate");
    sendMail(db, "gift_sent", m.email, giftSentEmail(m.name, gift.to_contact, gift.code));
    if (to.includes("@")) sendMail(db, "gift_received", to, giftReceivedEmail(m.name, gift.code, gift.expires_at));
    return { code: gift.code };
  });

  revalidatePath("/me");
  if ("error" in outcome) redirect("/me?done=gift-no-token");
  redirect(`/me?gifted=${outcome.code}`);
}
