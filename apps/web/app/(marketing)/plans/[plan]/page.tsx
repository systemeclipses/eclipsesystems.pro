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
      <p className="mt-6 text-3xl font-semibold">${plan.priceMonthly}<span className="text-base text-muted-foreground"> / seat / month</span></p>
      <p className="mt-2 text-muted-foreground">${plan.annualEffectiveMonthly} effective monthly per seat with annual billing.</p>
      <h2 className="mt-10 text-xl font-semibold">Who should choose {plan.name}?</h2>
      <p className="mt-2 leading-7 text-muted-foreground">{plan.bestFor}</p>
      <ul className="mt-6 grid gap-2">
        {plan.features.map((feature) => <li key={feature} className="rounded-md border border-border p-3">{feature}</li>)}
      </ul>
      <FAQ items={[
        { question: `How much does ${plan.name} cost?`, answer: `${plan.name} costs $${plan.priceMonthly} per seat per month, or $${plan.annualEffectiveMonthly} effective monthly per seat when billed annually.` },
        { question: `Is ${plan.name} available as a trial?`, answer: "Yes. Every paid Eclipse product includes a 14-day card-required trial." },
        { question: `Can teams change from ${plan.name} later?`, answer: "Yes. Teams can change subscriptions through Stripe billing workflows as their needs expand." }
      ]} />
    </main>
  );
}
