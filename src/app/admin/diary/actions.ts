"use server";

import { revalidatePath } from "next/cache";
import { mutate } from "@/lib/data/db";

export async function toggleDayAction(formData: FormData) {
  const day = Number(formData.get("day"));
  await mutate((db) => {
    const s = db.settings;
    s.open_days = s.open_days.includes(day)
      ? s.open_days.filter((d) => d !== day)
      : [...s.open_days, day].sort();
  });
  revalidatePath("/admin/diary");
}

export async function setWeekendDayAction(formData: FormData) {
  const which = String(formData.get("weekend_day")) as "saturday" | "sunday";
  await mutate((db) => {
    db.settings.weekend_day = which;
  });
  revalidatePath("/admin/diary");
}

export async function setCapAction(formData: FormData) {
  const cap = Math.max(0, Math.min(8, Number(formData.get("cap"))));
  await mutate((db) => {
    db.settings.weekday_daily_cap = cap;
  });
  revalidatePath("/admin/diary");
}
