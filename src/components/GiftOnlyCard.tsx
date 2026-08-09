"use client";

import { useRef, useState } from "react";
import Coin from "./Coin";

type Action = (formData: FormData) => void | Promise<void>;

/**
 * An expired token — silver, gift-only. It can't be booked any more, but it's
 * not lost: you can still send it to a mate, who gets 14 days to book it.
 */
export default function GiftOnlyCard({
  tokenId,
  giftAction,
}: {
  tokenId: string;
  giftAction: Action;
}) {
  const coinRef = useRef<HTMLSpanElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function send() {
    if (!form.current) return;
    setBusy(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !coinRef.current) {
      form.current.requestSubmit();
      return;
    }
    coinRef.current.classList.add("animate-token-send");
    window.setTimeout(() => form.current?.requestSubmit(), 720);
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-steel/30 bg-paper p-5 text-center">
      <span className="num text-[10px] uppercase tracking-[0.15em] text-steel">Gift only</span>
      <span ref={coinRef} data-coin className="mt-2 inline-block">
        <Coin size={84} tone="silver" />
      </span>
      <p className="num mt-2 text-xs text-steel">Expired — still giftable</p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border border-steel/50 px-4 py-2 text-xs hover:border-ink"
        >
          Gift it to a mate
        </button>
      ) : (
        <div className="mt-3 w-full">
          <input
            name="to_contact"
            form={`giftonly-${tokenId}`}
            placeholder="Name or email"
            className="w-full rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm outline-none focus:border-brass"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={send}
              className="flex-1 rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              Send it
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="rounded-full border border-steel/50 px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>
          <p className="num mt-2 text-[11px] text-steel">They get 14 days to book it.</p>
        </div>
      )}

      <form ref={form} id={`giftonly-${tokenId}`} action={giftAction} className="hidden">
        <input type="hidden" name="token_id" value={tokenId} />
      </form>
    </div>
  );
}
