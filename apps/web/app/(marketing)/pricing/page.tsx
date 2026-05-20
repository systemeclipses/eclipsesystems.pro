import Link from "next/link";
import { PLAN_KINDS, PLAN_PRICES, type PlanCode } from "@eclipsesystems/shared/plans";
import type { Metadata } from "next";
import { ArrowRight, Check, Clock3, FileText, Layers3, Scale, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadPlans } from "@/lib/seo/content";
import { centsToDollars } from "@/lib/money";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Eclipse Systems pricing for Timekeeping, Mission Command, Eclipse project billing, Eclipse Suite, and the Eclipse Legal add-on.",
  alternates: { canonical: "/pricing" }
};

const planCodeBySlug: Record<string, PlanCode> = {
  timekeeping: "timekeeping",
  "mission-command": "mission_command",
  eclipse: "eclipse",
  suite: "suite",
  "legal-addon": "legal_addon"
};

const cardStyles: Record<PlanCode, { label: string; icon: typeof Clock3; accent: string }> = {
  timekeeping: { label: "Time capture", icon: Clock3, accent: "bg-secondary" },
  mission_command: { label: "Operations", icon: UsersRound, accent: "bg-[#d7ddbc]" },
  eclipse: { label: "Billing", icon: FileText, accent: "bg-cream" },
  suite: { label: "Best value", icon: Layers3, accent: "bg-primary text-white" },
  legal_addon: { label: "Add-on", icon: Scale, accent: "bg-[#efe2cd]" }
};

function formatPrice(cents: number) {
  return centsToDollars(cents).replace(".00", "");
}

export default async function PricingPage() {
  const plans = await loadPlans();
  const corePlans = plans.filter((plan) => plan.slug !== "legal-addon");
  const legalPlan = plans.find((plan) => plan.slug === "legal-addon");

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="grid min-h-[360px] overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid w-full max-w-[104rem] content-center px-5 py-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-secondary">Pricing built around what your team actually needs.</p>
                <h1 className="font-title text-6xl leading-[0.88] text-cream md:text-8xl">Choose your Eclipse.</h1>
              </div>
              <div>
                <p className="max-w-4xl text-base leading-7 text-white/78 md:text-lg">
                  Start with focused timekeeping, add operations or project billing, bundle the core workspace, then layer in legal controls only when matter billing demands it.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ["14 days", "Card-required trial on every paid product."],
                    ["20%", "Annual billing discount versus monthly seats."],
                    ["2 seats", "Team organizations start with a two-seat minimum."]
                  ].map(([value, label]) => (
                    <div key={value} className="flex min-h-44 flex-col justify-between rounded-md border border-white/15 bg-white/10 p-5">
                      <p className="font-title text-5xl leading-none text-cream">{value}</p>
                      <p className="mt-6 text-sm leading-6 text-white/72">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 xl:grid-cols-4">
          {corePlans.map((plan) => {
            const code = planCodeBySlug[plan.slug];
            const price = PLAN_PRICES[code];
            const kind = PLAN_KINDS[code].replace("_", " ");
            const style = cardStyles[code];
            const Icon = style.icon;

            return (
              <section
                key={plan.slug}
                className="group flex min-h-[520px] flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs font-semibold uppercase ${style.accent}`}>
                    <Icon className="h-4 w-4" />
                    {style.label}
                  </div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{kind}</span>
                </div>

                <h2 className="mt-8 font-title text-5xl leading-none">{plan.name}</h2>
                <p className="mt-5 min-h-24 text-sm leading-6 text-muted-foreground">{plan.summary}</p>

                <div className="mt-6 border-y border-border py-5">
                  <p className="flex items-end gap-1">
                    <span className="font-title text-6xl leading-none">${formatPrice(price.monthlyCents)}</span>
                    <span className="pb-2 text-sm text-muted-foreground">/ seat</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ${formatPrice(Math.round(price.annualCents / 12))} / seat monthly when billed annually
                  </p>
                </div>

                <p className="mt-5 text-sm font-semibold">Best for</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.bestFor}</p>

                <ul className="mt-5 grid gap-2 text-sm">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-[#314839]">
                    <Link href="/signup">Start Trial <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Link href={`/plans/${plan.slug}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-primary">
                    View details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>

        <div className="my-12 overflow-hidden rounded-md bg-primary text-white">
          <div className="grid gap-4 px-6 py-6 md:grid-cols-[0.8fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Need matter-aware billing?</p>
              <h2 className="mt-2 font-title text-4xl leading-none text-cream md:text-5xl">Legal is priced after fit.</h2>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-white/75 md:justify-self-end">
              Eclipse Legal depends on firm size, billing complexity, data migration, trust workflows, and LEDES requirements. Tell us what your firm needs and we will shape the right package.
            </p>
          </div>
        </div>

        {legalPlan ? (
          <section className="grid overflow-hidden rounded-md border border-border bg-white/75 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-sm bg-[#efe2cd] px-2.5 py-1.5 text-xs font-semibold uppercase">
                  <Scale className="h-4 w-4" />
                  Legal add-on
                </div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">Contact for pricing</span>
              </div>

              <h2 className="mt-8 font-title text-6xl leading-none md:text-7xl">{legalPlan.name}</h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{legalPlan.summary}</p>

              <div className="mt-6 rounded-md border border-border bg-cream/70 p-5">
                <p className="text-sm font-semibold">Built for firms that need more than generic invoicing</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We use the contact details to understand attorney count, staff count, billing volume, migration needs, and whether trust or LEDES workflows need setup support.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {legalPlan.features.map((feature) => (
                  <div key={feature} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <form className="grid gap-4 border-t border-border bg-[#f8f3eb] p-6 md:p-8 lg:border-l lg:border-t-0">
              <div>
                <p className="font-title text-4xl leading-none">Talk with Eclipse</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Share the basics and we will follow up with the right legal billing path.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Firm name
                  <input name="firmName" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="Carter & Wells LLP" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Contact name
                  <input name="contactName" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="Jordan Carter" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Work email
                  <input name="email" type="email" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="jordan@firm.com" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Phone
                  <input name="phone" type="tel" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="205.555.0184" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold">
                  Attorneys
                  <input name="attorneys" type="number" min="1" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="12" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Total employees
                  <input name="employees" type="number" min="1" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="34" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Monthly invoices
                  <input name="monthlyInvoices" type="number" min="0" className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="80" />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                What do you need legal billing to handle?
                <textarea name="needs" className="min-h-28 rounded-md border border-border bg-white px-3 py-3 font-normal outline-none focus:border-primary" placeholder="Matters, LEDES export, UTBMS codes, trust accounting, migration from current tools..." />
              </label>

              <Button className="h-11 bg-primary text-primary-foreground hover:bg-[#314839]">
                Contact Sales <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </section>
        ) : null}
      </section>
    </main>
  );
}
