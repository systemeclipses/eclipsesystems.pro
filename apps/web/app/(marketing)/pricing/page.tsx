import { PLAN_PRICES } from "@eclipsesystems/shared/plans";
import type { Metadata } from "next";
import { FAQ } from "@/components/seo/faq";
import { centsToDollars } from "@/lib/money";

const names = { starter: "Starter", pro: "Pro", business: "Business", legal: "Legal" } as const;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Eclipse Timekeeping pricing starts at $10 per seat per month, with Pro, Business, and Legal plans for invoicing, shifts, and legal billing.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Eclipse Timekeeping by Eclipse Systems Pricing</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {Object.entries(PLAN_PRICES).map(([code, price]) => (
          <section key={code} className="rounded-lg border border-border p-5">
            <h2 className="text-xl font-semibold">{names[code as keyof typeof names]}</h2>
            <p className="mt-3 text-2xl font-semibold">${centsToDollars(price.monthlyCents)}<span className="text-sm text-muted-foreground"> / seat</span></p>
            <p className="text-sm text-muted-foreground">${centsToDollars(Math.round(price.annualCents / 12))} / seat monthly when billed annually</p>
            <p className="mt-4 text-sm">14-day trial. Card required.</p>
          </section>
        ))}
      </div>
      <FAQ items={[
        { question: "Does Eclipse Timekeeping have a free plan?", answer: "No. Eclipse Timekeeping does not have a free plan. Every paid plan includes a 14-day card-required trial." },
        { question: "What is the annual discount?", answer: "Annual billing is priced at 20 percent off the monthly seat price." },
        { question: "What is the minimum seat count?", answer: "Team organizations have a two-seat minimum. Personal organizations are the application-layer exception and use one seat." }
      ]} />
    </main>
  );
}
