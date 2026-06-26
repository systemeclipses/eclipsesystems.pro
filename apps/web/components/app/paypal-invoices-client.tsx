"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";
import { AlertTriangle, ExternalLink, Loader2, Send, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InvoiceRow = {
  id: string;
  number: string;
  total: string | null;
  status: string;
  recipientName: string | null;
  recipientEmail: string | null;
  description: string | null;
  currency: string;
  paypalInvoiceId: string | null;
  paypalStatus: string | null;
  paypalRecipientViewUrl: string | null;
  paypalInvoicerViewUrl: string | null;
  paypalLastError: string | null;
};

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusLabel(invoice: InvoiceRow) {
  if (invoice.paypalStatus) return invoice.paypalStatus.toLowerCase().replace(/_/g, " ");
  return invoice.status.replace(/_/g, " ");
}

export function PayPalInvoiceForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSent(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientName: form.get("recipientName"),
        recipientEmail: form.get("recipientEmail"),
        description: form.get("description"),
        amount: form.get("amount"),
        currency: form.get("currency"),
        dueDate: form.get("dueDate"),
        sendNow: form.get("sendNow") === "on"
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Unable to create PayPal invoice.");
      router.refresh();
      return;
    }

    event.currentTarget.reset();
    setSent(data.warning ? "Local invoice draft created. Add PayPal credentials to send it online." : data.status === "sent" ? "PayPal invoice sent." : "PayPal draft created.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {!configured ? (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>PayPal credentials are missing. You can create local invoice drafts, but online PayPal sending is disabled until `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set.</span>
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          Customer name
          <input name="recipientName" className="h-10 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="Acme Operations" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Customer email
          <input name="recipientEmail" type="email" required className="h-10 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="billing@example.com" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Line item
        <input name="description" required className="h-10 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="June cleaning services" />
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
        <label className="grid gap-1 text-sm font-semibold">
          Amount
          <input name="amount" type="number" min="0.01" step="0.01" required className="h-10 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" placeholder="250.00" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Currency
          <input name="currency" defaultValue="USD" maxLength={3} className="h-10 rounded-md border border-border bg-white px-3 font-normal uppercase outline-none focus:border-primary" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Due date
          <input name="dueDate" type="date" defaultValue={todayPlus(10)} className="h-10 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <input name="sendNow" type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          Send through PayPal now
        </label>
        <Button type="submit" disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          {configured ? "Create PayPal invoice" : "Create local invoice"}
        </Button>
      </div>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      {sent ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{sent}</p> : null}
    </form>
  );
}

export function PayPalInvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendInvoice(invoiceId: string) {
    setSendingId(invoiceId);
    setError(null);
    const response = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setSendingId(null);
    if (!response.ok) setError(typeof data.error === "string" ? data.error : "Unable to send invoice.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/70 text-left">
            <tr>
              <th className="p-3">Number</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>PayPal</th>
              <th className="pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border align-top">
                <td className="p-3">
                  <p className="font-semibold">{invoice.number}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{invoice.description}</p>
                </td>
                <td className="py-3">
                  <p className="font-semibold">{invoice.recipientName || "Customer"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{invoice.recipientEmail}</p>
                </td>
                <td className="py-3">
                  <span className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary">{statusLabel(invoice)}</span>
                  {invoice.paypalLastError ? <p className="mt-2 max-w-xs text-xs font-semibold text-red-700">{invoice.paypalLastError}</p> : null}
                </td>
                <td className="py-3">{invoice.currency} {Number(invoice.total ?? 0).toFixed(2)}</td>
                <td className="py-3">
                  {invoice.paypalInvoiceId ? <p className="font-semibold">{invoice.paypalInvoiceId}</p> : <p className="text-muted-foreground">Not drafted</p>}
                  {invoice.paypalRecipientViewUrl ? (
                    <a href={invoice.paypalRecipientViewUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Payment link <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </td>
                <td className="py-3 pr-3 text-right">
                  {invoice.paypalInvoiceId && invoice.status === "draft" ? (
                    <Button variant="outline" onClick={() => sendInvoice(invoice.id)} disabled={sendingId === invoice.id} className="gap-2 text-xs">
                      {sendingId === invoice.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send
                    </Button>
                  ) : invoice.paypalInvoicerViewUrl ? (
                    <a href={invoice.paypalInvoicerViewUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-primary">
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
