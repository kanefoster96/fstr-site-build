"use client";

import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

type Variant = "gold" | "silver" | "ghost" | "avatar";
const BASE = 120; // the coin renders at 120 and is scaled to each dock's size

/**
 * One coin for the whole homepage. It reads the `data-coin-dock` markers placed
 * through the page and smoothly follows the one nearest the reading line as you
 * scroll — a single seamless token travelling from the hero to the footer,
 * spinning as it moves, fading to a used/saved record, turning silver when it
 * becomes giftable, and morphing into Adam's avatar in his story.
 */
export default function CoinJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("gold");
  const [hidden, setHidden] = useState(true);
  const variantRef = useRef<Variant>("gold");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = { x: 0, y: 0, scale: 0.6, rot: 0, init: false };
    let raf = 0;

    function activeDock(): HTMLElement | null {
      const list = document.querySelectorAll<HTMLElement>("[data-coin-dock]");
      if (!list.length) return null;
      const focal = window.innerHeight * 0.42;
      let best: HTMLElement | null = null;
      let bd = Infinity;
      list.forEach((el) => {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - focal);
        if (d < bd) {
          bd = d;
          best = el;
        }
      });
      return best;
    }

    function frame() {
      const el = activeDock();
      const wrap = wrapRef.current;
      if (el && wrap) {
        if (hidden) setHidden(false);
        const r = el.getBoundingClientRect();
        const tx = r.left + r.width / 2;
        const ty = r.top + r.height / 2;
        const tScale = (Number(el.dataset.size) || 76) / BASE;
        const v = (el.dataset.variant as Variant) || "gold";
        if (variantRef.current !== v) {
          variantRef.current = v;
          setVariant(v);
        }

        const k = reduce || !s.init ? 1 : 0.16;
        const px = s.x;
        s.x += (tx - s.x) * k;
        s.y += (ty - s.y) * k;
        s.scale += (tScale - s.scale) * k;

        if (!reduce) {
          // spin while travelling, then settle upright
          s.rot += (s.x - px) * 1.6;
          if (Math.abs(tx - s.x) < 0.6) {
            const nearest = Math.round(s.rot / 360) * 360;
            s.rot += (nearest - s.rot) * 0.12;
          }
        }
        s.init = true;

        const rot = v === "avatar" ? 0 : s.rot;
        wrap.style.transform = `translate(${s.x - BASE / 2}px, ${s.y - BASE / 2}px) scale(${s.scale}) rotate(${rot}deg)`;
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-30 transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}
      style={{ width: BASE, height: BASE, transformOrigin: "60px 60px", willChange: "transform" }}
    >
      {variant === "avatar" ? (
        <div className="grid h-full w-full place-items-center rounded-full bg-mist ring-1 ring-steel/20">
          <span className="font-display text-4xl font-bold text-ink">A</span>
        </div>
      ) : (
        <Coin size={BASE} tone={variant === "silver" ? "silver" : "gold"} ghost={variant === "ghost"} />
      )}
    </div>
  );
}
