import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getDb, mutate } from "@/lib/data/db";
import { findGiftByCode, openGift } from "@/lib/engine/gifts";
import { memberVisibleSlots } from "@/lib/engine/booking";
import { fromPrice } from "@/lib/engine/membership";
import { fmtDay, fmtTime, fmtMonthDay, daysLeftLabel, gbp } from "@/lib/format";
import { redeemGiftAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GiftRedeemPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;

  // Mark the gift opened (coin flips to reveal) on first view.
  await mutate((db) => openGift(db, code));
  const db = await getDb();
  const gift = findGiftByCode(db, code);

  if (!gift) {
    return (
      <Container className="py-20 text-center">
        <Coin size={90} ghost className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-bold">No gift here</h1>
        <p className="mt-3 text-steel">That code doesn&apos;t match anything. Check it and try again.</p>
      </Container>
    );
  }

  const fromName = db.members.find((m) => m.id === gift.from_member_id)?.name ?? "A mate";

  if (sp.booked || gift.status === "booked") {
    return (
      <Container className="py-20 text-center">
        <Coin size={100} className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-bold">You&apos;re booked in</h1>
        <p className="mx-auto mt-3 max-w-sm text-steel">
          Sorted. Your address and parking notes land 24 hours before — Wallsend area.
        </p>
        <p className="mt-6 num text-sm text-steel">Want your own regular chair? Membership — cuts from {gbp(fromPrice(db))}.</p>
        <Button href="/join" className="mt-3">See membership</Button>
      </Container>
    );
  }

  const lapsed = gift.status === "returned" || gift.status === "expired" || new Date(db.clock.now) >= new Date(gift.expires_at);
  if (lapsed) {
    return (
      <Container className="py-20 text-center">
        <Coin size={90} ghost className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-bold">This gift has lapsed</h1>
        <p className="mt-3 text-steel">It went back to {fromName.split(" ")[0]} with the time it had left.</p>
      </Container>
    );
  }

  const slots = memberVisibleSlots(db).filter((s) => s.day_type === "weekday").slice(0, 9);

  return (
    <Container className="py-12">
      <div className="text-center">
        <Eyebrow>A gift from {fromName.split(" ")[0]}</Eyebrow>
        <div className="mx-auto mt-4 w-fit [perspective:800px]">
          <Coin size={140} flipped code={gift.code} className="animate-coin-flip" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold">
          {fromName.split(" ")[0]} bought you a cut.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-steel">
          A proper cut, beard tidy included, on them. Book by{" "}
          <span className="num">{fmtMonthDay(gift.expires_at)}</span> ·{" "}
          <span className="num value">{daysLeftLabel(db.clock.now, gift.expires_at)} left</span>.
        </p>
      </div>

      {sp.error && (
        <p className="mx-auto mt-6 max-w-md rounded-lg bg-mist px-4 py-3 text-center text-sm">
          {sp.error === "used"
            ? "This gift's already been booked."
            : sp.error === "slot"
              ? "That slot's just gone — pick another."
              : "Something went off. Try another slot."}
        </p>
      )}

      <Card className="!bg-mist mx-auto mt-8 max-w-xl">
        <p className="text-sm font-medium">Pick a slot &amp; leave your details</p>
        <form action={redeemGiftAction} className="mt-4 space-y-4">
          <input type="hidden" name="code" value={gift.code} />
          <label className="block">
            <span className="text-sm">Your name</span>
            <input name="name" required placeholder="Your name"
              className="mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass" />
          </label>
          <div>
            <span className="text-sm">Choose a slot</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s, i) => (
                <label key={s.id} className="cursor-pointer rounded-xl border border-steel/30 bg-paper p-3 text-center has-[:checked]:border-brass has-[:checked]:bg-mist">
                  <input type="radio" name="slot_id" value={s.id} required defaultChecked={i === 0} className="sr-only" />
                  <span className="num block text-xs text-steel">{fmtDay(s.starts_at)}</span>
                  <span className="num block text-sm">{fmtTime(s.starts_at)}</span>
                </label>
              ))}
            </div>
            {slots.length === 0 && <p className="mt-2 text-sm text-steel">No slots free right now — check back shortly.</p>}
          </div>
          <Button type="submit" className="w-full" disabled={slots.length === 0}>Book my cut</Button>
          <p className="num text-center text-[11px] text-steel">
            Wallsend area — exact address sent 24 hours before your cut.
          </p>
        </form>
      </Card>
    </Container>
  );
}
