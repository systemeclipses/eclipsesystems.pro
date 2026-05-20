import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ChefHat, DraftingCompass, FileCheck2, Scale, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadIndustries, type IndustryContent } from "@/lib/seo/content";

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
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-12 md:py-16 lg:grid-cols-[0.78fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-secondary">Built for teams with real operating complexity.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Industries that run on Eclipse.</h1>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
                Eclipse gives service firms and shift teams one place to capture work, review it, bill it, schedule it, and understand what is actually happening across the business.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Billable", "Time, rates, invoices, and client work."],
                  ["Operational", "Schedules, coverage, chat, and approvals."],
                  ["Auditable", "Clear records for review and reporting."]
                ].map(([title, text]) => (
                  <div key={title} className="rounded-md border border-white/15 bg-white/10 p-4">
                    <p className="font-title text-3xl leading-none text-cream">{title}</p>
                    <p className="mt-3 text-xs leading-5 text-white/70">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 lg:grid-cols-4">
          {priority.map(({ industry, label, eyebrow, icon: Icon }) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group flex min-h-[420px] flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
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

      <section className="px-3 pb-12">
        <div className="mx-auto grid max-w-[104rem] gap-8 rounded-md bg-primary p-8 text-white lg:grid-cols-[0.65fr_1fr] lg:p-10">
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
                <div key={item.title} className="rounded-md border border-white/15 bg-white/10 p-5">
                  <Icon className="h-5 w-5 text-secondary" />
                  <p className="mt-6 text-lg font-semibold text-cream">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-white/72">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 pb-16">
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
            <Link key={industry.slug} href={`/industries/${industry.slug}`} className="group rounded-md border border-border bg-white/60 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-primary/10">
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
