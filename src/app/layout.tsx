import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "FSTR Cuts — one cut a month, never wasted",
  description:
    "Membership home barbering in North Tyneside. £25/month, one cut a month, tokens roll over and can be gifted. You never lose a cut you've paid for.",
  applicationName: "FSTR Cuts",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "FSTR Cuts", statusBarStyle: "default" },
  openGraph: {
    title: "FSTR Cuts — one cut a month, never wasted",
    description: "The home-worker's barber. Get a proper cut on a quiet weekday lunchtime.",
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
