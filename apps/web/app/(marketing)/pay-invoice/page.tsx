import type { Metadata } from "next";
import { Check, ShieldCheck, WalletCards } from "lucide-react";
import { PayInvoiceForm } from "@/components/marketing/pay-invoice-form";

export const metadata: Metadata = {
  title: "Pay Invoice | Eclipse Systems",
  description: "Find and pay an Eclipse Systems invoice online through PayPal.",
  alternates: { canonical: "/pay-invoice" }
};

export default function PayInvoicePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="px-3 pt-3">
        <div className="overflow-hidden rounded-md bg-primary text-white">
          <div className="mx-auto grid max-w-[104rem] gap-8 px-5 py-10 md:py-14 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-secondary">Customer billing</p>
              <h1 className="mt-4 font-title text-6xl leading-[0.88] text-cream md:text-8xl">Pay your Eclipse Systems invoice.</h1>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-7 text-white/78 md:text-lg">
                Look up your invoice with the invoice number and billing email from your invoice. Payments are completed through PayPal’s secure hosted checkout.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Secure PayPal checkout", WalletCards],
                  ["Email-matched lookup", ShieldCheck],
                  ["Hosted payment receipt", Check]
                ].map(([label, Icon]) => (
                  <div key={label as string} className="rounded-md border border-white/15 bg-white/10 p-4">
                    <Icon className="h-5 w-5 text-secondary" />
                    <p className="mt-5 text-sm font-semibold text-cream">{label as string}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[92rem] gap-10 px-5 py-12 lg:grid-cols-[0.72fr_1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Before you pay</p>
          <h2 className="mt-3 font-title text-5xl leading-none md:text-7xl">You only need two details.</h2>
          <p className="mt-5 leading-7 text-muted-foreground">
            Enter the invoice number and the email address the invoice was sent to. If the invoice is open, we will send you to the PayPal payment page for that invoice.
          </p>
          <div className="mt-8 grid gap-3">
            {["Invoice number", "Billing email address", "A PayPal account or card accepted by PayPal"].map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-border bg-white/60 p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <PayInvoiceForm />
      </section>
    </main>
  );
}
