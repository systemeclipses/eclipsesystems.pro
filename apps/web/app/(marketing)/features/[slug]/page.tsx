import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { StructuredData } from "@/components/seo/structured-data";
import { absoluteUrl, loadFeatures } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadFeatures()).map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const feature = (await loadFeatures()).find((entry) => entry.slug === params.slug);
  if (!feature) return {};
  return {
    title: feature.name,
    description: feature.summary,
    alternates: { canonical: `/features/${feature.slug}` }
  };
}

export default async function FeaturePage({ params }: { params: { slug: string } }) {
  const feature = (await loadFeatures()).find((entry) => entry.slug === params.slug);
  if (!feature) notFound();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Eclipse capability" title={feature.name} description={feature.summary} image="/media/generated/heroes/capabilities.jpg" imageAlt="Connected custom software dashboards arranged in a modular system" points={["Customer-facing clarity", "Internal controls", "Connected reporting"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }, { name: feature.name, href: `/features/${feature.slug}` }]} />
        <StructuredData schema={{"@context":"https://schema.org","@type":"Service",name:feature.name,description:feature.summary,url:absoluteUrl(`/features/${feature.slug}`),provider:{"@id":"https://www.eclipsesystems.pro/#organization"},areaServed:{"@type":"AdministrativeArea",name:"Birmingham and Central Alabama"}}} />
        {feature.sections?.length ? <article className="mt-10 grid gap-5 md:grid-cols-2">{feature.sections.map(section => <section key={section.heading} className="rounded-2xl border border-[#d8d0c1] bg-[#fbfaf6] p-7"><h2 className="font-title text-3xl leading-tight text-[#172219]">{section.heading}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="mt-5 leading-7 text-[#314839]">{paragraph}</p>)}</section>)}</article> : null}
        <div className="mt-10"><PublicSectionHeading eyebrow="Questions this capability answers" title="Built around the real process." /></div>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {feature.questions.map((question) => (
            <div key={question} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-lg shadow-[#172219]/5">
              <div className="flex gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{question}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {feature.answers?.[question] ?? "Eclipse Systems scopes this around your workflow, access requirements, data and the supported interfaces of any connected systems. Review feasibility and delivery requirements during discovery."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#cbd3b0] bg-[#eef1e5] p-7 md:p-10">
          <h2 className="font-title text-4xl leading-none">Built around the real process.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            This can be delivered as a focused workflow, connected to an existing Eclipse system, or built as part of a larger custom software project. The goal is not to force your business into a generic template; it is to make the customer-facing and internal steps work together cleanly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-[#314839]">
              <Link href="/contact">Schedule a Demo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            {feature.slug.includes("payment") || feature.slug.includes("invoicing") ? (
              <Button asChild variant="outline">
                <Link href="/pay-invoice">Pay an Invoice <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[#cbd3b0] bg-[#eef1e5] p-7"><h2 className="font-title text-3xl">Plan the next step with Eclipse.</h2><div className="mt-6 flex flex-wrap gap-3">{[{href:"/features/software-consulting",label:"Software consulting"},{href:"/features/api-integrations",label:"API integrations"},{href:"/locations/birmingham-al",label:"Birmingham business solutions"}].filter(link=>link.href!==`/features/${feature.slug}`).map(link=><Link key={link.href} href={link.href} className="inline-flex min-h-12 items-center rounded-full bg-[#314839] px-6 py-3 font-bold text-[#f9e8d2]">{link.label}</Link>)}</div></section>
        <FAQ items={feature.questions.map((question) => ({ question, answer: feature.answers?.[question] ?? "Eclipse Systems scopes this around your workflow, customer access needs, internal controls, integrations, and launch path." }))} />
      </section>
      <PublicCta eyebrow="Build this around your team" title="Start with the workflow that needs to work better." primaryLabel="Schedule a Demo" primaryHref="/contact" secondaryLabel="Explore Our Systems" secondaryHref="/demos" />
    </main>
  );
}
