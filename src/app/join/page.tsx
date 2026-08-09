import Coin from "@/components/Coin";
import OnboardingWizard from "@/components/OnboardingWizard";
import TokenGuide from "@/components/TokenGuide";
import { Container, Button, Num, Eyebrow } from "@/components/ui";
import { getSeatSummary, getSettings } from "@/lib/data/queries";
import { getDb } from "@/lib/data/db";
import { memberVisibleSlots } from "@/lib/engine/booking";
import { fmtDay, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ waitlisted?: string }>;
}) {
  const sp = await searchParams;
  const seats = await getSeatSummary();
  const settings = await getSettings();
  const db = await getDb();

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

  const slots = memberVisibleSlots(db)
    .slice(0, 9)
    .map((s) => ({ id: s.id, day: fmtDay(s.starts_at), time: fmtTime(s.starts_at) }));

  return (
    <Container className="py-12">
      <div className="mb-8 text-center">
        <Eyebrow>Join FSTR</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
          Let&apos;s find your <span className="value">pace</span>.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-steel">
          Membership earns you a token on each billing date — one token, one cut. Book with a token,
          or try a one-off first.{" "}
          <TokenGuide />
        </p>
      </div>

      <OnboardingWizard
        slots={slots}
        rate={seats.current_rate}
        oneOffPrice={settings.oneoff_price}
        planPrices={settings.plan_prices}
        foundingLeft={seats.founding_left}
      />
    </Container>
  );
}
