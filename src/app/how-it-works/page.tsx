import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow } from "@/components/ui";

export const metadata = { title: "How it works — FSTR" };

const RULES: { n: string; title: string; body: string; ring?: number; ghost?: boolean; flipped?: boolean }[] = [
  {
    n: "01",
    title: "One cut, every month",
    body: "On your billing date, a haircut is added to your account. One full cut, beard tidy included.",
  },
  {
    n: "02",
    title: "60 days to use it",
    body: "You've got 60 days from when it's added — that's two full months. No rush.",
    ring: 0.85,
  },
  {
    n: "03",
    title: "Keep a few in the bank",
    body: "Up to five can sit in your account at once. If it's full when your next one's due, I hold off — you're never charged for a cut you can't fit in.",
  },
  {
    n: "04",
    title: "Once booked, it's yours",
    body: "Book an appointment and that cut is locked to it. It won't run out while it's booked, even if the date's past day 60.",
    ring: 0.5,
  },
  {
    n: "05",
    title: "Change of plan? Just tell me",
    body: "Let me know 24 hours ahead and the cut goes back to your account. Inside 24 hours or a no-show and it's used — but message me, I'm reasonable.",
  },
  {
    n: "06",
    title: "Gift it to a mate",
    body: "Send a cut to a mate in a tap. They get 14 days to book it. If they don't, it comes straight back to you. Gifts have no cash value.",
    flipped: true,
  },
  {
    n: "07",
    title: "Cancel any time, keep your cuts",
    body: "Stop your membership whenever you like. Billing stops, and any cuts still in your account stay yours until they run out.",
    ghost: true,
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="py-12">
      <div className="text-center">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          Everything you need to know, <span className="value">in plain English.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-steel">
          No jargon, no small print. Here&apos;s exactly how your membership works — what you get,
          what happens if you can&apos;t make it, and how to cancel.
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
          Use it, or gift it. That&apos;s the whole thing.
        </p>
        <p className="mt-2 text-steel">
          Still got a question? Just message me — I&apos;d rather you asked than wondered.
        </p>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </div>
    </Container>
  );
}
