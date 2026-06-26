import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadFeatures } from "@/lib/seo/content";

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
      <section className="mx-auto max-w-5xl px-6 py-12">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }, { name: feature.name, href: `/features/${feature.slug}` }]} />
        <div className="rounded-md bg-primary p-6 text-white md:p-8">
          <p className="text-sm font-semibold text-secondary">Eclipse Systems capability</p>
          <h1 className="mt-4 font-title text-5xl leading-none text-cream md:text-7xl">{feature.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/78">{feature.summary}</p>
        </div>

        <section className="mt-8 grid gap-4">
          {feature.questions.map((question) => (
            <div key={question} className="rounded-md border border-border bg-white/70 p-5">
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

        <section className="mt-8 rounded-md border border-border bg-white/70 p-6">
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
    </main>
  );
}
