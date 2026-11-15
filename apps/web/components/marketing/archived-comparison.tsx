import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCompetitor } from "@/lib/seo/content";
import { archivedProductRobots } from "@/lib/seo/positioning";
import { PublicPageHero } from "./public-page";
export async function archivedComparisonMetadata(slug: string, section: "vs" | "alternatives"): Promise<Metadata> {
  const competitor = await loadCompetitor(slug);
  return competitor ? { title: `Archived comparison: ${competitor.name}`, description: "This historical product comparison has been retired. Explore Eclipse Systems custom business software or the current ClockEclipse employee timekeeping product.", alternates: { canonical: `/${section}/${competitor.slug}` }, robots: archivedProductRobots } : {};
}
export async function ArchivedComparison({ slug }: { slug: string }) {
  const competitor = await loadCompetitor(slug); if (!competitor) notFound();
  return <main className="min-h-screen bg-cream text-ink"><PublicPageHero compact eyebrow="Historical comparison" title="This product comparison has been retired." description={`The earlier ${competitor.name} comparison described a retired Eclipse Timekeeping package. Its old prices and feature rankings are no longer presented as current guidance.`} image="/media/generated/heroes/engagements.jpg" imageAlt="Software workflow modules arranged for planning" points={["Current product destination", "Clear business scope"]} /><section className="mx-auto max-w-5xl px-5 py-16"><h2 className="font-title text-4xl leading-tight">Choose the site for the work you need.</h2><p className="mt-6 text-lg leading-8 text-[#314839]">Eclipse Systems focuses on custom business software: client portals, operations systems, CRM, dashboards, automations and integrations. ClockEclipse is our separate employee timekeeping, scheduling, PTO and payroll-review product.</p><div className="mt-8 flex flex-wrap gap-4"><Link className="inline-flex min-h-12 items-center rounded-full bg-[#314839] px-6 py-3 font-bold text-[#f9e8d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314839]" href="/vs">Explore custom software versus buying a tool →</Link><a className="inline-flex min-h-12 items-center rounded-full border border-[#314839] bg-white px-6 py-3 font-bold text-[#172219] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314839]" href="https://clockeclipse.com/">Visit ClockEclipse →</a></div><p className="mt-6 text-sm leading-6 text-[#314839]">This archive remains accessible for existing links and is excluded from search indexing. It does not make current claims about {competitor.name}.</p></section></main>;
}
