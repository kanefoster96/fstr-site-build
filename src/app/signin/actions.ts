"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/data/db";
import { setSession } from "@/lib/auth";

/**
 * Mock sign-in. There's no password — your email is your key (a magic-link
 * style flow, minus the real email round-trip). We match the email you joined
 * with, preferring a subscribed account if the same address has more than one.
 * Swaps 1:1 for Supabase Auth later.
 */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/signin?error=empty");

  const db = await getDb();
  const matches = db.members.filter((m) => m.email.trim().toLowerCase() === email);
  if (matches.length === 0) redirect("/signin?error=notfound");

  // Prefer a real subscriber, then the most recently created account.
  const subscribed = matches.find((m) =>
    db.subscriptions.some((s) => s.member_id === m.id && s.status !== "cancelled"),
  );
  const member =
    subscribed ??
    matches.sort((a, b) => Date.parse(b.joined_at) - Date.parse(a.joined_at))[0];

  await setSession(member.id, member.role);
  revalidatePath("/me");
  redirect("/me");
}

/** Sign out — clear the session and land back on the homepage. */
export async function signOutAction() {
  await setSession(null, "member");
  revalidatePath("/");
  redirect("/");
}
