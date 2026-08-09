import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui";

export const metadata = { title: "Legal — FSTR Cuts" };

/** Templated legal pages, marked for review before launch. */
const DOCS: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of membership",
    body: [
      "These terms are a template and must be reviewed by a solicitor before launch.",
      "Membership is priced by cadence — from £20 to £30 per cut depending on how often you choose to be billed (every 2 to 6 weeks), locked for as long as you remain continuously subscribed. Each billing payment mints one token, valid for two billing cycles from issue.",
      "Tokens may be used for one cut (beard tidy included) or gifted. Tokens have no cash value and cannot be exchanged for products or refunds.",
      "A maximum of five tokens may be held at once (two active, three stored). Bookings freeze a token's expiry. Cancellations 24+ hours before a slot return the token; later cancellations or no-shows forfeit it.",
      "FSTR Cuts operates from a private residence. The address is shared only with confirmed bookings, 24 hours in advance.",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      "This privacy notice is a template and must be reviewed before launch.",
      "We collect your name, contact details and availability preferences to run your membership and bookings. Payment is handled by our payment processor; we do not store card details.",
      "We use your email to send booking confirmations, reminders (including the address 24 hours before your cut), and membership notifications.",
      "We never sell your data. You can request access to or deletion of your data at any time.",
    ],
  },
  cancellation: {
    title: "Cancellation policy",
    body: [
      "This cancellation policy is a template and must be reviewed before launch.",
      "You can cancel your membership at any time from your profile. Billing stops immediately; any unexpired tokens remain usable to their expiry.",
      "After cancelling, your locked rate is held for 30 days should you wish to rejoin. After that window, the current rate applies.",
      "Individual booking cancellations follow the token rules: 24+ hours' notice returns your token; later cancellations forfeit it, with a once-yearly goodwill reinstatement at the barber's discretion.",
    ],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const content = DOCS[doc];
  if (!content) notFound();

  return (
    <Container className="py-12">
      <Eyebrow>Legal · marked for review</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold">{content.title}</h1>
      <div className="mt-6 max-w-2xl space-y-4">
        {content.body.map((p, i) => (
          <p key={i} className={i === 0 ? "rounded-lg bg-mist px-4 py-3 text-sm text-steel" : "text-steel"}>
            {p}
          </p>
        ))}
      </div>
    </Container>
  );
}

export function generateStaticParams() {
  return [{ doc: "terms" }, { doc: "privacy" }, { doc: "cancellation" }];
}
