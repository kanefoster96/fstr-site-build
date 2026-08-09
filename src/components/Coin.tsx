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
  gold: {
    face: "var(--coin-gold)",
    rim: "var(--coin-gold-rim)",
    edge: "var(--coin-gold-edge)",
    ink: "var(--coin-gold-ink)",
  },
  silver: {
    face: "var(--coin-silver)",
    rim: "var(--coin-silver-rim)",
    edge: "var(--coin-silver-edge)",
    ink: "var(--coin-silver-ink)",
  },
} as const;

const ROUND = "var(--font-round)";

/**
 * A simple cartoon coin: a gold rim with a darker edge line around a bright
 * flat face, with chunky rounded lettering ("FSTR" / "1 CUT"). No shading.
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
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = ring != null ? circumference * Math.max(0, Math.min(1, ring)) : 0;

  if (ghost) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" className={className} style={style} role="img" aria-label="Empty token slot">
        <circle cx="60" cy="60" r="53" fill="none" stroke="var(--steel)" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="5 6" />
        <text x="60" y="52" textAnchor="middle" dominantBaseline="central" fontFamily={ROUND} fontSize="26" fontWeight="800" fill="var(--steel)" fillOpacity="0.5">FSTR</text>
        <text x="60" y="74" textAnchor="middle" dominantBaseline="central" fontFamily={ROUND} fontSize="12" fontWeight="700" fill="var(--steel)" fillOpacity="0.45">+1 CUT</text>
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
      {/* outer edge line */}
      <circle cx="60" cy="60" r="58" fill={p.edge} />
      {/* gold rim band */}
      <circle cx="60" cy="60" r="56" fill={p.rim} />
      {/* bright face with a darker inner line */}
      <circle cx="60" cy="60" r="47" fill={p.face} stroke={p.edge} strokeWidth="2.5" />

      {flipped && code ? (
        <>
          <text x="60" y="51" textAnchor="middle" dominantBaseline="central" fontFamily={ROUND} fontSize="12" fontWeight="700" fill={p.ink} letterSpacing="1">GIFT</text>
          <text x="60" y="74" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize="13" fontWeight="600" fill={p.ink} letterSpacing="0.5">{code}</text>
        </>
      ) : (
        <>
          <text x="60" y="52" textAnchor="middle" dominantBaseline="central" fontFamily={ROUND} fontSize="29" fontWeight="800" fill={p.ink}>FSTR</text>
          <text x="60" y="75" textAnchor="middle" dominantBaseline="central" fontFamily={ROUND} fontSize="13.5" fontWeight="700" fill={p.ink} letterSpacing="1">+1 CUT</text>
        </>
      )}

      {/* optional thin countdown ring (life remaining) */}
      {ring != null && (
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={p.edge} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`} transform="rotate(-90 60 60)"
        />
      )}
    </svg>
  );
}
