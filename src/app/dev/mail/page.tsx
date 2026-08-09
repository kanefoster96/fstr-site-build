import Link from "next/link";
import { getDb } from "@/lib/data/db";
import { Container, Eyebrow, Num } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Dev inbox — renders the real MailAdapter templates that were "sent". */
export default async function DevMailPage() {
  const db = await getDb();

  return (
    <Container className="py-12">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Dev inbox</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold">Sent mail</h1>
        </div>
        <Link href="/dev" className="text-sm text-steel hover:text-ink">← Control panel</Link>
      </div>
      <p className="mt-2 text-steel">
        <Num value>{db.mail.length}</Num> emails logged. These render the real templates —
        wire a provider later and they go out for real.
      </p>

      {db.mail.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-mist p-8 text-center text-steel">
          No mail yet. Fire an <span className="num">invoice.paid</span> from the control panel.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {db.mail.map((m) => (
            <article key={m.id} className="overflow-hidden rounded-2xl border border-steel/25">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-steel/20 bg-mist px-5 py-3">
                <div>
                  <p className="font-medium">{m.subject}</p>
                  <p className="num text-xs text-steel">
                    to {m.to} · {m.template} · {fmtDateTime(m.sent_at)}
                  </p>
                </div>
              </header>
              <div className="bg-paper p-5" dangerouslySetInnerHTML={{ __html: m.html }} />
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
