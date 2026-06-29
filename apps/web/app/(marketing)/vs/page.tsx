import type { Metadata } from "next";
import Link from "next/link";
import { loadCompetitors } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Comparisons",
  description: "Compare Eclipse Timekeeping by Eclipse Systems with time tracking, billing, legal, and shift management competitors."
};

export default async function VsIndexPage() {
  const competitors = await loadCompetitors();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Software comparisons" title="Compare the Workflow, Not Just the Feature List." description="See where Eclipse fits against common timekeeping, billing, legal, and workforce tools, with practical context for choosing the right system." image="/media/generated/heroes/engagements.jpg" imageAlt="Modular software foundations arranged for comparison" points={["Workflow fit", "Verified sources", "Clear tradeoffs"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Comparisons" title="Find the difference that matters to your team." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {competitors.map((competitor) => <Link key={competitor.slug} href={`/vs/${competitor.slug}`} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 font-title text-3xl leading-none transition hover:-translate-y-1 hover:shadow-xl">Eclipse vs {competitor.name}</Link>)}
      </div>
      </section>
    </main>
  );
}
