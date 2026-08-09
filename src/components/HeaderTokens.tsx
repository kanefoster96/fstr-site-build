"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

/**
 * The header's wallet. Empty: a ghost holder the same size as the hamburger,
 * with a little "+" badge on the top-left to add tokens. With tokens: the coins
 * fan out as an overlapping stack. Fills with a pop the moment a token is earned
 * during onboarding (window events), so any flow can drive it:
 *   fstr:token-earned  → +1, coin pops in
 *   fstr:token-spent   → −1
 */
const SIZE = 40; // matches the hamburger circle (h-10 w-10)
const OVERLAP = 15; // how far each stacked coin tucks under the previous
const MAX_VISIBLE = 3;

export default function HeaderTokens({ initial = 0, withAdd = false }: { initial?: number; withAdd?: boolean }) {
  const [tokens, setTokens] = useState(initial);
  const [pop, setPop] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTokens(initial);
  }, [initial]);

  useEffect(() => {
    const onEarned = () => {
      setTokens((n) => n + 1);
      setPop(true);
      if (popTimer.current) clearTimeout(popTimer.current);
      popTimer.current = setTimeout(() => setPop(false), 700);
    };
    const onSpent = () => setTokens((n) => Math.max(0, n - 1));
    window.addEventListener("fstr:token-earned", onEarned);
    window.addEventListener("fstr:token-spent", onSpent);
    return () => {
      window.removeEventListener("fstr:token-earned", onEarned);
      window.removeEventListener("fstr:token-spent", onSpent);
      if (popTimer.current) clearTimeout(popTimer.current);
    };
  }, []);

  const visible = Math.min(tokens, MAX_VISIBLE);
  const overflow = tokens - visible;

  return (
    <div className="relative shrink-0" style={{ height: SIZE }}>
      <Link
        href={tokens > 0 ? "/me" : "/join"}
        aria-label={tokens > 0 ? "Your tokens" : "Add tokens"}
        title={tokens > 0 ? "Your tokens" : "Add tokens"}
        className="flex items-center"
      >
        {tokens === 0 ? (
          <span className={`block ${pop ? "animate-pop" : ""}`}>
            <Coin size={SIZE} ghost />
          </span>
        ) : (
          <span className="flex items-center">
            {Array.from({ length: visible }).map((_, i) => (
              <span
                key={i}
                className={`block rounded-full ring-2 ring-paper ${i === visible - 1 && pop ? "animate-pop" : ""}`}
                style={{ marginLeft: i === 0 ? 0 : -OVERLAP, zIndex: visible - i }}
              >
                <Coin size={SIZE} />
              </span>
            ))}
            {overflow > 0 && (
              <span
                className="grid place-items-center rounded-full bg-ink text-paper ring-2 ring-paper"
                style={{ width: SIZE, height: SIZE, marginLeft: -OVERLAP, zIndex: 0 }}
              >
                <span className="num text-xs font-bold">+{overflow}</span>
              </span>
            )}
          </span>
        )}
      </Link>

      {withAdd && (
        <Link
          href="/join"
          aria-label="Add tokens"
          title="Add tokens"
          className="absolute -left-1 -top-1 z-20 grid h-4 w-4 place-items-center rounded-full bg-brass text-ink ring-2 ring-paper"
        >
          <span className="text-[11px] font-bold leading-none">+</span>
        </Link>
      )}
    </div>
  );
}
