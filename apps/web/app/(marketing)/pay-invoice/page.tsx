import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PayInvoiceForm } from "@/components/marketing/pay-invoice-form";
import { PublicPageHero, PublicSectionHeading } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Pay Invoice | Eclipse Systems",
  description: "Find and pay an Eclipse Systems invoice online through PayPal.",
  alternates: { canonical: "/pay-invoice" }
};

export default function PayInvoicePage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero eyebrow="Customer billing" title="Pay Your Eclipse Invoice." description="Look up your invoice using the invoice number and billing email provided on the invoice. Payment is completed through PayPal’s secure hosted checkout." image="/media/generated/heroes/billing-legal.jpg" imageAlt="A billing professional reviewing an invoice and payment records" points={["Secure checkout", "Email-matched lookup", "Hosted receipt"]} />

      <section className="mx-auto grid max-w-[100rem] gap-12 px-5 py-16 md:py-24 lg:grid-cols-[0.72fr_1fr] lg:items-start">
        <div>
          <PublicSectionHeading eyebrow="Before you pay" title="You only need two details." description="Enter the invoice number and the email address the invoice was sent to. If it is open, we will send you to its PayPal payment page." />
          <div className="mt-8 grid gap-3">
            {["Invoice number", "Billing email address", "A PayPal account or card accepted by PayPal"].map((item) => (
              <div key={item} className="flex gap-3 rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-4">
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
