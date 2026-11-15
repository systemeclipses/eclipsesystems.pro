import type { Metadata } from "next";
import Link from "next/link";
import { loadLocations } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  alternates: { canonical: "/locations" },
  title: "Custom Software for Birmingham & Central Alabama",
  description: "Custom business software for Birmingham and Central Alabama: portals, operations, CRM, workflow automation, dashboards and integrations."
};

export default async function LocationsPage() {
  const locations = await loadLocations();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Birmingham, Alabama" title="Serving Birmingham and Central Alabama." description="Eclipse Systems works with Birmingham-area businesses to scope custom software around customer requests, internal operations, documents, reporting and integrations." image="/media/generated/heroes/local-business.jpg" imageAlt="A local service business team coordinating daily operations in Birmingham, Alabama" points={["Birmingham-area workflows", "Central Alabama service area", "Scoped custom software"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Our location" title="Custom business solutions for Central Alabama." />
      <div className="mt-12 grid gap-5">
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
