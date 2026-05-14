import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorBio } from "@/components/seo/author-bio";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FAQ } from "@/components/seo/faq";
import { loadIndustries, loadIndustry } from "@/lib/seo/content";

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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Industries", href: "/industries" }, { name: industry.name, href: `/industries/${industry.slug}` }]} />
      <h1 className="text-3xl font-semibold">{industry.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{industry.description}</p>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Why is timekeeping hard for {industry.name.toLowerCase()}?</h2>
        <ul className="mt-4 grid gap-3">
          {industry.problems.map((problem) => <li key={problem} className="rounded-md border border-border p-4 text-muted-foreground">{problem}</li>)}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Which Eclipse Timekeeping features map to those problems?</h2>
        <div className="mt-4 grid gap-3">
          {industry.featureMap.map((item) => <div key={item.problem} className="rounded-md border border-border p-4"><p className="font-medium">{item.problem}</p><p className="mt-2 text-sm text-muted-foreground">{item.feature}</p></div>)}
        </div>
      </section>
      <section className="mt-10 rounded-lg border border-border bg-muted/50 p-5">
        <h2 className="text-xl font-semibold">Original data point</h2>
        <p className="mt-2 leading-7 text-muted-foreground">{industry.originalData}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">What compliance issues should {industry.name.toLowerCase()} consider?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">{industry.compliance}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Which plan should {industry.name.toLowerCase()} choose?</h2>
        <p className="mt-2 leading-7 text-muted-foreground">Most {industry.name.toLowerCase()} should start with the {industry.recommendedPlan} plan because it matches the workflow described above.</p>
      </section>
      <FAQ items={[
        { question: `Is Eclipse Timekeeping useful for ${industry.name.toLowerCase()}?`, answer: `Yes. Eclipse Timekeeping supports ${industry.name.toLowerCase()} with workflows for time capture, review, reporting, and plan-specific billing or workforce features.` },
        { question: `What plan is best for ${industry.name.toLowerCase()}?`, answer: `The recommended plan for this industry is ${industry.recommendedPlan}.` },
        { question: `Can ${industry.name.toLowerCase()} use Eclipse Timekeeping for approvals?`, answer: "Yes. Manager and admin workflows support review before entries are billed or reported." }
      ]} />
      <AuthorBio name="Eclipse Systems Operations Team" role="Product and SEO review" expertise="Small-business timekeeping, legal billing workflows, and workforce operations." />
    </main>
  );
}
