import type { Metadata } from "next";
import { Code2, Database, KeyRound, Webhook } from "lucide-react";

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
      <section className="px-3 pt-3">
        <div className="rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Integration notes for technical teams.</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Developer Documentation</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
              This area is a living map for API access, webhooks, data relationships, and implementation patterns as Eclipse integrations open up.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] px-5 py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <article key={doc.title} className="rounded-md border border-border bg-white/70 p-6 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-8 font-title text-4xl leading-none">{doc.title}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{doc.text}</p>
              </article>
            );
          })}
        </div>

        <pre className="mt-8 overflow-x-auto rounded-md border border-border bg-[#18251d] p-6 text-sm leading-6 text-cream">
{`// Example shape
{
  "event": "invoice.approved",
  "organization_id": "org_123",
  "invoice_id": "inv_456",
  "approved_time_entries": 42
}`}
        </pre>
      </section>
    </main>
  );
}
