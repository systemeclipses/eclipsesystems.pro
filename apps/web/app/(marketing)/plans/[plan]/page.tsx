import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadPlans } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadPlans()).map((plan) => ({ plan: plan.slug }));
}

export async function generateMetadata({ params }: { params: { plan: string } }): Promise<Metadata> {
  const plan = (await loadPlans()).find((entry) => entry.slug === params.plan);
  if (!plan) return {};
  return { title: plan.name, description: plan.summary, alternates: { canonical: `/plans/${plan.slug}` } };
}

export default async function PlanPage({ params }: { params: { plan: string } }) {
  const plan = (await loadPlans()).find((entry) => entry.slug === params.plan);
  if (!plan) notFound();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Eclipse package" title={plan.name} description={plan.summary} image="/media/generated/heroes/engagements.jpg" imageAlt="Modular software foundations being arranged for a business" points={["Scoped after discovery", "Customizable foundation", "Supported through launch"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Pricing", href: "/pricing" }, { name: plan.name, href: `/plans/${plan.slug}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="Scoped quote" title="Start with what already works." description="Pricing depends on whether this package is used as-is, customized, or becomes the foundation for a bespoke build." /></div>
      {plan.moduleNote ? <p className="mt-2 text-muted-foreground">{plan.moduleNote}</p> : null}
      {plan.worksWith ? <p className="mt-4 rounded-md border border-border bg-cream/70 p-4 text-sm font-semibold text-primary">Works with {plan.worksWith.packageName}: {plan.worksWith.copy}</p> : null}
      <h2 className="mt-12 font-title text-4xl leading-none">Who should choose {plan.name}?</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{plan.bestFor}</p>
      <ul className="mt-6 grid gap-2">
        {plan.features.map((feature) => <li key={feature} className="rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-4 font-semibold">{feature}</li>)}
      </ul>
      <FAQ items={[
        { question: `How much does ${plan.name} cost?`, answer: "Eclipse Systems prices after discovery so the quote matches the actual package, customization, integrations, and launch path." },
        { question: `Can ${plan.name} be customized?`, answer: "Yes. Each package can be bought as-is, customized around your workflow, or used as the foundation for a bespoke build." },
        { question: `Can teams change from ${plan.name} later?`, answer: "Yes. Packages can expand through customization, additional modules, integrations, and custom workflows as needs change." }
      ]} />
      </section>
      <PublicCta eyebrow="Make it yours" title={"Shape " + plan.name + " around your workflow."} primaryLabel="Start Discovery" primaryHref="/contact" secondaryLabel="Compare Engagements" secondaryHref="/pricing" />
    </main>
  );
}
