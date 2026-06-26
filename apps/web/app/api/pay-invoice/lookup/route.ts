import { NextResponse } from "next/server";
import { findPayableInvoiceForCustomer } from "@/src/db/queries/invoices";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isClosed(status: string, paypalStatus: string | null) {
  const local = status.toLowerCase();
  const paypal = paypalStatus?.toLowerCase();
  return ["paid", "cancelled", "void", "refunded"].includes(local) || ["paid", "cancelled", "refunded", "marked_as_refunded"].includes(paypal ?? "");
}

function isDemoInvoice(paypalInvoiceId: string | null, paymentUrl: string | null) {
  return Boolean(paypalInvoiceId?.startsWith("TEST-") || paymentUrl?.includes("#TEST-INVOICE"));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const number = text(body.number).toUpperCase();
  const recipientEmail = text(body.recipientEmail).toLowerCase();

  if (!number) return NextResponse.json({ error: "Invoice number is required." }, { status: 400 });
  if (!recipientEmail || !recipientEmail.includes("@")) return NextResponse.json({ error: "Billing email is required." }, { status: 400 });

  let invoice;
  try {
    invoice = await findPayableInvoiceForCustomer({ number, recipientEmail });
  } catch (error) {
    console.error("Invoice lookup failed", error);
    return NextResponse.json({ error: "Online invoice lookup is not ready yet. Please try again later." }, { status: 503 });
  }
  if (!invoice) return NextResponse.json({ error: "We could not find an invoice for that number and email." }, { status: 404 });

  const demo = isDemoInvoice(invoice.paypalInvoiceId, invoice.paypalRecipientViewUrl);
  const paymentUrl = demo
    ? `/pay-invoice/demo-complete?invoice=${encodeURIComponent(invoice.number)}`
    : invoice.paypalRecipientViewUrl;

  return NextResponse.json({
    number: invoice.number,
    amount: Number(invoice.total ?? 0).toFixed(2),
    currency: invoice.currency,
    description: invoice.description,
    customerName: invoice.recipientName,
    status: invoice.paypalStatus ?? invoice.status,
    payable: Boolean(paymentUrl) && !isClosed(invoice.status, invoice.paypalStatus),
    paymentProvider: demo ? "demo" : "paypal",
    paymentUrl
  });
}
