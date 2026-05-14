import type { Metadata } from "next";
import Link from "next/link";
import { loadIndustries } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Industries",
  description: "Time tracking, billing, and workforce management workflows by industry."
};

export default async function IndustriesPage() {
  const industries = await loadIndustries();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Timekeeping by Industry</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {industries.map((industry) => (
          <Link key={industry.slug} href={`/industries/${industry.slug}`} className="rounded-lg border border-border p-5 hover:bg-muted/40">
            <h2 className="text-xl font-semibold">{industry.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{industry.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
