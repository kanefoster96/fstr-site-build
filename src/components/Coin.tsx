import type { CSSProperties } from "react";

type CoinProps = {
  size?: number;
  /** 0..1 fraction of life remaining, draws the mono countdown ring. */
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

/**
 * The FSTR token as a physical brass coin.
 * Circular, subtly embossed "FSTR" monogram, soft radial sheen.
 * This is the visual language for the whole system (§2).
 */
export default function Coin({
  size = 120,
  ring,
  flipped = false,
  code,
  ghost = false,
  className = "",
  style,
  live = false,
}: CoinProps) {
  const id = code ?? "coin";
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
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--steel)"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />
        <text
          x="60"
          y="66"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="22"
          fill="var(--steel)"
          fillOpacity="0.4"
          letterSpacing="1"
        >
          FSTR
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`${className} ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
      style={{ overflow: "visible", ...style }}
      role="img"
      aria-label={flipped && code ? `Gift token, code ${code}` : "FSTR brass token"}
    >
      <defs>
        <radialGradient id={`${id}-face`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#e7d29a" />
          <stop offset="42%" stopColor="var(--brass)" />
          <stop offset="100%" stopColor="var(--brass-dark)" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9c187" />
          <stop offset="50%" stopColor="var(--brass-dark)" />
          <stop offset="100%" stopColor="#e7d29a" />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="34%" cy="26%" r="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* rim */}
      <circle cx="60" cy="60" r="56" fill={`url(#${id}-rim)`} />
      {/* face */}
      <circle cx="60" cy="60" r="50" fill={`url(#${id}-face)`} />
      {/* inner engraved ring */}
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="var(--brass-dark)"
        strokeOpacity="0.45"
        strokeWidth="1"
      />

      {flipped && code ? (
        <g style={{ transform: "scaleX(-1)", transformOrigin: "60px 60px" }}>
          <text
            x="60"
            y="52"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="var(--brass-dark)"
            letterSpacing="1.5"
          >
            GIFT
          </text>
          <text
            x="60"
            y="72"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="15"
            fontWeight="600"
            fill="#3a3116"
            letterSpacing="1"
          >
            {code}
          </text>
        </g>
      ) : (
        <>
          {/* embossed monogram */}
          <text
            x="60"
            y="60"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="30"
            fontWeight="700"
            fill="#3a3116"
            fillOpacity="0.85"
            letterSpacing="1"
          >
            FSTR
          </text>
          <text
            x="60"
            y="60"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="30"
            fontWeight="700"
            fill="#f4e8c4"
            fillOpacity="0.5"
            letterSpacing="1"
            transform="translate(-0.6 -0.6)"
          >
            FSTR
          </text>
          <text
            x="60"
            y="82"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="7"
            fill="var(--brass-dark)"
            letterSpacing="2"
          >
            ONE CUT
          </text>
        </>
      )}

      {/* soft radial sheen */}
      <circle cx="60" cy="60" r="50" fill={`url(#${id}-sheen)`} pointerEvents="none" />
      {live && (
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.28"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="30 300"
          className="animate-[spin_6s_linear_infinite]"
          style={{ transformOrigin: "60px 60px" }}
          pointerEvents="none"
        />
      )}

      {/* mono countdown ring (life remaining) */}
      {ring != null && (
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--brass-dark)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 60 60)"
          opacity="0.9"
        />
      )}
    </svg>
  );
}
