import Link from "next/link";
import Coin from "@/components/Coin";
import ActiveTokenCard from "@/components/ActiveTokenCard";
import AnimatedSubmit from "@/components/AnimatedSubmit";
import GiftOnlyCard from "@/components/GiftOnlyCard";
import PlanPicker from "@/components/PlanPicker";
import { Container, Button, Num, Eyebrow, Card, Hairline } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getWallet, getUsual, getComingUp } from "@/lib/data/member";
import { getDb } from "@/lib/data/db";
import { gbp, daysLeftLabel, fmtDateTime, fmtMonthDay, fmtDay, fmtTime } from "@/lib/format";
import { quickBookAction, quickGiftAction, upgradeMembershipAction, giftTokenByIdAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    done?: string; gifted?: string; booked?: string; welcome?: string; plan?: string;
    trial?: string; explore?: string; credit?: string;
  }>;
}) {
  const sp = await searchParams;
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
  const usual = await getUsual(session.member.id);
  const comingUp = await getComingUp(session.member.id, 8);
  const db = await getDb();
  const now = db.clock.now;

  const issued = wallet.tokens.filter((t) => t.state === "ISSUED");
  const active = issued.slice(0, wallet.activeCap);
  const stored = issued.slice(wallet.activeCap);
  const reserved = wallet.tokens.filter((t) => t.state === "RESERVED");
  const gifted = wallet.tokens.filter((t) => t.state === "GIFTED");
  const expired = wallet.tokens.filter((t) => t.state === "EXPIRED");
  const soonest = comingUp[0]?.slot;
  const usualSlot = usual?.slot;
  const walletFull = wallet.held >= db.settings.rules.max_held;

  return (
    <Container className="py-10">
      {/* Toasts */}
      {sp.gifted && (
        <Banner>
          Gift sent — code <span className="num value">{sp.gifted}</span>. It&apos;ll bob back to you if
          it&apos;s not used in 14 days.
        </Banner>
      )}
      {sp.done === "booked" && <Banner>Booked — your token&apos;s reserved and the clock&apos;s frozen. ❄</Banner>}
      {sp.done === "prebooked" && <Banner>Held for you — it confirms the moment your next token lands.</Banner>}
      {(sp.booked || sp.welcome) && (
        <Banner>
          You&apos;re all set. Welcome to FSTR. ✂{sp.credit ? ` £${(Number(sp.credit) / 100).toFixed(0)} trial credit applied.` : ""}
        </Banner>
      )}
      {sp.trial && <Banner>Trial cut booked — enjoy it. Join on the day and we&apos;ll knock the extra off your first token.</Banner>}
      {sp.explore && <Banner>Welcome in. Have a look around — book your first cut whenever you&apos;re ready.</Banner>}
      {sp.plan === "locked" && <Banner>You&apos;ve already changed plan this cycle — switch again after your next token.</Banner>}
      {sp.plan && sp.plan !== "locked" && (
        <Banner>Plan updated — a token every <span className="num value">{sp.plan}</span> weeks now.</Banner>
      )}

      {/* Header + value chips */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {session.member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : null}
          <div>
            <Eyebrow>{wallet.subscribed ? "Your wallet" : "Your dashboard"}</Eyebrow>
            <h1 className="mt-2 font-display text-4xl font-bold">Alright, {wallet.name.split(" ")[0]}.</h1>
            <p className="num mt-1 text-sm text-steel">
              {wallet.subscribed
                ? `Seat ${wallet.seat} · ${wallet.badges.join(" · ") || "Member"}`
                : "Exploring · not a member yet"}
            </p>
            {(wallet.priority || wallet.pendingBonus > 0) && (
              <p className="num mt-1 text-xs">
                {wallet.priority && <span className="value">★ Priority booking</span>}
                {wallet.priority && wallet.pendingBonus > 0 && <span className="text-steel"> · </span>}
                {wallet.pendingBonus > 0 && (
                  <span className="value">🎁 {wallet.pendingBonus} free cut{wallet.pendingBonus === 1 ? "" : "s"} queued</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <Button href="/me/book" variant="ghost" className="text-sm">All slots</Button>
          <Button href="/me/chat" variant="ghost" className="text-sm">Message</Button>
        </div>
      </div>

      {/* Guest → membership CTA */}
      {!wallet.subscribed && (
        <div className="mt-6 rounded-2xl border border-brass/40 bg-mist p-6">
          <div className="flex items-start gap-4">
            <Coin size={56} />
            <div className="flex-1">
              <p className="font-display text-xl font-semibold">Become a member</p>
              <p className="mt-1 text-sm text-steel">
                {gbp(wallet.currentRate)} per token — a cut a month that never goes to waste, first look at
                every slot, and you can gift them.
                {wallet.trialCreditValid && (
                  <>
                    {" "}
                    <span className="value">Today only:</span> we&apos;ll knock{" "}
                    <span className="num value">{gbp(wallet.trialCredit)}</span> off your first token.
                  </>
                )}
              </p>
              <form action={upgradeMembershipAction} className="mt-4">
                <input type="hidden" name="cycle_weeks" value={session.member.cut_frequency_weeks ?? 4} />
                <button className="rounded-full bg-brass px-6 py-2.5 text-sm font-medium text-ink">
                  Join — {gbp(wallet.trialCreditValid ? Math.max(0, wallet.currentRate - wallet.trialCredit) : wallet.currentRate)} now
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {wallet.subscribed && (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Your rate" value={gbp(wallet.lockedRate)} sub={`per token`} brass />
          <Stat label="Saved this year" value={gbp(wallet.savedThisYear)} sub={`${wallet.cutsCount} cuts`} brass />
          <Stat label="Streak" value={`${wallet.streakMonths}`} sub="months" />
        </div>
      )}

      {/* ===== The dashboard ===== */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Active + stored tokens */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">
              Active <span className="num text-steel">{active.length}/{wallet.activeCap}</span>
              {stored.length > 0 && (
                <span className="num text-steel"> · Stored {stored.length}/{wallet.storeCap}</span>
              )}
            </h2>
            {walletFull && <span className="num text-xs text-brass">Account full</span>}
          </div>

          {issued.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-2xl bg-mist py-12 text-center">
              <Coin size={84} ghost />
              <p className="mt-4 max-w-xs text-steel">
                {wallet.subscribed
                  ? `Your next token drops ${fmtMonthDay(wallet.nextTokenDrops)}.`
                  : "No tokens yet. Become a member above and your first one lands right away."}
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {active.map((t) => (
                <ActiveTokenCard
                  key={t.id}
                  daysLeft={t.daysLeft}
                  lifeFraction={t.lifeFraction}
                  expiresLabel={daysLeftLabel(now, t.expires_at)}
                  soonestSlotId={usualSlot?.id ?? soonest?.id}
                  soonestSlotLabel={
                    usualSlot
                      ? `${fmtDay(usualSlot.starts_at).split(" ")[0]} ${fmtTime(usualSlot.starts_at)}`
                      : soonest
                        ? `${fmtDay(soonest.starts_at).split(" ")[0]} ${fmtTime(soonest.starts_at)}`
                        : undefined
                  }
                  quickBookAction={quickBookAction}
                  quickGiftAction={quickGiftAction}
                />
              ))}
            </div>
          )}

          {/* Stored — banked, ready when you are */}
          {stored.length > 0 && (
            <div className="mt-3">
              <p className="num text-xs uppercase tracking-[0.15em] text-steel">Stored · ready when you are</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {stored.map((t) => (
                  <div key={t.id} className="flex flex-col items-center">
                    <Coin size={52} ring={t.lifeFraction} />
                    <span className="num mt-1 text-[11px] text-steel">{daysLeftLabel(now, t.expires_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan nudge — appears once you're banking tokens (§ holding >= 3) */}
          {wallet.showPlanNudge && (
            <div className="mt-4 rounded-2xl border border-brass/40 bg-mist p-5">
              <p className="font-display text-lg font-semibold">
                {wallet.atCap ? "Your account's full" : "You're banking tokens"}
              </p>
              <p className="mt-1 text-sm text-steel">
                {wallet.atCap
                  ? `You're holding ${wallet.maxHeld}. Nothing's charged until you've room. Slow to a longer plan so tokens don't pile up — or gift a couple to mates.`
                  : `You've ${issued.length + gifted.length} on the go. If cuts are less frequent, stretch your plan so a token drops less often — you'll never waste one.`}
              </p>
              <div className="mt-3">
                <PlanPicker plans={wallet.plans} current={wallet.cycleWeeks} locked={wallet.planLocked} from="me" />
              </div>
            </div>
          )}
        </section>

        {/* Your next move */}
        <section>
          <h2 className="font-display text-2xl font-semibold">Your next move</h2>
          <div className="mt-3">
            {wallet.nextBooking ? (
              <div className="rounded-2xl border border-brass/40 bg-mist p-6">
                <div className="flex items-center gap-4">
                  <Coin size={64} ring={0.5} />
                  <div>
                    <p className="text-sm text-steel">You&apos;re booked in</p>
                    <p className="num mt-1 text-xl value">{fmtDateTime(wallet.nextBooking.slot.starts_at)}</p>
                    <p className="text-sm text-steel">
                      {wallet.nextBooking.booking.beard_addon ? "60 min · full beard" : "45 min · clock frozen"}
                    </p>
                  </div>
                </div>
              </div>
            ) : wallet.prebook ? (
              <div className="rounded-2xl bg-ink p-6 text-paper">
                <p className="text-sm text-paper/70">Held for you</p>
                <p className="num mt-1 text-lg">{fmtDateTime(wallet.prebook.slot.starts_at)}</p>
                <p className="mt-1 text-sm text-paper/70">
                  Provisional — confirms when your token lands {fmtMonthDay(wallet.nextTokenDrops)}.
                </p>
              </div>
            ) : wallet.subscribed && usualSlot ? (
              <div className="rounded-2xl border border-brass/40 bg-mist p-6">
                <p className="text-sm text-steel">Your usual</p>
                <p className="num mt-1 text-xl">{usual!.label}</p>
                <p className="text-sm text-steel">
                  {issued.length > 0 ? "Tap once — token on, done." : "No token yet — we'll hold it till your next drops."}
                </p>
                <AnimatedSubmit action={quickBookAction} anim="use" className="mt-4">
                  <input type="hidden" name="slot_id" value={usualSlot.id} />
                  <button className="flex w-full items-center justify-center gap-3 rounded-full bg-brass px-5 py-3 font-medium text-ink">
                    <span data-coin style={{ display: "inline-block" }}>
                      <Coin size={30} />
                    </span>
                    {issued.length > 0 ? "Book my usual" : "Hold my usual"}
                  </button>
                </AnimatedSubmit>
              </div>
            ) : wallet.subscribed && soonest ? (
              <div className="rounded-2xl border border-brass/40 bg-mist p-6">
                <p className="text-sm text-steel">Soonest free slot</p>
                <p className="num mt-1 text-xl">{fmtDateTime(soonest.starts_at)}</p>
                <AnimatedSubmit action={quickBookAction} anim="use" className="mt-4">
                  <input type="hidden" name="slot_id" value={soonest.id} />
                  <button className="flex w-full items-center justify-center gap-3 rounded-full bg-brass px-5 py-3 font-medium text-ink">
                    <span data-coin style={{ display: "inline-block" }}>
                      <Coin size={30} />
                    </span>
                    Grab this one
                  </button>
                </AnimatedSubmit>
              </div>
            ) : !wallet.subscribed ? (
              <div className="rounded-2xl border border-brass/40 bg-mist p-6">
                <p className="text-sm text-steel">Ready for your first cut?</p>
                <p className="num mt-1 text-xl">
                  {soonest ? fmtDateTime(soonest.starts_at) : "Slots open two weeks out"}
                </p>
                <p className="mt-1 text-sm text-steel">Try a one-off, or become a member above.</p>
                <Button href="/book" className="mt-4 w-full">Book a one-off — {gbp(db.settings.oneoff_price)}</Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-mist p-6">
                <p className="text-steel">Nothing to do right now. Your next token drops {fmtMonthDay(wallet.nextTokenDrops)}.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Coming up — one-tap dates */}
      {comingUp.length > 0 && issued.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Coming up</h2>
            <Link href="/me/book" className="text-sm text-steel hover:text-ink">See all →</Link>
          </div>
          <p className="mt-1 text-sm text-steel">Tap a date to spend a token — no faff.</p>
          <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {comingUp.map(({ slot, isUsual }) => (
              <AnimatedSubmit key={slot.id} action={quickBookAction} anim="use" className="shrink-0">
                <input type="hidden" name="slot_id" value={slot.id} />
                <button
                  className={`flex w-24 flex-col items-center rounded-2xl border p-3 ${
                    isUsual ? "border-brass/60 bg-mist" : "border-steel/25 bg-paper"
                  }`}
                >
                  <span data-coin style={{ display: "inline-block" }}>
                    <Coin size={34} />
                  </span>
                  <span className="num mt-2 text-[11px] text-steel">{fmtDay(slot.starts_at)}</span>
                  <span className="num text-sm">{fmtTime(slot.starts_at)}</span>
                  {isUsual && <span className="num text-[9px] uppercase tracking-wide value">usual</span>}
                </button>
              </AnimatedSubmit>
            ))}
          </div>
        </section>
      )}

      {/* Reserved / Gifted / gift-only coins */}
      {(reserved.length > 0 || gifted.length > 0 || expired.length > 0) && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">In play</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reserved.map((t) => (
              <MiniCoin key={t.id} label="Reserved" tone="ink">
                <Coin size={84} ring={0.5} />
                <p className="num mt-2 text-sm">Clock frozen ❄</p>
                {t.slot && <p className="num text-xs text-steel">{fmtDateTime(t.slot.starts_at)}</p>}
              </MiniCoin>
            ))}
            {gifted.map((t) => (
              <MiniCoin key={t.id} label="Gifted" tone="steel">
                <Coin size={84} tone="silver" flipped code={t.gift?.code} />
                <p className="num mt-2 text-sm">{t.gift?.code}</p>
                <p className="num text-xs text-steel">
                  {t.gift ? `back in ${daysLeftLabel(now, t.gift.expires_at)} if unused` : "gifted"}
                </p>
              </MiniCoin>
            ))}
            {expired.map((t) => (
              <GiftOnlyCard key={t.id} tokenId={t.id} giftAction={giftTokenByIdAction} />
            ))}
          </div>
        </section>
      )}

      <Hairline className="mt-12" />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/me/profile" className="text-steel hover:text-ink">Profile & billing →</Link>
        <Link href="/me/gift" className="text-steel hover:text-ink">Gift centre →</Link>
        <Link href="/how-it-works" className="text-steel hover:text-ink">The token rules →</Link>
      </div>
    </Container>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 animate-fade-up rounded-xl border border-brass/40 bg-mist px-4 py-3 text-sm">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  brass,
}: {
  label: string;
  value: string;
  sub?: string;
  brass?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-mist p-3 sm:p-4">
      <p className="text-[11px] text-steel sm:text-xs">{label}</p>
      <p className={`num mt-1 text-lg font-semibold sm:text-2xl ${brass ? "value" : ""}`}>{value}</p>
      {sub && <p className="num text-[10px] text-steel sm:text-xs">{sub}</p>}
    </div>
  );
}

function MiniCoin({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "ink" | "steel";
  children: React.ReactNode;
}) {
  const border = tone === "ink" ? "border-ink/20" : "border-steel/30";
  return (
    <div className={`flex flex-col items-center rounded-2xl border ${border} bg-paper p-5 text-center`}>
      <span className="num text-[10px] uppercase tracking-[0.15em] text-steel">{label}</span>
      <div className="mt-2">{children}</div>
    </div>
  );
}
