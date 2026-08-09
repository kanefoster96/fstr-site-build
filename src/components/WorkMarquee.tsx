/**
 * A seamless sliding row of work photos. The track holds two identical copies
 * and slides one copy-width (translateX -50%), so the loop never jumps. Each
 * tile carries its own right margin (not a flex gap) so the halves line up
 * exactly. Pure CSS — pauses on hover, stills under reduced-motion.
 */
export default function WorkMarquee({ images }: { images: string[] }) {
  const track = [...images, ...images];
  return (
    <div className="group relative overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {track.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt="A recent FSTR cut"
            aria-hidden={i >= images.length}
            className="mr-4 h-48 w-48 shrink-0 rounded-2xl object-cover sm:h-60 sm:w-60"
          />
        ))}
      </div>
    </div>
  );
}
