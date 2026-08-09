import { Container, Button, Eyebrow, Num, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import { AdminNav } from "../page";
import { getDb } from "@/lib/data/db";
import { getRevealState, slotStartTimes, DOW_LONG } from "@/lib/engine/schedule";
import { toggleDayAction, setWeekendDayAction, setCapAction } from "./actions";

export const dynamic = "force-dynamic";

const DAYS = [
  [1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"],
] as const;

export default async function DiaryPage() {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;
  const db = await getDb();
  const s = db.settings;
  const reveal = getRevealState(db);
  const times = slotStartTimes(db);
  const fillPct = Math.round(reveal.fill * 100);

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Diary</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">Shape your week</h1>
        </div>
        <AdminNav />
      </div>

      {/* Staged opening status */}
      <div className="mt-6 rounded-2xl border border-brass/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Staged opening</p>
          <p className="num text-sm text-steel">
            {s.day_start}–{s.day_end} · {times.length} slots/day · {times.join("  ")}
          </p>
        </div>
        <p className="num mt-2 text-sm">
          Open now: <span className="value">{reveal.revealed.map((d) => DOW_LONG[d]).join(", ")}</span>
        </p>
        {reveal.nextDay != null ? (
          <>
            <div className="mt-2 h-2 rounded-full bg-mist">
              <div className="h-2 rounded-full bg-brass" style={{ width: `${Math.min(100, (fillPct / (reveal.threshold * 100)) * 100)}%` }} />
            </div>
            <p className="num mt-2 text-xs text-steel">
              {fillPct}% full — {DOW_LONG[reveal.nextDay]} unlocks at {Math.round(reveal.threshold * 100)}%.
            </p>
          </>
        ) : (
          <p className="num mt-2 text-xs text-steel">Full week open — demand&apos;s strong.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Open days */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Open days</p>
          <p className="text-xs text-steel">Toggle which weekdays you work.</p>
          <div className="mt-3 space-y-2">
            {DAYS.map(([d, label]) => {
              const open = s.open_days.includes(d);
              return (
                <form key={d} action={toggleDayAction} className="flex items-center justify-between">
                  <input type="hidden" name="day" value={d} />
                  <span className="text-sm">{label}</span>
                  <button className={`num rounded-full px-4 py-1.5 text-xs ${open ? "bg-brass text-paper" : "border border-steel/40 text-steel"}`}>
                    {open ? "Open" : "Closed"}
                  </button>
                </form>
              );
            })}
          </div>
        </Card>

        {/* Weekend day + caps */}
        <div className="space-y-4">
          <Card className="!bg-mist">
            <p className="text-sm font-medium">Weekend day</p>
            <p className="text-xs text-steel">One weekend day, 4 slots max. Members get 48h early access.</p>
            <div className="mt-3 flex gap-2">
              {(["saturday", "sunday"] as const).map((w) => (
                <form key={w} action={setWeekendDayAction}>
                  <input type="hidden" name="weekend_day" value={w} />
                  <button className={`num rounded-full px-4 py-1.5 text-xs capitalize ${s.weekend_day === w ? "bg-brass text-paper" : "border border-steel/40 text-steel"}`}>
                    {w}
                  </button>
                </form>
              ))}
            </div>
          </Card>

          <Card className="!bg-mist">
            <p className="text-sm font-medium">Weekday slot cap</p>
            <p className="text-xs text-steel">Published slots per open day (staged opening).</p>
            <form action={setCapAction} className="mt-3 flex items-center gap-2">
              <input
                name="cap"
                type="number"
                min={0}
                max={8}
                defaultValue={s.weekday_daily_cap}
                className="num w-20 rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm"
              />
              <Button type="submit" variant="ghost" className="text-sm">Save cap</Button>
            </form>
          </Card>
        </div>
      </div>

      <p className="num mt-8 text-xs text-steel">
        Release windows: members {s.rules.member_release_weeks}w out · one-offs ≤{s.rules.oneoff_window_days}d ·
        weekend early access {s.rules.weekend_early_access_hours}h. Block dates &amp; staged opening — v2.
      </p>
    </Container>
  );
}
