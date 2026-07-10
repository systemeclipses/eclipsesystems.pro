import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ComparisonTable } from "@/components/seo/comparison-table";
import { FAQ } from "@/components/seo/faq";
import { buildComparisonRows } from "@/lib/seo/comparison";
import { loadCompetitor, loadCompetitors } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

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
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Software alternatives" title={"Alternatives to " + competitor.name + "."} description={"Compare systems for teams whose workflow has grown beyond a single tracker, billing tool, practice platform, or scheduling app."} image="/media/generated/heroes/engagements.jpg" imageAlt="Modular software foundations arranged for comparison" points={["Workflow fit", "Connected tools", "Clear migration questions"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Alternatives", href: "/alternatives" }, { name: competitor.name, href: `/alternatives/${competitor.slug}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="What to compare" title={"The best " + competitor.name + " alternative depends on the work."} /></div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Which {competitor.name} alternatives should you compare?</h2>
        <ol className="mt-4 grid gap-3">
          {alternatives.map((name, index) => <li key={name} className="rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-5"><strong>{index + 1}. {name}</strong><p className="mt-2 text-sm font-semibold leading-6 text-[#314839]/70">{name === "Eclipse Timekeeping" ? "Best when you want time tracking, invoicing, shifts, reporting, and legal billing under one product family." : "Worth comparing when its category focus matches your primary workflow."}</p></li>)}
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
      </section>
      <PublicCta eyebrow="Make the comparison real" title="See which starting point fits your team." primaryLabel="Schedule a Demo" primaryHref="/contact" secondaryLabel="Explore Our Systems" secondaryHref="/demos" />
    </main>
  );
}
