import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadIndustries, loadIndustry } from "@/lib/seo/content";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export async function generateStaticParams() {
  return (await loadIndustries()).map((industry) => ({ industry: industry.slug }));
}

export async function generateMetadata({ params }: { params: { industry: string } }): Promise<Metadata> {
  const industry = await loadIndustry(params.industry);
  if (!industry) return {};
  return { title: industry.title, description: industry.description, alternates: { canonical: `/industries/${industry.slug}` } };
}

export default async function IndustryPage({ params }: { params: { industry: string } }) {
  const industry = await loadIndustry(params.industry);
  if (!industry) notFound();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow={industry.name + " workflows"} title={industry.title} description={industry.description} image="/media/generated/heroes/industries.jpg" imageAlt="A cross-functional team coordinating work across office and field operations" points={["Clear handoffs", "Role-aware workflows", "Connected reporting"]} />
      <section className="mx-auto max-w-[90rem] px-5 py-16 md:py-24">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Industries", href: "/industries" }, { name: industry.name, href: `/industries/${industry.slug}` }]} />
      <div className="mt-10"><PublicSectionHeading eyebrow="Workflow fit" title={"What " + industry.name + " need from the system."} /></div>
      <section className="mt-10">
        <h2 className="font-title text-4xl leading-none">Where does the workflow get difficult?</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {industry.problems.map((problem) => <li key={problem} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 font-semibold leading-7 text-[#314839]/75">{problem}</li>)}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Which custom workflows address those problems?</h2>
        <div className="mt-4 grid gap-3">
          {industry.featureMap.map((item) => <div key={item.problem} className="rounded-[1.25rem] border border-[#cbd3b0] bg-[#eef1e5] p-6"><p className="font-bold">{item.problem}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#314839]">{item.feature}</p></div>)}
        </div>
      </section>
      <section className="mt-10 rounded-[2rem] border border-[#314839]/15 bg-[#314839] p-7 text-[#f9e8d2] md:p-10">
        <h2 className="text-xl font-semibold">A workflow to explore</h2>
        <p className="mt-2 leading-7 text-[#f9e8d2]">{industry.originalData}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">What requirements should the team confirm?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">{industry.compliance}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Where should the project start?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">{industry.recommendedPlan}</p>
      </section>
      <FAQ items={[
        { question: `Can Eclipse Systems build software for ${industry.name.toLowerCase()}?`, answer: `Discovery can explore ${industry.name.toLowerCase()} workflows such as client intake, internal tasks, documents, approvals and reporting. The scope and supported integrations must be confirmed for the project.` },
        { question: `What is the right starting point for ${industry.name.toLowerCase()}?`, answer: `${industry.recommendedPlan}` },
        { question: `Can the project connect to existing systems?`, answer: "Integration requirements are reviewed during discovery, including available interfaces, shared identifiers, permissions and recovery from failed updates." }
      ]} />
      </section>
      <PublicCta eyebrow="See the fit" title={"Build around how " + industry.name + " work actually moves."} primaryLabel="Discuss your workflow" primaryHref="/contact" />
    </main>
  );
}
