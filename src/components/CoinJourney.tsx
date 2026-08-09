"use client";

import { useEffect, useRef, useState } from "react";
import Coin from "./Coin";

type Variant = "gold" | "silver" | "ghost" | "avatar";
const BASE = 120; // the coin renders at 120 and is scaled to each dock's size
const HOP = 560; // ms — the confident spin-and-land between placements
const MARGIN = 64; // px — how much closer a new dock must be before we commit
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * One coin for the whole homepage. It stays PINNED wherever it landed (fixed on
 * screen — it does not drift as you scroll), and only moves when a new section
 * clearly takes over: then it spins a full turn and lands on that section's
 * placement. Morphs gold → used → silver, and into Adam's avatar in his story.
 * Respects prefers-reduced-motion (snaps, no spin).
 */
export default function CoinJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("gold");
  const [hidden, setHidden] = useState(true);
  const vRef = useRef<Variant>("gold");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = {
      landed: null as HTMLElement | null,
      target: null as HTMLElement | null,
      hopping: false,
      hopStart: 0,
      fromX: 0,
      fromY: 0,
      fromScale: 0.6,
      fromRot: 0,
      x: 0,
      y: 0,
      scale: 0.6,
      rot: 0,
      inited: false,
    };
    let raf = 0;

    const read = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        s: (Number(el.dataset.size) || 76) / BASE,
        v: (el.dataset.variant as Variant) || "gold",
        dist: Math.abs(r.top + r.height / 2 - window.innerHeight * 0.42),
      };
    };

    /** Nearest dock to the reading line, but only switch off the current one
     *  when a new dock is clearly closer (hysteresis → commits, no jitter). */
    function activeDock(current: HTMLElement | null): HTMLElement | null {
      const list = document.querySelectorAll<HTMLElement>("[data-coin-dock]");
      if (!list.length) return null;
      let best: HTMLElement | null = null;
      let bd = Infinity;
      list.forEach((el) => {
        const d = read(el).dist;
        if (d < bd) {
          bd = d;
          best = el;
        }
      });
      if (current && current !== best) {
        if (read(current).dist - bd < MARGIN) return current; // stay put
      }
      return best;
    }

    const setV = (v: Variant) => {
      if (vRef.current !== v) {
        vRef.current = v;
        setVariant(v);
      }
    };

    function frame(now: number) {
      const wrap = wrapRef.current;
      const active = activeDock(st.landed);
      if (active && wrap) {
        if (hidden) setHidden(false);

        if (!st.inited || reduce) {
          // first paint, or reduced-motion: snap onto the active dock, no spin
          if (!st.inited || active !== st.landed) {
            const c = read(active);
            st.landed = active;
            st.target = active;
            st.x = c.x;
            st.y = c.y;
            st.scale = c.s;
            st.rot = 0;
            st.inited = true;
            st.hopping = false;
            setV(c.v);
          }
        } else {
          // a new section took over → begin (or retarget) a spin-hop
          if (active !== st.target) {
            st.fromX = st.x;
            st.fromY = st.y;
            st.fromScale = st.scale;
            st.fromRot = st.rot;
            st.target = active;
            st.hopStart = now;
            st.hopping = true;
          }

          if (st.hopping && st.target) {
            const t = Math.min(1, (now - st.hopStart) / HOP);
            const e = easeInOut(t);
            const c = read(st.target); // live — the dock moves with scroll
            st.x = st.fromX + (c.x - st.fromX) * e;
            st.y = st.fromY + (c.y - st.fromY) * e;
            st.scale = st.fromScale + (c.s - st.fromScale) * e;
            st.rot = st.fromRot + 360 * e; // one confident full turn
            if (t > 0.5) setV(c.v); // change mid-spin
            if (t >= 1) {
              st.hopping = false;
              st.landed = st.target;
              st.rot = Math.round(st.rot / 360) * 360; // land upright
              setV(c.v);
            }
          }
          // when not hopping: hold x/y/scale exactly — pinned, no drift
        }

        const rot = vRef.current === "avatar" ? 0 : st.rot;
        wrap.style.transform = `translate(${st.x - BASE / 2}px, ${st.y - BASE / 2}px) scale(${st.scale}) rotate(${rot}deg)`;
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
