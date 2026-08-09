import { Container, Button, Eyebrow } from "@/components/ui";
import TokenExplainer, { type ExplainerStep } from "@/components/TokenExplainer";

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

/** Made-up-for-now FAQs, grounded in how the site actually works. Adam's voice. */
const FAQS: { q: string; a: string }[] = [
  {
    q: "How long is an appointment?",
    a: "45 minutes — one chair, no rushing. Add a beard trim (free) and I leave you the full hour.",
  },
  {
    q: "How far ahead can I book?",
    a: "Up to six weeks. Booking closes at midday the day before, so grab your slot in good time.",
  },
  {
    q: "Can I get a Saturday?",
    a: "Each Saturday has three slots you can book with a token. Once they're gone, emergency slots open at a token + £10.",
  },
  {
    q: "How much is it?",
    a: "From £20 a cut on the 2-weekly plan up to £30 on the 6-weekly — one cut per cycle, beard trim included. Or a one-off cut for £35.",
  },
  {
    q: "What if I don't use a token in time?",
    a: "Each one lasts two billing cycles, then rolls over. If it finally lapses it turns silver — gift it, or pair two silver coins for a cut.",
  },
  {
    q: "Can I change how often I get a token?",
    a: "Yes — pick any plan from every 2 to 6 weeks, and change it once per billing cycle. More often means cheaper per cut.",
  },
  {
    q: "Where's the chair?",
    a: "My private home studio in the Wallsend area, North Tyneside. I send the exact address and parking notes 24 hours before.",
  },
  {
    q: "Can I cancel?",
    a: "Anytime. Cancel 24+ hours before and your token comes back; any unused tokens stay yours until they run out.",
  },
  {
    q: "How do I sign in?",
    a: "With the email and password you set when you joined — that keeps your tokens and details yours.",
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

      {/* FAQ — native <details> accordion, no JS */}
      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
          Questions, <span className="value">answered.</span>
        </h2>
        <div className="mt-6 divide-y divide-steel/15 overflow-hidden rounded-2xl border border-steel/15">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="value grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brass/40 text-lg leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-4 text-steel">{f.a}</p>
            </details>
          ))}
        </div>
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
