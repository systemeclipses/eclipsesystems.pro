import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadGlossary, loadGlossaryTerm } from "@/lib/seo/content";

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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Glossary", href: "/glossary" }, { name: term.term, href: `/glossary/${term.slug}` }]} />
      <h1 className="text-3xl font-semibold">{term.term}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{term.definition}</p>
      <section className="mt-10"><h2 className="text-xl font-semibold">How does {term.term.toLowerCase()} apply in practice?</h2><p className="mt-2 leading-7 text-muted-foreground">{term.appliesTo}</p></section>
      <section className="mt-10"><h2 className="text-xl font-semibold">What do people often misunderstand about {term.term.toLowerCase()}?</h2><ul className="mt-3 grid gap-2">{term.misconceptions.map((item) => <li key={item} className="rounded-md border border-border p-3 text-muted-foreground">{item}</li>)}</ul></section>
      <FAQ items={[
        { question: `What is ${term.term}?`, answer: term.definition },
        { question: `Why does ${term.term.toLowerCase()} matter?`, answer: term.appliesTo },
        { question: `What terms are related to ${term.term}?`, answer: term.related.join(", ") }
      ]} />
    </main>
  );
}
