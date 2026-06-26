import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Demo Payment Complete | Eclipse Systems",
  description: "Demo invoice payment confirmation for Eclipse Systems."
};

export default function DemoPaymentCompletePage({ searchParams }: { searchParams: { invoice?: string } }) {
  const invoice = searchParams.invoice ?? "test invoice";

  return (
    <main className="min-h-screen bg-cream px-5 py-12 text-ink">
      <section className="mx-auto grid max-w-2xl place-items-center rounded-md border border-border bg-white/80 p-8 text-center shadow-xl shadow-primary/10">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-cream">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase text-primary">Demo complete</p>
        <h1 className="mt-3 font-title text-5xl leading-none">Payment flow works.</h1>
        <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">
          This confirms the public invoice lookup and payment handoff path for {invoice}. No real PayPal payment was processed.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/pay-invoice" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Try another invoice
          </Link>
          <Link href="/" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary">
            Main site
          </Link>
        </div>
      </section>
    </main>
  );
}
