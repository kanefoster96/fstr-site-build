import Link from "next/link";
import Coin from "@/components/Coin";
import TokenExplainer from "@/components/TokenExplainer";
import { Container, Button, Num, Eyebrow, Card, Hairline } from "@/components/ui";
import { getSeatSummary } from "@/lib/data/queries";
import { gbp } from "@/lib/format";

export default async function HomePage() {
  const seats = await getSeatSummary();

  return (
    <>
      {/* Hero */}
      <section className="pt-14 sm:pt-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <Eyebrow>North Tyneside · Members only</Eyebrow>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] sm:text-6xl">
              One cut a month.
              <br />
              <span className="value">Never wasted.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-steel">
              Membership home barbering for people who work from home. A proper cut on a
              Tuesday lunchtime — while everyone else waits for Saturday.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/join">Join — {gbp(seats.founding_rate)}/month</Button>
              <Button href="/how-it-works" variant="ghost">
                How the token works
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-brass" />
              <span className="text-steel">Founding 50:</span>
              <Num value className="font-semibold">
                {seats.founding_left} seats left
              </Num>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <Coin size={260} live />
              <div className="absolute -bottom-3 left-1/2 h-6 w-40 -translate-x-1/2 rounded-full bg-ink/10 blur-md" />
            </div>
          </div>
        </Container>
      </section>

      {/* Trust: the real setup */}
      <section className="mt-16">
        <Container>
          <div className="grid gap-4 rounded-3xl bg-mist p-6 sm:grid-cols-3 sm:p-8">
            <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#e7e5df,#d7d5cd)] sm:col-span-2" aria-hidden />
            <div className="flex flex-col justify-center">
              <Eyebrow>The chair</Eyebrow>
              <p className="mt-2 text-sm text-steel">
                A proper home studio in the Wallsend area. One barber, one chair, no queue.
                The exact address lands 24 hours before your cut.
              </p>
              <Link href="/about" className="mt-3 text-sm value underline underline-offset-4">
                See the setup →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* The maths block */}
      <section className="mt-24">
        <Container>
          <Eyebrow>The maths</Eyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold sm:text-4xl">
            One-off, or a cut a month that never goes to waste.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="!bg-mist">
              <p className="text-sm text-steel">One-off cut</p>
              <p className="mt-2">
                <Num className="text-4xl font-semibold">{gbp(3500)}</Num>
                <span className="text-steel"> / cut</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-steel">
                <li>Pay each time.</li>
                <li>Slots only open ≤7 days out.</li>
                <li>Members always get first look.</li>
              </ul>
            </Card>
            <Card className="!bg-ink text-paper">
              <p className="text-sm text-paper/70">Membership</p>
              <p className="mt-2">
                <Num value className="text-4xl font-semibold">
                  {gbp(seats.founding_rate)}
                </Num>
                <span className="text-paper/60"> / month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-paper/80">
                <li>One token a month — beard tidy included.</li>
                <li>Rolls over. Gift it. Never lost.</li>
                <li>Book weekdays two weeks out, or just message him.</li>
              </ul>
              <Button href="/join" className="mt-5 w-full">
                Take a seat
              </Button>
            </Card>
          </div>
        </Container>
      </section>

      {/* How it works — the animated token sequence */}
      <section className="mt-28">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            Follow the coin.
          </h2>
          <div className="mt-10">
            <TokenExplainer />
          </div>
        </Container>
      </section>

      {/* The promise, verbatim */}
      <section className="mt-28">
        <Container>
          <div className="rounded-3xl border border-brass/40 bg-mist p-10 text-center sm:p-16">
            <Coin size={72} className="mx-auto" />
            <p className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold sm:text-5xl">
              You never lose a cut you&apos;ve paid for.
            </p>
            <p className="mt-4 text-steel">Use it, or gift it. That&apos;s the whole deal.</p>
          </div>
        </Container>
      </section>

      {/* WFH positioning strip */}
      <section className="mt-24">
        <Container>
          <div className="flex flex-col gap-6 rounded-3xl bg-ink p-8 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <Eyebrow>The home-worker&apos;s barber</Eyebrow>
              <p className="mt-3 max-w-lg font-display text-2xl font-semibold sm:text-3xl">
                Booked out Saturdays? We don&apos;t do them.
              </p>
              <p className="mt-2 text-paper/70">
                Tuesday, <Num className="text-paper">11am</Num>, done by half-eleven.
              </p>
            </div>
            <Button href="/join" className="shrink-0">
              Join FSTR
            </Button>
          </div>
        </Container>
      </section>

      {/* Gallery + reviews teaser */}
      <section className="mt-24">
        <Container>
          <div className="flex items-end justify-between">
            <Eyebrow>Recent cuts</Eyebrow>
            <Link href="/about" className="text-sm text-steel hover:text-ink">
              More on the chair →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-[linear-gradient(135deg,#e7e5df,#d5d3cb)]"
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["“Best decision — a proper cut mid-week, no faff.”", "Danny, member since March"],
              ["“Gifted one to my brother. He joined the week after.”", "Reece, Founding 50"],
              ["“Tuesday 11am is mine now. Never going back.”", "Marcus, WFH"],
            ].map(([quote, who]) => (
              <Card key={who} className="!bg-mist">
                <p className="text-sm">{quote}</p>
                <p className="num mt-3 text-xs text-steel">{who}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ teaser + final CTA */}
      <section className="mt-24">
        <Container>
          <Hairline className="mb-10" />
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold">Questions?</h2>
              <p className="mt-3 text-steel">
                The seven token rules — in plain English — are the trust document. What you
                own, what rolls over, what happens if you cancel.
              </p>
              <Button href="/how-it-works" variant="ghost" className="mt-5">
                Read the token rules
              </Button>
            </div>
            <div className="rounded-3xl bg-mist p-8">
              <p className="text-sm text-steel">Seats sell in bands. Right now:</p>
              <p className="mt-3">
                <Num value className="text-3xl font-semibold">
                  {seats.filled} / {seats.total}
                </Num>{" "}
                <span className="text-steel">seats taken</span>
              </p>
              <p className="num mt-2 text-sm text-steel">
                Founding 50: {seats.founding_left} left · then {gbp(seats.current_rate)}/month
              </p>
              <Button href="/join" className="mt-5 w-full">
                Join now
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
