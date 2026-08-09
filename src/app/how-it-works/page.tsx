import { Container, Button, Eyebrow } from "@/components/ui";
import TokenExplainer, { type ExplainerStep } from "@/components/TokenExplainer";

export const metadata = { title: "How it works — FSTR" };

/** The token's life, told with the travelling coin — fuller than the homepage. */
const STEPS: ExplainerStep[] = [
  {
    key: "first",
    variant: "gold",
    title: "Join & book your first cut",
    body: "Your first payment adds a token and books your first cut on the spot — no waiting for a billing date. One token is one full haircut, beard tidy included.",
  },
  {
    key: "billing",
    variant: "gold",
    title: "A token every billing date",
    body: "After that, a fresh token — the gold coin — lands in your account on each billing date. Choose your pace when you join: every 2, 3, 4, 5 or 6 weeks, from £20 to £30 a cut. More often is cheaper per cut.",
  },
  {
    key: "life",
    variant: "gold",
    title: "Two billing cycles to use each one",
    body: "Every token lasts two billing cycles from the day it lands — plenty of breathing room, so there's no rush and nothing's wasted.",
  },
  {
    key: "book",
    variant: "gold",
    title: "Use it to book",
    body: "Spend a token on a weekday appointment, up to two weeks ahead. Can't see a time that works? Just message Adam and he'll sort one.",
  },
  {
    key: "saved",
    variant: "ghost",
    title: "Your cut, saved",
    body: "Once we get it right, Adam saves the lengths, the blend and how you like it — so every visit is consistent and you never explain it twice.",
  },
  {
    key: "gift",
    variant: "silver",
    title: "Roll it over, gift it, or pair it",
    body: "Not used a token in time? It rolls over for another cycle. If one finally lapses it turns silver — gift the cut to a mate, or pair two silver coins for a cut of your own (your backup for missing a couple in a row). Cancel whenever you like and any unused tokens stay yours until they run out.",
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          One token, <span className="value">one cut.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-steel">
          Your membership runs on tokens — think of them as your cuts, saved as coins. Here&apos;s the
          life of a single token, from the day it lands to the day you use it (or pass it on). No
          jargon, no small print.
        </p>
      </div>

      <div className="mt-12">
        <TokenExplainer steps={STEPS} />
      </div>

      <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-brass/40 p-8 text-center">
        <p className="font-display text-2xl font-semibold">Use it, or gift it. That&apos;s the whole thing.</p>
        <p className="mt-2 text-steel">
          Still got a question? Just message me — I&apos;d rather you asked than wondered.
        </p>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </div>
    </Container>
  );
}
