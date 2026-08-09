"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { pauseMembership, cancelMembership } from "@/lib/engine/membership";

export async function pauseAction() {
  const session = await getSession();
  if (!session.member) return;
  await mutate((db) => pauseMembership(db, session.member!.id));
  revalidatePath("/me/profile");
  redirect("/me/profile?paused=1");
}

export async function cancelAction() {
  const session = await getSession();
  if (!session.member) return;
  await mutate((db) => cancelMembership(db, session.member!.id));
  revalidatePath("/me/profile");
  redirect("/me/profile?cancelled=1");
}
