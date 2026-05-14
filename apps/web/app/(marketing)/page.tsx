import Link from "next/link";
import type { Metadata } from "next";
import { Clock, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/seo/faq";
import { loadFeatures } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Eclipse Timekeeping by Eclipse Systems",
  description: "Time tracking, invoicing, shift management, and legal billing software for U.S. small businesses, law firms, and shift teams.",
  alternates: { canonical: "/" }
};

export default async function LandingPage() {
  const features = await loadFeatures();

  return (
    <main className="min-h-screen">
      <section className="border-b border-border bg-muted/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Eclipse Systems</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal md:text-6xl">Timekeeping for teams that bill carefully.</h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Live timers, approvals, invoicing, shift operations, chat, legal billing, and trust accounting in one tenant-safe workspace.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild><Link href="/signup">Start trial</Link></Button>
              <Button asChild variant="outline"><Link href="/pricing">Pricing</Link></Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="grid gap-3">
              {[Clock, FileText, ShieldCheck].map((Icon, index) => (
                <div key={index} className="flex items-center gap-3 rounded-md border border-border p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold">What does Eclipse Timekeeping include?</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.slug} href={`/features/${feature.slug}`} className="rounded-lg border border-border p-5 hover:bg-muted/40">
              <h3 className="font-semibold">{feature.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.summary}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <FAQ items={[
          { question: "Is Eclipse Timekeeping by Eclipse Systems the same as the Eclipse IDE Timekeeper plugin?", answer: "No. Eclipse Timekeeping by Eclipse Systems is a SaaS timekeeping platform for businesses. It is not the Eclipse IDE Timekeeper open-source plugin, Total Eclipse court reporting software, or TimeCamp's Eclipse integration." },
          { question: "How much does Eclipse Timekeeping cost?", answer: "Eclipse Timekeeping starts at $10 per seat per month for Starter. Pro is $18, Business is $28, and Legal is $55 per seat per month. Annual billing reduces the effective monthly seat price by 20 percent." },
          { question: "Who is Eclipse Timekeeping built for?", answer: "Eclipse Timekeeping is built for U.S. small businesses, law firms, professional services teams, restaurants, construction teams, and shift-based operators." }
        ]} />
      </section>
    </main>
  );
}
