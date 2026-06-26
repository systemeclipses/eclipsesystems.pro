import { ReceiptText } from "lucide-react";
import { PayPalInvoiceForm, PayPalInvoiceTable, type InvoiceRow } from "@/components/app/paypal-invoices-client";
import { EmptyState, PageHeader, StatPill, Surface } from "@/components/app/page-shell";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { isPayPalConfigured } from "@/lib/paypal";
import { requireFeature } from "@/lib/plan-features";
import { getInvoicesForOrganization } from "@/src/db/queries/invoices";

export default async function InvoicesPage() {
  await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "invoicing");
  const invoices = await getInvoicesForOrganization(orgId);
  const openInvoices = invoices.filter((invoice) => !["paid", "cancelled", "void"].includes(invoice.status));
  const openTotal = openInvoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  const rows: InvoiceRow[] = invoices.map((invoice) => ({
    ...invoice,
    total: invoice.total,
    recipientName: invoice.recipientName,
    recipientEmail: invoice.recipientEmail,
    description: invoice.description,
    currency: invoice.currency,
    paypalInvoiceId: invoice.paypalInvoiceId,
    paypalStatus: invoice.paypalStatus,
    paypalRecipientViewUrl: invoice.paypalRecipientViewUrl,
    paypalInvoicerViewUrl: invoice.paypalInvoicerViewUrl,
    paypalLastError: invoice.paypalLastError
  }));

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Billing desk" title="Invoices" description="Create PayPal invoices, email customers payment links, and track collection state from one place." />
      <div className="grid gap-3 md:grid-cols-3">
        <StatPill label="Invoices" value={invoices.length} />
        <StatPill label="Open value" value={`$${openTotal.toFixed(2)}`} />
        <StatPill label="Drafts" value={invoices.filter((invoice) => invoice.status === "draft").length} />
      </div>
      <Surface>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Send a PayPal invoice</h2>
            <p className="mt-1 text-sm text-muted-foreground">PayPal emails the customer a hosted payment link after the invoice is sent.</p>
          </div>
        </div>
        <PayPalInvoiceForm configured={isPayPalConfigured()} />
      </Surface>
      <Surface className="overflow-hidden p-0">
        {invoices.length ? (
          <PayPalInvoiceTable invoices={rows} />
        ) : (
          <div className="p-5">
            <EmptyState icon={ReceiptText} title="No invoices yet" description="Create a PayPal invoice above to send your first customer payment request." />
          </div>
        )}
      </Surface>
    </section>
  );
}
