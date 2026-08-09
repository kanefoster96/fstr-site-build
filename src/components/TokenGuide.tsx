"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Coin from "./Coin";

/**
 * A tiny "how tokens work" popover — a token picture and three plain steps.
 * Opens on tap, closes on a second tap, a tap outside, or Escape. Positioned
 * by measuring the button and clamping to the viewport (via a portal), so it
 * always sits just under the button and never runs off the screen edge.
 */
const STEPS = [
  { n: "1", title: "Earn a token", body: "Every billing date drops one gold coin in your wallet. One token = one full cut." },
  { n: "2", title: "Spend it to book", body: "Pick a weekday slot and the token books it — no card at the chair." },
  { n: "3", title: "Keep, gift or pair it", body: "Tokens last two billing cycles. Lapsed ones turn silver — gift them, or pair two silver coins for a cut." },
];

const GAP = 8;
const MARGIN = 8;

export default function TokenGuide({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; arrow: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const width = Math.min(288, window.innerWidth - MARGIN * 2);
    const centre = b.left + b.width / 2;
    const left = Math.min(Math.max(MARGIN, centre - width / 2), window.innerWidth - width - MARGIN);
    const arrow = Math.min(Math.max(14, centre - left), width - 14);
    setPos({ top: b.bottom + GAP, left, width, arrow });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <span className={`inline-block ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="value underline underline-offset-2"
      >
        How tokens work
      </button>

      {open && pos != null &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            className="animate-pop fixed z-[100] rounded-2xl border border-steel/25 bg-paper p-4 text-left shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <span
              aria-hidden
              className="absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-steel/25 bg-paper"
              style={{ left: pos.arrow - 6 }}
            />
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
          </div>,
          document.body,
        )}
    </span>
  );
}
