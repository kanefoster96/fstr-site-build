import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow } from "@/components/ui";

export const metadata = { title: "How the token works — FSTR Cuts" };

const RULES: { n: string; title: string; body: string; ring?: number; ghost?: boolean; flipped?: boolean }[] = [
  {
    n: "01",
    title: "You earn a token on payment",
    body: "Your billing day mints exactly one token, instantly. One token, one cut — beard tidy included.",
  },
  {
    n: "02",
    title: "You get 60 days to use it",
    body: "Two full billing cycles, never less. That's the headline promise: a cut you've paid for waits for you.",
    ring: 0.85,
  },
  {
    n: "03",
    title: "You can hold two at a time",
    body: "Bank up to two. If your wallet's full on billing day, we pause — nothing's charged, nothing's minted. We never charge into a full wallet.",
  },
  {
    n: "04",
    title: "Booking freezes the clock",
    body: "The moment you book, the countdown stops. A reserved token can't expire, even past day 60.",
    ring: 0.5,
  },
  {
    n: "05",
    title: "Cancel early and you keep it",
    body: "Cancel 24 hours ahead and the token comes back with at least a week left on it. Inside 24 hours or a no-show and it's spent — but there's a once-a-year goodwill button.",
  },
  {
    n: "06",
    title: "Gift it and it's never a risk",
    body: "One tap sends a mate a cut. They've 14 days to book. If they don't, it comes back to you with whatever time was left. Gifts can't be re-gifted and have no cash value.",
    flipped: true,
  },
  {
    n: "07",
    title: "Cancel your membership, keep your tokens",
    body: "Billing stops, but any unexpired tokens stay usable right to their expiry. You never lose a cut you've paid for.",
    ghost: true,
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="py-12">
      <div className="text-center">
        <Eyebrow>The token rules</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          Seven rules. <span className="value">No small print.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-steel">
          This is the trust document. What you own, what rolls over, what happens if you cancel —
          in plain English.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {RULES.map((r) => (
          <div key={r.n} className="flex items-start gap-5 rounded-2xl bg-mist p-6">
            <div className="shrink-0">
              <Coin size={64} ring={r.ring} ghost={r.ghost} flipped={r.flipped} code={r.flipped ? "BRASS" : undefined} />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <Num value className="text-sm">{r.n}</Num>
                <h2 className="font-display text-xl font-semibold">{r.title}</h2>
              </div>
              <p className="mt-1 text-steel">{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-brass/40 p-8 text-center">
        <p className="font-display text-2xl font-semibold">
          Tokens are use or gift only. No cash-out, no faff.
        </p>
        <p className="mt-2 text-steel">One currency, two uses. You could explain it to a mate in a sentence.</p>
        <Button href="/join" className="mt-5">Take a seat</Button>
      </div>
    </Container>
  );
}
