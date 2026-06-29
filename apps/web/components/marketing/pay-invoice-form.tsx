"use client";

import { useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";

type LookupResult = {
  number: string;
  amount: string;
  currency: string;
  description: string | null;
  customerName: string | null;
  status: string;
  payable: boolean;
  paymentProvider?: "paypal" | "demo";
  paymentUrl: string | null;
};

export function PayInvoiceForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<LookupResult | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInvoice(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/pay-invoice/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: form.get("number"),
        recipientEmail: form.get("recipientEmail")
      })
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Unable to find that invoice.");
      return;
    }

    setInvoice(data as LookupResult);
  }

  return (
    <section className="rounded-[2rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-2xl shadow-primary/10 md:p-8">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-primary text-cream">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Find your invoice</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Use the invoice number and billing email from your Eclipse Systems invoice.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-1 text-sm font-semibold">
          Invoice number
          <input
            name="number"
            required
            className="h-11 rounded-lg border border-border bg-white px-3 font-normal uppercase outline-none focus:border-primary"
            placeholder="INV-..."
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Billing email
          <input
            name="recipientEmail"
            type="email"
            required
            className="h-11 rounded-lg border border-border bg-white px-3 font-normal outline-none focus:border-primary"
            placeholder="billing@example.com"
          />
        </label>
        <Button type="submit" disabled={busy} className="h-11 gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
          Look up invoice
        </Button>
      </form>

      {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}

      {invoice ? (
        <div className="mt-5 rounded-md border border-border bg-cream/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{invoice.number}</p>
              <h3 className="mt-1 text-xl font-semibold">{invoice.description ?? "Eclipse Systems invoice"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{invoice.customerName ?? "Customer"} · {invoice.status}</p>
            </div>
            <p className="text-2xl font-semibold">{invoice.currency} {invoice.amount}</p>
          </div>
          {invoice.payable && invoice.paymentUrl ? (
            <Button asChild className="mt-5 h-11 w-full gap-2">
              <a href={invoice.paymentUrl}>
                {invoice.paymentProvider === "demo" ? "Complete Demo Payment" : "Continue to PayPal"} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <p className="mt-5 rounded-md bg-white p-3 text-sm font-semibold text-muted-foreground">
              This invoice is not currently payable online. Please contact Eclipse Systems if you need help.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
