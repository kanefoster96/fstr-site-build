import Link from "next/link";
import Coin from "@/components/Coin";
import TokenExplainer from "@/components/TokenExplainer";
import { Container, Button, Num, Eyebrow, Card, Hairline } from "@/components/ui";
import { getSeatSummary } from "@/lib/data/queries";
import { gbp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const seats = await getSeatSummary();
  const foundingClaimed = 50 - seats.founding_left;

  return (
    <>
      {/* Hero — lead with Adam's standards */}
      <section className="pt-10 sm:pt-14">
        <Container className="flex flex-col items-center text-center animate-fade-up">
          <div className="relative mb-8">
            <Coin size={200} />
            <div className="absolute -bottom-3 left-1/2 h-6 w-36 -translate-x-1/2 rounded-full bg-ink/10 blur-md" />
          </div>

          <Eyebrow>North Tyneside · One barber · One chair</Eyebrow>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] sm:text-6xl">
            A proper cut,
            <br />
            <span className="value">done properly.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-steel">
            No rushing. No waiting around. I take the time to understand what you actually want,
            save the details of your cut and get it right every time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/join">Join FSTR · {gbp(seats.current_rate)} a month</Button>
            <Button href="/how-it-works" variant="ghost">See how it works</Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-brass" />
            <span className="text-steel">Founding 50:</span>
            <Num value className="font-semibold">{seats.founding_left} seats left</Num>
          </p>
        </Container>
      </section>

      {/* The Chair — make the home setup a benefit */}
      <section className="mt-24">
        <Container>
          <div className="grid items-center gap-8 rounded-3xl bg-mist p-6 sm:p-10 lg:grid-cols-2">
            <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#e7e5df,#d7d5cd)]" aria-hidden />
            <div>
              <Eyebrow>The Chair</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                Just you, me and enough time to get it right.
              </h2>
              <p className="mt-4 text-steel">
                FSTR is my private home barber studio in the Wallsend area. There&apos;s one chair, no
                crowded waiting area and no queue building behind you.
              </p>
              <p className="mt-3 text-steel">
                We&apos;ll talk through exactly what you want, I&apos;ll take the time to make sure
                you&apos;re happy, and I&apos;ll save the details of your cut for next time.
              </p>
              <p className="num mt-3 text-sm text-steel">
                The exact address is sent 24 hours before your appointment.
              </p>
              <Link href="/about" className="mt-4 inline-block text-sm value underline underline-offset-4">
                See the setup →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Adam's story */}
      <section className="mt-24">
        <Container>
          <div className="mx-auto max-w-2xl">
            <Eyebrow>Why I started FSTR</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              I wanted a barber who actually listened.
            </h2>
            <div className="mt-5 space-y-4 text-lg text-steel">
              <p>
                I&apos;ve had plenty of cuts where I explained what I wanted, felt like the appointment
                was rushed and left thinking it still wasn&apos;t quite right.
              </p>
              <p>That&apos;s why I do things differently.</p>
              <p>
                I leave enough time for every appointment, listen before I start and check you&apos;re
                happy before you leave. Once we&apos;ve got your cut right, I save exactly how we did it
                so we can get it right again next time.
              </p>
              <p>
                I want you to leave happy with your haircut, and I want it to be one I&apos;m proud to put
                my name to.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="num grid h-11 w-11 place-items-center rounded-full bg-mist text-steel">A</span>
              <span className="font-display text-lg font-semibold">Adam</span>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="mt-28">
        <Container>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            Simple as it should be.
          </h2>
          <div className="mt-10">
            <TokenExplainer />
          </div>
        </Container>
      </section>

      {/* Your regular chair — mid-page conversion */}
      <section className="mt-28">
        <Container>
          <div className="rounded-3xl border border-brass/40 bg-mist p-8 text-center sm:p-14">
            <Coin size={64} className="mx-auto" />
            <Eyebrow>Your regular chair</Eyebrow>
            <p className="mx-auto mt-3 max-w-xl font-display text-2xl font-semibold sm:text-3xl">
              No explaining your haircut from scratch every month.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-steel">
              I&apos;ll know how you like it, what we did last time and whether there&apos;s anything you
              want to change. You get the same barber, the same attention and a cut that stays consistent.
            </p>
            <p className="num mt-4 text-sm">One proper cut every month for <span className="value">{gbp(seats.current_rate)}</span>.</p>
            <Button href="/join" className="mt-5">Join FSTR</Button>
          </div>
        </Container>
      </section>

      {/* Choose your seat — pricing */}
      <section className="mt-28">
        <Container>
          <Eyebrow>Choose your seat</Eyebrow>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold sm:text-4xl">
            Come once, or make it your regular chair.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="!bg-mist">
              <p className="text-sm text-steel">One-off cut</p>
              <p className="mt-2"><Num className="text-4xl font-semibold">{gbp(3500)}</Num></p>
              <ul className="mt-4 space-y-2 text-sm text-steel">
                <li>Book up to seven days ahead, subject to availability.</li>
              </ul>
              <Button href="/book" variant="ghost" className="mt-5 w-full">Book a one-off</Button>
            </Card>
            <Card className="!bg-ink text-paper">
              <p className="text-sm text-paper/70">Membership</p>
              <p className="mt-2">
                <Num value className="text-4xl font-semibold">{gbp(seats.current_rate)}</Num>
                <span className="text-paper/60"> a month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-paper/85">
                {[
                  "One full cut every month",
                  "Beard tidy included",
                  "Book up to two weeks ahead",
                  "Your cut saved for next time",
                  "Same barber every appointment",
                  "Unused cuts can be gifted",
                  "No queues and no rushing",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="value">✓</span>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="num mt-4 text-xs text-paper/60">
                Each cut is yours for 60 days. Prefer a cut every few weeks? Choose how often yours comes when you join.
              </p>
              <Button href="/join" className="mt-5 w-full">Join FSTR</Button>
            </Card>
          </div>
        </Container>
      </section>

      {/* The home worker's barber */}
      <section className="mt-24">
        <Container>
          <div className="flex flex-col gap-6 rounded-3xl bg-ink p-8 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div>
              <Eyebrow>The home worker&apos;s barber</Eyebrow>
              <p className="mt-3 max-w-lg font-display text-2xl font-semibold sm:text-3xl">
                Get your cut while everyone else is at work.
              </p>
              <p className="mt-3 max-w-lg text-paper/70">
                Book a quiet weekday appointment, take the chair straight away and get back to your
                day. No busy shop, no waiting behind three other people and no losing your Saturday
                morning.
              </p>
              <p className="mt-3 max-w-lg text-sm text-paper/60">
                Need a Saturday instead? Members get first access to limited Saturday appointments.
              </p>
            </div>
            <Button href="/join" className="shrink-0">Join FSTR</Button>
          </div>
        </Container>
      </section>

      {/* Recent cuts */}
      <section className="mt-24">
        <Container>
          <div className="flex items-end justify-between">
            <Eyebrow>Recent cuts</Eyebrow>
            <Link href="/about" className="text-sm text-steel hover:text-ink">More on the chair →</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[linear-gradient(135deg,#e7e5df,#d5d3cb)]" aria-hidden />
            ))}
          </div>
        </Container>
      </section>

      {/* Final call to action */}
      <section className="mt-24">
        <Container>
          <Hairline className="mb-10" />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Ready for a barber who remembers your cut?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-steel">
              Join FSTR for {gbp(seats.current_rate)} a month. You&apos;ll get one proper haircut every
              month, enough time to get it right and the same barber every time.
            </p>
            <p className="num mt-5 text-sm">
              <span className="value">{foundingClaimed} of 50</span> founding memberships claimed.
            </p>
            <Button href="/join" className="mt-5">Join FSTR</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
