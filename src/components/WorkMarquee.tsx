/**
 * A seamless sliding row of work photos. The track holds two identical copies
 * and slides exactly one copy-width (translateX -50%), so the loop never jumps.
 * For that to be seamless, ONE copy must be wider than the viewport — so we
 * repeat the images enough to comfortably exceed any screen before duplicating.
 * Pure CSS: pauses on hover, stills under reduced-motion.
 */
export default function WorkMarquee({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  // ~16 tiles per copy (>3000px) so a single copy always overflows the screen.
  const copy: string[] = [];
  while (copy.length < 16) copy.push(...images);
  const track = [...copy, ...copy];

  return (
    <div className="group relative overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]">
      <span className="sr-only">Recent FSTR cuts</span>
      <div
        aria-hidden
        className="flex w-max animate-marquee will-change-transform [animation-duration:120s] group-hover:[animation-play-state:paused]"
      >
        {track.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            className="mr-4 h-48 w-48 shrink-0 rounded-2xl object-cover sm:h-60 sm:w-60"
          />
        ))}
      </div>
    </div>
  );
}
