import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { clients, invoices, memberships } from "@/src/db/schema";

export type CreateInvoiceInput = {
  organizationId: string;
  userId?: string;
  membershipId?: string | null;
  recipientName?: string | null;
  recipientEmail: string;
  description: string;
  total: string;
  currency: string;
  dueDate?: string | null;
};

export async function getInvoicesForOrganization(organizationId: string) {
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      total: invoices.total,
      status: invoices.status,
      recipientName: invoices.recipientName,
      recipientEmail: invoices.recipientEmail,
      description: invoices.description,
      currency: invoices.currency,
      paypalInvoiceId: invoices.paypalInvoiceId,
      paypalStatus: invoices.paypalStatus,
      paypalRecipientViewUrl: invoices.paypalRecipientViewUrl,
      paypalInvoicerViewUrl: invoices.paypalInvoicerViewUrl,
      paypalLastError: invoices.paypalLastError,
      sentAt: invoices.sentAt,
      createdAt: invoices.createdAt
    })
    .from(invoices)
    .where(and(eq(invoices.organizationId, organizationId), isNull(invoices.deletedAt)))
    .orderBy(desc(invoices.createdAt));
}

export async function createInvoiceForOrganization(input: CreateInvoiceInput) {
  const number = `INV-${Date.now().toString(36).toUpperCase()}`;
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.organizationId, input.organizationId), isNull(clients.deletedAt)))
    .limit(1);
  const [membership] = input.membershipId
    ? [{ id: input.membershipId }]
    : await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(eq(memberships.organizationId, input.organizationId))
        .limit(1);

  if (!client) throw new Error("Create a client before creating invoices.");
  if (!membership) throw new Error("A workspace membership is required to create invoices.");

  const [invoice] = await db
    .insert(invoices)
    .values({
      organizationId: input.organizationId,
      clientId: client.id,
      number,
      subtotal: input.total,
      taxRate: "0",
      taxAmount: "0",
      discountAmount: "0",
      total: input.total,
      amountPaid: "0",
      status: "draft",
      createdBy: membership.id,
      dueDate: input.dueDate || null,
      notes: "Created from the Eclipse billing desk.",
      terms: "Payment due according to invoice terms.",
      recipientName: input.recipientName || null,
      recipientEmail: input.recipientEmail,
      description: input.description,
      currency: input.currency
    })
    .returning({
      id: invoices.id,
      number: invoices.number,
      total: invoices.total,
      status: invoices.status,
      recipientName: invoices.recipientName,
      recipientEmail: invoices.recipientEmail,
      description: invoices.description,
      currency: invoices.currency
    });

  return invoice;
}

export async function getInvoiceForOrganization(organizationId: string, invoiceId: string) {
  const [invoice] = await db
    .select({
      id: invoices.id,
      status: invoices.status,
      paypalInvoiceId: invoices.paypalInvoiceId,
      paypalStatus: invoices.paypalStatus
    })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId), isNull(invoices.deletedAt)))
    .limit(1);
  return invoice ?? null;
}

export async function findPayableInvoiceForCustomer(input: { number: string; recipientEmail: string }) {
  const [invoice] = await db
    .select({
      number: invoices.number,
      total: invoices.total,
      status: invoices.status,
      recipientName: invoices.recipientName,
      recipientEmail: invoices.recipientEmail,
      description: invoices.description,
      currency: invoices.currency,
      paypalInvoiceId: invoices.paypalInvoiceId,
      paypalStatus: invoices.paypalStatus,
      paypalRecipientViewUrl: invoices.paypalRecipientViewUrl
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.number, input.number),
        sql`lower(${invoices.recipientEmail}) = ${input.recipientEmail.toLowerCase()}`,
        isNull(invoices.deletedAt)
      )
    )
    .limit(1);

  return invoice ?? null;
}

export async function markInvoicePayPalDrafted(input: {
  organizationId: string;
  invoiceId: string;
  paypalInvoiceId: string;
  paypalStatus: string | null;
  recipientViewUrl: string | null;
  invoicerViewUrl: string | null;
}) {
  const [invoice] = await db
    .update(invoices)
    .set({
      status: "draft",
      paypalInvoiceId: input.paypalInvoiceId,
      paypalStatus: input.paypalStatus,
      paypalRecipientViewUrl: input.recipientViewUrl,
      paypalInvoicerViewUrl: input.invoicerViewUrl,
      paypalLastError: null
    })
    .where(and(eq(invoices.id, input.invoiceId), eq(invoices.organizationId, input.organizationId)))
    .returning({ id: invoices.id });
  return invoice;
}

export async function markInvoicePayPalSent(input: {
  organizationId: string;
  invoiceId: string;
  paypalStatus: string | null;
  recipientViewUrl: string | null;
  invoicerViewUrl: string | null;
}) {
  const [invoice] = await db
    .update(invoices)
    .set({
      status: "sent",
      paypalStatus: input.paypalStatus,
      paypalRecipientViewUrl: input.recipientViewUrl,
      paypalInvoicerViewUrl: input.invoicerViewUrl,
      sentAt: new Date(),
      paypalLastError: null
    })
    .where(and(eq(invoices.id, input.invoiceId), eq(invoices.organizationId, input.organizationId)))
    .returning({ id: invoices.id });
  return invoice;
}

export async function markInvoicePayPalError(input: { organizationId: string; invoiceId: string; error: string }) {
  await db
    .update(invoices)
    .set({ paypalLastError: input.error })
    .where(and(eq(invoices.id, input.invoiceId), eq(invoices.organizationId, input.organizationId)));
}
