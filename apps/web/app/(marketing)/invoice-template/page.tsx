import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Invoice Template",
  description: "A practical invoice template and review checklist for teams billing from approved time."
};

const checklist = [
  "Confirm client, project, matter, or engagement name.",
  "Review approved billable time before totals are calculated.",
  "Check rates, fixed-fee scope, taxes, and payment terms.",
  "Attach supporting notes for client-facing line items.",
  "Send only after owner, manager, or attorney review."
] as const;

export default function InvoiceTemplatePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.74fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Template for billing from real work.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Invoice Template</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              A simple structure for turning approved time into invoices that are easier to review, explain, and collect.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[104rem] gap-6 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-md border border-border bg-white/70 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="font-title text-4xl leading-none">Review checklist</h2>
          </div>
          <ul className="mt-6 grid gap-3">
            {checklist.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-[#314839]">
            <Link href="/signup">Build invoices in Eclipse <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="rounded-md border border-border bg-white p-6 shadow-2xl shadow-primary/10">
          <div className="flex justify-between border-b border-border pb-5">
            <div>
              <p className="font-title text-4xl leading-none">Invoice</p>
              <p className="mt-2 text-sm text-muted-foreground">Eclipse Systems template</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">INV-0042<br />Due Net 15</p>
          </div>
          <div className="mt-6 grid gap-3 text-sm">
            {[
              ["Discovery and project setup", "4.5h", "$675"],
              ["Client review meeting", "1.0h", "$150"],
              ["Implementation work", "12.0h", "$1,800"]
            ].map(([task, hours, amount]) => (
              <div key={task} className="grid grid-cols-[1fr_70px_80px] gap-3 rounded-sm bg-cream/70 p-3">
                <span>{task}</span>
                <span>{hours}</span>
                <span className="text-right font-semibold">{amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="w-48 rounded-sm bg-primary p-4 text-cream">
              <p className="text-sm">Total</p>
              <p className="font-title text-4xl leading-none">$2,625</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
