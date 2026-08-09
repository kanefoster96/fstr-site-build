import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "FSTR — a proper cut, done properly",
  description:
    "Private home barbering in North Tyneside. One barber, one chair, enough time to get your cut right — and your cut saved for next time. Memberships from £20 a cut.",
  applicationName: "FSTR",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "FSTR", statusBarStyle: "default" },
  openGraph: {
    title: "FSTR — a proper cut, done properly",
    description: "A barber who listens, takes his time and remembers exactly how you like it.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FCFCFA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
