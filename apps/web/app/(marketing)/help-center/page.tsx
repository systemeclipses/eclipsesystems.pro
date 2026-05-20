import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, FileText, ShieldCheck, TimerReset, UsersRound } from "lucide-react";

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
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto max-w-[104rem] px-5 py-12 md:py-16">
            <p className="text-sm font-semibold text-secondary">Answers without the maze.</p>
            <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Help Center</h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              Find the workflow, fix the snag, and get back to the work. The good kind of boring support.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link key={topic.title} href="/guides" className="group rounded-md border border-border bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20">
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
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

        <div className="mt-8 rounded-md bg-primary p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <CircleHelp className="mt-1 h-5 w-5 text-secondary" />
              <div>
                <p className="font-title text-4xl leading-none text-cream">Need a human?</p>
                <p className="mt-2 text-sm text-white/72">Send us the question and the workspace context. We will point you in the right direction.</p>
              </div>
            </div>
            <a href="mailto:help@eclipsesystems.pro" className="text-sm font-semibold text-cream hover:text-white">help@eclipsesystems.pro</a>
          </div>
        </div>
      </section>
    </main>
  );
}
