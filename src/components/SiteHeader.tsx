import Link from "next/link";
import { Container, Button } from "./ui";

/**
 * Sticky, mobile-first header. Uses a native <details> disclosure for the
 * mobile menu so it works with zero client JS and transfers 1:1 to the app.
 */
export default function SiteHeader() {
  const links = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "The Chair" },
    { href: "/book", label: "Book a one-off" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-steel/25 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
          FSTR<span className="value"> ·</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-steel hover:text-ink">
              {l.label}
            </Link>
          ))}
          <Link href="/me" className="text-sm text-steel hover:text-ink">
            My wallet
          </Link>
          <Button href="/join" className="!px-5 !py-2 text-sm">
            Join
          </Button>
        </nav>

        <details className="relative md:hidden">
          <summary className="list-none cursor-pointer rounded-full border border-steel/50 px-4 py-2 text-sm">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-steel/30 bg-paper p-3 shadow-lg">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-mist">
                {l.label}
              </Link>
            ))}
            <Link href="/me" className="block rounded-lg px-3 py-2 text-sm hover:bg-mist">
              My wallet
            </Link>
            <Button href="/join" className="mt-2 w-full text-sm">
              Join
            </Button>
          </div>
        </details>
      </Container>
    </header>
  );
}
