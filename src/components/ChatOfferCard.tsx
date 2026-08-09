import Coin from "./Coin";
import { Num } from "./ui";
import { fmtDateTime } from "@/lib/format";
import type { Message } from "@/lib/types";

/** The booking-offer card that drops into the chat (§9). Accept/decline forms
 *  are passed in so the same card renders on both member and barber sides. */
export default function ChatOfferCard({
  message,
  acceptAction,
  declineAction,
  noToken,
}: {
  message: Message;
  acceptAction?: (fd: FormData) => void;
  declineAction?: (fd: FormData) => void;
  noToken?: boolean;
}) {
  const s = message.slot_suggestion!;
  const status = message.offer_status;
  return (
    <div className="mt-2 rounded-2xl border border-brass/40 bg-paper p-4">
      <div className="flex items-center gap-3">
        <Coin size={44} ring={0.6} />
        <div>
          <p className="num text-sm value">{fmtDateTime(s.starts_at)}</p>
          <p className="num text-xs text-steel">{s.duration_mins} min · {s.requires_token ? "1 token" : "one-off"}</p>
        </div>
      </div>

      {status === "accepted" ? (
        <p className="num mt-3 text-sm">✓ Booked — token reserved.</p>
      ) : status === "declined" ? (
        <p className="num mt-3 text-sm text-steel">Offer closed.</p>
      ) : noToken ? (
        <div className="mt-3">
          <p className="text-sm text-steel">No token ready — grab a one-off or wait for your next drop.</p>
          <a href="/book" className="num text-sm value underline underline-offset-4">Book a one-off →</a>
        </div>
      ) : acceptAction ? (
        <div className="mt-3 flex gap-2">
          <form action={acceptAction}>
            <input type="hidden" name="message_id" value={message.id} />
            <button className="rounded-full bg-brass px-4 py-2 text-xs font-medium text-paper">Accept</button>
          </form>
          {declineAction && (
            <form action={declineAction}>
              <input type="hidden" name="message_id" value={message.id} />
              <button className="rounded-full border border-steel/50 px-4 py-2 text-xs">Decline</button>
            </form>
          )}
        </div>
      ) : (
        <p className="num mt-3 text-xs text-steel">Waiting on them to accept…</p>
      )}
    </div>
  );
}
