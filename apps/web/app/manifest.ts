import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eclipse Systems — Custom Business Software",
    short_name: "Eclipse Systems",
    description: "Custom business software, client portals, operations systems, CRM and workflow automation.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#314839",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
