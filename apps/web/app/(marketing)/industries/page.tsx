import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ChefHat, DraftingCompass, FileCheck2, Scale, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadIndustries, type IndustryContent } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Industries",
  description: "Time tracking, billing, and workforce management workflows for engineering firms, lawyers, accounting firms, restaurants, and more."
};

const priorityIndustries = [
  {
    slug: "engineering",
    label: "Engineering",
    eyebrow: "Project budgets, phases, and billable work",
    icon: DraftingCompass
  },
  {
    slug: "law-firms",
    label: "Lawyers",
    eyebrow: "Matters, UTBMS, LEDES, and approvals",
    icon: Scale
  },
  {
    slug: "accounting-firms",
    label: "Accounting",
    eyebrow: "Busy season, realization, and client work",
    icon: BadgeDollarSign
  },
  {
    slug: "restaurants",
    label: "Restaurants",
    eyebrow: "Schedules, swaps, chat, and coverage",
    icon: ChefHat
  }
] as const;

function findIndustry(industries: IndustryContent[], slug: string) {
  return industries.find((industry) => industry.slug === slug);
}

export default async function IndustriesPage() {
  const industries = await loadIndustries();
  const priority = priorityIndustries
    .map((item) => ({ ...item, industry: findIndustry(industries, item.slug) }))
    .filter((item): item is typeof item & { industry: IndustryContent } => Boolean(item.industry));
  const moreIndustries = industries.filter((industry) => !priorityIndustries.some((item) => item.slug === industry.slug));

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero
        eyebrow="Built for operating complexity"
        title="Systems for Teams That Keep Things Moving."
        description="Eclipse gives service firms, professional teams, and shift-based businesses one place to capture work, review it, bill it, schedule it, and understand what is actually happening."
        image="/media/generated/heroes/industries.jpg"
        imageAlt="A team collaborating around an Eclipse workflow"
        points={["Billable work", "Operational clarity", "Auditable records"]}
        actions={<Link href="/schedule-demo" className="rounded-full bg-[#f9e8d2] px-6 py-3 text-sm font-bold text-[#314839]">Find Your Starting Point</Link>}
      />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Priority industries" title="Different work. The same need for clarity." description="Start with the workflow pressure your team feels most, then shape the system around the rest." />
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {priority.map(({ industry, label, eyebrow, icon: Icon }) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group flex min-h-[440px] flex-col rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</span>
              </div>
              <h2 className="mt-8 font-title text-5xl leading-none">{label}</h2>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{industry.description}</p>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-semibold">Common pressure</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{industry.problems[0]}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">
                Explore {label} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-3 pb-16">
        <div className="mx-auto grid max-w-[100rem] gap-8 rounded-[2rem] bg-primary p-8 text-white lg:grid-cols-[0.65fr_1fr] lg:p-12">
          <div>
            <p className="text-sm font-semibold text-secondary">One platform, different operating shapes.</p>
            <h2 className="mt-4 font-title text-5xl leading-none text-cream md:text-6xl">Match the workflow to the work.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { title: "Professional services", text: "Clients, projects, phases, budgets, rates, invoices, and profitability.", icon: FileCheck2 },
              { title: "Legal teams", text: "Matter-aware billing, UTBMS codes, LEDES exports, approvals, and trust context.", icon: Scale },
              { title: "Shift operators", text: "Schedules, swaps, chat, manager approvals, and coverage visibility.", icon: UsersRound }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.25rem] border border-white/15 bg-white/10 p-5">
                  <Icon className="h-5 w-5 text-secondary" />
                  <p className="mt-6 text-lg font-semibold text-cream">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[100rem] px-5 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">And more</p>
            <h2 className="mt-2 font-title text-5xl leading-none md:text-6xl">More teams can run here.</h2>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-[#314839]">
            <Link href="/signup">Start Trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {moreIndustries.map((industry) => (
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="group rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
              <h3 className="font-title text-4xl leading-none">{industry.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{industry.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
