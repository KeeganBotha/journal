import type { MetadataRoute } from "next";

// Installable PWA (SPEC): iOS delivers web push only to an installed app.
// Served at /manifest.webmanifest and linked automatically by Next.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Journal",
    short_name: "Journal",
    description: "One entry a day, in your own words.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#1a1a1a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
