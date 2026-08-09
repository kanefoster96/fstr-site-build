import type { CSSProperties } from "react";

type Tone = "gold" | "silver";

type CoinProps = {
  size?: number;
  /** gold = live/usable, silver = gift-only (expired) or an outstanding gift. */
  tone?: Tone;
  /** 0..1 fraction of life remaining, draws a thin countdown ring. */
  ring?: number;
  /** Show the flipped face (gift reveal) with a code. */
  flipped?: boolean;
  code?: string;
  /** Dim outline only — the empty-wallet state. */
  ghost?: boolean;
  className?: string;
  style?: CSSProperties;
};

const PALETTE = {
  gold: { fill: "var(--coin-gold)", rim: "var(--coin-gold-rim)", ink: "var(--coin-gold-ink)" },
  silver: { fill: "var(--coin-silver)", rim: "var(--coin-silver-rim)", ink: "var(--coin-silver-ink)" },
} as const;

/**
 * A simple flat coin: a solid warm-yellow circle with a thin darker rim and
 * plain text inside ("FSTR" / "1 x cut"). No shading, no idle animation.
 * Silver when it's gift-only.
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
}: CoinProps) {
  const p = PALETTE[flipped ? "silver" : tone];
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const dash = ring != null ? circumference * Math.max(0, Math.min(1, ring)) : 0;

  if (ghost) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} style={style} role="img" aria-label="Empty token slot">
        <circle cx="60" cy="60" r="53" fill="none" stroke="var(--steel)" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 5" />
        <text x="60" y="57" textAnchor="middle" fontFamily="var(--font-display)" fontSize="21" fontWeight="700" fill="var(--steel)" fillOpacity="0.5">FSTR</text>
        <text x="60" y="74" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--steel)" fillOpacity="0.45" letterSpacing="1.5">1 x cut</text>
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
      {/* solid flat circle with a thin darker rim */}
      <circle cx="60" cy="60" r="54" fill={p.fill} stroke={p.rim} strokeWidth="3" />

      {flipped && code ? (
        <>
          <text x="60" y="53" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={p.ink} letterSpacing="2">GIFT</text>
          <text x="60" y="73" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight="600" fill={p.ink} letterSpacing="1">{code}</text>
        </>
      ) : (
        <>
          <text x="60" y="57" textAnchor="middle" fontFamily="var(--font-display)" fontSize="30" fontWeight="700" fill={p.ink} letterSpacing="0.5">FSTR</text>
          <text x="60" y="75" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="500" fill={p.ink} letterSpacing="1">1 x cut</text>
        </>
      )}

      {/* optional thin countdown ring (life remaining) */}
      {ring != null && (
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={p.rim} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} transform="rotate(-90 60 60)"
        />
      )}
    </svg>
  );
}
