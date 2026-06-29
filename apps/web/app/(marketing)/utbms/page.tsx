import type { Metadata } from "next";
import Link from "next/link";
import { CitationBlock } from "@/components/seo/citation-block";
import { FAQ } from "@/components/seo/faq";
import { loadUtbmsCodes } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "UTBMS Code Reference",
  description: "A practical UTBMS task, activity, and expense code reference for legal billing teams."
};

export default async function UtbmsPage() {
  const codes = await loadUtbmsCodes();
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Legal billing reference" title="UTBMS Codes, Made Practical." description="A clear reference for classifying legal work by task, activity, and expense so firms and clients can review invoices consistently." image="/media/generated/heroes/billing-legal.jpg" imageAlt="A legal billing professional reviewing structured matter records" points={["Task codes", "Practical examples", "Common misuses"]} />
      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
      <PublicSectionHeading eyebrow="Code reference" title="Find the work. Use the right code." />
      <CitationBlock source="LEDES Oversight Committee UTBMS resources" url="https://ledes.org/" accessedOn="2026-05-13" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {codes.map((entry) => (
          <Link key={entry.code} href={`/utbms/${entry.code.toLowerCase()}`} className="min-w-0 rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 transition hover:-translate-y-1 hover:shadow-xl">
            <h2 className="font-title text-3xl leading-none [overflow-wrap:anywhere]">{entry.code}: {entry.task}</h2>
            <p className="mt-3 text-sm font-semibold text-[#314839]/60">{entry.category}</p>
          </Link>
        ))}
      </div>
      <FAQ items={[
        { question: "What does UTBMS stand for?", answer: "UTBMS stands for Uniform Task-Based Management System." },
        { question: "Does Eclipse Timekeeping support UTBMS codes?", answer: "Yes. Eclipse Timekeeping Legal supports UTBMS task and activity codes for matter-aware time entries and invoices." },
        { question: "Is UTBMS the same as LEDES?", answer: "No. UTBMS is a code system. LEDES is a set of electronic invoice exchange formats that can include UTBMS-coded line items." }
      ]} />
      </section>
    </main>
  );
}
