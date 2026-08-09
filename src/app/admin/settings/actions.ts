"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "@/lib/data/db";

/**
 * Admin settings — every rule number, price and cap is editable here and read
 * live everywhere else (§19). Prices are entered in pounds and stored in pence.
 */
export async function updateSettingsAction(formData: FormData) {
  await mutate((db) => {
    const s = db.settings;
    const num = (k: string, def: number) => {
      const v = formData.get(k);
      return v == null || v === "" ? def : Number(v);
    };
    const pounds = (k: string, def: number) => {
      const v = formData.get(k);
      return v == null || v === "" ? def : Math.round(Number(v) * 100);
    };
    const on = (k: string) => formData.get(k) === "on";

    // Pricing
    s.current_rate = pounds("current_rate", s.current_rate);
    s.oneoff_price = pounds("oneoff_price", s.oneoff_price);
    s.weekend_public_price = pounds("weekend_public_price", s.weekend_public_price);
    s.weekend_upgrade_surcharge = pounds("weekend_upgrade_surcharge", s.weekend_upgrade_surcharge);
    s.waitlist_price = pounds("waitlist_price", s.waitlist_price);
    s.pause_holding_fee = pounds("pause_holding_fee", s.pause_holding_fee);

    // Plans / cadence
    const plans = formData.getAll("plans").map(Number).filter((n) => n >= 1);
    if (plans.length) s.plans = plans.sort((a, b) => a - b);
    s.default_cycle_weeks = num("default_cycle_weeks", s.default_cycle_weeks);

    // Holding caps
    s.rules.max_held = num("max_held", s.rules.max_held);
    s.rules.active_display = num("active_display", s.rules.active_display);
    s.rules.store_cap = num("store_cap", s.rules.store_cap);
    s.rules.plan_prompt_threshold = num("plan_prompt_threshold", s.rules.plan_prompt_threshold);

    // Token rules
    s.rules.token_life_days = num("token_life_days", s.rules.token_life_days);
    s.rules.gift_life_days = num("gift_life_days", s.rules.gift_life_days);
    s.rules.cancel_cutoff_hours = num("cancel_cutoff_hours", s.rules.cancel_cutoff_hours);
    s.rules.cancel_extend_days = num("cancel_extend_days", s.rules.cancel_extend_days);
    s.rules.member_release_weeks = num("member_release_weeks", s.rules.member_release_weeks);
    s.rules.oneoff_window_days = num("oneoff_window_days", s.rules.oneoff_window_days);
    s.rules.reclaim_window_days = num("reclaim_window_days", s.rules.reclaim_window_days);
    s.rules.liability_amber = num("liability_amber", s.rules.liability_amber);
    s.rules.liability_red = num("liability_red", s.rules.liability_red);

    // Staged opening
    s.reveal_threshold = Math.max(0, Math.min(1, num("reveal_threshold_pct", s.reveal_threshold * 100) / 100));
    s.last_minute_days = num("last_minute_days", s.last_minute_days);

    // Weekend
    const wd = formData.get("weekend_day");
    if (wd === "saturday" || wd === "sunday") s.weekend_day = wd;
    s.weekend_slots_max = num("weekend_slots_max", s.weekend_slots_max);
    s.rules.weekend_early_access_hours = num("weekend_early_access_hours", s.rules.weekend_early_access_hours);

    // Feature flags (§13)
    s.flags.pause_holding_fee = on("flag_pause_holding_fee");
    s.flags.trial_offer = on("flag_trial_offer");
    s.flags.three_day_opening = on("flag_three_day_opening");
  });

  revalidatePath("/admin/settings");
  revalidatePath("/me");
  revalidatePath("/join");
  revalidatePath("/me/book");
  redirect("/admin/settings?saved=1");
}
