import Coin from "@/components/Coin";
import { Container, Button, Num, Eyebrow, Card } from "@/components/ui";
import { getSession } from "@/lib/auth";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import Avatar from "@/components/Avatar";
import { getDb } from "@/lib/data/db";
import { fmtDateTime } from "@/lib/format";
import { redeemAction } from "./actions";

export const dynamic = "force-dynamic";

/** Mock QR scan: the member's wallet shows a signed rotating payload; here we
 *  list reserved tokens as if scanned, then confirm → RESERVED→REDEEMED. */
export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;
  const sp = await searchParams;
  const db = await getDb();

  const reserved = db.tokens
    .filter((t) => t.state === "RESERVED")
    .map((t) => {
      const booking = db.bookings.find((b) => b.id === t.booking_id);
      const slot = booking ? db.slots.find((s) => s.id === booking.slot_id) : undefined;
      const member = db.members.find((m) => m.id === t.member_id);
      return { token: t, booking, slot, member };
    })
    .sort((a, b) => (a.slot && b.slot ? Date.parse(a.slot.starts_at) - Date.parse(b.slot.starts_at) : 0));

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>QR scan</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">Redeem at the chair</h1>
        </div>
        <AdminNav />
      </div>

      {sp.done && (
        <p className="mt-4 rounded-lg bg-mist px-4 py-3 text-sm">✓ Token redeemed and the cut logged.</p>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-steel/40 p-6">
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-ink text-paper">
          <span className="num text-[10px]">QR</span>
        </div>
        <p className="text-sm text-steel">
          Camera scanner mock. In the app this reads the member&apos;s signed rotating payload from
          their wallet. Pick a reserved token below to simulate a scan.
        </p>
      </div>

      <h2 className="mt-8 font-display text-xl font-semibold">Reserved — ready to redeem</h2>
      {reserved.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-mist p-8 text-center text-steel">
          Nothing reserved right now. Book a member cut, then come back to scan it.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {reserved.map(({ token, slot, member }) => (
            <Card key={token.id} className="!bg-mist">
              <div className="flex items-start gap-4">
                <Avatar src={member?.avatar_url} name={member?.name ?? "Member"} size={48} />
                <Coin size={44} ring={0.5} />
                <div className="flex-1">
                  <p className="font-medium">{member?.name}</p>
                  <p className="text-xs text-steel">
                    {member?.usual_cut}{member?.notes ? ` · ${member.notes}` : ""}
                  </p>
                  {slot && <p className="num mt-1 text-xs text-steel">{fmtDateTime(slot.starts_at)}</p>}
                </div>
              </div>
              <form action={redeemAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="token_id" value={token.id} />
                <input
                  name="note"
                  placeholder="Cut note (optional) — e.g. left a bit longer on top"
                  className="flex-1 rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm outline-none focus:border-brass"
                />
                <Button type="submit" className="text-sm">Redeem token</Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
