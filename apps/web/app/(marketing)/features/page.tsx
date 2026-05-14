import type { Metadata } from "next";
import Link from "next/link";
import { loadFeatures } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore Eclipse Timekeeping features for time tracking, invoicing, shifts, chat, legal billing, and reporting."
};

export default async function FeaturesPage() {
  const features = await loadFeatures();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Eclipse Timekeeping Features</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Link key={feature.slug} href={`/features/${feature.slug}`} className="rounded-lg border border-border p-5 hover:bg-muted/40">
            <h2 className="text-xl font-semibold">{feature.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
