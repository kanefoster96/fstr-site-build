import type { CSSProperties } from "react";

type Tone = "gold" | "silver";

type CoinProps = {
  size?: number;
  /** gold = live/usable, silver = gift-only (expired) or an outstanding gift. */
  tone?: Tone;
  /** 0..1 fraction of life remaining, draws the countdown ring. */
  ring?: number;
  /** Show the flipped face (gift reveal) with a code. */
  flipped?: boolean;
  code?: string;
  /** Dim, embossed outline only — the empty-wallet state. */
  ghost?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Animate the resting sheen. Respects prefers-reduced-motion via CSS. */
  live?: boolean;
};

const PALETTE = {
  gold: {
    hi: "var(--coin-gold-hi)",
    mid: "var(--coin-gold)",
    deep: "var(--coin-gold-deep)",
    rim: "var(--coin-gold-rim)",
    ink: "var(--coin-gold-ink)",
  },
  silver: {
    hi: "var(--coin-silver-hi)",
    mid: "var(--coin-silver)",
    deep: "var(--coin-silver-deep)",
    rim: "var(--coin-silver-rim)",
    ink: "var(--coin-silver-ink)",
  },
} as const;

/**
 * The FSTR token as a bold coin: a simple circle, "FSTR" and "1 x CUT" beneath.
 * Gold when it's live and usable; silver when it's gift-only. Edged so it never
 * blends into the warm-white page.
 */
export default function Coin({
  size = 120,
  tone = "gold",
  ring,
  flipped = false,
  code,
  ghost = false,
  className = "",
  style,
  live = false,
}: CoinProps) {
  const id = `${tone}-${code ?? "coin"}`;
  const p = PALETTE[flipped ? "silver" : tone];
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const dash = ring != null ? circumference * Math.max(0, Math.min(1, ring)) : 0;

  if (ghost) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className={className}
        style={style}
        role="img"
        aria-label="Empty token slot"
      >
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--steel)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 5" />
        <text x="60" y="58" textAnchor="middle" fontFamily="var(--font-display)" fontSize="20" fontWeight="700" fill="var(--steel)" fillOpacity="0.45" letterSpacing="1">FSTR</text>
        <text x="60" y="74" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--steel)" fillOpacity="0.4" letterSpacing="1.5">1 x CUT</text>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      style={{ overflow: "visible", ...style }}
      role="img"
      aria-label={flipped && code ? `Gift token, code ${code}` : tone === "silver" ? "Gift-only token" : "FSTR token"}
    >
      <defs>
        <radialGradient id={`${id}-face`} cx="38%" cy="30%" r="85%">
          <stop offset="0%" stopColor={p.hi} />
          <stop offset="45%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.deep} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.hi} />
          <stop offset="50%" stopColor={p.rim} />
          <stop offset="100%" stopColor={p.mid} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="34%" cy="24%" r="42%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* crisp outer edge so it never blends into white */}
      <circle cx="60" cy="60" r="57" fill={p.rim} />
      {/* rim */}
      <circle cx="60" cy="60" r="55" fill={`url(#${id}-rim)`} />
      {/* face */}
      <circle cx="60" cy="60" r="49" fill={`url(#${id}-face)`} stroke={p.rim} strokeWidth="1" strokeOpacity="0.5" />
      {/* faint inner ring */}
      <circle cx="60" cy="60" r="43" fill="none" stroke={p.rim} strokeOpacity="0.35" strokeWidth="1" />

      {flipped && code ? (
        <>
          <text x="60" y="52" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={p.ink} letterSpacing="2">GIFT</text>
          <text x="60" y="73" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight="600" fill={p.ink} letterSpacing="1">{code}</text>
        </>
      ) : (
        <>
          {/* subtle emboss highlight */}
          <text x="60" y="55.2" textAnchor="middle" fontFamily="var(--font-display)" fontSize="30" fontWeight="700" fill="#fff" fillOpacity="0.35" letterSpacing="0.5">FSTR</text>
          <text x="60" y="56" textAnchor="middle" fontFamily="var(--font-display)" fontSize="30" fontWeight="700" fill={p.ink} letterSpacing="0.5">FSTR</text>
          <text x="60" y="74" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="500" fill={p.ink} fillOpacity="0.85" letterSpacing="1.5">1 x CUT</text>
        </>
      )}

      {/* soft sheen */}
      <circle cx="60" cy="60" r="49" fill={`url(#${id}-sheen)`} pointerEvents="none" />
      {live && (
        <circle
          cx="60" cy="60" r="49" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="7" strokeLinecap="round"
          strokeDasharray="26 300" className="animate-[spin_6s_linear_infinite]" style={{ transformOrigin: "60px 60px" }} pointerEvents="none"
        />
      )}

      {/* countdown ring (life remaining) */}
      {ring != null && (
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={p.rim} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} transform="rotate(-90 60 60)" opacity="0.95"
        />
      )}
    </svg>
  );
}
