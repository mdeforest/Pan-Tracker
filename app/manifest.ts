import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PanTracker",
    short_name: "PanTracker",
    description: "Track your beauty project pan — finish products before buying new ones.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ef",
    theme_color: "#1a1a1a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
