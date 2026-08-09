"use client";

import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

/**
 * The one orchestrated moment (§2): the coin drops into a wallet on payment →
 * slides onto a calendar slot when booked → flips to reveal a gift code when
 * gifted. Scroll-triggered, one sequence, respects prefers-reduced-motion —
 * when reduced motion is set we render the resting end-state of each step.
 */
const STEPS = [
  { key: "join", title: "Join", body: "£25/month. Your seat is yours." },
  { key: "drop", title: "A token drops", body: "One cut, minted on your billing day. 60 days to use it." },
  { key: "book", title: "Book it — or message him", body: "Slides onto a weekday slot. The clock freezes the moment you book." },
  { key: "rollover", title: "Can't make it? It rolls over", body: "Never silently disappears. You've got two full billing cycles." },
  { key: "gift", title: "Still can't? Gift it to a mate", body: "One tap, a code, done. A cut you paid for is never wasted." },
] as const;

export default function TokenExplainer() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActive(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stage = active;

  return (
    <div className="relative grid gap-10 lg:grid-cols-2">
      {/* Sticky stage */}
      <div className="top-24 self-start lg:sticky">
        <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center rounded-3xl bg-mist">
          {/* wallet plate */}
          <div className="absolute bottom-8 left-8 right-8 h-24 rounded-2xl border border-steel/30 bg-paper/70" />
          {/* calendar plate */}
          <div
            className={`absolute right-8 top-8 h-28 w-28 rounded-2xl border border-steel/30 bg-paper/70 transition-opacity duration-500 ${
              stage >= 2 ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="num p-2 text-[10px] text-steel">TUE</div>
            <div className="num px-2 text-2xl value">11:00</div>
          </div>
          {/* the coin, positioned per stage */}
          <div
            className="absolute transition-all duration-700 ease-out"
            style={{
              transform: reduced
                ? "none"
                : stage === 0
                  ? "translate(0, -30%) scale(0.9)"
                  : stage === 1
                    ? "translate(-28%, 20%) scale(1)"
                    : stage === 2
                      ? "translate(28%, -28%) scale(0.85)"
                      : stage === 3
                        ? "translate(-28%, 20%) scale(1)"
                        : "translate(0, 0) scale(1.05)",
            }}
          >
            <Coin
              size={132}
              live={!reduced && stage <= 1}
              flipped={stage === 4}
              code={stage === 4 ? "BRASS-7Q2" : undefined}
              ring={stage === 3 ? 0.55 : undefined}
            />
          </div>
        </div>
      </div>

      {/* Scrolling steps */}
      <ol className="flex flex-col gap-6 lg:gap-16">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            data-idx={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`rounded-2xl p-6 transition-all duration-300 ${
              stage === i ? "bg-mist" : "opacity-55"
            }`}
          >
            <div className="flex items-baseline gap-3">
              <span className="num text-sm value">0{i + 1}</span>
              <h3 className="font-display text-2xl font-semibold">{s.title}</h3>
            </div>
            <p className="mt-2 text-steel">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
