import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ChefHat, DraftingCompass, FileCheck2, Scale, UsersRound } from "lucide-react";
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
        eyebrow=""
        title="Systems for Teams That Keep Things Moving."
        description="Eclipse gives service firms, professional teams, and shift-based businesses one place to capture work, review it, bill it, schedule it, and understand what is actually happening."
        image="/media/generated/heroes/industries.jpg"
        imageAlt="A team collaborating around an Eclipse workflow"
        points={["Billable work", "Operational clarity", "Auditable records"]}
        height="medium"
      />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="" title="Different work. The same need for clarity." description="Start with the workflow pressure your team feels most, then shape the system around the rest." />
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {priority.map(({ industry, label, eyebrow, icon: Icon }) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group flex min-h-[440px] flex-col rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 text-[#172219] shadow-xl shadow-[#172219]/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-[#172219]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase text-[#314839]">{eyebrow}</span>
              </div>
              <h2 className="mt-8 font-title text-5xl leading-none">{label}</h2>
              <p className="mt-5 text-sm leading-6 text-[#314839]">{industry.description}</p>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-semibold">Common pressure</p>
                <p className="mt-2 text-sm leading-6 text-[#314839]">{industry.problems[0]}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[#314839]">
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
        <div className="rounded-[2rem] bg-[#314839] px-7 py-9 text-[#f9e8d2] shadow-2xl shadow-[#172219]/15 md:px-10 md:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-[#b4c292]">Find out how we can help</p>
              <h2 className="mt-3 max-w-5xl font-title text-5xl leading-[0.9] md:text-7xl">If your team has a workflow, Eclipse can help run it.</h2>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-white/72 md:text-lg">
                These industries are examples, not limits. Tell us how your business works, and we’ll shape Eclipse around the people, approvals, schedules, records, and handoffs that keep it moving.
              </p>
            </div>
            <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#f9e8d2] px-6 py-3 text-sm font-bold text-[#314839] transition hover:bg-white lg:self-auto">
              Contact Eclipse <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {moreIndustries.map((industry) => (
              <Link key={industry.slug} href={`/industries/${industry.slug}`} className="group rounded-[1.25rem] border border-white/15 bg-white/10 p-6 transition hover:-translate-y-1 hover:bg-white/15">
                <h3 className="font-title text-4xl leading-none text-[#f9e8d2]">{industry.name}</h3>
                <p className="mt-3 text-sm leading-6 text-white/68">{industry.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#b4c292]">
                  View guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
