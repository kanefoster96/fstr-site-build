import Link from "next/link";
import HeaderTokens from "./HeaderTokens";
import MobileMenu from "./MobileMenu";
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
          <HeaderTokens />
          <JoinButton />
        </nav>

        {/* Mobile cluster: empty coin · Join · hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <HeaderTokens />
          <JoinButton />
          <MobileMenu links={links} />
        </div>
      </Container>
    </header>
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
