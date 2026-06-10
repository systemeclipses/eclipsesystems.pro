import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardList, PackageCheck, Rocket, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { packageDefinitions } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Pricing | Eclipse Systems",
  description: "Engagement options for Eclipse Systems custom software, four packaged templates, and package customization projects.",
  keywords: packageDefinitions.flatMap((pkg) => pkg.seoKeywords),
  alternates: { canonical: "/pricing" }
};

const engagementOptions = [
  {
    title: "Proven Package",
    label: "Fastest path",
    icon: PackageCheck,
    summary: "Use an existing Eclipse system as-is when the workflow already matches what your team needs.",
    bestFor: "Teams that need a practical system quickly and do not need heavy process changes.",
    includes: ["Existing production-grade module", "Standard setup and configuration", "Basic launch support", "Clear upgrade path if customization is needed"]
  },
  {
    title: "Customized Package",
    label: "Most common",
    icon: Settings2,
    summary: "Start with working software, then adapt the screens, rules, roles, data, and integrations around your business.",
    bestFor: "Operations teams that like the starting point but need the system to match their real workflow.",
    includes: ["Discovery and workflow mapping", "Module customization", "Role and permission setup", "Integration and reporting options"]
  },
  {
    title: "Bespoke Build",
    label: "Fully custom",
    icon: Rocket,
    summary: "Commission a new system designed and built for your business when no off-the-shelf tool fits.",
    bestFor: "Businesses with specific workflows, internal tools, portals, storefronts, dashboards, or automation needs.",
    includes: ["Product scoping", "UX and system design", "Custom Next.js and TypeScript build", "Launch planning and support"]
  }
];

const pricingFactors = [
  "How much of an existing Eclipse module can be reused",
  "Number and complexity of custom workflows",
  "Roles, permissions, and approval rules",
  "Data migration from spreadsheets or existing systems",
  "Third-party integrations and payment flows",
  "Reporting, dashboards, and export requirements",
  "Compliance, security, and audit needs",
  "Timeline, launch support, and ongoing maintenance"
];

const demoHref = "/schedule-demo";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="grid min-h-[360px] overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid w-full max-w-[104rem] content-center px-5 py-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-secondary">Pricing depends on the system you need</p>
                <h1 className="font-title text-6xl leading-[0.88] text-cream md:text-8xl">Start from a package or build custom.</h1>
              </div>
              <div>
                <p className="max-w-4xl text-base leading-7 text-white/78 md:text-lg">
                  Eclipse Systems is a custom software company. Some clients buy a proven package. Some customize one. Some commission a fully bespoke system. We price after we understand the workflow, reuse opportunities, integrations, and launch path.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ["1", "Discovery call to understand the workflow and business goal."],
                    ["2", "Recommendation: package, customization, or bespoke build."],
                    ["3", "Scoped proposal with timeline, responsibilities, and price."]
                  ].map(([value, label]) => (
                    <div key={value} className="flex min-h-40 flex-col justify-between rounded-md border border-white/15 bg-white/10 p-5">
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
        <div className="grid gap-5 lg:grid-cols-3">
          {engagementOptions.map((option) => {
            const Icon = option.icon;

            return (
              <section
                key={option.title}
                className="flex min-h-[520px] flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-sm bg-secondary px-2.5 py-1.5 text-xs font-semibold uppercase text-white">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Scoped quote</span>
                </div>

                <h2 className="mt-8 font-title text-5xl leading-none">{option.title}</h2>
                <p className="mt-5 min-h-24 text-sm leading-6 text-muted-foreground">{option.summary}</p>

                <div className="mt-6 border-y border-border py-5">
                  <p className="font-title text-5xl leading-none">Priced after fit</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    We quote the work after discovery so the price matches the actual system, not a generic seat grid.
                  </p>
                </div>

                <p className="mt-5 text-sm font-semibold">Best for</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.bestFor}</p>

                <ul className="mt-5 grid gap-2 text-sm">
                  {option.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-[#314839]">
                    <Link href={demoHref}>Schedule a demo <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </section>
            );
          })}
        </div>

        <section className="my-12 grid overflow-hidden rounded-md bg-primary text-white lg:grid-cols-[0.74fr_1fr]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-semibold text-secondary">What affects price</p>
            <h2 className="mt-3 font-title text-5xl leading-none text-cream md:text-6xl">The quote follows the work.</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/72">
              A package rollout, a customized operations portal, and a new system from scratch should not be priced the same way. We scope the work first so the project is clear before anyone commits.
            </p>
          </div>
          <div className="grid gap-px bg-white/15 p-px sm:grid-cols-2">
            {pricingFactors.map((factor) => (
              <div key={factor} className="flex gap-3 bg-primary/90 p-5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <p className="text-sm leading-6 text-white/75">{factor}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Packages</p>
            <h2 className="mt-3 font-title text-5xl leading-none md:text-7xl">Start from one of four templates.</h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              Existing Eclipse work can serve as a live demo, a ready-to-buy package, or the foundation for a custom system. Operations Hub, Client Portal, CRM & Sales Pipeline, and Storefront are the four package starting points.
            </p>
            <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-[#314839]">
              <Link href={demoHref}>Schedule a demo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {packageDefinitions.map((pkg) => (
              <article key={pkg.slug} className="rounded-md border border-border bg-white/70 p-5">
                <div className="flex items-start gap-4">
                  <ClipboardList className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">{pkg.name}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-primary">{pkg.tagline}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{pkg.description}</p>
                    {pkg.moduleNote ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{pkg.moduleNote}</p> : null}
                    {pkg.worksWith ? <p className="mt-3 rounded-sm bg-secondary/25 px-3 py-2 text-xs font-semibold leading-5 text-primary">Works with {pkg.worksWith.packageName}: {pkg.worksWith.copy}</p> : null}
                    <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      {pkg.features.slice(0, 6).map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-md border border-border bg-white/70 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[0.75fr_1fr] md:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">Not sure which path fits?</p>
              <h2 className="mt-2 font-title text-5xl leading-none">That is what discovery is for.</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Tell us what your team is trying to fix, what tools you use now, and where the process breaks. We will tell you whether a package, customization, or bespoke build is the honest fit.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
