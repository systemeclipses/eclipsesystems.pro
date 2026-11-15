import type { MetadataRoute } from "next";
import { absoluteUrl, loadFeatures, loadGlossary, loadIndustries, loadLocations, loadPlans, loadUtbmsCodes } from "@/lib/seo/content";
import { additionalBlogPosts } from "@/lib/additional-blog-posts";
import { isProductLegacyPost } from "@/lib/seo/positioning";
const revised = "2026-11-15";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plans, features, locations, industries, codes, glossary] = await Promise.all([loadPlans(), loadFeatures(), loadLocations(), loadIndustries(), loadUtbmsCodes(), loadGlossary()]);
  const changed = new Set(["/", "/industries", "/locations", "/utbms", "/glossary", "/blog", "/vs", "/help-center", "/webinars", "/developer-documentation", "/invoice-template", "/pricing", "/features"]);
  const pages = ["/", "/pricing", "/demos", "/features", "/industries", "/locations", "/contact", "/utbms", "/glossary", "/blog", "/vs", "/help-center", "/webinars", "/developer-documentation", "/invoice-template", "/pricing", "/features"];
  const articles = [...additionalBlogPosts, { slug: "approved-time-invoices", publishedAt: "2026-06-17" }].filter(post => !isProductLegacyPost(post.slug));
  return [
    ...pages.map(path => ({ url: absoluteUrl(path), ...(changed.has(path) ? { lastModified: revised } : {}), changeFrequency: "monthly" as const, priority: path === "/" ? 1 : 0.75 })),
    ...plans.map(plan => ({ url: absoluteUrl(`/plans/${plan.slug}`), ...(plan.slug === "operations-hub" ? { lastModified: revised } : {}), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...features.map(feature => ({ url: absoluteUrl(`/features/${feature.slug}`), lastModified: revised, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...locations.map(location => ({ url: absoluteUrl(`/locations/${location.slug}`), lastModified: revised, changeFrequency: "monthly" as const, priority: 0.85 })),
    ...industries.map(industry => ({ url: absoluteUrl(`/industries/${industry.slug}`), lastModified: revised, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...articles.map(post => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.publishedAt, changeFrequency: "monthly" as const, priority: 0.65 })),
    ...codes.map(entry => ({ url: absoluteUrl(`/utbms/${entry.code.toLowerCase()}`), changeFrequency: "yearly" as const, priority: 0.4 })),
    ...glossary.filter(term => term.slug !== "shift-swap").map(term => ({ url: absoluteUrl(`/glossary/${term.slug}`), changeFrequency: "yearly" as const, priority: 0.4 }))
  ];
}
