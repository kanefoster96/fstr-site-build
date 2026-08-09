"use client";

import { useRef, type ReactNode } from "react";

/**
 * Wraps a server-action form and plays a token animation before submitting:
 * "use" flings the coin onto the slot, "send" flips it and sails it to a mate.
 * The coin to animate is any child carrying `data-coin`. Respects
 * prefers-reduced-motion (submits immediately, no animation).
 */
export default function AnimatedSubmit({
  action,
  anim,
  children,
  className = "",
}: {
  action: (formData: FormData) => void | Promise<void>;
  anim: "use" | "send";
  children: ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const armed = useRef(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (armed.current) return; // second pass — let the real submit go through
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coin = formRef.current?.querySelector<HTMLElement>("[data-coin]");
    if (reduce || !coin) return; // submit normally

    e.preventDefault();
    coin.style.pointerEvents = "none";
    coin.classList.add(anim === "use" ? "animate-token-use" : "animate-token-send");
    armed.current = true;
    window.setTimeout(() => formRef.current?.requestSubmit(), anim === "use" ? 620 : 720);
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
