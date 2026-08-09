import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { memberVisibleSlots } from "@/lib/engine/booking";
import { getWallet } from "@/lib/data/member";
import { fmtDay, fmtTime, gbp } from "@/lib/format";
import { bookSlotAction } from "./actions";

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
  const slots = memberVisibleSlots(db).filter((s) => s.day_type === "weekday");

  // Group by day
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
          <span className="value">{available}</span> token{available === 1 ? "" : "s"} ready · booking freezes the clock
        </span>
      </div>

      {sp.error === "no-token" && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          You&apos;ve no available token right now. Your next one drops on the 1st — or grab a one-off.
        </p>
      )}

      {available === 0 ? (
        <div className="mt-8 rounded-2xl bg-mist p-8 text-center">
          <Coin size={72} ghost className="mx-auto" />
          <p className="mt-4 text-steel">No tokens to spend yet. Your next drops on the 1st.</p>
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-mist p-8 text-center text-steel">
          No weekday slots released right now — they open two weeks out.
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
                    <Button type="submit" className="!px-4 !py-2 text-xs">Book</Button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
