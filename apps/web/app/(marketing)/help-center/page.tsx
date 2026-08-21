import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, FileText, ShieldCheck, TimerReset, UsersRound } from "lucide-react";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Help center resources for Eclipse Systems timekeeping, billing, operations, and legal workflows."
};

const topics = [
  { title: "Timers and timesheets", text: "Starting timers, submitting weeks, approvals, and edits.", icon: TimerReset },
  { title: "Invoices and payments", text: "Draft invoices, exports, payment links, and billing review.", icon: FileText },
  { title: "Schedules and swaps", text: "Marketplace shifts, swaps, manager approval, and coverage.", icon: UsersRound },
  { title: "Roles and access", text: "Owners, admins, managers, members, and tenant-safe data.", icon: ShieldCheck }
] as const;

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Answers without the maze" title="Eclipse Help Center." description="Find the workflow, fix the snag, and get back to the work. Clear guidance for the people using the system every day." image="/media/generated/heroes/support.jpg" imageAlt="A support specialist helping an operations manager resolve a workflow" points={["Workflow help", "Access guidance", "Human support"]} />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Browse support" title="Start with the part that is stuck." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link key={topic.title} href="/blog" className="group rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-8 font-title text-4xl leading-none">{topic.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{topic.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Browse help <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-[2rem] bg-primary p-7 text-white md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <CircleHelp className="mt-1 h-5 w-5 text-secondary" />
              <div>
                <p className="font-title text-4xl leading-none text-cream">Need a human?</p>
                <p className="mt-2 text-sm text-white/72">Send us the question and the workspace context. We will point you in the right direction.</p>
              </div>
            </div>
            <a href="mailto:info@eclipsesystems.pro" className="text-sm font-semibold text-cream hover:text-white">info@eclipsesystems.pro</a>
          </div>
        </div>
      </section>
    </main>
  );
}
