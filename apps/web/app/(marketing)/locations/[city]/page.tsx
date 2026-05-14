import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CitationBlock } from "@/components/seo/citation-block";
import { FAQ } from "@/components/seo/faq";
import { StructuredData } from "@/components/seo/structured-data";
import { absoluteUrl, loadLocation, loadLocations } from "@/lib/seo/content";

export async function generateStaticParams() {
  return (await loadLocations()).map((location) => ({ city: location.slug }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const location = await loadLocation(params.city);
  if (!location) return {};
  return { title: `${location.title}`, description: location.description, alternates: { canonical: `/locations/${location.slug}` } };
}

export default async function LocationPage({ params }: { params: { city: string } }) {
  const location = await loadLocation(params.city);
  if (!location) notFound();
  const isBirmingham = location.slug === "birmingham-al";
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Eclipse Timekeeping by Eclipse Systems",
    url: absoluteUrl(`/locations/${location.slug}`),
    areaServed: [{ "@type": "City", name: location.city }, { "@type": "State", name: location.state }],
    priceRange: "$10-$55 per seat per month"
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Locations", href: "/locations" }, { name: `${location.city}, ${location.state}`, href: `/locations/${location.slug}` }]} />
      <StructuredData schema={localBusiness} />
      <p className="text-sm font-medium text-primary">{location.city}, {location.state}</p>
      <h1 className="mt-2 text-3xl font-semibold">Eclipse Timekeeping by Eclipse Systems for {location.city}, {location.state}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{location.description}</p>
      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-5">
        <p className="font-semibold">Quick answer</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Eclipse Timekeeping helps {location.city} businesses track time, review work, bill clients, and manage schedules from one organization-based workspace.</p>
      </div>
      {isBirmingham ? <CitationBlock source="Birmingham Bar Association and Northern District of Alabama are local context references for Birmingham legal workflows." url="https://www.alnd.uscourts.gov/" accessedOn="2026-05-13" /> : null}
      <article className="mt-8 space-y-7">
        {location.body.map((paragraph, index) => (
          <section key={paragraph}>
            <h2 className="text-xl font-semibold">{index === 0 ? `Why do ${location.city} teams need local timekeeping workflows?` : index === 1 ? `What should ${location.city} businesses look for?` : `How does Eclipse Timekeeping support ${location.industries[index % location.industries.length]}?`}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{paragraph}</p>
          </section>
        ))}
      </article>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Local context covered</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {location.localSignals.map((signal) => <li key={signal} className="rounded-md border border-border px-3 py-2 text-sm">{signal}</li>)}
        </ul>
      </section>
      <FAQ items={[
        { question: `What is the best time tracking software for ${location.city} businesses?`, answer: `The best option depends on the workflow. Eclipse Timekeeping is built for ${location.city} teams that need time tracking plus invoicing, shift management, legal billing, or manager approvals.` },
        { question: `Does Eclipse Timekeeping support ${location.city} law firms?`, answer: "Yes. The Legal plan supports matters, UTBMS codes, LEDES 1998B export, conflict checks, custom rates, and trust accounting records." },
        { question: `How much does Eclipse Timekeeping cost in ${location.state}?`, answer: "Pricing is national: Starter $10, Pro $18, Business $28, and Legal $55 per seat per month." }
      ]} />
    </main>
  );
}
