/**
 * An invisible placement marker for the page-wide travelling coin. It reserves
 * space where the coin should rest in a section; CoinJourney reads these and
 * glides the single coin between them as you scroll.
 */
export default function Dock({
  variant = "gold",
  size = 76,
  step,
  className = "",
}: {
  variant?: "gold" | "silver" | "ghost" | "avatar";
  size?: number;
  step?: number;
  className?: string;
}) {
  return (
    <span
      data-coin-dock
      data-variant={variant}
      data-size={size}
      {...(step != null ? { "data-step": step } : {})}
      aria-hidden
      className={`inline-block align-middle ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
