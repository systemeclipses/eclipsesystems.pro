import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock3, FileCheck2, LayoutDashboard, MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/seo/faq";
import { loadFeatures } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Eclipse Systems",
  description: "Timekeeping, invoicing, shift operations, chat, and legal billing add-ons for U.S. small businesses, law firms, and shift teams.",
  alternates: { canonical: "/" }
};

const metrics = [
  { label: "Hours tracked", value: "2.4m" },
  { label: "Invoices drafted", value: "96k" },
  { label: "Teams aligned", value: "70k+" }
];

const workflows = [
  {
    title: "Capture time as work happens",
    text: "Timers, notes, projects, matters, shifts, and approvals stay in one workspace.",
    icon: Clock3
  },
  {
    title: "Turn approved work into clean billing",
    text: "Draft invoices from time, rates, matters, and project budgets without spreadsheet cleanup.",
    icon: FileCheck2
  },
  {
    title: "Keep operators in motion",
    text: "Mission Command brings schedules, swaps, team chat, and reporting into daily view.",
    icon: UsersRound
  },
  {
    title: "Add legal depth when it matters",
    text: "UTBMS, LEDES, realization, trust-aware workflows, and matter billing are ready for law firms.",
    icon: ShieldCheck
  }
];

function ProductMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-md border border-white/20 bg-[#f8f3eb] text-ink shadow-2xl shadow-black/30">
      <div className="flex h-11 items-center justify-between border-b border-[#e4d7c6] bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">E</div>
          <span className="text-sm font-semibold">Eclipse Suite</span>
        </div>
        <div className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
          <span>Timer</span>
          <span>Timesheet</span>
          <span>Billing</span>
          <span>Mission Command</span>
        </div>
        <div className="h-7 w-24 rounded-sm border border-[#ded2c2] bg-[#faf7f2]" />
      </div>

      <div className="grid min-h-[440px] grid-cols-1 md:grid-cols-[56px_1fr_260px]">
        <aside className="hidden border-r border-[#e4d7c6] bg-[#f4ebde] px-3 py-5 md:block">
          <div className="grid gap-4">
            {[LayoutDashboard, Clock3, FileCheck2, MessageSquareText, ShieldCheck].map((Icon, index) => (
              <div key={index} className={`grid h-8 w-8 place-items-center rounded-sm ${index === 0 ? "bg-primary text-white" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
        </aside>

        <section className="p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Live workspace</p>
              <h2 className="mt-2 font-title text-3xl leading-none text-ink md:text-5xl">
                <span className="block">Operations</span>
                <span className="block">Dashboard</span>
              </h2>
            </div>
            <Button asChild className="h-8 bg-primary px-3 text-xs">
              <Link href="/signup">Start trial</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Billable hours", "128.5", "+12%"],
              ["Open invoices", "$42.8k", "9 drafts"],
              ["Shift coverage", "94%", "3 alerts"]
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
                <p className="text-sm font-semibold">Weekly timesheet</p>
                <span className="rounded-sm bg-secondary/60 px-2 py-1 text-xs text-ink">Ready for review</span>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {days.map((day, index) => (
                  <div key={day} className="rounded-sm bg-[#f4ebde] p-2">
                    <p className="text-xs text-muted-foreground">{day}</p>
                    <div className="mt-8 h-24 rounded-sm bg-white">
                      <div className="rounded-sm bg-primary" style={{ height: `${52 + index * 8}%` }} />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{6 + index}.0h</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#e1d5c5] bg-[#2f4135] p-4 text-white">
              <p className="text-sm font-semibold">Mission Command</p>
              <div className="mt-5 space-y-3">
                {["North crew swap approved", "Matter review due today", "Invoice batch generated"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-sm bg-white/10 p-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-secondary" : "bg-cream"}`} />
                    <span className="text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-sm bg-cream p-3 text-ink">
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="mt-2 text-3xl font-semibold">87%</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="border-t border-[#e4d7c6] bg-white p-4 md:border-l md:border-t-0">
          <p className="text-sm font-semibold">Today</p>
          <div className="mt-4 space-y-3">
            {["Timer running", "Client invoice sent", "Shift gap filled", "Legal code reviewed"].map((item, index) => (
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

export default async function LandingPage() {
  const features = await loadFeatures();
  const featured = features.slice(0, 3);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto max-w-[104rem] px-5 pb-7 pt-8 md:pb-12 md:pt-16">
            <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-secondary">Timekeeping, billing, shifts, and legal workflows</p>
                <h1 className="mt-5 font-title text-6xl leading-[0.86] text-cream md:text-8xl lg:text-9xl">
                  Work in one Eclipse.
                </h1>
                <p className="mt-8 max-w-xl text-base leading-7 text-white/78 md:text-lg">
                  Run time, projects, invoices, shift operations, chat, and matter billing in a workspace that shows the work as clearly as the numbers behind it.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="h-11 bg-cream px-5 text-primary hover:bg-white">
                    <Link href="/signup">Start trial <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 border-white/30 bg-transparent px-5 text-white hover:bg-white/10">
                    <Link href="/pricing">View pricing</Link>
                  </Button>
                </div>
              </div>

              <div>
                <ProductMockup />
              </div>
            </div>

            <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-white/15 bg-white/15 md:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-primary/80 p-5">
                  <p className="font-title text-5xl leading-none text-cream">{metric.value}</p>
                  <p className="mt-2 text-sm text-white/70">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-8 px-5 py-16 lg:grid-cols-[0.55fr_1fr]">
        <div>
          <h2 className="font-title text-5xl leading-none md:text-7xl">Operational flow, without the friction</h2>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">
            Eclipse keeps the daily work close to the financial record, so teams can move from timer to approval to invoice without switching context.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {workflows.map((item) => {
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
        <div className="mx-auto grid max-w-[92rem] overflow-hidden rounded-md bg-[#26352b] text-white lg:grid-cols-[1fr_0.48fr]">
          <div className="relative min-h-[520px] p-8 md:p-12">
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_18%_18%,#b4c292_0_8%,transparent_9%),linear-gradient(135deg,transparent_0_33%,rgba(249,232,210,.16)_34%_35%,transparent_36%_58%,rgba(180,194,146,.2)_59%_60%,transparent_61%),repeating-linear-gradient(0deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,rgba(249,232,210,.06)_0_1px,transparent_1px_42px)]" />
            <div className="relative max-w-xl">
              <p className="text-sm font-semibold text-secondary">Our impact</p>
              <h2 className="mt-5 font-title text-6xl leading-none text-cream md:text-8xl">Results that move with purpose.</h2>
              <p className="mt-6 leading-7 text-white/72">
                The app connects what people do every day with the operating signals leaders need: capacity, revenue, coverage, utilization, and compliance.
              </p>
            </div>
          </div>
          <div className="grid border-t border-white/15 lg:border-l lg:border-t-0">
            {metrics.map((metric) => (
              <div key={metric.label} className="border-b border-white/15 bg-cream/12 p-8 last:border-b-0">
                <p className="font-title text-7xl leading-none text-cream">{metric.value}</p>
                <p className="mt-5 text-sm text-white/70">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-16">
        <div className="max-w-2xl">
          <h2 className="font-title text-5xl leading-none md:text-7xl">Three ways in. One way forward.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            Choose the surface your team needs now, then expand without rebuilding the workflow.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featured.map((feature) => (
            <Link key={feature.slug} href={`/features/${feature.slug}`} className="group rounded-md border border-border bg-white/60 p-6 transition hover:bg-white">
              <p className="text-xs font-semibold uppercase text-primary">Currently available</p>
              <h3 className="mt-3 font-title text-5xl leading-none">{feature.name}</h3>
              <p className="mt-5 min-h-24 text-sm leading-6 text-muted-foreground">{feature.summary}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-3 pb-16">
        <div className="mx-auto grid max-w-[92rem] gap-10 rounded-md bg-primary p-8 text-white md:grid-cols-[0.85fr_1.15fr] md:p-12">
          <div>
            <h2 className="font-title text-5xl leading-none text-cream md:text-6xl">Designed for flow. Built for the field.</h2>
            <Button asChild className="mt-10 bg-cream text-primary hover:bg-white">
              <Link href="/signup">Start trial</Link>
            </Button>
          </div>
          <blockquote className="text-3xl leading-tight text-cream md:text-4xl">
            "Eclipse gives teams one operating surface for time, billing, shifts, and client work - without losing the detail that keeps the business honest."
            <footer className="mt-8 text-sm text-white/65">Eclipse Systems product team</footer>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 pb-16">
        <FAQ items={[
          { question: "Is Eclipse Timekeeping by Eclipse Systems the same as the Eclipse IDE Timekeeper plugin?", answer: "No. Eclipse Timekeeping by Eclipse Systems is a SaaS timekeeping platform for businesses. It is not the Eclipse IDE Timekeeper open-source plugin, Total Eclipse court reporting software, or TimeCamp's Eclipse integration." },
          { question: "How much does Eclipse cost?", answer: "Eclipse Timekeeping starts at $10 per seat per month. Mission Command is $18, Eclipse project billing is $22, Eclipse Suite is $38, and Eclipse Legal is a $20 add-on. Annual billing reduces the effective monthly seat price by 20 percent." },
          { question: "Who is Eclipse Timekeeping built for?", answer: "Eclipse Timekeeping is built for U.S. small businesses, law firms, professional services teams, restaurants, construction teams, and shift-based operators." }
        ]} />
      </section>
    </main>
  );
}
