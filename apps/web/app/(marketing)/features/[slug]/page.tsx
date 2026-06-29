import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadFeatures } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadFeatures()).map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const feature = (await loadFeatures()).find((entry) => entry.slug === params.slug);
  if (!feature) return {};
  return {
    title: `${feature.name} | Eclipse Systems`,
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
        <div className="mt-10"><PublicSectionHeading eyebrow="Questions this capability answers" title="Built around the real process." /></div>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {feature.questions.map((question) => (
            <div key={question} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-lg shadow-[#172219]/5">
              <div className="flex gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{question}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    Yes. Eclipse Systems treats this as part of the workflow design: what customers see, what admins control, what data needs to be shared, and where payment, reporting, or automation should happen.
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
              <Link href="/schedule-demo">Schedule a Demo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            {feature.slug.includes("payment") || feature.slug.includes("invoicing") ? (
              <Button asChild variant="outline">
                <Link href="/pay-invoice">Pay an Invoice <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            ) : null}
          </div>
        </section>

        <FAQ items={feature.questions.map((question) => ({ question, answer: "Yes. Eclipse Systems scopes this around your workflow, customer access needs, internal controls, integrations, and launch path." }))} />
      </section>
      <PublicCta eyebrow="Build this around your team" title="Start with the workflow that needs to work better." primaryLabel="Schedule a Demo" primaryHref="/schedule-demo" secondaryLabel="Explore Our Systems" secondaryHref="/demos" />
    </main>
  );
}
