import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ComparisonTable } from "@/components/seo/comparison-table";
import { FAQ } from "@/components/seo/faq";
import { buildComparisonRows } from "@/lib/seo/comparison";
import { loadCompetitor, loadCompetitors } from "@/lib/seo/content";

const alternatives = ["Eclipse Timekeeping", "Toggl Track", "Clockify", "Harvest", "Clio", "Bill4Time", "Deputy", "Homebase"];

export async function generateStaticParams() {
  return (await loadCompetitors()).map((competitor) => ({ competitor: competitor.slug }));
}

export async function generateMetadata({ params }: { params: { competitor: string } }): Promise<Metadata> {
  const competitor = await loadCompetitor(params.competitor);
  if (!competitor) return {};
  return { title: `Best ${competitor.name} Alternatives in 2026`, description: `Compare ${competitor.name} alternatives for time tracking, invoicing, legal billing, and shift management.`, alternates: { canonical: `/alternatives/${competitor.slug}` } };
}

export default async function AlternativesPage({ params }: { params: { competitor: string } }) {
  const competitor = await loadCompetitor(params.competitor);
  if (!competitor) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Alternatives", href: "/alternatives" }, { name: competitor.name, href: `/alternatives/${competitor.slug}` }]} />
      <h1 className="text-3xl font-semibold">Best {competitor.name} Alternatives in 2026</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">Teams usually search for {competitor.name} alternatives when their workflow has grown beyond a single time tracker, billing tool, practice-management platform, or scheduling app.</p>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Which {competitor.name} alternatives should you compare?</h2>
        <ol className="mt-4 grid gap-3">
          {alternatives.map((name, index) => <li key={name} className="rounded-md border border-border p-4"><strong>{index + 1}. {name}</strong><p className="mt-1 text-sm text-muted-foreground">{name === "Eclipse Timekeeping" ? "Best when you want time tracking, invoicing, shifts, reporting, and legal billing under one product family." : "Worth comparing when its category focus matches your primary workflow."}</p></li>)}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Why do people leave {competitor.name}?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">Common reasons include needing a more complete billing workflow, adding legal-specific controls, consolidating shift operations, or wanting a smaller-business workflow that does not require multiple disconnected tools.</p>
      </section>
      <ComparisonTable caption={`Alternatives to ${competitor.name}`} columns={[{ key: "eclipse", label: "Eclipse Timekeeping" }, { key: "competitor", label: competitor.name }]} rows={buildComparisonRows(competitor)} />
      <FAQ items={[
        { question: `What is the best ${competitor.name} alternative?`, answer: "The best alternative depends on the workflow. Eclipse Timekeeping is a strong alternative for teams that want time tracking plus invoicing, shifts, reporting, or legal billing." },
        { question: `Is there a legal billing alternative to ${competitor.name}?`, answer: "Eclipse Timekeeping Legal includes UTBMS codes, LEDES 1998B export, matters, conflict checks, trust accounting, and custom rates." },
        { question: "Should a team switch immediately?", answer: "No. Teams should compare current workflows, integrations, migration needs, and billing requirements before switching." }
      ]} />
    </main>
  );
}
