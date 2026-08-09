import Link from "next/link";
import Coin from "@/components/Coin";
import { Container, Eyebrow, Num, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import Avatar from "@/components/Avatar";
import { getTodayBookings, getAdminNumbers } from "@/lib/data/admin";
import { getDb } from "@/lib/data/db";
import { fmtTime, fmtDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminTodayPage() {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;

  const today = await getTodayBookings();
  const numbers = await getAdminNumbers();
  const db = await getDb();
  const hoursPct = Math.min(100, (numbers.hoursThisWeek / 30) * 100);

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Today · {fmtDay(db.clock.now)}</Eyebrow>
          <h1 className="mt-2 font-display text-4xl font-bold">Your day</h1>
        </div>
        <AdminNav />
      </div>

      {/* Hours gauge + weekend status */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card className="!bg-mist">
          <div className="flex items-center justify-between">
            <p className="text-sm text-steel">Hours this week</p>
            <p className="num text-sm"><span className="value">{numbers.hoursThisWeek}</span> / 20–30 target</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-paper">
            <div className="h-2 rounded-full bg-brass" style={{ width: `${hoursPct}%` }} />
          </div>
        </Card>
        <Card className="!bg-mist">
          <p className="text-sm text-steel">Weekend</p>
          <p className="mt-1 text-sm">
            {numbers.weekendBooked === 0 ? (
              <>Weekend: <Num value>0</Num> booked — you&apos;re free. Have the day off.</>
            ) : (
              <><Num value>{numbers.weekendBooked}</Num> booked this weekend.</>
            )}
          </p>
        </Card>
      </div>

      {/* Today's chair list */}
      <h2 className="mt-10 font-display text-2xl font-semibold">In the chair today</h2>
      {today.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-mist p-8 text-center text-steel">
          Nothing booked today. Advance the clock in the dev panel to a busy day, or check the diary.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {today.map(({ booking, slot, member, token }) => (
            <div key={booking.id} className="flex items-center gap-4 rounded-2xl border border-steel/25 bg-paper p-4">
              <Avatar src={member?.avatar_url} name={member?.name ?? booking.contact_name ?? "One-off"} size={44} />
              <Coin size={36} tone={token?.state === "EXPIRED" ? "silver" : "gold"} ring={token?.state === "RESERVED" ? 0.5 : undefined} ghost={!token} />
              <div className="flex-1">
                <p className="font-medium">
                  {member?.name ?? booking.contact_name ?? "One-off"}{" "}
                  <span className="num text-steel">· {fmtTime(slot.starts_at)}</span>
                </p>
                <p className="text-xs text-steel">
                  {member?.usual_cut ?? "One-off cut"}
                  {member?.notes ? ` · ${member.notes}` : ""}
                  {booking.beard_addon ? " · +beard" : ""}
                </p>
              </div>
              <span className="num rounded-full bg-mist px-3 py-1 text-[10px] uppercase tracking-wide">
                {token?.state ?? (booking.kind === "prebook_pending" ? "prebook" : "one-off")}
              </span>
              <Link href="/admin/scan" className="num rounded-full bg-brass px-4 py-2 text-xs font-medium text-paper">
                Scan QR
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Quick numbers */}
      <div className="mt-10 grid gap-3 sm:grid-cols-4">
        <Stat label="MRR" value={`£${(numbers.mrr / 100).toFixed(0)}`} brass />
        <Stat label="Seats" value={`${numbers.seatsFilled}/${numbers.totalSeats}`} />
        <Stat
          label="Token liability"
          value={String(numbers.liability)}
          tone={numbers.liabilityLevel}
        />
        <Stat label="Chat bookings" value={String(numbers.chatBookings)} />
      </div>
      <Link href="/admin/numbers" className="mt-4 inline-block text-sm text-steel hover:text-ink">
        Full numbers →
      </Link>
    </Container>
  );
}


function Stat({
  label,
  value,
  brass,
  tone,
}: {
  label: string;
  value: string;
  brass?: boolean;
  tone?: "ok" | "amber" | "red";
}) {
  const color = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : brass ? "value" : "";
  return (
    <div className="rounded-2xl bg-mist p-4">
      <p className="text-xs text-steel">{label}</p>
      <p className={`num mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
