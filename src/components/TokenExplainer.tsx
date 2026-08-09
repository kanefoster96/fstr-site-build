"use client";

import { useEffect, useRef, useState } from "react";
import Dock from "./Dock";

/**
 * The five steps of the journey. The travelling coin (CoinJourney) docks beside
 * each one as you scroll — gold while it's live, a faded record once it's used,
 * silver when it becomes giftable. This component just lays out the steps and
 * highlights whichever the coin is on.
 */
const STEPS = [
  { key: "join", variant: "gold" as const, title: "Join", body: "Membership is £25 a month — one full haircut and a beard tidy, every month." },
  { key: "added", variant: "gold" as const, title: "A token lands", body: "On your billing date a token — the gold coin — drops into your account. One token is one cut, and it's good for 60 days." },
  { key: "book", variant: "gold" as const, title: "Use it to book", body: "Spend your token on a weekday appointment, up to two weeks ahead. Can't see a time that works? Just message me." },
  { key: "saved", variant: "ghost" as const, title: "I save your cut", body: "Once we get it right, I save the lengths, the blend and how you like it — so next time you don't have to explain a thing." },
  { key: "gift", variant: "silver" as const, title: "Not used it?", body: "Your token rolls over for another month. Still can't use it? It turns giftable — the silver coin — so you can send the cut to a mate." },
];

export default function TokenExplainer() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ol className="space-y-5 sm:space-y-8">
      {STEPS.map((s, i) => (
        <li
          key={s.key}
          data-idx={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`flex items-center gap-4 rounded-2xl border p-5 transition-all duration-300 sm:gap-6 ${
            active === i ? "border-brass/40 bg-mist" : "border-transparent opacity-55"
          }`}
        >
          <Dock variant={s.variant} size={76} step={i} className="shrink-0" />
          <div>
            <div className="flex items-baseline gap-3">
              <span className="num text-sm value">0{i + 1}</span>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
            </div>
            <p className="mt-1.5 text-steel">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
