import type { Metadata } from "next";
import { Check, ClipboardList, PackageCheck, Settings2 } from "lucide-react";
import { ScheduleDemoForm } from "@/components/marketing/schedule-demo-form";

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

export default function ScheduleDemoPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-10 md:py-14 lg:grid-cols-[0.7fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Schedule a demo</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Show us what your software needs to do.</h1>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
                Tell us about your business, your team size, and the workflow you want to fix or build. We will use that context to show the right Eclipse examples and talk through the best path forward.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Package", PackageCheck],
                  ["Customize", Settings2],
                  ["Build", ClipboardList]
                ].map(([label, Icon]) => (
                  <div key={label as string} className="rounded-md border border-white/15 bg-white/10 p-4">
                    <Icon className="h-5 w-5 text-secondary" />
                    <p className="mt-5 text-sm font-semibold text-cream">{label as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-10 px-5 py-12 lg:grid-cols-[0.6fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-primary">What happens next</p>
          <h2 className="mt-3 font-title text-5xl leading-none md:text-7xl">A useful demo starts with the real problem.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            We are not trying to force every business into the same product. The demo is a fit conversation: what can we show you, what can we reuse, and what would need to be custom.
          </p>
          <div className="mt-8 grid gap-3">
            {demoPoints.map((point) => (
              <div key={point} className="flex gap-3 rounded-md border border-border bg-white/60 p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-6">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <ScheduleDemoForm />
      </section>
    </main>
  );
}
