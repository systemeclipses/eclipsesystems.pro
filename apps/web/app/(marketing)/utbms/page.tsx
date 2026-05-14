import type { Metadata } from "next";
import Link from "next/link";
import { CitationBlock } from "@/components/seo/citation-block";
import { FAQ } from "@/components/seo/faq";
import { loadUtbmsCodes } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "UTBMS Code Reference",
  description: "A practical UTBMS task, activity, and expense code reference for legal billing teams."
};

export default async function UtbmsPage() {
  const codes = await loadUtbmsCodes();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">UTBMS Code Reference for Legal Billing</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">UTBMS codes classify legal work by task, activity, and expense so firms and clients can review invoices consistently.</p>
      <CitationBlock source="LEDES Oversight Committee UTBMS resources" url="https://ledes.org/" accessedOn="2026-05-13" />
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {codes.map((entry) => (
          <Link key={entry.code} href={`/utbms/${entry.code.toLowerCase()}`} className="rounded-lg border border-border p-4 hover:bg-muted/40">
            <h2 className="font-semibold">{entry.code}: {entry.task}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entry.category}</p>
          </Link>
        ))}
      </div>
      <FAQ items={[
        { question: "What does UTBMS stand for?", answer: "UTBMS stands for Uniform Task-Based Management System." },
        { question: "Does Eclipse Timekeeping support UTBMS codes?", answer: "Yes. Eclipse Timekeeping Legal supports UTBMS task and activity codes for matter-aware time entries and invoices." },
        { question: "Is UTBMS the same as LEDES?", answer: "No. UTBMS is a code system. LEDES is a set of electronic invoice exchange formats that can include UTBMS-coded line items." }
      ]} />
    </main>
  );
}
