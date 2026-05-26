import { ReceiptText } from "lucide-react";
import { EmptyState, PageHeader, StatPill, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { requireFeature } from "@/lib/plan-features";
import { getInvoicesForOrganization } from "@/src/db/queries/invoices";

export default async function InvoicesPage() {
  await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "invoicing");
  const invoices = await getInvoicesForOrganization(orgId);
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Billing desk" title="Invoices" description="Track drafts, sent invoices, payment state, and billing totals from one place." />
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="Invoices" value={invoices.length} />
        <StatPill label="Open value" value={`$${total.toFixed(2)}`} />
        <StatPill label="Drafts" value={invoices.filter((invoice) => invoice.status === "draft").length} />
      </div>
      <Surface className="overflow-hidden p-0">
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-secondary/70 text-left">
                <tr><th className="p-3">Number</th><th>Status</th><th>Total</th></tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{invoice.number}</td>
                    <td><span className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary">{invoice.status}</span></td>
                    <td>${Number(invoice.total ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon={ReceiptText} title="No invoices yet" description="Approved time and client work will appear here as invoice-ready billing records." action={{ href: "/timesheet", label: "Review timesheet" }} />
          </div>
        )}
      </Surface>
    </section>
  );
}
