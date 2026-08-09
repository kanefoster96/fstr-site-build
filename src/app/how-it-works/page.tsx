import { Container, Button, Eyebrow } from "@/components/ui";
import TokenExplainer, { type ExplainerStep } from "@/components/TokenExplainer";
import Faq from "@/components/Faq";

export const metadata = { title: "How it works — FSTR" };

/** The token's life, told with the travelling coin — fuller than the homepage. */
const STEPS: ExplainerStep[] = [
  {
    key: "first",
    variant: "gold",
    title: "Join & book your first cut",
    body: "Your first payment gets you a token and books your first cut — right away. One token = one full cut, beard trim included.",
  },
  {
    key: "billing",
    variant: "gold",
    title: "A token every billing date",
    body: "After that, a fresh token lands each billing date. Pick your pace — every 2 to 6 weeks, £20 to £30 a cut. Come more often, pay less per cut.",
  },
  {
    key: "life",
    variant: "gold",
    title: "Two cycles to use each",
    body: "Every token lasts two billing cycles. No rush, nothing wasted.",
  },
  {
    key: "book",
    variant: "gold",
    title: "Use it to book",
    body: "Spend it on a weekday up to six weeks ahead, or one of three Saturday slots. Booking closes midday the day before. Stuck? Message me and I'll sort it.",
  },
  {
    key: "saved",
    variant: "ghost",
    title: "Your cut, saved",
    body: "Once we nail it, I save your lengths and how you like it. You never explain it twice.",
  },
  {
    key: "gift",
    variant: "silver",
    title: "Roll over, gift, or pair",
    body: "Not used one? It rolls over. If it lapses it turns silver — gift it, or pair two silver for a cut. Cancel anytime; unused tokens stay yours.",
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
          Your membership runs on tokens — cuts, saved as coins. Here&apos;s a token&apos;s whole life,
          in six quick steps. No jargon.
        </p>
      </div>

      <div className="mt-12">
        <TokenExplainer steps={STEPS} />
      </div>

      <div className="mt-16">
        <Faq />
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
