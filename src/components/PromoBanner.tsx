import Coin from "./Coin";

/**
 * Temporary promo strip under the header — a slim golden marquee. Two identical
 * copies slide one width (translateX -50%) for a seamless loop; pauses on hover,
 * stills under reduced-motion. Remove by dropping <PromoBanner/> from the layout.
 */
const MESSAGE = "Book with a friend — get a free token";
// Enough messages per copy that one copy overflows any screen — required for the
// two-copy translateX(-50%) loop to be seamless.
const PER_COPY = 8;

export default function PromoBanner() {
  return (
    <div className="group relative overflow-hidden border-b border-ink/10 bg-brass text-ink">
      <span className="sr-only">{MESSAGE}</span>
      <div
        aria-hidden
        className="flex w-max animate-marquee whitespace-nowrap py-2 will-change-transform [animation-duration:44s] group-hover:[animation-play-state:paused]"
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {Array.from({ length: PER_COPY }).map((_, i) => (
              <span key={i} className="mr-12 inline-flex items-center gap-2 text-sm font-medium">
                <span className="grid place-items-center rounded-full ring-1 ring-ink/15">
                  <Coin size={18} />
                </span>
                {MESSAGE}
                <span className="text-ink/40">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
