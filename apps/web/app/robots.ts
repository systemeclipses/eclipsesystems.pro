import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/api/og/"], disallow: ["/app/", "/api/", "/admin/"] }], sitemap: "https://www.eclipsesystems.pro/sitemap.xml", host: "https://www.eclipsesystems.pro" };
}
