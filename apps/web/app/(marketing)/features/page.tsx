import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, Clock3, FileText, MessageSquareText, Scale, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadFeatures, type FeatureContent } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore Eclipse Timekeeping features for time tracking, invoicing, shifts, chat, legal billing, and reporting."
};

const featureDesign: Record<string, { label: string; icon: typeof Clock3; accent: string }> = {
  "time-tracking": { label: "Capture", icon: Clock3, accent: "bg-secondary" },
  invoicing: { label: "Bill", icon: FileText, accent: "bg-cream" },
  "shift-management": { label: "Operate", icon: UsersRound, accent: "bg-[#d7ddbc]" },
  "team-chat": { label: "Coordinate", icon: MessageSquareText, accent: "bg-[#efe2cd]" },
  "legal-billing": { label: "Legal", icon: Scale, accent: "bg-primary text-white" },
  reporting: { label: "Measure", icon: BarChart3, accent: "bg-[#dfe7cf]" }
};

const workflows = [
  ["Capture work", "Live timers, manual entries, timesheets, and approvals keep the record current."],
  ["Turn work into revenue", "Approved billable time moves into invoices, exports, payment links, and reporting."],
  ["Keep teams aligned", "Shift operations, chat, manager review, and legal workflows stay in one workspace."]
] as const;

function getDesign(feature: FeatureContent) {
  return featureDesign[feature.slug] ?? { label: "Feature", icon: Check, accent: "bg-secondary" };
}

export default async function FeaturesPage() {
  const features = await loadFeatures();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-12 md:py-16 lg:grid-cols-[0.74fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">One workspace for the work behind the numbers.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Features built for flow.</h1>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
                Eclipse connects the pieces teams usually stitch together after the fact: time, approvals, schedules, client billing, chat, legal codes, and reporting.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {workflows.map(([title, text]) => (
                  <div key={title} className="flex min-h-40 flex-col justify-between rounded-md border border-white/15 bg-white/10 p-5">
                    <p className="font-title text-3xl leading-none text-cream">{title}</p>
                    <p className="mt-5 text-sm leading-6 text-white/72">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature) => {
            const design = getDesign(feature);
            const Icon = design.icon;
            return (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group flex min-h-[420px] flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs font-semibold uppercase ${design.accent}`}>
                    <Icon className="h-4 w-4" />
                    {design.label}
                  </div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Feature</span>
                </div>

                <h2 className="mt-8 font-title text-5xl leading-none">{feature.name}</h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{feature.summary}</p>

                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-semibold">Questions this answers</p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {feature.questions.slice(0, 2).map((question) => (
                      <li key={question} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">
                  Explore feature <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-3 pb-16">
        <div className="mx-auto grid max-w-[104rem] gap-8 rounded-md bg-primary p-8 text-white md:grid-cols-[0.75fr_1fr] md:p-10">
          <div>
            <p className="text-sm font-semibold text-secondary">Designed to expand.</p>
            <h2 className="mt-4 font-title text-5xl leading-none text-cream md:text-6xl">Start narrow. Grow into the suite.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Timekeeping", "Capture accountable work first."],
              ["Operations", "Add schedules, chat, and coverage."],
              ["Legal", "Layer in matter-aware billing when needed."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-white/15 bg-white/10 p-5">
                <p className="font-title text-4xl leading-none text-cream">{title}</p>
                <p className="mt-4 text-sm leading-6 text-white/72">{text}</p>
              </div>
            ))}
          </div>
          <div className="md:col-span-2">
            <Button asChild className="bg-cream text-primary hover:bg-white">
              <Link href="/pricing">View Pricing <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
