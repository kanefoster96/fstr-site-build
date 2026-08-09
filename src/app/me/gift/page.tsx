import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { getWallet } from "@/lib/data/member";
import { daysLeftLabel } from "@/lib/format";
import { giftTokenAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GiftPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session.member) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to gift</h1>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </Container>
    );
  }
  const db = await getDb();
  const wallet = (await getWallet(session.member.id))!;
  const available = wallet.tokens.filter((t) => t.state === "ISSUED");
  const outstanding = wallet.tokens.filter((t) => t.state === "GIFTED");

  return (
    <Container className="py-12">
      <Eyebrow>Gift a token</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">Send a mate a cut</h1>
      <p className="mt-2 max-w-md text-steel">
        One tap, a code, done. They&apos;ve 14 days to book. If they don&apos;t, it comes
        straight back to you with whatever time was left. Gifting is never a risk.
      </p>

      {sp.sent && (
        <div className="mt-6 rounded-2xl border border-brass/40 bg-mist p-6">
          <div className="flex items-center gap-4">
            <Coin size={72} flipped code={sp.sent} />
            <div>
              <p className="text-sm text-steel">Gift sent — share this code or link</p>
              <p className="num mt-1 text-2xl value">{sp.sent}</p>
              <p className="num text-xs text-steel">/gift/{sp.sent}</p>
            </div>
          </div>
        </div>
      )}
      {sp.error === "no-token" && (
        <p className="mt-6 rounded-lg bg-mist px-4 py-3 text-sm">
          You&apos;ve no available token to gift right now.
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="!bg-mist">
          <p className="text-sm text-steel">
            You have <Num value>{available.length}</Num> token{available.length === 1 ? "" : "s"} to gift
          </p>
          <form action={giftTokenAction} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Send to (name or email)</span>
              <input
                name="to_contact"
                placeholder="dave@example.com"
                className="mt-1 w-full rounded-lg border border-steel/40 bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass"
              />
            </label>
            <Button type="submit" className="w-full" disabled={available.length === 0}>
              {available.length === 0 ? "No tokens to gift" : "Gift a token"}
            </Button>
          </form>
        </Card>

        <div>
          <p className="text-sm font-medium">In flight</p>
          {outstanding.length === 0 ? (
            <p className="mt-2 text-sm text-steel">Nothing gifted right now.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {outstanding.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-steel/25 p-3">
                  <Coin size={44} flipped code={t.gift?.code} />
                  <div className="num text-sm">
                    <p>{t.gift?.code}</p>
                    <p className="text-xs text-steel">
                      {t.gift?.status === "opened" ? "Opened · " : "Sent · "}
                      returns in {t.gift ? daysLeftLabel(db.clock.now, t.gift.expires_at) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
