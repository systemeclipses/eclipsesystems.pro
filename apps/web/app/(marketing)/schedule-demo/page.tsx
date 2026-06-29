import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ScheduleDemoForm } from "@/components/marketing/schedule-demo-form";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Schedule a Demo | Eclipse Systems",
  description: "Schedule an Eclipse Systems demo for custom software, packaged systems, and workflow-specific business tools.",
  alternates: { canonical: "/schedule-demo" }
};

const demoPoints = [
  "See relevant Eclipse modules and examples",
  "Talk through your workflow and current tools",
  "Identify whether a package, customization, or bespoke build fits",
  "Leave with a clearer next step before a proposal"
];

export default function ScheduleDemoPage({ searchParams }: { searchParams?: { demo?: string } }) {
  const selectedDemo = searchParams?.demo ?? "";

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Schedule a demo" title="Show Us What the System Needs to Do." description="Tell us about your business, your team, and the workflow you want to fix or build. We will use that context to show the right Eclipse examples and talk through the clearest path forward." image="/media/generated/heroes/discovery.jpg" imageAlt="A team mapping its workflow during a discovery workshop" points={["See a relevant starting point", "Talk through the real workflow", "Leave with a clearer next step"]} />

      <section className="mx-auto grid max-w-[100rem] gap-12 px-5 py-16 md:py-24 lg:grid-cols-[0.72fr_1fr]">
        <div>
          <PublicSectionHeading eyebrow="What happens next" title="A useful demo starts with the real problem." description="This is a fit conversation: what can we show you, what can we reuse, and what genuinely needs to be custom." />
          <div className="mt-8 grid gap-3">
            {demoPoints.map((point) => (
              <div key={point} className="flex gap-3 rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-6">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <ScheduleDemoForm selectedDemo={selectedDemo} />
      </section>
    </main>
  );
}
