import type { Metadata } from "next";
import Link from "next/link";
import { loadLocations } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Birmingham & Central Alabama | Locations",
  description: "Eclipse Systems is based in Birmingham and serves businesses throughout Central Alabama with connected timekeeping, operations, billing, and customer workflows."
};

export default async function LocationsPage() {
  const locations = await loadLocations();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Birmingham, Alabama" title="Serving Birmingham and Central Alabama." description="Eclipse Systems helps businesses across the Birmingham metro and Central Alabama connect time, operations, billing, customer workflows, and reporting around the work they already do." image="/media/generated/heroes/local-business.jpg" imageAlt="A local service business team coordinating daily operations in Birmingham, Alabama" points={["Birmingham-based", "Central Alabama service area", "One connected platform"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Our location" title="Built in Birmingham. Serving Central Alabama." />
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
