import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Landmark, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Guides & Templates",
  description: "Evergreen guides and templates for timekeeping, billable hours, LEDES, UTBMS, trust accounting, and shift policies."
};

const guides = [
  { title: "Billable Hours Field Guide", text: "How to capture, approve, and invoice time without reconstructing the week.", icon: ClipboardList, href: "/glossary/billable-hours" },
  { title: "Invoice Review Checklist", text: "A template for catching rate, scope, and approval issues before invoices go out.", icon: FileText, href: "/invoice-template" },
  { title: "UTBMS Starter Map", text: "A practical guide to legal task codes, descriptions, and review patterns.", icon: Scale, href: "/utbms" },
  { title: "Trust Ledger Basics", text: "What small firms should separate before matter billing gets messy.", icon: Landmark, href: "/features/legal-billing" }
] as const;

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Guides, templates, and operating playbooks.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Resources that do work.</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              Use these as starting points for cleaner timesheets, better invoice review, legal billing setup, and shift policies your team can actually follow.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link key={guide.title} href={guide.href} className="group rounded-md border border-border bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20">
                <div className="flex items-start gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-title text-4xl leading-none">{guide.title}</h2>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{guide.text}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Open guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
