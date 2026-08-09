import Link from "next/link";
import { Container, Hairline } from "./ui";

export default function SiteFooter() {
  return (
    <footer className="mt-24 pb-10">
      <Container>
        <Hairline className="mb-8" />
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <p className="font-display text-xl font-bold">FSTR</p>
            <p className="mt-2 text-sm text-steel">
              Private home barbering, Wallsend area. The exact address is sent 24 hours
              before your appointment.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <Link href="/how-it-works" className="text-steel hover:text-ink">How it works</Link>
            <Link href="/join" className="text-steel hover:text-ink">Join</Link>
            <Link href="/about" className="text-steel hover:text-ink">The Chair</Link>
            <Link href="/book" className="text-steel hover:text-ink">Book a one-off</Link>
            <Link href="/legal/terms" className="text-steel hover:text-ink">Terms</Link>
            <Link href="/legal/privacy" className="text-steel hover:text-ink">Privacy</Link>
            <Link href="/legal/cancellation" className="text-steel hover:text-ink">Cancellation</Link>
            <Link href="/dev" className="text-steel hover:text-ink">Dev panel</Link>
          </div>
        </div>
        <p className="mt-10 text-xs text-steel">
          © {2026} FSTR · North Tyneside, UK · One barber. No rushing. Done properly.
        </p>
      </Container>
    </footer>
  );
}
