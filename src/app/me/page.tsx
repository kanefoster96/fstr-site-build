import Link from "next/link";
import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card, Hairline } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getWallet } from "@/lib/data/member";
import { gbp, daysLeftLabel, fmtDateTime, fmtMonthDay } from "@/lib/format";
import { getDb } from "@/lib/data/db";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getSession();
  if (!session.member) {
    return (
      <Container className="py-20 text-center">
        <Coin size={90} ghost className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-bold">No wallet yet</h1>
        <p className="mx-auto mt-3 max-w-sm text-steel">
          Join to get your first token — or pick a seeded member in the dev panel to explore.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/join">Join FSTR</Button>
          <Button href="/dev" variant="ghost">Dev panel</Button>
        </div>
      </Container>
    );
  }

  const wallet = (await getWallet(session.member.id))!;
  const db = await getDb();
  const now = db.clock.now;
  const available = wallet.tokens.filter((t) => t.state === "ISSUED");
  const reserved = wallet.tokens.filter((t) => t.state === "RESERVED");
  const gifted = wallet.tokens.filter((t) => t.state === "GIFTED");

  return (
    <Container className="py-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Your wallet</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold">Alright, {wallet.name.split(" ")[0]}.</h1>
          <p className="num mt-1 text-sm text-steel">
            Seat {wallet.seat} · {wallet.badges.join(" · ") || "Member"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button href="/me/book" className="text-sm">Book a cut</Button>
          <Button href="/me/gift" variant="ghost" className="text-sm">Gift a token</Button>
        </div>
      </div>

      {/* Value strip: rate lock + savings (mono, brass) */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Your token</p>
          <p className="mt-1">
            <Num value className="text-2xl font-semibold">{gbp(wallet.lockedRate)}</Num>
          </p>
          <p className="num mt-1 text-xs text-steel">
            Current rate {gbp(wallet.currentRate)} · you save {gbp(wallet.savePerCut)} every cut
          </p>
        </Card>
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Saved this year</p>
          <p className="mt-1"><Num value className="text-2xl font-semibold">{gbp(wallet.savedThisYear)}</Num></p>
          <p className="num mt-1 text-xs text-steel">{wallet.cutsCount} cuts with us</p>
        </Card>
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Streak</p>
          <p className="mt-1"><Num className="text-2xl font-semibold">{wallet.streakMonths}</Num> <span className="text-steel text-sm">months</span></p>
          <p className="num mt-1 text-xs text-steel">Next token drops {fmtMonthDay(wallet.nextTokenDrops)}</p>
        </Card>
      </div>

      {/* Next booking */}
      {wallet.nextBooking && (
        <div className="mt-8 rounded-2xl border border-brass/40 bg-mist p-6">
          <div className="flex items-center gap-5">
            <Coin size={72} ring={0.5} />
            <div>
              <p className="text-sm text-steel">Your next cut</p>
              <p className="num mt-1 text-xl value">{fmtDateTime(wallet.nextBooking.slot.starts_at)}</p>
              <p className="text-sm text-steel">
                {wallet.nextBooking.booking.beard_addon ? "60 min · full beard" : "45 min · cut + beard tidy"} · token reserved, clock frozen
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prebook prompt / pending */}
      {wallet.prebook ? (
        <div className="mt-4 rounded-2xl bg-ink p-6 text-paper">
          <p className="text-sm text-paper/70">Prebooked at the chair</p>
          <p className="num mt-1 text-lg">{fmtDateTime(wallet.prebook.slot.starts_at)}</p>
          <p className="mt-1 text-sm text-paper/70">
            Provisional — confirms the moment your next token lands on {fmtMonthDay(wallet.nextTokenDrops)}.
          </p>
        </div>
      ) : (
        available.length === 0 &&
        reserved.length === 0 && (
          <div className="mt-4 rounded-2xl bg-mist p-6">
            <p className="text-sm text-steel">
              Your usual Tuesday 11am is free in 4 weeks — want to hold it? Prebook at your next cut.
            </p>
          </div>
        )
      )}

      {/* The coins */}
      <h2 className="mt-12 font-display text-2xl font-semibold">Your tokens</h2>
      {wallet.tokens.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-mist py-14">
          <Coin size={88} ghost />
          <p className="mt-4 text-steel">Your next token drops {fmtMonthDay(wallet.nextTokenDrops)}.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((t) => (
            <TokenCard key={t.id} state="Available" tone="brass">
              <Coin size={96} ring={t.lifeFraction} />
              <p className="num mt-3 text-sm">
                Expires in <span className="value">{daysLeftLabel(now, t.expires_at)}</span>
              </p>
              <p className="num text-xs text-steel">{fmtMonthDay(t.expires_at)}</p>
              <div className="mt-3 flex gap-2">
                <Button href="/me/book" className="!px-4 !py-2 text-xs">Book</Button>
                <Button href="/me/gift" variant="ghost" className="!px-4 !py-2 text-xs">Gift</Button>
              </div>
            </TokenCard>
          ))}
          {reserved.map((t) => (
            <TokenCard key={t.id} state="Reserved" tone="ink">
              <Coin size={96} ring={0.5} />
              <p className="num mt-3 text-sm">Clock frozen ❄</p>
              {t.slot && <p className="num text-xs text-steel">{fmtDateTime(t.slot.starts_at)}</p>}
            </TokenCard>
          ))}
          {gifted.map((t) => (
            <TokenCard key={t.id} state="Gifted" tone="steel">
              <Coin size={96} flipped code={t.gift?.code} />
              <p className="num mt-3 text-sm">{t.gift?.code}</p>
              <p className="num text-xs text-steel">
                {t.gift ? `Returns in ${daysLeftLabel(now, t.gift.expires_at)} if unused` : "Gifted"}
              </p>
            </TokenCard>
          ))}
        </div>
      )}

      <Hairline className="mt-12" />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/me/profile" className="text-steel hover:text-ink">Profile & billing →</Link>
        <Link href="/me/chat" className="text-steel hover:text-ink">Message the chair →</Link>
        <Link href="/how-it-works" className="text-steel hover:text-ink">The token rules →</Link>
      </div>
    </Container>
  );
}

function TokenCard({
  state,
  tone,
  children,
}: {
  state: string;
  tone: "brass" | "ink" | "steel";
  children: React.ReactNode;
}) {
  const border =
    tone === "brass" ? "border-brass/40" : tone === "ink" ? "border-ink/20" : "border-steel/30";
  return (
    <div className={`flex flex-col items-center rounded-2xl border ${border} bg-paper p-5 text-center`}>
      <span className="num text-[10px] uppercase tracking-[0.15em] text-steel">{state}</span>
      <div className="mt-2">{children}</div>
    </div>
  );
}
