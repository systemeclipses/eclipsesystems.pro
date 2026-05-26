"use client";

import { Button } from "@/components/ui/button";
import { ProductRecommendations } from "@/components/billing/product-recommendations";
import { PLAN_NAMES, type PlanCode } from "@eclipsesystems/shared/plans";

type Subscription = { plan: string; seats: number; status: string; billing_interval: string | null } | null;

export function BillingPanel({ orgId, subscription }: { orgId: string; subscription: Subscription }) {
  async function openPortal() {
    const response = await fetch("/api/billing/portal", { method: "POST", body: JSON.stringify({ organization_id: orgId }) });
    const data = await response.json();
    if (data.url) location.href = data.url;
  }

  async function startTrial() {
    const response = await fetch("/api/billing/trial", { method: "POST" });
    if (response.ok) location.reload();
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
        <p className="text-sm font-semibold text-secondary">Plan and billing</p>
        <h1 className="mt-4 font-title text-6xl leading-[0.86] text-cream md:text-7xl">Billing</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">Manage the plan, seats, and Stripe customer portal for this workspace.</p>
      </div>
      <div className="rounded-md border border-border bg-white/65 p-5">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="mt-3 text-3xl font-semibold">
          {subscription?.plan ? PLAN_NAMES[subscription.plan as PlanCode] ?? subscription.plan : "No active subscription"}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-cream/70 p-4"><p className="text-sm text-muted-foreground">Status</p><p className="mt-2 font-semibold">{subscription?.status ?? "not started"}</p></div>
          <div className="rounded-md bg-cream/70 p-4"><p className="text-sm text-muted-foreground">Seats</p><p className="mt-2 font-semibold">{subscription?.seats ?? 0}</p></div>
          <div className="rounded-md bg-cream/70 p-4"><p className="text-sm text-muted-foreground">Interval</p><p className="mt-2 font-semibold">{subscription?.billing_interval ?? "none"}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {!subscription ? <Button onClick={startTrial}>Start free trial</Button> : null}
          <Button variant={subscription ? "default" : "outline"} onClick={openPortal}>Open Stripe portal</Button>
        </div>
      </div>
      <ProductRecommendations currentPlan={subscription?.plan} />
    </section>
  );
}
