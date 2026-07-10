import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  PanelsTopLeft,
  UsersRound,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadFeatures, type FeatureContent } from "@/lib/seo/content";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Features | Eclipse Systems",
  description: "Explore Eclipse Systems features for custom software builds, customer invoice payments, PayPal invoicing, portals, operations tools, CRM workflows, storefronts, and reporting.",
  alternates: { canonical: "/features" }
};

const featureDesign: Record<string, { label: string; icon: typeof LayoutDashboard; accent: string }> = {
  "custom-software": { label: "Build", icon: PanelsTopLeft, accent: "bg-primary text-white" },
  "customer-payments": { label: "Pay", icon: CreditCard, accent: "bg-secondary text-white" },
  "paypal-invoicing": { label: "Invoice", icon: WalletCards, accent: "bg-[#d7ddbc]" },
  "client-portals": { label: "Portal", icon: UsersRound, accent: "bg-[#efe2cd]" },
  "operations-back-office": { label: "Operate", icon: ClipboardList, accent: "bg-[#dfe7cf]" },
  "crm-to-billing": { label: "Sell", icon: BriefcaseBusiness, accent: "bg-cream" },
  "storefront-commerce": { label: "Commerce", icon: Package, accent: "bg-[#e9dfd0]" },
  "reporting-automation": { label: "Measure", icon: BarChart3, accent: "bg-[#314839] text-white" }
};

const workflows = [
  ["Customers pay", "A public Pay Invoice page gives customers a direct path from invoice number to PayPal checkout."],
  ["Admins collect", "Internal billing tools create, send, and track invoices without making customers log into the admin app."],
  ["Systems connect", "Portals, CRM, operations, storefronts, and reporting can share the same customer and billing record."]
] as const;

const capabilityGroups = [
  {
    title: "Customer-facing",
    text: "Payment pages, client portals, storefronts, account areas, files, messages, and service requests."
  },
  {
    title: "Internal operations",
    text: "Billing desks, staff workflows, scheduling, documents, tickets, approvals, training, dashboards, and controls."
  },
  {
    title: "Custom build path",
    text: "Start from an existing Eclipse system when it fits, customize it when close, or build bespoke when the workflow demands it."
  }
] as const;

function getDesign(feature: FeatureContent) {
  return featureDesign[feature.slug] ?? { label: "Feature", icon: Check, accent: "bg-secondary text-white" };
}

export default async function FeaturesPage() {
  const features = await loadFeatures();

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero
        eyebrow="Custom software capabilities"
        title="Features Built Around Real Work."
        description="Eclipse builds the practical layer between your team and your customers: payments, portals, operations tools, storefronts, CRM handoffs, reporting, and automation designed around how the business actually runs."
        image="/media/generated/heroes/capabilities.jpg"
        imageAlt="Connected Eclipse operations dashboards"
        points={workflows.map(([title]) => title)}
        actions={
          <>
            <Link href="/demos" className="rounded-full bg-[#f9e8d2] px-6 py-3 text-sm font-bold text-[#314839]">Explore Our Systems</Link>
            <Link href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white">Schedule a Demo</Link>
          </>
        }
      />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="What we build" title="The useful parts, connected." description="Choose the capabilities your workflow needs now, then connect the rest as your team grows." />
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {features.map((feature) => {
            const design = getDesign(feature);
            const Icon = design.icon;
            return (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group flex min-h-[400px] flex-col rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase ${design.accent}`}>
                    <Icon className="h-4 w-4" />
                    {design.label}
                  </div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Capability</span>
                </div>

                <h2 className="mt-8 font-title text-4xl leading-none">{feature.name}</h2>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{feature.summary}</p>

                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-semibold">Common questions</p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {feature.questions.slice(0, 2).map((question) => (
                      <li key={question} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">
                  View details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-[100rem] gap-5 px-5 pb-16 lg:grid-cols-3">
        {capabilityGroups.map((group) => (
          <section key={group.title} className="rounded-[1.5rem] border border-[#cbd3b0] bg-[#eef1e5] p-7">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="mt-6 font-title text-4xl leading-none">{group.title}</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{group.text}</p>
          </section>
        ))}
      </section>

      <section className="px-3 pb-16">
        <div className="mx-auto grid max-w-[100rem] gap-8 rounded-[2rem] bg-primary p-8 text-white md:grid-cols-[0.75fr_1fr] md:p-12">
          <div>
            <p className="text-sm font-semibold text-secondary">Customer payments are now public.</p>
            <h2 className="mt-4 font-title text-5xl leading-none text-cream md:text-6xl">Customers should not need an admin login to pay you.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Pay Invoice", "Public invoice lookup by invoice number and billing email."],
              ["PayPal Checkout", "Payment happens through PayPal-hosted invoice links."],
              ["Admin Billing", "Your team creates and tracks invoices inside the app."],
              ["Custom Flow", "We can adapt the payment path to your real customer process."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-white/15 bg-white/10 p-5">
                <p className="font-title text-4xl leading-none text-cream">{title}</p>
                <p className="mt-4 text-sm leading-6 text-white/72">{text}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button asChild className="bg-cream text-primary hover:bg-white">
              <Link href="/pay-invoice">Pay an Invoice <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
              <Link href="/contact">Build a Customer Flow <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
