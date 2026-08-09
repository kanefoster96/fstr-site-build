import type { Config } from "tailwindcss";

/**
 * FSTR Cuts design tokens.
 * Brass (--brass) is the token metal: it appears ONLY where value lives.
 * Keep that discipline in components — it is the brand.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        steel: "var(--steel)",
        brass: "var(--brass)",
        mist: "var(--mist)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderColor: {
        DEFAULT: "var(--steel)",
      },
      maxWidth: {
        content: "72rem",
      },
      keyframes: {
        "coin-drop": {
          "0%": { transform: "translateY(-120%) rotate(-25deg)", opacity: "0" },
          "60%": { transform: "translateY(6%) rotate(3deg)", opacity: "1" },
          "100%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
        },
        "coin-flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "fade-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "coin-drop": "coin-drop 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "coin-flip": "coin-flip 0.7s ease-in-out both",
        sheen: "sheen 2.4s ease-in-out infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
