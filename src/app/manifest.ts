import type { MetadataRoute } from "next";

/** PWA manifest — every screen is designed to transfer 1:1 to a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FSTR Cuts",
    short_name: "FSTR",
    description: "One cut a month, never wasted. Membership home barbering.",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFCFA",
    theme_color: "#FCFCFA",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
