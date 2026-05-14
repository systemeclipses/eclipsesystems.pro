import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadFeatures } from "@/lib/seo/content";

export async function generateStaticParams() {
  return (await loadFeatures()).map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const feature = (await loadFeatures()).find((entry) => entry.slug === params.slug);
  if (!feature) return {};
  return { title: feature.name, description: feature.summary, alternates: { canonical: `/features/${feature.slug}` } };
}

export default async function FeaturePage({ params }: { params: { slug: string } }) {
  const feature = (await loadFeatures()).find((entry) => entry.slug === params.slug);
  if (!feature) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }, { name: feature.name, href: `/features/${feature.slug}` }]} />
      <h1 className="text-3xl font-semibold">{feature.name} in Eclipse Timekeeping by Eclipse Systems</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{feature.summary}</p>
      <section className="mt-8 space-y-6">
        {feature.questions.map((question) => (
          <div key={question}>
            <h2 className="text-xl font-semibold">{question}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">Eclipse Timekeeping answers this with a workflow designed for small businesses, law firms, and shift teams that need accountable time records instead of disconnected spreadsheets.</p>
          </div>
        ))}
      </section>
      <FAQ items={feature.questions.map((question) => ({ question, answer: "Yes. Eclipse Timekeeping supports this workflow through its plan-based feature set and database-enforced organization access controls." }))} />
    </main>
  );
}
