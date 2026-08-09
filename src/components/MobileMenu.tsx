"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

/**
 * The mobile hamburger. Unlike a native <details>, this closes the moment you
 * pick a link, tap outside the panel, or hit Escape — so it never lingers open
 * over the page.
 */
export default function MobileMenu({ links }: { links: NavLink[] }) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-steel/40"
      >
        <span className="flex flex-col gap-[4px]" aria-hidden>
          <span className="block h-0.5 w-5 rounded-full bg-ink" />
          <span className="block h-0.5 w-5 rounded-full bg-ink" />
          <span className="block h-0.5 w-5 rounded-full bg-ink" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-steel/30 bg-paper p-3 shadow-lg">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-mist"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/join"
            onClick={() => setOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-full border border-steel/40 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-ink"
          >
            <span aria-hidden className="value">+</span> Add tokens
          </Link>
        </div>
      )}
    </div>
  );
}
