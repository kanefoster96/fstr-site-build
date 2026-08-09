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
  { key: "join", variant: "gold" as const, title: "Join", body: "£25 a month — one full haircut and a beard tidy, every month." },
  { key: "added", variant: "gold" as const, title: "Your cut is added", body: "A haircut lands in your account on your billing date. You've got 60 days to use it." },
  { key: "book", variant: "gold" as const, title: "Book your time", body: "Pick a weekday appointment up to two weeks ahead. Can't see the time you need? Just message me." },
  { key: "saved", variant: "ghost" as const, title: "I save your cut", body: "Once we get it right, I save the lengths, details and how you like it — so next time's easy." },
  { key: "gift", variant: "silver" as const, title: "Can't use it?", body: "It rolls over for one more cycle. Still stuck? Gift the cut to a mate." },
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
