import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { sendPayPalInvoice } from "@/lib/paypal";
import { getInvoiceForOrganization, markInvoicePayPalError, markInvoicePayPalSent } from "@/src/db/queries/invoices";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: RouteContext) {
  await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const invoice = await getInvoiceForOrganization(organizationId, params.id);

  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  if (!invoice.paypalInvoiceId) return NextResponse.json({ error: "Invoice does not have a PayPal draft ID." }, { status: 400 });

  try {
    const sent = await sendPayPalInvoice(invoice.paypalInvoiceId);
    await markInvoicePayPalSent({
      organizationId,
      invoiceId: invoice.id,
      paypalStatus: sent.status,
      recipientViewUrl: sent.recipientViewUrl,
      invoicerViewUrl: sent.invoicerViewUrl
    });

    return NextResponse.json({ invoiceId: invoice.id, paypalInvoiceId: invoice.paypalInvoiceId, status: "sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal send request failed.";
    await markInvoicePayPalError({ organizationId, invoiceId: invoice.id, error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
