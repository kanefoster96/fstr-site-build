import Link from "next/link";
import Coin from "./Coin";
import { Container } from "./ui";

/**
 * Sticky, mobile-first header. Right side carries an empty token coin (your
 * wallet), a coin-coloured Join CTA, and a hamburger menu (native <details> so
 * it needs no client JS and transfers 1:1 to the app).
 */
export default function SiteHeader() {
  const links = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "The Chair" },
    { href: "/book", label: "Book a one-off" },
    { href: "/me", label: "My wallet" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-steel/25 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
          FSTR<span className="value"> ·</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-steel hover:text-ink">
              {l.label}
            </Link>
          ))}
          <TokenCoin />
          <JoinButton />
        </nav>

        {/* Mobile cluster: empty coin · Join · hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <TokenCoin />
          <JoinButton />
          <details className="relative">
            <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-steel/40 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-[4px]" aria-hidden>
                <span className="block h-0.5 w-5 rounded-full bg-ink" />
                <span className="block h-0.5 w-5 rounded-full bg-ink" />
                <span className="block h-0.5 w-5 rounded-full bg-ink" />
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-steel/30 bg-paper p-3 shadow-lg">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-mist">
                  {l.label}
                </Link>
              ))}
              <JoinButton className="mt-2 w-full" />
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}

/** Empty token coin — your wallet at a glance (no tokens yet). */
function TokenCoin() {
  return (
    <Link href="/me" aria-label="Your tokens" className="shrink-0" title="Your tokens">
      <Coin size={34} ghost />
    </Link>
  );
}

/** "Add tokens" CTA — a clean white pill that pairs with the empty coin. */
function JoinButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/join"
      className={`inline-flex items-center justify-center gap-1 rounded-full border border-steel/40 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-ink ${className}`}
    >
      <span aria-hidden className="value">+</span> Add tokens
    </Link>
  );
}
