import { Container, Eyebrow, Num, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import { getAdminNumbers } from "@/lib/data/admin";
import { getDb } from "@/lib/data/db";
import { gbp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NumbersPage() {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;
  const n = await getAdminNumbers();
  const db = await getDb();

  // Fill rate per weekday
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fill: Record<number, { booked: number; total: number }> = {};
  db.slots.forEach((s) => {
    const dow = new Date(s.starts_at).getUTCDay();
    fill[dow] = fill[dow] ?? { booked: 0, total: 0 };
    fill[dow].total++;
    if (s.booked) fill[dow].booked++;
  });

  // Average wait-to-book (created_at → slot start) for member bookings
  const memberBookings = db.bookings.filter((b) => b.member_id && b.created_via !== "prebook");
  const waits = memberBookings.map((b) => {
    const slot = db.slots.find((s) => s.id === b.slot_id);
    return slot ? (Date.parse(slot.starts_at) - Date.parse(b.created_at)) / 864e5 : 0;
  }).filter((d) => d >= 0);
  const avgWait = waits.length ? Math.round((waits.reduce((a, c) => a + c, 0) / waits.length) * 10) / 10 : 0;
  const waitFlag = avgWait > db.settings.rules.wait_to_book_flag_days;

  const giftConversions = db.gifts.filter((g) => g.status === "booked").length;

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Numbers</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">Your true position</h1>
        </div>
        <AdminNav />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Big label="MRR" value={gbp(n.mrr)} brass />
        <Big label="Seats filled" value={`${n.seatsFilled} / ${n.totalSeats}`} />
        <Big
          label="Token liability (cuts owed)"
          value={String(n.liability)}
          note={n.liabilityLevel === "red" ? "over 60 — tighten intake" : n.liabilityLevel === "amber" ? "over 40 — watch it" : "healthy"}
          tone={n.liabilityLevel}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Fill rate per weekday</p>
          <div className="mt-3 space-y-2">
            {[1, 2, 3, 4, 5].map((d) => {
              const f = fill[d] ?? { booked: 0, total: 0 };
              const pct = f.total ? (f.booked / f.total) * 100 : 0;
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="num w-10 text-xs text-steel">{dayNames[d]}</span>
                  <div className="h-2 flex-1 rounded-full bg-paper">
                    <div className="h-2 rounded-full bg-brass" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="num w-12 text-right text-xs text-steel">{f.booked}/{f.total}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="!bg-mist">
          <p className="text-sm font-medium">Signals</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">Avg wait-to-book</dt>
              <dd className={`num ${waitFlag ? "text-amber-600" : ""}`}>
                {avgWait} days {waitFlag ? "· open more capacity" : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Chat bookings</dt>
              <dd className="num"><Num value>{n.chatBookings}</Num> · the personal touch</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Gifts sent → joined</dt>
              <dd className="num">{n.giftsSent} → {giftConversions}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Weekend booked</dt>
              <dd className="num">{n.weekendBooked}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Hours this week</dt>
              <dd className="num value">{n.hoursThisWeek}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </Container>
  );
}

function Big({
  label,
  value,
  brass,
  note,
  tone,
}: {
  label: string;
  value: string;
  brass?: boolean;
  note?: string;
  tone?: "ok" | "amber" | "red";
}) {
  const color = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : brass ? "value" : "";
  return (
    <div className="rounded-2xl bg-mist p-5">
      <p className="text-xs text-steel">{label}</p>
      <p className={`num mt-1 text-3xl font-semibold ${color}`}>{value}</p>
      {note && <p className="num mt-1 text-xs text-steel">{note}</p>}
    </div>
  );
}
