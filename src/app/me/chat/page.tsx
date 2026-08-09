import { Container, Button, Eyebrow } from "@/components/ui";
import ChatOfferCard from "@/components/ChatOfferCard";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { fmtTime, fmtDay } from "@/lib/format";
import { sendMemberMessage, acceptOfferAction, declineOfferAction } from "./actions";

export const dynamic = "force-dynamic";

const CHIPS = ["Any morning next week", "Evening if possible", "Whenever's free"];

export default async function MemberChatPage() {
  const session = await getSession();
  if (!session.member) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to message the chair</h1>
        <Button href="/join" className="mt-5">Join FSTR</Button>
      </Container>
    );
  }
  const db = await getDb();
  const memberId = session.member.id;
  const chat = db.chats.find((c) => c.member_id === memberId);
  const messages = chat ? db.messages.filter((m) => m.chat_id === chat.id) : [];
  const hasToken = db.tokens.some((t) => t.member_id === memberId && t.state === "ISSUED");

  return (
    <Container className="py-12">
      <Eyebrow>Message the chair</Eyebrow>
      <h1 className="mt-2 font-display text-3xl font-bold">Just ask</h1>
      <p className="mt-1 text-steel">&ldquo;You free Thursday?&rdquo; works fine. He&apos;ll drop you a slot to tap.</p>

      <div className="mt-6 rounded-2xl border border-steel/25 bg-mist p-4">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-steel">No messages yet. Say hello 👇</p>
          )}
          {messages.map((m) => {
            const mine = m.sender === memberId;
            return (
              <div key={m.id} className={`max-w-[80%] ${mine ? "self-end text-right" : "self-start"}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-ink text-paper" : "bg-paper"}`}>
                  {m.body}
                </div>
                {m.slot_suggestion && (
                  <ChatOfferCard
                    message={m}
                    acceptAction={acceptOfferAction}
                    declineAction={declineOfferAction}
                    noToken={!hasToken}
                  />
                )}
                <p className="num mt-1 text-[10px] text-steel">{fmtDay(m.created_at)} {fmtTime(m.created_at)}</p>
              </div>
            );
          })}
        </div>

        <form action={sendMemberMessage} className="mt-4 flex gap-2">
          <input
            name="body"
            placeholder="You free Thursday afternoon?"
            className="flex-1 rounded-full border border-steel/40 bg-paper px-4 py-2.5 text-sm outline-none focus:border-brass"
          />
          <Button type="submit" className="text-sm">Send</Button>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <form key={c} action={sendMemberMessage}>
              <input type="hidden" name="body" value={c} />
              <button className="rounded-full border border-steel/40 px-3 py-1.5 text-xs text-steel hover:border-ink hover:text-ink">
                {c}
              </button>
            </form>
          ))}
        </div>
      </div>
    </Container>
  );
}
