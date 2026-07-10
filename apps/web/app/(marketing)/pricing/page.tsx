import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardList, PackageCheck, Rocket, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { packageDefinitions } from "@/lib/packages";
import { PublicPageHero } from "@/components/marketing/public-page";

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

const pricingSegments = [
  {
    label: "01",
    title: "Starting point",
    items: ["Existing package fit", "Reusable screens and data models", "Configuration before custom build"]
  },
  {
    label: "02",
    title: "Workflow shape",
    items: ["Custom approvals and rules", "Roles, permissions, and handoffs", "Dashboards, exports, and reporting"]
  },
  {
    label: "03",
    title: "Connection work",
    items: ["Data migration from current tools", "Third-party integrations", "Payment and billing flows"]
  },
  {
    label: "04",
    title: "Launch path",
    items: ["Timeline and rollout support", "Security and compliance needs", "Ongoing maintenance expectations"]
  }
];

const demoHref = "/contact";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero
        height="medium"
        eyebrow=""
        title={"Start Proven. Customize\u00A0What\u00A0Matters."}
        titleTopClassName="mt-8"
        description="Use an existing Eclipse system, adapt a working foundation, or commission a bespoke build. We price after understanding the workflow, reuse opportunities, integrations, and launch path."
        image="/media/generated/heroes/engagements.jpg"
        imageAlt="Connected Eclipse commerce and operations modules"
        points={["Proven packages", "Custom adaptations", "Bespoke systems"]}
      />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <div>
          <h2 className="font-title text-[clamp(3.6rem,6.3vw,6.7rem)] leading-[0.88] text-[#172219] lg:whitespace-nowrap">The price follows the project.</h2>
          <p className="mt-6 max-w-5xl text-base font-semibold leading-7 text-[#314839]/72 md:text-lg">
            Every engagement starts with fit, then moves into a clear scope, timeline, and price.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {engagementOptions.map((option) => {
            const Icon = option.icon;

            return (
              <section
                key={option.title}
                className="flex min-h-[540px] flex-col rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-xl shadow-[#172219]/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold uppercase text-white">
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

        <section className="pricing-pulse-panel my-16 grid overflow-hidden rounded-[2rem] border border-[#b4c292]/30 p-1 text-white shadow-2xl shadow-[#172219]/20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between p-6 md:p-8 lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b4c292]">What shapes the scope</p>
              <h2 className="mt-4 max-w-3xl font-title text-5xl leading-none text-[#f9e8d2] md:text-6xl">Clear scope before a clean number.</h2>
              <p className="mt-6 max-w-2xl text-sm font-semibold leading-6 text-[#f9e8d2]/72">
                We separate the parts we can reuse from the parts that need to be designed around your team. That keeps pricing tied to the real build, not a guess dressed up as a package.
              </p>
            </div>
            <div className="mt-8 rounded-[1.25rem] border border-[#f9e8d2]/15 bg-[#172219]/42 p-5 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b4c292]">Discovery output</p>
              <p className="mt-2 text-sm leading-6 text-[#f9e8d2]/76">
                A recommended path, scoped phases, practical timeline, and the pricing logic behind the work.
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-3 md:grid-cols-2 md:p-4 lg:p-5">
            {pricingSegments.map((segment) => (
              <div key={segment.title} className="rounded-[1.35rem] border border-[#f9e8d2]/12 bg-[#172219]/58 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-title text-3xl leading-none text-[#f9e8d2]">{segment.title}</h3>
                  <span className="rounded-full bg-[#b4c292] px-3 py-1 text-xs font-black text-[#172219]">{segment.label}</span>
                </div>
                <ul className="mt-5 grid gap-3">
                  {segment.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#f9e8d2]/74">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#b4c292]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid items-stretch gap-8 lg:grid-cols-[1fr_0.65fr] lg:gap-12">
          <div className="flex h-full flex-col lg:order-2">
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
            <div className="relative mt-8 min-h-[34rem] flex-1 overflow-hidden rounded-[2rem] border border-[#d8d0c1] bg-[#172219] shadow-2xl shadow-[#172219]/14">
              <Image
                src="/media/generated/pricing/templates-hero-card.png"
                alt="Four modular Eclipse software templates connected in a polished operations workspace"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172219]/45 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-[1.2rem] border border-[#f9e8d2]/16 bg-[#172219]/62 p-4 text-[#f9e8d2] backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b4c292]">Template foundation</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#f9e8d2]/82">Pick the closest starting point, then shape the screens, rules, and handoffs around the way your team actually works.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:order-1">
            {packageDefinitions.map((pkg) => (
              <article key={pkg.slug} className="rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6">
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

        <section className="mt-16 rounded-[2rem] border border-[#cbd3b0] bg-[#eef1e5] p-7 md:p-10">
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
