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
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-12 md:py-16 lg:grid-cols-[0.72fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Custom software, customer payments, and the workflows around them.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Features for the business you actually run.</h1>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
                Eclipse Systems builds the practical layer between your team and your customers: invoice payment access, PayPal billing, client portals, internal operations tools, storefronts, CRM handoffs, and custom dashboards.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {workflows.map(([title, text]) => (
                  <div key={title} className="flex min-h-40 flex-col justify-between rounded-md border border-white/15 bg-white/10 p-5">
                    <p className="font-title text-3xl leading-none text-cream">{title}</p>
                    <p className="mt-5 text-sm leading-6 text-white/72">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 lg:grid-cols-4">
          {features.map((feature) => {
            const design = getDesign(feature);
            const Icon = design.icon;
            return (
              <Link
                key={feature.slug}
                href={`/features/${feature.slug}`}
                className="group flex min-h-[360px] flex-col rounded-md border border-border bg-white/70 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`inline-flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs font-semibold uppercase ${design.accent}`}>
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

      <section className="mx-auto grid max-w-[104rem] gap-5 px-5 pb-12 lg:grid-cols-3">
        {capabilityGroups.map((group) => (
          <section key={group.title} className="rounded-md border border-border bg-white/70 p-6">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="mt-6 font-title text-4xl leading-none">{group.title}</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{group.text}</p>
          </section>
        ))}
      </section>

      <section className="px-3 pb-16">
        <div className="mx-auto grid max-w-[104rem] gap-8 rounded-md bg-primary p-8 text-white md:grid-cols-[0.75fr_1fr] md:p-10">
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
              <Link href="/schedule-demo">Build a Customer Flow <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
