import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { createPayPalInvoice, isPayPalConfigured, sendPayPalInvoice } from "@/lib/paypal";
import {
  createInvoiceForOrganization,
  markInvoicePayPalDrafted,
  markInvoicePayPalError,
  markInvoicePayPalSent
} from "@/src/db/queries/invoices";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";

function money(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric.toFixed(2);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isoDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  const recipientEmail = text(body.recipientEmail).toLowerCase();
  const recipientName = text(body.recipientName);
  const description = text(body.description);
  const total = money(body.amount);
  const currency = (text(body.currency) || "USD").toUpperCase();
  const sendNow = Boolean(body.sendNow);
  const dueDate = isoDate(body.dueDate);

  if (!recipientEmail || !recipientEmail.includes("@")) return NextResponse.json({ error: "Customer email is required." }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Invoice description is required." }, { status: 400 });
  if (!total) return NextResponse.json({ error: "Invoice amount must be greater than zero." }, { status: 400 });
  if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "Currency must be a 3-letter code." }, { status: 400 });

  const localInvoice = await createInvoiceForOrganization({
    organizationId,
    userId,
    membershipId,
    recipientName,
    recipientEmail,
    description,
    total,
    currency,
    dueDate
  });

  if (!isPayPalConfigured()) {
    return NextResponse.json({ invoiceId: localInvoice.id, status: "draft", warning: "PayPal credentials are not configured." }, { status: 201 });
  }

  try {
    const draft = await createPayPalInvoice({
      invoiceNumber: localInvoice.number,
      recipientName,
      recipientEmail,
      description,
      quantity: "1",
      amount: total,
      currency,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate
    });

    await markInvoicePayPalDrafted({
      organizationId,
      invoiceId: localInvoice.id,
      paypalInvoiceId: draft.id,
      paypalStatus: draft.status,
      recipientViewUrl: draft.recipientViewUrl,
      invoicerViewUrl: draft.invoicerViewUrl
    });

    if (!sendNow) return NextResponse.json({ invoiceId: localInvoice.id, paypalInvoiceId: draft.id, status: "paypal_draft" }, { status: 201 });

    const sent = await sendPayPalInvoice(draft.id);
    await markInvoicePayPalSent({
      organizationId,
      invoiceId: localInvoice.id,
      paypalStatus: sent.status,
      recipientViewUrl: sent.recipientViewUrl ?? draft.recipientViewUrl,
      invoicerViewUrl: sent.invoicerViewUrl ?? draft.invoicerViewUrl
    });

    return NextResponse.json({ invoiceId: localInvoice.id, paypalInvoiceId: draft.id, status: "sent" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PayPal invoice request failed.";
    await markInvoicePayPalError({ organizationId, invoiceId: localInvoice.id, error: message });
    return NextResponse.json({ error: message, invoiceId: localInvoice.id }, { status: 502 });
  }
}
