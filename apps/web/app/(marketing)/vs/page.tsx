import type { Metadata } from "next";
import Link from "next/link";
import { loadCompetitors } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Comparisons",
  description: "Compare Eclipse Timekeeping by Eclipse Systems with time tracking, billing, legal, and shift management competitors."
};

export default async function VsIndexPage() {
  const competitors = await loadCompetitors();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Eclipse Timekeeping Comparisons</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {competitors.map((competitor) => <Link key={competitor.slug} href={`/vs/${competitor.slug}`} className="rounded-lg border border-border p-5 hover:bg-muted/40">Eclipse Timekeeping vs {competitor.name}</Link>)}
      </div>
    </main>
  );
}
