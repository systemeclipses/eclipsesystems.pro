import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eclipse Timekeeping by Eclipse Systems",
    short_name: "Eclipse Timekeeping",
    description: "Time tracking, invoicing, shift management, and legal billing software.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#12706b",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
