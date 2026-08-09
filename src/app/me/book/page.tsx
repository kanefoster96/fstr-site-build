import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { memberVisibleSlots, weekendVisibleSlots } from "@/lib/engine/booking";
import { getRevealState, DOW_LONG } from "@/lib/engine/schedule";
import { getWallet } from "@/lib/data/member";
import { fmtDay, fmtTime, gbp } from "@/lib/format";
import { bookSlotAction, bookWeekendUpgradeAction, bookWeekendPaidAction } from "./actions";

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
  const slots = memberVisibleSlots(db);
  const weekend = weekendVisibleSlots(db);
  const reveal = getRevealState(db);
  const fillPct = Math.round(reveal.fill * 100);

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

      {/* Staged-opening status */}
      {reveal.nextDay != null && (
        <div className="mt-5 rounded-2xl bg-mist p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-steel">
              {reveal.revealed.map((d) => DOW_LONG[d]).join(", ")} open
            </span>
            <span className="num">
              <span className="value">{fillPct}%</span> full · {DOW_LONG[reveal.nextDay]} opens at {Math.round(reveal.threshold * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-paper">
            <div
              className="h-2 rounded-full bg-brass transition-all"
              style={{ width: `${Math.min(100, (fillPct / (reveal.threshold * 100)) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-steel">
            We open days as demand grows, so every day stays calm. {DOW_LONG[reveal.nextDay]} unlocks
            once these fill up.
          </p>
        </div>
      )}

      {sp.error?.startsWith("no-token") && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          You&apos;ve no available token right now. Your next drops on the 1st — or pay for a Saturday priority spot below.
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
          No weekday slots open right now — they release two weeks out.
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

      {/* Saturday priority slots */}
      {weekend.length > 0 && (
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Saturday priority</h2>
            <span className="num text-sm text-steel">
              upgrade a token +{gbp(db.settings.weekend_upgrade_surcharge)} · or {gbp(db.settings.weekend_public_price)}
            </span>
          </div>
          <p className="mt-1 text-sm text-steel">
            Saturdays are in demand, so they&apos;re priority spots. Use a token with a small
            top-up, or just pay for it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {weekend.map((s) => (
              <div key={s.id} className="rounded-2xl border border-brass/40 bg-paper p-4">
                <p className="num text-lg">
                  {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={bookWeekendUpgradeAction}>
                    <input type="hidden" name="slot_id" value={s.id} />
                    <Button type="submit" className="!px-4 !py-2 text-xs" disabled={available === 0}>
                      Token +{gbp(db.settings.weekend_upgrade_surcharge)}
                    </Button>
                  </form>
                  <form action={bookWeekendPaidAction}>
                    <input type="hidden" name="slot_id" value={s.id} />
                    <Button type="submit" variant="ghost" className="!px-4 !py-2 text-xs">
                      Pay {gbp(db.settings.weekend_public_price)}
                    </Button>
                  </form>
                </div>
                {available === 0 && (
                  <p className="num mt-2 text-[11px] text-steel">No token — pay {gbp(db.settings.weekend_public_price)} to book.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
