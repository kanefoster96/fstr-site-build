import Link from "next/link";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { cancelStats } from "@/lib/engine/membership";
import { gbp, fmtMonthDay } from "@/lib/format";
import { pauseAction, cancelAction } from "./actions";
import PlanPicker from "@/components/PlanPicker";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ paused?: string; cancelled?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session.member) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to see your profile</h1>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </Container>
    );
  }
  const db = await getDb();
  const m = session.member;
  const sub = db.subscriptions.find((s) => s.member_id === m.id);
  const subscribed = !!sub && sub.status !== "cancelled";
  const stats = cancelStats(db, m.id);

  if (!subscribed) {
    return (
      <Container className="py-12">
        <Eyebrow>Profile</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-bold">{m.name}</h1>
        <p className="num mt-1 text-sm text-steel">Exploring · not a member yet</p>
        <Card className="!bg-mist mt-8 max-w-lg">
          <p className="text-sm font-medium">Your details</p>
          <p className="num mt-2 text-sm text-steel">{m.email}{m.phone ? <><br />{m.phone}</> : null}</p>
          {m.usual_cut && <p className="mt-3 text-sm">Usual: <span className="text-steel">{m.usual_cut}</span></p>}
          <Button href="/me" className="mt-5">Become a member</Button>
        </Card>
        <Link href="/me" className="mt-8 inline-block text-sm text-steel hover:text-ink">← Back to dashboard</Link>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <Eyebrow>Profile</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">{m.name}</h1>
      <p className="num mt-1 text-sm text-steel">Seat {m.seat_number} · joined {fmtMonthDay(m.joined_at)}</p>

      {sp.paused && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          Membership paused — your seat and rate are held. Nothing&apos;s charged while paused.
        </p>
      )}
      {sp.cancelled && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          Cancelled. Billing&apos;s stopped, but your unexpired tokens are still yours. You&apos;ve got
          30 days to reclaim your {gbp(stats.lockedRate)} rate.
        </p>
      )}
      {sp.plan === "locked" && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          You&apos;ve already changed plan this cycle — you can switch again after your next token.
        </p>
      )}
      {sp.plan && sp.plan !== "locked" && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">
          Plan updated — a token every <span className="num value">{sp.plan}</span> weeks.
        </p>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Billing summary */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Billing</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Price per token"><Num value>{gbp(stats.lockedRate)}</Num></Row>
            <Row k="Current rate"><Num>{gbp(stats.currentRate)}</Num> / token</Row>
            <Row k="Cadence">a token every <Num>{sub?.cycle_weeks ?? 4}</Num> wks</Row>
            <Row k="Next token"><Num>{sub ? fmtMonthDay(sub.next_billing_at) : "—"}</Num></Row>
            <Row k="Status"><span className="capitalize">{sub?.status ?? "—"}</span></Row>
            <Row k="You save"><Num value>{gbp(stats.saved)}</Num> so far</Row>
          </dl>
          <p className="num mt-4 text-xs text-steel">Mock Stripe portal — wires in later.</p>
        </Card>

        {/* Plan / cadence */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Your plan</p>
          <p className="mt-1 text-sm text-steel">
            A token every <Num>{sub?.cycle_weeks ?? 4}</Num> weeks at <Num>{gbp(stats.lockedRate)}</Num> a cut.
            More often is cheaper per cut; a longer gap costs a little more. Change once per cycle.
          </p>
          <div className="mt-4">
            <PlanPicker
              plans={db.settings.plans}
              planPrices={db.settings.plan_prices}
              current={sub?.cycle_weeks ?? db.settings.default_cycle_weeks}
              locked={sub?.plan_locked_until_next_billing ?? false}
              from="profile"
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Your usual</p>
          <p className="mt-2 text-sm text-steel">{m.usual_cut ?? "Not set yet."}</p>
          <p className="mt-4 text-sm font-medium">Contact</p>
          <p className="num mt-1 text-sm text-steel">{m.email}<br />{m.phone}</p>
          <p className="num mt-4 text-xs text-steel">Photo upload &amp; edit — coming in profile v2.</p>
        </Card>
      </div>

      {/* Cancel / pause — numbers computed live (§7) */}
      <div className="mt-8 rounded-2xl border border-steel/30 p-6">
        <p className="font-display text-xl font-semibold">Before you go</p>
        <p className="mt-2 max-w-lg text-steel">
          You&apos;re locked at <Num value>{gbp(stats.lockedRate)}</Num> a cut. You&apos;ve had{" "}
          <Num>{stats.cutsHad}</Num> cuts with us and saved <Num value>{gbp(stats.saved)}</Num> against
          one-off prices. Rejoin later and you&apos;ll pay whatever the going rate is then.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={pauseAction}>
            <Button type="submit" variant="ghost" className="text-sm">Pause instead</Button>
          </form>
          <Button href="/me" className="text-sm">Keep my membership</Button>
          <form action={cancelAction}>
            <Button type="submit" variant="quiet" className="text-sm">Cancel anyway</Button>
          </form>
        </div>
        <p className="num mt-3 text-xs text-steel">
          Pause keeps your seat &amp; rate, max 2 months a year. Cancel keeps your unexpired tokens.
        </p>
      </div>

      <Link href="/me" className="mt-8 inline-block text-sm text-steel hover:text-ink">← Back to wallet</Link>
    </Container>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-steel">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}
