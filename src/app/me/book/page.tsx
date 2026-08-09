import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { memberVisibleSlots, weekendVisibleSlots } from "@/lib/engine/booking";
import { weekdayStatus, DOW_SHORT } from "@/lib/engine/schedule";
import { hasPriority } from "@/lib/engine/gamification";
import { getWallet } from "@/lib/data/member";
import { fmtDay, fmtTime, gbp } from "@/lib/format";
import { bookSlotAction, bookWeekendUpgradeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberBookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session.member) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to book</h1>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </Container>
    );
  }
  const db = await getDb();
  const wallet = (await getWallet(session.member.id))!;
  const available = wallet.tokens.filter((t) => t.state === "ISSUED").length;
  const priority = hasPriority(session.member) ? 24 : 0;
  const slots = memberVisibleSlots(db, priority);
  const weekend = weekendVisibleSlots(db);
  const satToken = weekend.filter((s) => !s.emergency);
  // Emergency Saturday slots only open once that day's 3 token slots are booked.
  const satDate = (iso: string) => iso.slice(0, 10);
  const tokenFull = new Set<string>();
  {
    const byDate = new Map<string, { total: number; booked: number }>();
    for (const s of db.slots.filter((x) => x.day_type === "weekend" && !x.emergency)) {
      const k = satDate(s.starts_at);
      const e = byDate.get(k) ?? { total: 0, booked: 0 };
      e.total += 1;
      if (s.booked) e.booked += 1;
      byDate.set(k, e);
    }
    for (const [k, e] of byDate) if (e.total > 0 && e.booked === e.total) tokenFull.add(k);
  }
  const satEmergency = weekend.filter((s) => s.emergency && tokenFull.has(satDate(s.starts_at)));
  const weekStatus = [1, 2, 3, 4, 5].map((d) => ({ d, status: weekdayStatus(db, d) }));

  const byDay = new Map<string, typeof slots>();
  for (const s of slots) {
    const key = fmtDay(s.starts_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return (
    <Container className="py-12">
      <Eyebrow>Book a cut</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">Pick your slot</h1>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Coin size={28} />
        <span className="num">
          <span className="value">{available}</span> token{available === 1 ? "" : "s"} ready · 45 min · booking freezes the clock
        </span>
      </div>
      {priority > 0 && (
        <p className="num mt-2 inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs">
          <span className="value">★ Priority</span> — you see new slots 24h early
        </p>
      )}

      {/* This week's availability — hidden days simply read as unavailable */}
      <div className="mt-5 grid grid-cols-6 gap-1.5">
        {weekStatus.map(({ d, status }) => (
          <div
            key={d}
            className={`rounded-lg px-1 py-2.5 text-center ${
              status === "open"
                ? "bg-mist"
                : status === "last_minute"
                  ? "border border-brass/40"
                  : "border border-steel/15 bg-paper text-steel/60"
            }`}
          >
            <p className="num text-[11px] text-steel">{DOW_SHORT[d]}</p>
            <p className="num mt-0.5 text-[10px]">
              {status === "open" ? "Open" : status === "last_minute" ? "Last-min" : "Full"}
            </p>
          </div>
        ))}
        <div className="rounded-lg border border-brass/40 px-1 py-2.5 text-center">
          <p className="num text-[11px] text-steel">Sat</p>
          <p className="num mt-0.5 text-[10px] value">Token</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-steel">
        Book up to 6 weeks ahead. Booking closes at midday the day before — quieter days also open
        up nearer the time.
      </p>

      {sp.error?.startsWith("no-token") && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          You&apos;ve no available token right now. Your next drops on your billing date.
        </p>
      )}

      {/* Weekday slots */}
      {available === 0 && slots.length > 0 ? (
        <div className="mt-8 rounded-2xl bg-mist p-8 text-center">
          <Coin size={72} ghost className="mx-auto" />
          <p className="mt-4 text-steel">No tokens to spend yet. Your next drops on the 1st.</p>
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-mist p-8 text-center text-steel">
          No weekday slots open right now — they release up to six weeks out.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {[...byDay.entries()].map(([day, daySlots]) => (
            <div key={day}>
              <p className="num text-sm font-medium text-steel">{day}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((s) => (
                  <form
                    key={s.id}
                    action={bookSlotAction}
                    className="flex items-center justify-between rounded-2xl border border-steel/25 bg-paper p-4"
                  >
                    <input type="hidden" name="slot_id" value={s.id} />
                    <div>
                      <p className="num text-lg">{fmtTime(s.starts_at)}</p>
                      <label className="mt-1 flex items-center gap-1.5 text-xs text-steel">
                        <input type="checkbox" name="beard" className="accent-[var(--brass)]" />
                        Full beard +{gbp(db.settings.beard_addon_price)}
                      </label>
                    </div>
                    <Button type="submit" className="!px-4 !py-2 text-xs" disabled={available === 0}>Book</Button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saturday — 3 token slots, then emergency overflow at token + £10 */}
      {weekend.length > 0 && (
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Saturdays</h2>
            <span className="num text-sm text-steel">
              {db.settings.saturday_token_slots} with a token · then +{gbp(db.settings.weekend_upgrade_surcharge)}
            </span>
          </div>
          <p className="mt-1 text-sm text-steel">
            Each Saturday opens {db.settings.saturday_token_slots} slots you can book with a token, just
            like a weekday. Once they&apos;re gone, emergency slots open at a token + {gbp(db.settings.weekend_upgrade_surcharge)}.
          </p>

          {satToken.length > 0 && (
            <div className="mt-4">
              <p className="num text-xs uppercase tracking-[0.15em] text-steel">With a token</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {satToken.map((s) => (
                  <form
                    key={s.id}
                    action={bookSlotAction}
                    className="flex items-center justify-between rounded-2xl border border-brass/40 bg-paper p-4"
                  >
                    <input type="hidden" name="slot_id" value={s.id} />
                    <div>
                      <p className="num text-lg">{fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}</p>
                      <label className="mt-1 flex items-center gap-1.5 text-xs text-steel">
                        <input type="checkbox" name="beard" className="accent-[var(--brass)]" />
                        Full beard +{gbp(db.settings.beard_addon_price)}
                      </label>
                    </div>
                    <Button type="submit" className="!px-4 !py-2 text-xs" disabled={available === 0}>Book</Button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {satEmergency.length > 0 && (
            <div className="mt-5">
              <p className="num text-xs uppercase tracking-[0.15em] text-steel">
                Emergency · token +{gbp(db.settings.weekend_upgrade_surcharge)}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {satEmergency.map((s) => (
                  <form
                    key={s.id}
                    action={bookWeekendUpgradeAction}
                    className="flex items-center justify-between rounded-2xl border border-steel/25 bg-paper p-4"
                  >
                    <input type="hidden" name="slot_id" value={s.id} />
                    <div>
                      <p className="num text-lg">{fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}</p>
                      <label className="mt-1 flex items-center gap-1.5 text-xs text-steel">
                        <input type="checkbox" name="beard" className="accent-[var(--brass)]" />
                        Full beard +{gbp(db.settings.beard_addon_price)}
                      </label>
                    </div>
                    <Button type="submit" className="!px-4 !py-2 text-xs" disabled={available === 0}>
                      Token +{gbp(db.settings.weekend_upgrade_surcharge)}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
