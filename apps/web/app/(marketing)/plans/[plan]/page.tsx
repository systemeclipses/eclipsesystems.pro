import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadPlans } from "@/lib/seo/content";

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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Pricing", href: "/pricing" }, { name: plan.name, href: `/plans/${plan.slug}` }]} />
      <h1 className="text-3xl font-semibold">{plan.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{plan.summary}</p>
      <p className="mt-6 text-3xl font-semibold">Scoped quote</p>
      <p className="mt-2 text-muted-foreground">Pricing depends on whether this package is bought as-is, customized, or used as the foundation for a bespoke build.</p>
      {plan.moduleNote ? <p className="mt-2 text-muted-foreground">{plan.moduleNote}</p> : null}
      {plan.worksWith ? <p className="mt-4 rounded-md border border-border bg-cream/70 p-4 text-sm font-semibold text-primary">Works with {plan.worksWith.packageName}: {plan.worksWith.copy}</p> : null}
      <h2 className="mt-10 text-xl font-semibold">Who should choose {plan.name}?</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{plan.bestFor}</p>
      <ul className="mt-6 grid gap-2">
        {plan.features.map((feature) => <li key={feature} className="rounded-md border border-border p-3">{feature}</li>)}
      </ul>
      <FAQ items={[
        { question: `How much does ${plan.name} cost?`, answer: "Eclipse Systems prices after discovery so the quote matches the actual package, customization, integrations, and launch path." },
        { question: `Can ${plan.name} be customized?`, answer: "Yes. Each package can be bought as-is, customized around your workflow, or used as the foundation for a bespoke build." },
        { question: `Can teams change from ${plan.name} later?`, answer: "Yes. Packages can expand through customization, additional modules, integrations, and custom workflows as needs change." }
      ]} />
    </main>
  );
}
