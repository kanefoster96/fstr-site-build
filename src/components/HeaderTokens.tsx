"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

/**
 * The header's wallet coin. Starts empty (ghost) and fills with a pop the moment
 * a token is earned during onboarding — the "it landed in my wallet" beat. It
 * listens for two window events so any flow can drive it:
 *   fstr:token-earned  → +1, coin fills and pops
 *   fstr:token-spent   → −1 (down to empty)
 */
export default function HeaderTokens({ size = 34 }: { size?: number }) {
  const [tokens, setTokens] = useState(0);
  const [pop, setPop] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <Link href="/me" aria-label="Your tokens" className="relative shrink-0" title="Your tokens">
      <span className={`block ${pop ? "animate-pop" : ""}`}>
        <Coin size={size} ghost={tokens === 0} />
      </span>
      {tokens > 0 && (
        <span className="num absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper">
          {tokens}
        </span>
      )}
    </Link>
  );
}
