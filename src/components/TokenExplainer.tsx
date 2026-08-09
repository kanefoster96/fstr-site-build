"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Coin from "./Coin";

/**
 * The life of one token, told as you scroll THIS section. A single coin travels
 * down beside each step (spinning as it moves), fades to a saved record when
 * it's used, then turns silver at "not used it?". Self-contained — it stays
 * within the how-it-works block. Respects prefers-reduced-motion.
 */
const COIN = 76;

export type ExplainerStep = {
  key: string;
  title: string;
  body: string;
  variant?: "gold" | "ghost" | "silver";
};

const DEFAULT_STEPS: ExplainerStep[] = [
  { key: "join", variant: "gold", title: "Join", body: "Pick your pace — a cut every 2 to 6 weeks, from £20. One full haircut and a beard tidy, every cycle." },
  { key: "added", variant: "gold", title: "A token lands", body: "On each billing date a token — the gold coin — drops into your account. One token is one cut, and it lasts two billing cycles." },
  { key: "book", variant: "gold", title: "Use it to book", body: "Spend your token on a weekday appointment, up to two weeks ahead. Can't see a time that works? Just message me." },
  { key: "saved", variant: "ghost", title: "I save your cut", body: "Once we get it right, I save the lengths, the blend and how you like it — so next time you don't have to explain a thing." },
  { key: "gift", variant: "silver", title: "Not used it?", body: "Your token rolls over. If one lapses it turns silver — gift it to a mate, or pair two silver coins for a cut. Nothing's ever wasted." },
];

export default function TokenExplainer({ steps = DEFAULT_STEPS }: { steps?: ExplainerStep[] }) {
  const STEPS = steps;
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [coinTop, setCoinTop] = useState(0);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const place = useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    if (card) setCoinTop(card.offsetTop + card.offsetHeight / 2 - COIN / 2);
  }, []);

  useEffect(() => {
    place(active);
  }, [active, place]);

  useEffect(() => {
    const onResize = () => place(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, place]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 },
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const v = STEPS[active]?.variant ?? "gold";
  const tone = v === "silver" ? "silver" : "gold";
  const ghost = v === "ghost"; // used — now a saved record
  const spin = active * 180; // half-turn per step as it travels

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute left-1 top-0 z-10 sm:left-3"
        style={{
          transform: reduced ? "none" : `translateY(${coinTop}px) rotate(${spin}deg)`,
          transition: reduced ? "none" : "transform 650ms cubic-bezier(0.45,0,0.2,1)",
        }}
      >
        <Coin size={COIN} tone={tone} ghost={ghost} />
      </div>

      <ol className="space-y-5 pl-[92px] sm:space-y-8 sm:pl-[128px]">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            data-idx={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`rounded-2xl border p-5 transition-all duration-300 ${
              active === i ? "border-brass/40 bg-mist" : "border-transparent opacity-55"
            }`}
          >
            <div className="flex items-baseline gap-3">
              <span className="num text-sm value">0{i + 1}</span>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
            </div>
            <p className="mt-1.5 text-steel">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
