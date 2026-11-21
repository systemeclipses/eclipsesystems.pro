import { TimekeepingPromotion } from '@/components/marketing/timekeeping-promotion';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { StructuredData } from "@/components/seo/structured-data";
import { absoluteUrl, loadLocation, loadLocations } from "@/lib/seo/content";
import { PublicCta, PublicPageHero } from "@/components/marketing/public-page";

export async function generateStaticParams() { return (await loadLocations()).map(location => ({ city: location.slug })); }
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const location = await loadLocation(params.city);
  return location ? { title: location.title, description: location.description, alternates: { canonical: `/locations/${location.slug}` } } : {};
}
const headings = ["Start with the handoff that needs fixing", "Connect the tools worth keeping", "Choose a practical first workflow", "Test a complete task, including permissions", "Plan migration and rollout together", "Scope the engagement around the work"];
export default async function LocationPage({ params }: { params: { city: string } }) {
  const location = await loadLocation(params.city); if (!location) notFound();
  const service = { "@context": "https://schema.org", "@type": "Service", name: `Custom business software for ${location.city}`, description: location.description, url: absoluteUrl(`/locations/${location.slug}`), serviceType: "Custom software design and development", areaServed: [{ "@type": "City", name: `${location.city}, ${location.state}` }, { "@type": "AdministrativeArea", name: "Central Alabama" }], provider: { "@id": absoluteUrl("/") + "/#organization" } };
  return <main className="min-h-screen bg-cream text-ink">
    <PublicPageHero eyebrow={`${location.city}, ${location.state}`} title={`Custom software & consulting for ${location.city}.`} description={location.description} image="/media/generated/heroes/local-business.jpg" imageAlt="A business team coordinating customer and internal workflows" points={["Workflow discovery", "Connected business systems", "Scoped implementation"]} />
    <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Locations", href: "/locations" }, { name: `${location.city}, ${location.state}`, href: `/locations/${location.slug}` }]} />
      <StructuredData schema={service} />
      <TimekeepingPromotion local/>
      <article className="mt-10 grid gap-5 md:grid-cols-2">{location.body.map((paragraph, index) => <section key={headings[index] ?? index} className="rounded-2xl border border-[#d8d0c1] bg-[#fbfaf6] p-7"><h2 className="font-title text-3xl leading-tight text-[#172219]">{headings[index] ?? "Review the workflow"}</h2><p className="mt-5 leading-7 text-[#314839]">{paragraph}</p></section>)}</article>
      <section className="mt-10 rounded-2xl border border-[#cbd3b0] bg-[#eef1e5] p-7"><h2 className="font-title text-3xl leading-tight">Bring one process to discovery.</h2><p className="mt-4 leading-7 text-[#314839]">A spreadsheet, sample request or redacted workflow diagram is enough to begin. Review the people, records, access rules and handoffs before choosing the build path.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/features/custom-software" className="inline-flex min-h-12 items-center rounded-full bg-[#314839] px-6 py-3 font-bold text-[#f9e8d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314839]">Explore custom software →</Link><a href="https://clockeclipse.com/alabama/birmingham-timekeeping-software" className="inline-flex min-h-12 items-center rounded-full border border-[#314839] bg-white px-6 py-3 font-bold text-[#172219] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#314839]">Need employee timekeeping? Visit Eclipse Timekeeping →</a></div></section>
      <section className="mt-10 rounded-2xl border border-[#cbd3b0] bg-[#eef1e5] p-7"><h2 className="font-title text-3xl">Software consulting near Birmingham, built around your workflow.</h2><p className="mt-4 leading-7 text-[#314839]">Eclipse Systems serves Birmingham and nearby Hoover, Homewood and Vestavia Hills businesses, with online collaboration available. A local search should lead to a useful conversation: which task needs fixing, what your current tools can already do and whether configuration, integration or custom development is the right next step.</p><p className="mt-4 leading-7 text-[#314839]">Start with one redacted example. We can discuss workflow discovery, an integration assessment, a prototype or a scoped implementation. Service-area coverage does not imply a separate office in each community.</p><div className="mt-6 flex flex-wrap gap-3">{[{href:"/features/software-consulting",label:"Software consulting"},{href:"/features/api-integrations",label:"API & system integrations"},{href:"/features/reporting-automation",label:"Workflow automation"},{href:"tel:+12059554028",label:"Call (205) 955-4028"}].map(link=><Link key={link.href} href={link.href} className="inline-flex min-h-12 items-center rounded-full bg-[#314839] px-6 py-3 font-bold text-[#f9e8d2]">{link.label}</Link>)}</div></section>
      <FAQ items={[{ question: "What can Eclipse Systems build for a Birmingham business?", answer: "Projects can include client portals, internal operations systems, CRM workflows, storefronts, dashboards, approvals and integrations. Discovery establishes the actual scope and delivery requirements." }, { question: "Can we keep our current business software?", answer: "The scope can focus on a missing workflow or an integration. Review supported interfaces, record ownership, permissions and recovery behavior before relying on a connection." }, { question: "How is a custom software project priced?", answer: "Pricing is scoped after discovery around workflow, customization, integrations, migration and support. ClockEclipse is a separate ready-to-use product with its own published plans." }]} />
    </section>
    <PublicCta eyebrow="Business solutions for Birmingham and beyond" title="Start with the process. Build the right system." primaryLabel="Discuss your workflow" primaryHref="/contact" secondaryLabel="Explore capabilities" secondaryHref="/features" />
  </main>;
}
