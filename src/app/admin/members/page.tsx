import { Container, Eyebrow, Num, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import { getDb } from "@/lib/data/db";
import { gbp, fmtMonthDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;
  const db = await getDb();

  const seatMap = new Map<number, (typeof db.members)[number]>();
  db.members.forEach((m) => {
    if (m.role === "member" && m.seat_number != null && m.status !== "cancelled") {
      seatMap.set(m.seat_number, m);
    }
  });

  const pastDue = db.subscriptions
    .filter((s) => s.status === "past_due")
    .map((s) => ({ sub: s, member: db.members.find((m) => m.id === s.member_id) }));

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Members</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">The seat map</h1>
        </div>
        <AdminNav />
      </div>
      <p className="num mt-1 text-sm text-steel">
        <span className="value">{seatMap.size}</span> / {db.settings.total_seats} filled ·{" "}
        {db.waitlist.filter((w) => !w.notified_at).length} on the waitlist
      </p>

      {/* 130-seat grid, brass = filled */}
      <div className="mt-6 grid grid-cols-10 gap-1.5">
        {Array.from({ length: db.settings.total_seats }, (_, i) => i + 1).map((seat) => {
          const m = seatMap.get(seat);
          const founding = seat <= 50;
          return (
            <div
              key={seat}
              title={m ? `${m.name} · seat ${seat}` : `Seat ${seat} — free`}
              className={`aspect-square rounded-[4px] ${
                m ? "bg-brass" : founding ? "border border-brass/40" : "bg-mist"
              }`}
            />
          );
        })}
      </div>
      <p className="num mt-2 text-xs text-steel">Brass = filled · outline = free Founding seat · grey = free</p>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {/* Failed payments queue */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Failed payments</p>
          {pastDue.length === 0 ? (
            <p className="mt-2 text-sm text-steel">None — all paid up.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {pastDue.map(({ sub, member }) => (
                <li key={sub.id} className="flex items-center justify-between text-sm">
                  <span>{member?.name}</span>
                  <span className="num text-steel">retry {sub.retry_count} · {gbp(sub.price_locked)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Waitlist */}
        <Card className="!bg-mist">
          <p className="text-sm font-medium">Waitlist</p>
          {db.waitlist.length === 0 ? (
            <p className="mt-2 text-sm text-steel">Empty.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {db.waitlist.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <span>{w.contact}</span>
                  <span className="num text-steel">since {fmtMonthDay(w.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Container>
  );
}
