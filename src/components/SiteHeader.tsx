import Link from "next/link";
import HeaderTokens from "./HeaderTokens";
import MobileMenu from "./MobileMenu";
import { Container } from "./ui";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/data/db";
import { signOutAction } from "@/app/signin/actions";

/**
 * Sticky, mobile-first header. Signed out: How it works · The Chair · one-off,
 * with Sign in + Add tokens. Signed in: your wallet coin (live token count),
 * your profile, and Sign out. Uses the mock session (getSession).
 */
export default async function SiteHeader() {
  const session = await getSession();
  const member = session.member;
  const signedIn = !!member;

  let held = 0;
  if (member) {
    const db = await getDb();
    held = db.tokens.filter(
      (t) => t.member_id === member.id && (t.state === "ISSUED" || t.state === "GIFTED"),
    ).length;
  }

  const publicLinks = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "The Chair" },
    { href: "/book", label: "Book a one-off" },
  ];
  const menuLinks = signedIn
    ? [{ href: "/me", label: "My wallet" }, { href: "/me/profile", label: "Profile" }, ...publicLinks]
    : [...publicLinks, { href: "/signin", label: "Sign in" }];

  return (
    <header className="sticky top-0 z-40 border-b border-steel/25 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink">
          FSTR<span className="value"> ·</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-steel hover:text-ink">
              {l.label}
            </Link>
          ))}
          <HeaderTokens initial={held} />
          {signedIn ? (
            <>
              <ProfileChip name={member!.name} avatar={member!.avatar_url} />
              <SignOut />
            </>
          ) : (
            <>
              <Link href="/signin" className="text-sm font-medium text-ink hover:text-brass">
                Sign in
              </Link>
              <JoinButton />
            </>
          )}
        </nav>

        {/* Mobile cluster: token holder (with + to add) · hamburger */}
        <div className="flex items-center gap-2.5 md:hidden">
          <HeaderTokens initial={held} withAdd />
          <MobileMenu links={menuLinks} signedIn={signedIn} />
        </div>
      </Container>
    </header>
  );
}

/** Small avatar + first name → profile. */
function ProfileChip({ name, avatar }: { name: string; avatar: string | null }) {
  const first = name.split(" ")[0] || "You";
  return (
    <Link href="/me/profile" className="flex items-center gap-2 text-sm font-medium text-ink hover:text-brass">
      <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-mist ring-1 ring-brass/30">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="num text-xs text-steel">{first.slice(0, 1).toUpperCase()}</span>
        )}
      </span>
      {first}
    </Link>
  );
}

/** Sign out — a tiny server-action form so it works without extra client JS. */
function SignOut() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="text-sm text-steel hover:text-ink">
        Sign out
      </button>
    </form>
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
