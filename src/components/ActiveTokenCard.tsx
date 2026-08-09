"use client";

import { useRef, useState } from "react";
import Coin from "./Coin";

type Action = (formData: FormData) => void | Promise<void>;

/**
 * An "active" token as a collectible coin: idle bob, a countdown ring, and two
 * one-tap moves — Use (flings onto the slot) and Gift (flips and sails to a
 * mate). The coin lives outside the hidden forms so a single element animates
 * for either action; requestSubmit fires the right server action after.
 */
export default function ActiveTokenCard({
  daysLeft,
  lifeFraction,
  expiresLabel,
  soonestSlotId,
  soonestSlotLabel,
  quickBookAction,
  quickGiftAction,
}: {
  daysLeft: number;
  lifeFraction: number;
  expiresLabel: string;
  soonestSlotId?: string;
  soonestSlotLabel?: string;
  quickBookAction: Action;
  quickGiftAction: Action;
}) {
  const coinRef = useRef<HTMLSpanElement>(null);
  const useForm = useRef<HTMLFormElement>(null);
  const giftForm = useRef<HTMLFormElement>(null);
  const [gifting, setGifting] = useState(false);
  const [busy, setBusy] = useState(false);

  const low = daysLeft <= 14;

  function reduced() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function play(anim: "use" | "send", form: HTMLFormElement | null) {
    if (!form) return;
    setBusy(true);
    if (reduced() || !coinRef.current) {
      form.requestSubmit();
      return;
    }
    coinRef.current.classList.add(anim === "use" ? "animate-token-use" : "animate-token-send");
    window.setTimeout(() => form.requestSubmit(), anim === "use" ? 620 : 720);
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-brass/40 bg-paper p-5 text-center">
      <span
        ref={coinRef}
        data-coin
        className=""
        style={{ display: "inline-block" }}
      >
        <Coin size={104} ring={lifeFraction} />
      </span>

      <p className="num mt-3 text-sm">
        <span className={low ? "text-amber-600" : "value"}>{expiresLabel}</span> left
      </p>
      <p className="num text-[11px] text-steel">60-day token</p>

      {/* Actions */}
      {!gifting ? (
        <div className="mt-4 flex w-full flex-col gap-2">
          {soonestSlotId ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => play("use", useForm.current)}
              className="w-full rounded-full bg-brass px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            >
              Use it{soonestSlotLabel ? ` · ${soonestSlotLabel}` : ""}
            </button>
          ) : (
            <a
              href="/me/book"
              className="w-full rounded-full bg-brass px-4 py-2.5 text-sm font-medium text-ink"
            >
              Book a slot
            </a>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setGifting(true)}
            className="w-full rounded-full border border-steel/50 px-4 py-2.5 text-sm hover:border-ink disabled:opacity-60"
          >
            Gift to a mate
          </button>
        </div>
      ) : (
        <div className="mt-4 w-full">
          <input
            id="gift-to"
            name="to_contact"
            form="giftform"
            placeholder="Name or email"
            className="w-full rounded-lg border border-steel/40 bg-paper px-3 py-2 text-sm outline-none focus:border-brass"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => play("send", giftForm.current)}
              className="flex-1 rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              Send it
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setGifting(false)}
              className="rounded-full border border-steel/50 px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>
          <p className="num mt-2 text-[11px] text-steel">14 days to book · comes back if unused</p>
        </div>
      )}

      {/* Hidden forms carry the real server actions */}
      <form ref={useForm} action={quickBookAction} className="hidden">
        <input type="hidden" name="slot_id" value={soonestSlotId ?? ""} />
      </form>
      <form ref={giftForm} id="giftform" action={quickGiftAction} className="hidden" />
    </div>
  );
}
