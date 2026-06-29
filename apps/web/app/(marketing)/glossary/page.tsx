import type { Metadata } from "next";
import Link from "next/link";
import { loadGlossary } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Timekeeping Glossary",
  description: "Definitions for timekeeping, billing, legal operations, shift management, and professional services terms."
};

export default async function GlossaryPage() {
  const terms = await loadGlossary();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Plain-language reference" title="The Eclipse Workflow Glossary." description="Clear definitions for operations, billing, legal workflows, scheduling, customer systems, and the language teams use to run the work." image="/media/generated/heroes/resources.jpg" imageAlt="Workflow notes and diagrams arranged into a practical reference" points={["Plain language", "Practical context", "Related concepts"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Browse terms" title="Understand the language behind the workflow." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {terms.map((term) => <Link key={term.slug} href={`/glossary/${term.slug}`} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 transition hover:-translate-y-1 hover:shadow-xl"><h2 className="font-title text-3xl leading-none">{term.term}</h2><p className="mt-3 text-sm font-semibold leading-6 text-[#314839]/70">{term.definition}</p></Link>)}
      </div>
      </section>
    </main>
  );
}
