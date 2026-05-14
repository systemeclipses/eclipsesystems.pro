import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadUtbmsCode, loadUtbmsCodes } from "@/lib/seo/content";

export async function generateStaticParams() {
  return (await loadUtbmsCodes()).map((entry) => ({ code: entry.code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const entry = await loadUtbmsCode(params.code);
  if (!entry) return {};
  return { title: `UTBMS Code ${entry.code}: ${entry.task}`, description: `${entry.code} is the UTBMS code for ${entry.task}. Practical examples, common mistakes, and related codes.`, alternates: { canonical: `/utbms/${entry.code.toLowerCase()}` } };
}

export default async function UtbmsCodePage({ params }: { params: { code: string } }) {
  const entry = await loadUtbmsCode(params.code);
  if (!entry) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "UTBMS", href: "/utbms" }, { name: entry.code, href: `/utbms/${entry.code.toLowerCase()}` }]} />
      <h1 className="text-3xl font-semibold">UTBMS Code {entry.code}: {entry.task}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{entry.official_definition}</p>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">When should legal teams use {entry.code}?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">Use {entry.code} when the primary work matches {entry.task.toLowerCase()} in the {entry.category.toLowerCase()} category.</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">What are examples of {entry.code} time entries?</h2>
        <ul className="mt-3 grid gap-2">{entry.practical_examples.map((example) => <li key={example} className="rounded-md border border-border p-3 text-muted-foreground">{example}</li>)}</ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">When should teams not use {entry.code}?</h2>
        <ul className="mt-3 grid gap-2">{entry.common_misuses.map((misuse) => <li key={misuse} className="rounded-md border border-border p-3 text-muted-foreground">{misuse}</li>)}</ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">How does Eclipse Timekeeping handle {entry.code}?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">Eclipse Timekeeping Legal lets firms attach UTBMS task and activity codes to matter-linked time entries so invoice review and LEDES export do not require re-keying code data.</p>
      </section>
      <FAQ items={[
        { question: `What is UTBMS code ${entry.code}?`, answer: `${entry.code} is the UTBMS code for ${entry.task}.` },
        { question: `Can Eclipse Timekeeping track ${entry.code}?`, answer: "Yes. Eclipse Timekeeping Legal supports UTBMS-coded time entries." },
        { question: `What codes are related to ${entry.code}?`, answer: entry.related_codes.join(", ") }
      ]} />
    </main>
  );
}
