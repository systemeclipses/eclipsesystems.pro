import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CitationBlock } from "@/components/seo/citation-block";
import { FAQ } from "@/components/seo/faq";
import { StructuredData } from "@/components/seo/structured-data";
import { absoluteUrl, loadLocation, loadLocations } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

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
    priceRange: "$10-$38 per seat per month, plus legal add-on"
  };

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow={location.city + ", " + location.state} title={"Eclipse Systems for " + location.city + "."} description={location.description} image="/media/generated/heroes/local-business.jpg" imageAlt="A local service business team coordinating daily operations" points={["Local workflow context", "Connected operations", "Supported implementation"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Locations", href: "/locations" }, { name: `${location.city}, ${location.state}`, href: `/locations/${location.slug}` }]} />
      <StructuredData schema={localBusiness} />
      <div className="mt-10"><PublicSectionHeading eyebrow="Local workflow guide" title={"What " + location.city + " teams should expect from their systems."} /></div>
      <div className="mt-8 rounded-[2rem] border border-[#cbd3b0] bg-[#eef1e5] p-7 md:p-10">
        <p className="font-semibold">Quick answer</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Eclipse Timekeeping helps {location.city} businesses track time, review work, bill clients, and manage schedules from one organization-based workspace.</p>
      </div>
      {isBirmingham ? <CitationBlock source="Birmingham Bar Association and Northern District of Alabama are local context references for Birmingham legal workflows." url="https://www.alnd.uscourts.gov/" accessedOn="2026-05-13" /> : null}
      <article className="mt-12 grid gap-5 md:grid-cols-2">
        {location.body.map((paragraph, index) => (
          <section key={paragraph} className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7">
            <h2 className="font-title text-3xl leading-none">{index === 0 ? `Why do ${location.city} teams need local timekeeping workflows?` : index === 1 ? `What should ${location.city} businesses look for?` : `How does Eclipse Timekeeping support ${location.industries[index % location.industries.length]}?`}</h2>
            <p className="mt-4 font-semibold leading-7 text-[#314839]/70">{paragraph}</p>
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
        { question: `Does Eclipse Timekeeping support ${location.city} law firms?`, answer: "Yes. Eclipse Legal Add-on supports matters, UTBMS codes, LEDES 1998B export, conflict checks, custom rates, and trust accounting records." },
        { question: `How much does Eclipse Timekeeping cost in ${location.state}?`, answer: "Pricing is national: Eclipse Timekeeping is $10, Mission Command is $18, Eclipse is $22, Eclipse Suite is $38, and Eclipse Legal Add-on is $20 per seat per month." }
      ]} />
      </section>
      <PublicCta eyebrow="Work with a team that understands the context" title={"Build the right starting point for " + location.city + "."} primaryLabel="Schedule a Demo" primaryHref="/schedule-demo" />
    </main>
  );
}
