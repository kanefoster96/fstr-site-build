import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getDb } from "@/lib/data/db";
import { oneOffVisibleSlots } from "@/lib/engine/booking";
import { fromPrice } from "@/lib/engine/membership";
import { fmtDay, fmtTime, gbp } from "@/lib/format";
import { bookOneOffAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OneOffBookPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const slots = oneOffVisibleSlots(db).slice(0, 12);

  if (sp.booked) {
    return (
      <Container className="py-20 text-center">
        <Coin size={100} className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-bold">Booked in</h1>
        <p className="mx-auto mt-3 max-w-sm text-steel">
          Paid and confirmed. Address and parking notes land 24 hours before — Wallsend area.
        </p>
        <p className="mt-6 num text-sm text-steel">Get this regularly? Membership works out cheaper — cuts from {gbp(fromPrice(db))}.</p>
        <Button href="/join" className="mt-3">See membership</Button>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <Eyebrow>One-off cut</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">
        A single cut — <span className="num value">{gbp(db.settings.oneoff_price)}</span>
      </h1>
      <p className="mt-2 max-w-md text-steel">
        No membership needed. One-off slots open up to a week ahead — members always get first
        look. Get cuts regularly? It works out cheaper as a member.
      </p>

      {sp.error && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          {sp.error === "missing" ? "We need your name and email." : "That slot's just gone — pick another."}
        </p>
      )}

      {slots.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-mist p-8 text-center">
          <p className="text-steel">
            No one-off slots open this week. Members see slots up to six weeks out —{" "}
            <a href="/join" className="value underline underline-offset-4">take a seat</a>.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-medium">Slots open now</p>
            <p className="text-xs text-steel">Released ≤7 days out.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s, i) => (
                <label key={s.id} form="oneoff" className="cursor-pointer rounded-xl border border-steel/30 bg-paper p-3 text-center has-[:checked]:border-brass has-[:checked]:bg-mist">
                  <input form="oneoff" type="radio" name="slot_id" value={s.id} required defaultChecked={i === 0} className="sr-only" />
                  <span className="num block text-xs text-steel">{fmtDay(s.starts_at)}</span>
                  <span className="num block text-sm">{fmtTime(s.starts_at)}</span>
                </label>
              ))}
            </div>
          </div>

          <Card className="!bg-mist">
            <form id="oneoff" action={bookOneOffAction} className="space-y-3">
              <p className="text-sm font-medium">Your details</p>
              <input name="name" required placeholder="Your name"
                className="w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass" />
              <input name="email" type="email" required placeholder="Email"
                className="w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass" />
              <input name="phone" type="tel" placeholder="Mobile"
                className="w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="beard" className="accent-[var(--brass)]" />
                Full beard service +{gbp(db.settings.beard_addon_price)} (60 min)
              </label>
              <Button type="submit" className="w-full">
                Pay {gbp(db.settings.oneoff_price)} — book it
              </Button>
              <p className="num text-center text-[11px] text-steel">
                Mock charge · non-refundable inside 24h
              </p>
            </form>
          </Card>
        </div>
      )}
    </Container>
  );
}
