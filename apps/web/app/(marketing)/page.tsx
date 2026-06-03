import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  PackageCheck,
  PanelsTopLeft,
  Rocket,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  UsersRound
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Eclipse Systems | Custom Software Solutions",
  description: "Custom business software, packaged systems, and production-ready modules for teams that need software built around how they actually work.",
  alternates: { canonical: "/" }
};

const modules = [
  { title: "Internal portals", text: "Intranets, knowledge bases, employee hubs, and admin workspaces.", icon: PanelsTopLeft },
  { title: "Time and billing", text: "Timekeeping, approvals, invoicing, rates, exports, and reporting.", icon: FileCheck2 },
  { title: "Training systems", text: "Onboarding, certification, policy acknowledgement, and learning paths.", icon: GraduationCap },
  { title: "Storefronts", text: "Product catalogs, checkout flows, fulfillment handoffs, and customer accounts.", icon: ShoppingBag },
  { title: "Dashboards", text: "Operational views that turn scattered work into decisions.", icon: LayoutDashboard },
  { title: "Integrations", text: "Connections between the tools your business already depends on.", icon: Settings2 }
];

const paths = [
  {
    title: "Buy a proven package",
    text: "Use an existing Eclipse system as-is when the workflow already fits. Good for teams that want a fast, lower-risk starting point.",
    icon: PackageCheck
  },
  {
    title: "Customize a package",
    text: "Start with working software, then adapt the screens, rules, roles, and integrations around your business.",
    icon: Settings2
  },
  {
    title: "Commission a bespoke build",
    text: "When your workflow is specific, we design and build the right system from the ground up using our proven foundation.",
    icon: Rocket
  }
];

const proofModules = [
  "Auth, roles, and permissions",
  "Timekeeping and approvals",
  "Invoicing and billing workflows",
  "Training and onboarding portals",
  "Storefront foundations",
  "Dashboards and reporting",
  "Admin panels and settings",
  "Third-party integrations"
];

const demoHref = "/schedule-demo";

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-md border border-white/20 bg-[#f8f3eb] text-ink shadow-2xl shadow-black/30">
      <div className="flex h-11 items-center justify-between border-b border-[#e4d7c6] bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">E</div>
          <span className="text-sm font-semibold">Eclipse Systems</span>
        </div>
        <div className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
          <span>Portal</span>
          <span>Billing</span>
          <span>Training</span>
          <span>Dashboard</span>
        </div>
        <div className="h-7 w-24 rounded-sm border border-[#ded2c2] bg-[#faf7f2]" />
      </div>

      <div className="grid min-h-[440px] grid-cols-1 md:grid-cols-[56px_1fr_260px]">
        <aside className="hidden border-r border-[#e4d7c6] bg-[#f4ebde] px-3 py-5 md:block">
          <div className="grid gap-4">
            {[LayoutDashboard, UsersRound, ClipboardList, ShoppingBag, ShieldCheck].map((Icon, index) => (
              <div key={index} className={`grid h-8 w-8 place-items-center rounded-sm ${index === 0 ? "bg-primary text-white" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
        </aside>

        <section className="p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Custom operating system</p>
              <h2 className="mt-2 font-title text-3xl leading-none text-ink md:text-5xl">
                <span className="block">Built around</span>
                <span className="block">your workflow</span>
              </h2>
            </div>
            <Button asChild className="h-8 bg-primary px-3 text-xs">
              <Link href={demoHref}>Schedule a demo</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Start point", "Package", "Ready modules"],
              ["Build path", "Custom", "Scoped to fit"],
              ["Handoff", "Working", "Real software"]
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-md border border-[#e1d5c5] bg-white p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
                <p className="mt-2 text-xs text-primary">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div className="rounded-md border border-[#e1d5c5] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Example build plan</p>
                <span className="rounded-sm bg-secondary/60 px-2 py-1 text-xs text-ink">In scope</span>
              </div>
              <div className="mt-5 grid gap-2">
                {["Discovery and workflow map", "Module selection", "Custom screens and rules", "Launch and support"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-sm bg-[#f4ebde] p-3">
                    <span className="grid h-7 w-7 place-items-center rounded-sm bg-white text-xs font-semibold text-primary">0{index + 1}</span>
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#e1d5c5] bg-[#2f4135] p-4 text-white">
              <p className="text-sm font-semibold">Module library</p>
              <div className="mt-5 space-y-3">
                {["Auth and permissions", "Billing workflow", "Training portal"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-sm bg-white/10 p-3">
                    <Check className="h-4 w-4 text-secondary" />
                    <span className="text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-sm bg-cream p-3 text-ink">
                <p className="text-xs text-muted-foreground">Engagement model</p>
                <p className="mt-2 text-3xl font-semibold">Package to custom</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="border-t border-[#e4d7c6] bg-white p-4 md:border-l md:border-t-0">
          <p className="text-sm font-semibold">Common builds</p>
          <div className="mt-4 space-y-3">
            {["Client portal", "Team intranet", "Training hub", "Operations dashboard"].map((item, index) => (
              <div key={item} className="rounded-md border border-[#e1d5c5] p-3">
                <p className="text-xs text-muted-foreground">0{index + 1}</p>
                <p className="mt-1 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto max-w-[104rem] px-5 pb-7 pt-8 md:pb-12 md:pt-16">
            <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-secondary">Custom software, without starting from zero</p>
                <h1 className="mt-5 font-title text-6xl leading-[0.86] text-cream md:text-8xl lg:text-9xl">
                  Software built around your business.
                </h1>
                <p className="mt-8 max-w-xl text-base leading-7 text-white/78 md:text-lg">
                  Eclipse Systems designs and builds bespoke systems for small and midsize teams: portals, dashboards, storefronts, training hubs, timekeeping, invoicing, and the workflows off-the-shelf software keeps missing.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="h-11 bg-cream px-5 text-primary hover:bg-white">
                    <Link href={demoHref}>Schedule a demo <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 border-white/30 bg-transparent px-5 text-white hover:bg-white/10">
                    <Link href="/pricing">See engagement options</Link>
                  </Button>
                </div>
              </div>

              <div>
                <ProductMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-8 px-5 py-16 lg:grid-cols-[0.55fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-primary">What We Build</p>
          <h2 className="mt-3 font-title text-5xl leading-none md:text-7xl">Business software that fits the way the work actually happens.</h2>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">
            We consult first, then build. The result is real software your team can use, not a strategy deck that leaves the hard part for later.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-md border border-border bg-white/55 p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-8 text-2xl font-semibold leading-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-3">
        <div className="mx-auto grid max-w-[92rem] overflow-hidden rounded-md bg-[#26352b] text-white lg:grid-cols-[0.7fr_1fr]">
          <div className="relative min-h-[440px] p-8 md:p-12">
            <div className="absolute inset-0 opacity-60 [background:linear-gradient(135deg,transparent_0_33%,rgba(249,232,210,.16)_34%_35%,transparent_36%_58%,rgba(180,194,146,.2)_59%_60%,transparent_61%),repeating-linear-gradient(0deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px)]" />
            <div className="relative max-w-xl">
              <p className="text-sm font-semibold text-secondary">How We Engage</p>
              <h2 className="mt-5 font-title text-6xl leading-none text-cream md:text-8xl">Buy it. Shape it. Build it.</h2>
              <p className="mt-6 leading-7 text-white/72">
                Eclipse is not one product. It is a software company with working systems already on the shelf, ready to use as proof, a package, or the starting point for a custom build.
              </p>
            </div>
          </div>
          <div className="grid border-t border-white/15 lg:border-l lg:border-t-0">
            {paths.map((path) => {
              const Icon = path.icon;
              return (
                <article key={path.title} className="border-b border-white/15 bg-cream/12 p-8 last:border-b-0">
                  <Icon className="h-7 w-7 text-secondary" />
                  <h3 className="mt-6 text-3xl font-semibold leading-tight text-cream">{path.title}</h3>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">{path.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Why It Is Faster</p>
            <h2 className="mt-3 font-title text-5xl leading-none md:text-7xl">A custom build with production parts already proven.</h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              We keep a library of modules built on a modern stack. That gives clients a better starting point: real examples to react to, tested foundations to build from, and a clearer path from idea to launch.
            </p>
            <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-[#314839]">
              <Link href={demoHref}>Schedule a demo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {proofModules.map((module) => (
              <div key={module} className="flex items-center gap-3 rounded-md border border-border bg-white/70 p-4">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm font-semibold">{module}</span>
              </div>
            ))}
            <div className="rounded-md bg-primary p-5 text-white sm:col-span-2">
              <Building2 className="h-6 w-6 text-secondary" />
              <p className="mt-6 text-2xl font-semibold leading-tight text-cream">Built for business owners and operations leaders who have outgrown generic tools.</p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                If the process is important enough to run the company, the software should fit the process.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
