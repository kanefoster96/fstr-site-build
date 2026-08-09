import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getSeatSummary, getSettings } from "@/lib/data/queries";
import { getDb } from "@/lib/data/db";
import { weekdayStatus, slotStartTimes, DOW_SHORT } from "@/lib/engine/schedule";
import { gbp } from "@/lib/format";
import { joinAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ waitlisted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const seats = await getSeatSummary();
  const settings = await getSettings();
  const db = await getDb();
  const times = slotStartTimes(db);
  const weekStatus = [1, 2, 3, 4, 5].map((d) => ({ d, status: weekdayStatus(db, d) }));
  const openCount = weekStatus.filter((w) => w.status !== "unavailable").length;
  const full = seats.left <= 0;

  if (sp.waitlisted) {
    return (
      <Container className="py-20 text-center">
        <Coin size={90} ghost className="mx-auto" />
        <h1 className="mt-6 font-display text-4xl font-bold">You&apos;re on the list</h1>
        <p className="mx-auto mt-3 max-w-md text-steel">
          Membership is full — <Num value>{seats.waitlist_count}</Num> waiting. When a seat frees,
          the oldest match gets 48 hours to claim it. We&apos;ll be in touch.
        </p>
        <Button href="/" variant="ghost" className="mt-6">Back home</Button>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        {/* Left: the offer + ladder + availability */}
        <div>
          <Eyebrow>Take a seat</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
            Lock your rate. <span className="value">Keep it.</span>
          </h1>
          <p className="mt-3 max-w-md text-steel">
            One token a month, beard tidy included. It rolls over, you can gift it, and your
            price is locked for as long as you stay subscribed.
          </p>

          {/* Pricing ladder */}
          <div className="mt-8 space-y-2">
            {settings.pricing_ladder.map((band) => {
              const isCurrent =
                seats.filled + 1 >= band.from_seat && seats.filled + 1 <= band.to_seat;
              return (
                <div
                  key={band.label}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isCurrent ? "border-brass/60 bg-mist" : "border-steel/25"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {band.label}{" "}
                      <span className="num text-steel">
                        · seats {band.from_seat}–{band.to_seat}
                      </span>
                    </p>
                    <p className="text-xs text-steel">{band.note}</p>
                  </div>
                  <div className="text-right">
                    <Num value className="text-lg font-semibold">{gbp(band.price)}</Num>
                    {isCurrent && <p className="num text-[10px] uppercase tracking-wide value">you&apos;re here</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Honest availability grid — shown before payment */}
          <div className="mt-8">
            <p className="text-sm font-medium">When cuts actually happen</p>
            <p className="text-xs text-steel">
              {settings.day_start}–{settings.day_end}, {times.length} slots a day, 45 min each. No surprises.
            </p>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {weekStatus.map(({ d, status }) => (
                <div
                  key={d}
                  className={`rounded-lg px-1 py-3 text-center ${
                    status === "open"
                      ? "bg-mist"
                      : status === "last_minute"
                        ? "border border-brass/40"
                        : "bg-paper border border-steel/15 text-steel/60"
                  }`}
                >
                  <p className="num text-[11px] text-steel">{DOW_SHORT[d]}</p>
                  <p className="num mt-1 text-sm">
                    {status === "open" ? times.length : status === "last_minute" ? "late" : "full"}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-brass/40 px-1 py-3 text-center">
                <p className="num text-[11px] text-steel">Sat</p>
                <p className="num mt-1 text-sm value">£35</p>
              </div>
            </div>
            <p className="num mt-2 text-[11px] text-steel">
              {openCount} weekday{openCount === 1 ? "" : "s"} open now · quieter days open up
              nearer the time · Sat = priority (token +{gbp(settings.weekend_upgrade_surcharge)} or {gbp(settings.weekend_public_price)})
            </p>
          </div>
        </div>

        {/* Right: the form → mock checkout */}
        <div>
          <Card className="!bg-mist sticky top-24">
            <div className="flex items-center gap-3">
              <Coin size={54} />
              <div>
                <p className="text-sm text-steel">Your rate</p>
                <p>
                  <Num value className="text-2xl font-semibold">{gbp(seats.current_rate)}</Num>
                  <span className="text-steel"> / month</span>
                </p>
              </div>
            </div>
            <p className="num mt-2 text-xs text-steel">
              Founding 50: {seats.founding_left} left · {seats.filled}/{seats.total} seats taken
            </p>

            {sp.error === "missing" && (
              <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm text-ink">
                We need your name and email to set up your seat.
              </p>
            )}

            <form action={joinAction} className="mt-5 space-y-3">
              <Field name="name" label="Your name" placeholder="Danny Robson" required />
              <Field name="email" label="Email" type="email" placeholder="danny@example.com" required />
              <Field name="phone" label="Mobile" type="tel" placeholder="07700 900123" />

              <fieldset className="pt-1">
                <legend className="text-sm font-medium">When can you usually make it?</legend>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["weekday_day", "Weekday daytime"],
                    ["evening", "Evenings"],
                    ["weekend", "Weekends"],
                  ].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="availability" value={val} className="accent-[var(--brass)]" />
                      {lbl}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" className="mt-2 w-full" disabled={full}>
                {full ? "Membership full — join waitlist" : `Pay ${gbp(seats.current_rate)} — take my seat`}
              </Button>
              <p className="num text-center text-[11px] text-steel">
                Mock checkout · no card charged · Stripe wires in later
              </p>
            </form>
          </Card>
        </div>
      </div>
    </Container>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass"
      />
    </label>
  );
}
