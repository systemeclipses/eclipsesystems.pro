import type { MetadataRoute } from "next";
import { absoluteUrl, loadCompetitors, loadFeatures, loadGlossary, loadIndustries, loadLocations, loadPlans, loadUtbmsCodes } from "@/lib/seo/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [plans, features, competitors, locations, industries, utbmsCodes, glossary] = await Promise.all([
    loadPlans(),
    loadFeatures(),
    loadCompetitors(),
    loadLocations().catch(() => []),
    loadIndustries().catch(() => []),
    loadUtbmsCodes().catch(() => []),
    loadGlossary().catch(() => [])
  ]);

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/demos"), lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: absoluteUrl("/features"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/industries"), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: absoluteUrl("/locations"), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: absoluteUrl("/utbms"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/glossary"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/guides"), lastModified: now, changeFrequency: "weekly", priority: 0.7 }
  ];

  return [
    ...staticPages,
    ...plans.map((plan) => ({ url: absoluteUrl(`/plans/${plan.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...features.map((feature) => ({ url: absoluteUrl(`/features/${feature.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...competitors.flatMap((competitor) => [
      { url: absoluteUrl(`/vs/${competitor.slug}`), lastModified: competitor.last_verified, changeFrequency: "monthly" as const, priority: 0.8 },
      { url: absoluteUrl(`/alternatives/${competitor.slug}`), lastModified: competitor.last_verified, changeFrequency: "monthly" as const, priority: 0.8 }
    ]),
    ...locations.map((location) => ({ url: absoluteUrl(`/locations/${location.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.78 })),
    ...industries.map((industry) => ({ url: absoluteUrl(`/industries/${industry.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.78 })),
    ...utbmsCodes.map((entry) => ({ url: absoluteUrl(`/utbms/${entry.code.toLowerCase()}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.6 })),
    ...glossary.map((term) => ({ url: absoluteUrl(`/glossary/${term.slug}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.55 }))
  ];
}
