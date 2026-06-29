import type { Metadata } from "next";
import Link from "next/link";
import { loadLocations } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Locations",
  description: "Local time tracking software pages for Alabama businesses and regional small-business teams."
};

export default async function LocationsPage() {
  const locations = await loadLocations();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Local context, connected systems" title="Eclipse Systems by Location." description="Explore how local teams can connect time, operations, billing, customer workflows, and reporting around the work they already do." image="/media/generated/heroes/local-business.jpg" imageAlt="A local service business team coordinating daily operations" points={["Local workflow context", "Industry-aware guidance", "One connected platform"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Locations" title="Built here. Ready wherever your team works." />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {locations.map((location) => (
          <Link key={location.slug} href={`/locations/${location.slug}`} className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-xl shadow-[#172219]/5 transition hover:-translate-y-1 hover:shadow-2xl">
            <h2 className="font-title text-4xl leading-none">{location.city}, {location.state}</h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#314839]/70">{location.description}</p>
          </Link>
        ))}
      </div>
      </section>
    </main>
  );
}
