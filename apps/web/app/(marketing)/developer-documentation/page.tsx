import type { Metadata } from "next";
import { Code2, Database, KeyRound, Webhook } from "lucide-react";
import { PublicCta, PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Developer Documentation",
  description: "Developer documentation concepts for Eclipse Systems APIs, webhooks, authentication, and data workflows."
};

const docs = [
  { title: "Authentication", text: "Connect users, organizations, and role-aware access.", icon: KeyRound },
  { title: "Data model", text: "Understand members, projects, time entries, shifts, invoices, and matters.", icon: Database },
  { title: "Webhooks", text: "Prepare downstream systems for invoice, approval, and shift events.", icon: Webhook },
  { title: "API patterns", text: "Build integrations without bypassing tenant boundaries.", icon: Code2 }
] as const;

export default function DeveloperDocumentationPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="For technical teams" title="Developer Documentation." description="A living map for API access, webhooks, data relationships, authentication, and implementation patterns as Eclipse integrations open up." image="/media/generated/heroes/developer.jpg" imageAlt="An engineer connecting APIs, data flows, and dashboards" points={["Tenant-aware", "Integration-ready", "Built for clear handoffs"]} />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <PublicSectionHeading eyebrow="Technical map" title="Understand the system boundaries." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <article key={doc.title} className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-xl shadow-[#172219]/5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-8 font-title text-4xl leading-none">{doc.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{doc.text}</p>
              </article>
            );
          })}
        </div>

        <pre className="mt-8 overflow-x-auto rounded-[1.5rem] border border-[#314839]/25 bg-[#18251d] p-7 text-sm leading-6 text-cream shadow-2xl shadow-[#172219]/12">
{`// Example shape
{
  "event": "invoice.approved",
  "organization_id": "org_123",
  "invoice_id": "inv_456",
  "approved_time_entries": 42
}`}
        </pre>
      </section>
      <PublicCta eyebrow="Planning an integration?" title="Bring the systems that need to talk." primaryLabel="Talk With Eclipse" primaryHref="/contact" />
    </main>
  );
}
