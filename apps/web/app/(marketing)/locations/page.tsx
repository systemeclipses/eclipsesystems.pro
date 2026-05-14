import type { Metadata } from "next";
import Link from "next/link";
import { loadLocations } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Locations",
  description: "Local time tracking software pages for Alabama businesses and regional small-business teams."
};

export default async function LocationsPage() {
  const locations = await loadLocations();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Local Time Tracking Software Guides</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {locations.map((location) => (
          <Link key={location.slug} href={`/locations/${location.slug}`} className="rounded-lg border border-border p-5 hover:bg-muted/40">
            <h2 className="text-xl font-semibold">{location.city}, {location.state}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{location.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
