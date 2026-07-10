import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoLibrary } from "@/components/marketing/demo-library";

export const metadata: Metadata = {
  title: "Demo Environments | Eclipse Systems",
  description: "Explore detailed previews of Eclipse Systems operations, client portal, CRM, and storefront environments.",
  alternates: { canonical: "/demos" }
};

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] text-[#172219]">
      <DemoLibrary />

      <section className="px-3 py-14">
        <div className="mx-auto grid max-w-[100rem] gap-8 rounded-[2rem] bg-[#314839] px-7 py-10 text-[#f9e8d2] md:px-12 md:py-14 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#b4c292]">See your workflow here</p>
            <h2 className="mt-3 max-w-5xl font-title text-[clamp(3.2rem,5vw,6.3rem)] leading-[0.88]">
              Bring us the process. We will show you the right starting point.
            </h2>
          </div>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#f9e8d2] px-6 py-3 text-sm font-bold text-[#314839] transition hover:bg-white">
            Schedule a demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
