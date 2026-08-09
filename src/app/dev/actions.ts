"use server";

import { revalidatePath } from "next/cache";
import { mutate, resetDb } from "@/lib/data/db";
import { advanceDays } from "@/lib/engine/clock";
import { invoicePaid, invoicePaymentFailed } from "@/lib/adapters/payments";
import { setSession } from "@/lib/auth";

export async function advanceClockAction(formData: FormData) {
  const days = Number(formData.get("days") ?? 1);
  await mutate((db) => advanceDays(db, days));
  revalidatePath("/dev");
  revalidatePath("/me");
  revalidatePath("/admin");
}

export async function fireInvoicePaid(formData: FormData) {
  const memberId = String(formData.get("member_id"));
  await mutate((db) => invoicePaid(db, memberId, false));
  revalidatePath("/dev");
  revalidatePath("/dev/mail");
  revalidatePath("/me");
}

export async function fireInvoiceFailed(formData: FormData) {
  const memberId = String(formData.get("member_id"));
  await mutate((db) => invoicePaymentFailed(db, memberId));
  revalidatePath("/dev");
  revalidatePath("/dev/mail");
}

export async function pickSessionAction(formData: FormData) {
  const memberId = String(formData.get("member_id"));
  if (memberId === "barber") {
    await setSession("barber", "barber");
  } else if (memberId === "none") {
    await setSession(null, "member");
  } else {
    await setSession(memberId, "member");
  }
  revalidatePath("/dev");
  revalidatePath("/me");
  revalidatePath("/admin");
}

export async function resetStoreAction() {
  await resetDb();
  revalidatePath("/dev");
  revalidatePath("/me");
  revalidatePath("/admin");
}
