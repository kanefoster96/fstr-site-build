"use client";

import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

/**
 * A tiny "how tokens work" popover — a token picture and three plain steps.
 * Opens on tap, closes on a second tap, a tap outside, or Escape. Keeps people
 * inside the sign-up flow instead of sending them off to another page.
 */
const STEPS = [
  { n: "1", title: "Earn a token", body: "Every billing date drops one gold coin in your wallet. One token = one full cut." },
  { n: "2", title: "Spend it to book", body: "Pick a weekday slot and the token books it — no card at the chair." },
  { n: "3", title: "Keep it or gift it", body: "Tokens last two billing cycles and roll over. Not using one? It turns silver — send it to a mate." },
];

export default function TokenGuide({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="value underline underline-offset-2"
      >
        How tokens work
      </button>

      {open && (
        <div
          role="dialog"
          className="animate-pop absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-2xl border border-steel/25 bg-paper p-4 text-left shadow-xl"
        >
          <div className="flex items-center gap-3">
            <Coin size={48} />
            <p className="font-display text-base font-semibold text-ink">
              One token, <span className="value">one cut.</span>
            </p>
          </div>
          <ol className="mt-3 space-y-2.5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-2.5">
                <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brass/20 text-[11px] font-bold text-ink">
                  {s.n}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{s.title}</span>
                  <span className="block text-[12px] leading-snug text-steel">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <span
            aria-hidden
            className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-steel/25 bg-paper"
          />
        </div>
      )}
    </span>
  );
}
