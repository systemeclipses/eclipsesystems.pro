import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadGlossary, loadGlossaryTerm } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadGlossary()).map((term) => ({ term: term.slug }));
}

export async function generateMetadata({ params }: { params: { term: string } }): Promise<Metadata> {
  const term = await loadGlossaryTerm(params.term);
  if (!term) return {};
  return { title: `${term.term} Definition`, description: term.definition, alternates: { canonical: `/glossary/${term.slug}` } };
}

export default async function GlossaryTermPage({ params }: { params: { term: string } }) {
  const term = await loadGlossaryTerm(params.term);
  if (!term) notFound();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Eclipse workflow glossary" title={term.term + "."} description={term.definition} image="/media/generated/heroes/resources.jpg" imageAlt="Workflow notes and diagrams arranged into a practical reference" points={["Plain-language definition", "Practical application", "Common misconceptions"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Glossary", href: "/glossary" }, { name: term.term, href: `/glossary/${term.slug}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="In practice" title={"How " + term.term.toLowerCase() + " shows up in the work."} description={term.appliesTo} /></div>
      <section className="mt-12 rounded-[2rem] border border-[#cbd3b0] bg-[#eef1e5] p-7 md:p-10"><h2 className="font-title text-4xl leading-none">What do people often misunderstand?</h2><ul className="mt-6 grid gap-3 md:grid-cols-2">{term.misconceptions.map((item) => <li key={item} className="rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-4 font-semibold leading-6 text-[#314839]/75">{item}</li>)}</ul></section>
      <FAQ items={[
        { question: `What is ${term.term}?`, answer: term.definition },
        { question: `Why does ${term.term.toLowerCase()} matter?`, answer: term.appliesTo },
        { question: `What terms are related to ${term.term}?`, answer: term.related.join(", ") }
      ]} />
      </section>
      <PublicCta eyebrow="Turn the concept into a working system" title="Connect the language to the workflow." primaryLabel="Explore Our Systems" primaryHref="/demos" />
    </main>
  );
}
