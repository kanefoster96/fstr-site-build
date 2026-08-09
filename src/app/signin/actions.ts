"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/data/db";
import { setSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

/**
 * Sign in with email + password. We match the email you joined with (preferring
 * a subscribed account if the same address has more than one) and verify the
 * password against its salted hash. Swaps 1:1 for Supabase Auth later.
 */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/signin?error=empty");

  const db = await getDb();
  const matches = db.members.filter(
    (m) => m.email.trim().toLowerCase() === email && !!m.password_hash,
  );

  // Prefer a real subscriber, then the most recently created account.
  const subscribed = matches.find((m) =>
    db.subscriptions.some((s) => s.member_id === m.id && s.status !== "cancelled"),
  );
  const member =
    subscribed ??
    matches.sort((a, b) => Date.parse(b.joined_at) - Date.parse(a.joined_at))[0];

  // Same message whether the email or the password is wrong — don't leak which.
  if (!member || !verifyPassword(password, member.password_hash)) {
    redirect("/signin?error=invalid");
  }

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
