import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Us Dashboard",
    short_name: "Us",
    description: "Shared household dashboard for Alec & Pau",
    start_url: "/",
    display: "standalone",
    background_color: "#1E2127",
    theme_color: "#1E2127",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
