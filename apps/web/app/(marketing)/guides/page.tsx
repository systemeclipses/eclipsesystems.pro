import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Landmark, Scale } from "lucide-react";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

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
      <PublicPageHero eyebrow="Guides and operating playbooks" title="Resources That Do Real Work." description="Practical starting points for cleaner records, better reviews, stronger billing controls, and workflows your team can actually follow." image="/media/generated/heroes/resources.jpg" imageAlt="An operations leader organizing a practical workflow playbook" points={["Practical templates", "Clear checklists", "Built for operators"]} />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Resource library" title="Start with something useful." description="Open a guide, adapt the framework, and make the process your own." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link key={guide.title} href={guide.href} className="group rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-xl shadow-[#172219]/5 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12">
                <div className="flex items-start gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
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
      <PublicCta eyebrow="Need a system, not another document?" title="Turn the playbook into the workflow." primaryLabel="Schedule a Demo" primaryHref="/schedule-demo" secondaryLabel="Explore Our Systems" secondaryHref="/demos" />
    </main>
  );
}
