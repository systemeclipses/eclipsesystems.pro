"use client";

import { Button } from "@/components/ui/button";

export function BillingPanel({ orgId, subscription }: { orgId: string; subscription: unknown }) {
  async function openPortal() {
    const response = await fetch("/api/billing/portal", { method: "POST", body: JSON.stringify({ organization_id: orgId }) });
    const data = await response.json();
    if (data.url) location.href = data.url;
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Billing</h1>
      <pre className="mt-6 rounded-lg border border-border p-4 text-sm">{JSON.stringify(subscription ?? { status: "no subscription" }, null, 2)}</pre>
      <Button className="mt-4" onClick={openPortal}>Open Stripe portal</Button>
    </section>
  );
}
