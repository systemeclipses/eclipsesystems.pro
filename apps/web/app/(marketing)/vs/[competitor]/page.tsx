import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CitationBlock } from "@/components/seo/citation-block";
import { ComparisonTable } from "@/components/seo/comparison-table";
import { FAQ } from "@/components/seo/faq";
import { buildComparisonRows } from "@/lib/seo/comparison";
import { loadCompetitor, loadCompetitors } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadCompetitors()).map((competitor) => ({ competitor: competitor.slug }));
}

export async function generateMetadata({ params }: { params: { competitor: string } }): Promise<Metadata> {
  const competitor = await loadCompetitor(params.competitor);
  if (!competitor) return {};
  return { title: `Eclipse Timekeeping vs ${competitor.name}: 2026 Comparison`, description: `Compare Eclipse Timekeeping by Eclipse Systems with ${competitor.name} for pricing, invoicing, shifts, and legal billing.`, alternates: { canonical: `/vs/${competitor.slug}` } };
}

export default async function CompetitorPage({ params }: { params: { competitor: string } }) {
  const competitor = await loadCompetitor(params.competitor);
  if (!competitor) notFound();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Software comparison" title={"Eclipse vs " + competitor.name + "."} description={"A practical comparison for " + competitor.audience + " evaluating connected time, billing, workforce, and reporting workflows."} image="/media/generated/heroes/engagements.jpg" imageAlt="Modular software foundations arranged for comparison" points={["Feature context", "Workflow tradeoffs", "Verified pricing sources"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Comparisons", href: "/vs" }, { name: competitor.name, href: `/vs/${competitor.slug}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="The short answer" title={"Which system fits the work?"} /></div>
      <div className="mt-8 rounded-[2rem] border border-[#cbd3b0] bg-[#eef1e5] p-7 md:p-10">
        <p className="font-semibold">TL;DR</p>
        <p className="mt-2 leading-7 text-muted-foreground">Choose {competitor.name} when its core strengths match your exact workflow and you do not need Eclipse's combined legal, shift, and billing operations. Choose Eclipse Timekeeping by Eclipse Systems when you want time tracking to connect directly to invoicing, shift management, reporting, or legal billing. Pricing and packaging were last reviewed on {competitor.last_verified}.</p>
      </div>
      <ComparisonTable caption={`Eclipse Timekeeping vs ${competitor.name}`} columns={[{ key: "eclipse", label: "Eclipse Timekeeping" }, { key: "competitor", label: competitor.name }]} rows={buildComparisonRows(competitor)} />
      <CitationBlock source={`${competitor.name} pricing page`} url={competitor.source_url} accessedOn={competitor.last_verified} />
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Where is {competitor.name} better?</h2>
        <ul className="mt-3 grid gap-2">{competitor.strengths.map((item) => <li key={item} className="rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-4 font-semibold text-[#314839]/75">{item}</li>)}</ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Where is Eclipse Timekeeping better?</h2>
        <ul className="mt-3 grid gap-2">{competitor.weaknesses.map((item) => <li key={item} className="rounded-[1rem] border border-[#cbd3b0] bg-[#eef1e5] p-4 font-semibold text-[#314839]/75">{item}</li>)}</ul>
      </section>
      <section className="mt-10 text-sm text-muted-foreground">
        <p>Methodology: Last updated {competitor.last_verified}. Pricing verified from the public source linked above. Submit corrections to corrections@eclipsesystems.pro.</p>
      </section>
      <FAQ items={[
        { question: `Is Eclipse Timekeeping better than ${competitor.name}?`, answer: `It depends on the use case. Eclipse Timekeeping is stronger when a team needs time tracking tied to invoicing, shifts, reporting, or legal billing. ${competitor.name} may be better when its specific strengths are the main buying criteria.` },
        { question: `Does Eclipse Timekeeping replace ${competitor.name}?`, answer: "For many teams, yes. Teams with specialized integrations or established workflows should compare the feature table carefully before switching." },
        { question: `How much does Eclipse Timekeeping cost compared with ${competitor.name}?`, answer: "Eclipse Timekeeping starts at $10 per seat per month. Competitor pricing changes frequently, so verify the linked source before making a buying decision." },
        { question: "Does Eclipse Timekeeping support legal billing?", answer: "Yes. Eclipse Legal Add-on supports matters, UTBMS codes, LEDES 1998B export, conflict checks, trust accounting, and custom rates." },
        { question: "Does Eclipse Timekeeping support shifts?", answer: "Yes. Mission Command by Eclipse and Eclipse Suite include shift management, shift swaps, marketplace workflows, and team chat." }
      ]} />
      </section>
      <PublicCta eyebrow="Compare it to your real process" title="Choose the system that fits the workflow." primaryLabel="Schedule a Demo" primaryHref="/contact" />
    </main>
  );
}
