/**
 * Shared FAQ accordion — native <details>, no JS. Answers are made-up-for-now
 * but grounded in how the site actually works. Adam's voice.
 */
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

export default function Faq() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
        Questions, <span className="value">answered.</span>
      </h2>
      <div className="mt-6 divide-y divide-steel/15 overflow-hidden rounded-2xl border border-steel/15">
        {FAQS.map((f) => (
          // name="faq" makes them mutually exclusive — opening one closes the rest.
          <details key={f.q} name="faq" className="group px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <span
                aria-hidden
                className="value grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brass/40 text-lg leading-none transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-steel group-open:animate-faq-open">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
