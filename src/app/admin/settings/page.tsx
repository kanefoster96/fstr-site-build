import { Container, Button, Eyebrow, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import { getDb } from "@/lib/data/db";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const P = (pence: number) => (pence / 100).toString();

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;
  const sp = await searchParams;
  const s = (await getDb()).settings;
  const ALL_PLANS = [2, 3, 4, 5, 6];

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Settings</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">The rules, tunable</h1>
        </div>
        <AdminNav />
      </div>

      {sp.saved && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">Saved — applied live across the site.</p>
      )}

      <form action={updateSettingsAction} className="mt-6 space-y-6">
        {/* Pricing */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Pricing (£)</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Money name="current_rate" label="Per token" value={P(s.current_rate)} />
            <Money name="oneoff_price" label="One-off cut" value={P(s.oneoff_price)} />
            <Money name="weekend_public_price" label="Weekend (public)" value={P(s.weekend_public_price)} />
            <Money name="weekend_upgrade_surcharge" label="Weekend upgrade" value={P(s.weekend_upgrade_surcharge)} />
            <Money name="waitlist_price" label="Waitlist rate" value={P(s.waitlist_price)} />
          </div>
        </Card>

        {/* Plans */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Plans (cadence)</p>
          <p className="text-xs text-steel">Which weekly cadences members can choose.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {ALL_PLANS.map((w) => (
              <label key={w} className="num flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="plans" value={w} defaultChecked={s.plans.includes(w)} className="accent-[var(--brass)]" />
                {w} wk
              </label>
            ))}
          </div>
          <div className="mt-3 w-40">
            <Int name="default_cycle_weeks" label="Default cadence (wks)" value={s.default_cycle_weeks} />
          </div>
        </Card>

        {/* Holding caps */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Token holding</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Int name="max_held" label="Max held" value={s.rules.max_held} />
            <Int name="active_display" label="Active shown" value={s.rules.active_display} />
            <Int name="store_cap" label="Stored cap" value={s.rules.store_cap} />
            <Int name="plan_prompt_threshold" label="Nudge at" value={s.rules.plan_prompt_threshold} />
          </div>
        </Card>

        {/* Token rules */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Token rules</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Int name="token_life_days" label="Token life (days)" value={s.rules.token_life_days} />
            <Int name="gift_life_days" label="Gift life (days)" value={s.rules.gift_life_days} />
            <Int name="cancel_cutoff_hours" label="Cancel cutoff (h)" value={s.rules.cancel_cutoff_hours} />
            <Int name="cancel_extend_days" label="Cancel extend (d)" value={s.rules.cancel_extend_days} />
            <Int name="member_release_weeks" label="Member release (wk)" value={s.rules.member_release_weeks} />
            <Int name="oneoff_window_days" label="One-off window (d)" value={s.rules.oneoff_window_days} />
            <Int name="reclaim_window_days" label="Reclaim (d)" value={s.rules.reclaim_window_days} />
            <Int name="liability_amber" label="Liability amber" value={s.rules.liability_amber} />
            <Int name="liability_red" label="Liability red" value={s.rules.liability_red} />
          </div>
        </Card>

        {/* Staged opening + weekend */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Opening &amp; weekend</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Int name="reveal_threshold_pct" label="Reveal at (%)" value={Math.round(s.reveal_threshold * 100)} />
            <Int name="last_minute_days" label="Last-minute (d)" value={s.last_minute_days} />
            <Int name="weekend_slots_max" label="Weekend slots" value={s.weekend_slots_max} />
            <Int name="weekend_early_access_hours" label="Early access (h)" value={s.rules.weekend_early_access_hours} />
            <label className="block">
              <span className="text-xs text-steel">Weekend day</span>
              <select name="weekend_day" defaultValue={s.weekend_day} className="num mt-1 w-full rounded-lg border border-steel/40 bg-paper px-2 py-2 text-sm capitalize">
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </label>
          </div>
        </Card>

        {/* Feature flags */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Feature flags (§13)</p>
          <div className="mt-3 space-y-2 text-sm">
            <Flag name="flag_pause_holding_fee" label={`£${P(s.pause_holding_fee)}/mo pause holding fee`} on={s.flags.pause_holding_fee} />
            <Flag name="flag_trial_offer" label="Trial offer (£35 first cut, refunded into month one)" on={s.flags.trial_offer} />
            <Flag name="flag_three_day_opening" label="Three-day opening (vs all weekdays capped)" on={s.flags.three_day_opening} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save settings</Button>
          <span className="num text-xs text-steel">Applies live everywhere immediately.</span>
        </div>
      </form>
    </Container>
  );
}

function Money({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs text-steel">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-steel/40 bg-paper px-2">
        <span className="num text-sm text-steel">£</span>
        <input name={name} type="number" step="0.5" min="0" defaultValue={value} className="num w-full bg-transparent px-1 py-2 text-sm outline-none" />
      </div>
    </label>
  );
}

function Int({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label className="block">
      <span className="text-xs text-steel">{label}</span>
      <input name={name} type="number" min="0" defaultValue={value} className="num mt-1 w-full rounded-lg border border-steel/40 bg-paper px-2 py-2 text-sm outline-none" />
    </label>
  );
}

function Flag({ name, label, on }: { name: string; label: string; on: boolean }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={on} className="accent-[var(--brass)]" />
      {label}
    </label>
  );
}
