import { Container, Button, Eyebrow, Num } from "@/components/ui";
import ChatOfferCard from "@/components/ChatOfferCard";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { parseTimeHints, slotsForHint } from "@/lib/engine/chat";
import { fmtTime, fmtDay } from "@/lib/format";
import { sendBarberMessage, offerSlotAction } from "./actions";
import BarberGate from "@/components/BarberGate";
import AdminNav from "@/components/AdminNav";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>;
}) {
  const session = await getSession();
  if (!session.isBarber) return <BarberGate />;

  const sp = await searchParams;
  const db = await getDb();
  const chats = [...db.chats].sort((a, b) => {
    // unread first, then most recent
    if (!!a.unread_for_barber !== !!b.unread_for_barber) return a.unread_for_barber ? -1 : 1;
    return Date.parse(b.last_message_at) - Date.parse(a.last_message_at);
  });
  const activeId = sp.chat ?? chats[0]?.id;
  const active = chats.find((c) => c.id === activeId);
  const messages = active ? db.messages.filter((m) => m.chat_id === active.id) : [];
  const member = active ? db.members.find((m) => m.id === active.member_id) : undefined;

  // Time-query detection on the latest inbound member message.
  const lastInbound = [...messages].reverse().find((m) => m.sender !== "barber");
  const hint = lastInbound ? parseTimeHints(lastInbound.body) : { raw: [] };
  const suggestedSlots = lastInbound ? slotsForHint(db, hint) : [];

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>Inbox</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold">Chats</h1>
        </div>
        <AdminNav />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Thread list */}
        <div className="space-y-1">
          {chats.map((c) => {
            const m = db.members.find((x) => x.id === c.member_id);
            const last = db.messages.filter((x) => x.chat_id === c.id).slice(-1)[0];
            return (
              <a
                key={c.id}
                href={`/admin/inbox?chat=${c.id}`}
                className={`block rounded-xl p-3 ${c.id === activeId ? "bg-mist" : "hover:bg-mist/60"}`}
              >
                <div className="flex items-center gap-2">
                  <Avatar src={m?.avatar_url} name={m?.name ?? "Member"} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{m?.name}</span>
                      {c.unread_for_barber && <span className="h-2 w-2 shrink-0 rounded-full bg-brass" />}
                    </div>
                    <p className="truncate text-xs text-steel">{last?.body}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Active thread + slot picker */}
        <div>
          {active && member ? (
            <div className="rounded-2xl border border-steel/25 bg-mist p-4">
              <div className="flex items-center gap-2">
                <Avatar src={member.avatar_url} name={member.name} size={36} />
                <p className="text-sm font-medium">
                  {member.name} <span className="num text-steel">· usual: {member.usual_cut ?? "—"}</span>
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {messages.map((m) => {
                  const mine = m.sender === "barber";
                  return (
                    <div key={m.id} className={`max-w-[80%] ${mine ? "self-end text-right" : "self-start"}`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-ink text-paper" : "bg-paper"}`}>
                        {highlightHints(m.body, mine ? [] : hint.raw)}
                      </div>
                      {m.slot_suggestion && <ChatOfferCard message={m} />}
                      <p className="num mt-1 text-[10px] text-steel">{fmtDay(m.created_at)} {fmtTime(m.created_at)}</p>
                    </div>
                  );
                })}
              </div>

              <form action={sendBarberMessage} className="mt-4 flex gap-2">
                <input type="hidden" name="chat_id" value={active.id} />
                <input name="body" placeholder="Reply…"
                  className="flex-1 rounded-full border border-steel/40 bg-paper px-4 py-2.5 text-sm outline-none focus:border-brass" />
                <Button type="submit" className="text-sm">Send</Button>
              </form>
            </div>
          ) : (
            <p className="rounded-2xl bg-mist p-8 text-center text-steel">No chats yet.</p>
          )}

          {/* Mini slot picker, pre-filtered to the mentioned window */}
          {active && (
            <div className="mt-4 rounded-2xl border border-brass/40 p-4">
              <p className="text-sm font-medium">
                Offer a slot
                {hint.raw.length > 0 && (
                  <span className="num text-steel"> · matched: {hint.raw.join(", ")}</span>
                )}
              </p>
              {suggestedSlots.length === 0 ? (
                <p className="mt-2 text-sm text-steel">No matching slots — widen the window in the diary.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {suggestedSlots.map((s) => (
                    <form key={s.id} action={offerSlotAction}>
                      <input type="hidden" name="chat_id" value={active.id} />
                      <input type="hidden" name="slot_id" value={s.id} />
                      <button className="w-full rounded-xl border border-steel/30 bg-paper p-3 text-center hover:border-brass">
                        <span className="num block text-xs text-steel">{fmtDay(s.starts_at)}</span>
                        <span className="num block text-sm">{fmtTime(s.starts_at)}</span>
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

/** Underline detected time expressions in brass so the barber sees them fast. */
function highlightHints(text: string, hints: string[]) {
  if (hints.length === 0) return text;
  const pattern = new RegExp(`(${hints.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((p, i) =>
    hints.some((h) => h.toLowerCase() === p.toLowerCase()) ? (
      <span key={i} className="value underline decoration-brass/60 underline-offset-2">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
