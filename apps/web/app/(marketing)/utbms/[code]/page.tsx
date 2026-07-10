import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadUtbmsCode, loadUtbmsCodes } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

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
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow={"UTBMS code " + entry.code} title={entry.task + "."} description={entry.official_definition} image="/media/generated/heroes/billing-legal.jpg" imageAlt="A legal billing professional reviewing structured matter records" points={[entry.category, "Practical examples", "LEDES-ready context"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "UTBMS", href: "/utbms" }, { name: entry.code, href: `/utbms/${entry.code.toLowerCase()}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="Usage guide" title={"When should legal teams use " + entry.code + "?"} description={"Use " + entry.code + " when the primary work matches " + entry.task.toLowerCase() + " in the " + entry.category.toLowerCase() + " category."} /></div>
      <section className="mt-10">
        <h2 className="font-title text-4xl leading-none">Practical examples</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">{entry.practical_examples.map((example) => <li key={example} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-5 font-semibold text-[#314839]/75">{example}</li>)}</ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">When should teams not use {entry.code}?</h2>
        <ul className="mt-3 grid gap-2">{entry.common_misuses.map((misuse) => <li key={misuse} className="rounded-[1rem] border border-[#cbd3b0] bg-[#eef1e5] p-4 font-semibold text-[#314839]/75">{misuse}</li>)}</ul>
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
      </section>
      <PublicCta eyebrow="Legal billing without re-keying" title="Connect coded time directly to review and invoicing." primaryLabel="Schedule a Demo" primaryHref="/contact" />
    </main>
  );
}
