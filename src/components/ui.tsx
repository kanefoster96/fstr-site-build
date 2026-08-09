import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-content px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Mono, tabular — every countable thing renders like an engraving (§2). */
export function Num({
  children,
  value = false,
  className = "",
}: {
  children: ReactNode;
  value?: boolean;
  className?: string;
}) {
  return (
    <span className={`num ${value ? "value" : ""} ${className}`}>{children}</span>
  );
}

type BtnProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Primary = brass, reserved for value/CTA moments (§2 discipline). */
  variant?: "primary" | "ghost" | "quiet";
  type?: "button" | "submit";
  name?: string;
  value?: string;
  disabled?: boolean;
};

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-colors select-none";

const variants = {
  primary:
    "bg-brass text-paper hover:bg-[var(--brass-dark)] focus-visible:outline-brass",
  ghost:
    "border border-steel/60 text-ink hover:border-ink hover:bg-mist",
  quiet: "text-steel hover:text-ink",
} as const;

export function Button({
  href,
  children,
  className = "",
  style,
  variant = "primary",
  type = "button",
  name,
  value,
  disabled,
}: BtnProps) {
  const cls = `${btnBase} ${variants[variant]} ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} name={name} value={value} className={cls} style={style} disabled={disabled}>
      {children}
    </button>
  );
}

/** A quiet card / well on --mist. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-mist p-6 ${className}`}>{children}</div>
  );
}

export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`hairline ${className}`} />;
}

/** Small uppercase eyebrow label in steel. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="num text-xs uppercase tracking-[0.2em] text-steel">{children}</p>
  );
}

/** Live seat counter — mono, brass, sells scarcity everywhere it appears (§6). */
export function SeatCounter({
  left,
  label,
  total,
}: {
  left: number;
  label: string;
  total?: number;
}) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <Num value className="text-lg font-semibold">
        {total != null ? `${total - left} / ${total}` : left}
      </Num>
      <span className="text-sm text-steel">{label}</span>
    </span>
  );
}
