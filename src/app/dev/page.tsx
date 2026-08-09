import Link from "next/link";
import { getDb } from "@/lib/data/db";
import { getSession } from "@/lib/auth";
import { Container, Num, Eyebrow, Card, Button } from "@/components/ui";
import { fmtDateTime, gbp } from "@/lib/format";
import {
  advanceClockAction,
  fireInvoicePaid,
  fireInvoiceFailed,
  pickSessionAction,
  resetStoreAction,
} from "./actions";

export const dynamic = "force-dynamic";

/** Hidden dev control panel (§3): fire webhooks, advance the clock, pick a
 *  session, reset — so the whole token lifecycle demos end-to-end. */
export default async function DevPage() {
  const db = await getDb();
  const session = await getSession();
  const members = db.members.filter((m) => m.role === "member");
  const tokenCounts = db.tokens.reduce<Record<string, number>>((acc, t) => {
    acc[t.state] = (acc[t.state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Container className="py-12">
      <Eyebrow>Dev control panel</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">The workshop</h1>
      <p className="mt-2 max-w-2xl text-steel">
        Everything is mocked. Fire Stripe-style webhooks, roll the clock forward, and
        switch who you&apos;re signed in as. State persists to disk between reloads.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/dev/mail" className="value underline underline-offset-4">Dev inbox →</Link>
        <Link href="/me" className="text-steel hover:text-ink">Member wallet →</Link>
        <Link href="/admin" className="text-steel hover:text-ink">Barber admin →</Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Clock */}
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Mock clock</p>
          <p className="num mt-1 text-lg value">{fmtDateTime(db.clock.now)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 7, 14, 30, 60, 90].map((d) => (
              <form key={d} action={advanceClockAction}>
                <input type="hidden" name="days" value={d} />
                <button
                  type="submit"
                  className="num rounded-full border border-steel/50 px-3 py-1.5 text-sm hover:border-ink"
                >
                  +{d}d
                </button>
              </form>
            ))}
          </div>
          <p className="mt-3 text-xs text-steel">
            Advancing runs billing, expiries, gift returns and the failure timeline.
          </p>
        </Card>

        {/* Session */}
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Signed in as</p>
          <p className="mt-1 text-lg">
            {session.isBarber ? "Kane (barber)" : session.member?.name ?? "Signed out"}
          </p>
          <form action={pickSessionAction} className="mt-4 flex flex-col gap-2">
            <select
              name="member_id"
              defaultValue={session.member?.id ?? "none"}
              className="num rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm"
            >
              <option value="none">— Signed out —</option>
              <option value="barber">Kane (barber)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · seat {m.seat_number}
                </option>
              ))}
            </select>
            <Button type="submit" variant="ghost" className="text-sm">Switch user</Button>
          </form>
        </Card>

        {/* Tokens at a glance */}
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Tokens in play</p>
          <ul className="mt-2 space-y-1">
            {["ISSUED", "RESERVED", "REDEEMED", "GIFTED", "EXPIRED"].map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="num text-steel">{s}</span>
                <Num value className="font-semibold">{tokenCounts[s] ?? 0}</Num>
              </li>
            ))}
          </ul>
          <form action={resetStoreAction} className="mt-4">
            <Button type="submit" variant="ghost" className="w-full text-sm">Reset to seed</Button>
          </form>
        </Card>
      </div>

      {/* Webhooks */}
      <h2 className="mt-12 font-display text-2xl font-semibold">Fire a payment webhook</h2>
      <p className="mt-1 text-sm text-steel">
        Drives the token lifecycle exactly as Stripe will. Try a member holding 2 tokens to
        watch billing pause instead of charging into a full wallet.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <form action={fireInvoicePaid} className="flex items-end gap-2 rounded-2xl bg-mist p-4">
          <label className="flex-1 text-sm">
            <span className="text-steel">invoice.paid</span>
            <select name="member_id" className="num mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm">
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <Button type="submit" className="text-sm">Mint</Button>
        </form>
        <form action={fireInvoiceFailed} className="flex items-end gap-2 rounded-2xl bg-mist p-4">
          <label className="flex-1 text-sm">
            <span className="text-steel">invoice.payment_failed</span>
            <select name="member_id" className="num mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm">
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="ghost" className="text-sm">Fail</Button>
        </form>
      </div>

      <p className="mt-10 num text-xs text-steel">
        Current joiner rate {gbp(db.settings.current_rate)} · {db.mail.length} emails in the dev inbox
      </p>
    </Container>
  );
}
