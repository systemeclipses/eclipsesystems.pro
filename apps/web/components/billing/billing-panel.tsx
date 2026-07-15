"use client";

import { useMemo, useState } from "react";
import type React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  Download,
  Pause,
  ReceiptText,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRecommendations } from "@/components/billing/product-recommendations";
import { cn } from "@/lib/utils";
import { PLAN_NAMES, PLAN_PRICES, type PlanCode } from "@eclipsesystems/shared/plans";

type ProductCode = "timekeeping" | "eclipse" | "mission_command" | "legal_addon";
type Subscription = { plan: string; seats: number; status: string; billing_interval: string | null } | null;
type BillingContext = {
  organizationName: string;
  plan: PlanCode | null;
  entitledProducts: ProductCode[];
  lockedProducts: ProductCode[];
  isSuite: boolean;
  hasLegal: boolean;
  showUpgradePrompts: boolean;
  billingPermissions: string[];
};

type ModalKind =
  | "plan"
  | "products"
  | "addProduct"
  | "removeProduct"
  | "suite"
  | "annual"
  | "payment"
  | "invoices"
  | "invoiceDetail"
  | "usage"
  | "cancel"
  | "pause"
  | "audit"
  | null;

const productMeta: Record<ProductCode, { plan: PlanCode; label: string; short: string; description: string; color: string; mark: string }> = {
  timekeeping: {
    plan: "timekeeping",
    label: PLAN_NAMES.timekeeping,
    short: "Timekeeping",
    description: "Clock in/out, timesheets, PTO, reports, and pay rules.",
    color: "border-blue-200 bg-blue-50 text-blue-800",
    mark: "TK"
  },
  eclipse: {
    plan: "eclipse",
    label: PLAN_NAMES.eclipse,
    short: "Invoicing",
    description: "Projects, clients, invoices, and payment tracking.",
    color: "border-emerald-200 bg-emerald-50 text-emerald-800",
    mark: "IV"
  },
  mission_command: {
    plan: "mission_command",
    label: PLAN_NAMES.mission_command,
    short: "Mission Command",
    description: "Schedules, chat, tasks, open shifts, and coverage.",
    color: "border-orange-200 bg-orange-50 text-orange-800",
    mark: "MC"
  },
  legal_addon: {
    plan: "legal_addon",
    label: PLAN_NAMES.legal_addon,
    short: "Eclipse Legal",
    description: "Matter-aware billing, UTBMS, LEDES, and legal controls.",
    color: "border-violet-200 bg-violet-50 text-violet-800",
    mark: "EL"
  }
};

const coreProducts: ProductCode[] = ["timekeeping", "eclipse", "mission_command"];
const nextRenewal = "Jul 1, 2026";
const billingPeriodEnd = "Jun 30, 2026";
const retentionEnd = "Sep 28, 2026";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

function productsForPlan(plan: PlanCode | string | null | undefined): ProductCode[] {
  if (plan === "suite") return ["timekeeping", "eclipse", "mission_command"];
  if (plan === "timekeeping") return ["timekeeping"];
  if (plan === "eclipse") return ["eclipse"];
  if (plan === "mission_command") return ["mission_command"];
  if (plan === "legal_addon") return ["legal_addon"];
  return [];
}

export function BillingPanel({ orgId, subscription, context }: { orgId: string; subscription: Subscription; context: BillingContext }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>("mission_command");
  const [busy, setBusy] = useState(false);
  const plan = subscription?.plan && subscription.plan in PLAN_PRICES ? (subscription.plan as PlanCode) : context.plan;
  const seats = Math.max(subscription?.seats ?? 0, plan ? PLAN_PRICES[plan].minSeats : 2);
  const entitledProducts = context.entitledProducts.length ? context.entitledProducts : productsForPlan(plan);
  const activeProductLabels = entitledProducts.map((product) => productMeta[product].short);
  const canManagePlan = context.billingPermissions.includes("billing.plan.modify") || context.billingPermissions.includes("billing.owner");
  const canUpdatePayment = context.billingPermissions.includes("billing.payment.update") || context.billingPermissions.includes("billing.owner");
  const canCancel = context.billingPermissions.includes("billing.cancel") || context.billingPermissions.includes("billing.owner");

  const totals = useMemo(() => {
    const monthlyPerSeat = plan ? PLAN_PRICES[plan].monthlyCents : PLAN_PRICES.timekeeping.monthlyCents;
    const annualPerSeat = plan ? PLAN_PRICES[plan].annualCents : PLAN_PRICES.timekeeping.annualCents;
    const monthly = monthlyPerSeat * seats;
    const annual = annualPerSeat * seats;
    return {
      monthlyPerSeat,
      annualPerSeat,
      monthly,
      annual,
      annualSavings: monthly * 12 - annual,
      suiteMonthly: PLAN_PRICES.suite.monthlyCents * seats,
      individualCoreMonthly: coreProducts.reduce((sum, product) => sum + PLAN_PRICES[productMeta[product].plan].monthlyCents, 0) * seats,
      legalMonthly: PLAN_PRICES.legal_addon.monthlyCents * seats
    };
  }, [plan, seats]);

  async function openPortal() {
    setBusy(true);
    const response = await fetch("/api/billing/portal", { method: "POST", body: JSON.stringify({ organization_id: orgId }) });
    const data = await response.json();
    setBusy(false);
    if (data.url) location.href = data.url;
  }

  function selectProduct(product: ProductCode, nextModal: ModalKind) {
    setSelectedProduct(product);
    setModal(nextModal);
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
        <p className="text-sm font-semibold text-secondary">Settings → Billing & Plan</p>
        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-title text-5xl leading-[0.9] text-cream md:text-7xl">Billing</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">
              What {context.organizationName} pays for, when it renews, and what happens before every plan change.
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-4 text-sm text-white/80">
            <p className="font-semibold text-cream">Billing access</p>
            <p className="mt-1">{context.billingPermissions.includes("billing.owner") ? "Owner controls enabled" : "Delegated billing permissions"}</p>
          </div>
        </div>
      </div>

      {!subscription ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">No active subscription</p>
              <p className="mt-1 text-sm text-amber-800">Open the billing portal to connect payment details and choose a plan.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openPortal} disabled={busy}>Open Stripe portal</Button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryCard
          icon={<WalletCards className="h-5 w-5" />}
          title="Your Plan"
          action={canManagePlan ? <Button variant="outline" onClick={() => setModal("plan")}>Change plan</Button> : null}
        >
          <p className="text-2xl font-semibold">{plan ? PLAN_NAMES[plan] : "No active plan"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{activeProductLabels.length ? activeProductLabels.join(" + ") : "No products active"}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Monthly total" value={formatMoney(totals.monthly)} />
            <Metric label="Active users" value={`${seats}`} />
            <Metric label="Next charge" value={`${formatMoney(totals.monthly)} on ${nextRenewal}`} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setModal("products")} disabled={!canManagePlan} variant="outline">Manage products</Button>
            <Button onClick={() => setModal("annual")} disabled={!canManagePlan} variant="ghost">Switch to annual</Button>
          </div>
        </SummaryCard>

        <SummaryCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Payment"
          action={canUpdatePayment ? <Button variant="outline" onClick={() => setModal("payment")}>Update payment</Button> : null}
        >
          <p className="text-2xl font-semibold">Visa ending in 4242</p>
          <p className="mt-1 text-sm text-muted-foreground">Expires 12/27 · Last used Jun 1, 2026</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Billing email" value="billing@acmecorp.com" />
            <Metric label="Backup card" value="Mastercard ending 1234" />
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mr-2 inline h-4 w-4" /> Card expiry alerts start 30 days before expiration.
          </div>
        </SummaryCard>

        <SummaryCard icon={<ReceiptText className="h-5 w-5" />} title="Recent Invoices" action={<Button variant="outline" onClick={() => setModal("invoices")}>See all</Button>}>
          <InvoiceRows compact onOpen={() => setModal("invoiceDetail")} />
        </SummaryCard>

        <SummaryCard icon={<CalendarClock className="h-5 w-5" />} title="Usage" action={<Button variant="outline" onClick={() => setModal("usage")}>Detailed usage</Button>}>
          <div className="space-y-4">
            <UsageBar label="Active users this month" value={seats} max={seats} caption={`${seats} / unlimited`} />
            <UsageBar label="SMS sent" value={1247} max={5000} caption="1,247 / 5,000 included" />
            <UsageBar label="Storage used" value={4.2} max={50} caption="4.2 GB / 50 GB" />
          </div>
        </SummaryCard>
      </div>

      <section className="rounded-md border border-border bg-white/70 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Billing audit log</p>
            <p className="mt-1 text-sm text-muted-foreground">Every billing action is recorded for disputes, accounting, and owner review.</p>
          </div>
          <Button variant="outline" onClick={() => setModal("audit")}>View audit log</Button>
        </div>
      </section>

      {context.showUpgradePrompts ? <ProductRecommendations currentPlan={subscription?.plan} /> : null}

      {modal ? (
        <BillingModal title={modalTitle(modal, selectedProduct)} onClose={() => setModal(null)}>
          {modal === "plan" ? (
            <PlanDetail
              plan={plan}
              seats={seats}
              totals={totals}
              entitledProducts={entitledProducts}
              canCancel={canCancel}
              onProducts={() => setModal("products")}
              onAnnual={() => setModal("annual")}
              onCancel={() => setModal("cancel")}
            />
          ) : null}
          {modal === "products" ? (
            <ProductsDetail entitledProducts={entitledProducts} onAdd={(product) => selectProduct(product, "addProduct")} onRemove={(product) => selectProduct(product, "removeProduct")} onSuite={() => setModal("suite")} />
          ) : null}
          {modal === "addProduct" ? <AddProductDetail product={selectedProduct} seats={seats} totals={totals} onPortal={openPortal} /> : null}
          {modal === "removeProduct" ? <RemoveProductDetail product={selectedProduct} onPortal={openPortal} /> : null}
          {modal === "suite" ? <SuiteDetail seats={seats} totals={totals} onPortal={openPortal} /> : null}
          {modal === "annual" ? <AnnualDetail plan={plan} seats={seats} totals={totals} onPortal={openPortal} /> : null}
          {modal === "payment" ? <PaymentDetail organizationName={context.organizationName} onPortal={openPortal} /> : null}
          {modal === "invoices" ? <InvoicesDetail onOpen={() => setModal("invoiceDetail")} /> : null}
          {modal === "invoiceDetail" ? <InvoiceDetail plan={plan} seats={seats} totals={totals} /> : null}
          {modal === "usage" ? <UsageDetail seats={seats} /> : null}
          {modal === "cancel" ? <CancelDetail onPortal={openPortal} onPause={() => setModal("pause")} /> : null}
          {modal === "pause" ? <PauseDetail onPortal={openPortal} /> : null}
          {modal === "audit" ? <AuditDetail /> : null}
        </BillingModal>
      ) : null}
    </section>
  );
}

function SummaryCard({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-white/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
          <p className="font-semibold">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-cream/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function UsageBar({ label, value, max, caption }: { label: string; value: number; max: number; caption: string }) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{caption}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function BillingModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 md:p-8">
      <div className="w-full max-w-4xl rounded-md border border-border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function modalTitle(modal: Exclude<ModalKind, null>, product: ProductCode) {
  if (modal === "addProduct") return `Add ${productMeta[product].short} to your plan`;
  if (modal === "removeProduct") return `Remove ${productMeta[product].short} from your plan`;
  const titles: Record<Exclude<ModalKind, null>, string> = {
    plan: "Your Plan",
    products: "Manage Products",
    addProduct: "",
    removeProduct: "",
    suite: "Switch to the Suite",
    annual: "Switch to Annual Billing",
    payment: "Payment Methods",
    invoices: "Invoices",
    invoiceDetail: "Invoice INV-2026-06",
    usage: "Detailed Usage",
    cancel: "Cancel Subscription",
    pause: "Pause Subscription",
    audit: "Billing Audit Log"
  };
  return titles[modal];
}

function PlanDetail({ plan, seats, totals, entitledProducts, canCancel, onProducts, onAnnual, onCancel }: {
  plan: PlanCode | null;
  seats: number;
  totals: { monthly: number; annualSavings: number; suiteMonthly: number };
  entitledProducts: ProductCode[];
  canCancel: boolean;
  onProducts: () => void;
  onAnnual: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current subscription</p>
            <p className="mt-2 text-2xl font-semibold">{plan ? PLAN_NAMES[plan] : "No active plan"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Includes {seats} active users · Renews {nextRenewal}</p>
          </div>
          <p className="text-2xl font-semibold">{formatMoney(totals.monthly)}/mo</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {entitledProducts.map((product) => (
            <div key={product} className={cn("rounded-md border p-3 text-sm", productMeta[product].color)}>
              <Check className="mr-2 inline h-4 w-4" /> {productMeta[product].short}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ActionPanel title="Billing cycle" body={`Monthly · annual would save ${formatMoney(totals.annualSavings)} per year at the established 20% discount.`} button="Switch to annual" onClick={onAnnual} />
        <ActionPanel title="Products" body="Add or remove products with a preview before any billing change is confirmed." button="Manage products" onClick={onProducts} />
      </div>
      {canCancel ? (
        <div className="rounded-md border border-border p-5">
          <p className="font-semibold">Need to leave or pause?</p>
          <p className="mt-1 text-sm text-muted-foreground">Cancellation continues access through {billingPeriodEnd}; data is preserved through {retentionEnd}.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel subscription</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductsDetail({ entitledProducts, onAdd, onRemove, onSuite }: { entitledProducts: ProductCode[]; onAdd: (product: ProductCode) => void; onRemove: (product: ProductCode) => void; onSuite: () => void }) {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-muted-foreground">Core products</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {coreProducts.map((product) => {
            const active = entitledProducts.includes(product);
            return <ProductCard key={product} product={product} active={active} onAdd={onAdd} onRemove={onRemove} />;
          })}
        </div>
      </section>
      <section>
        <p className="text-sm font-semibold text-muted-foreground">Specialized</p>
        <div className="mt-3 max-w-sm">
          <ProductCard product="legal_addon" active={entitledProducts.includes("legal_addon")} onAdd={onAdd} onRemove={onRemove} />
        </div>
      </section>
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-semibold">Suite pricing uses the established catalog.</p>
        <p className="mt-1">Core products individually are $50/user/mo. The Suite is $38/user/mo, saving $12/user/mo.</p>
        <Button className="mt-3" onClick={onSuite}>Switch to Suite</Button>
      </div>
    </div>
  );
}

function ProductCard({ product, active, onAdd, onRemove }: { product: ProductCode; active: boolean; onAdd: (product: ProductCode) => void; onRemove: (product: ProductCode) => void }) {
  const meta = productMeta[product];
  const price = PLAN_PRICES[meta.plan].monthlyCents;
  return (
    <div className={cn("rounded-md border p-4", active ? "border-primary/25 bg-white" : "border-border bg-white/65")}>
      <p className={cn("flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold", meta.color)}>{meta.mark}</p>
      <p className="mt-3 font-semibold">{meta.short}</p>
      <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
      <p className="mt-4 text-sm font-semibold">{active ? "Active" : `${formatMoney(price)}/user/mo`}</p>
      <Button className="mt-4 w-full" variant={active ? "outline" : "default"} onClick={() => (active ? onRemove(product) : onAdd(product))}>
        {active ? "Remove from plan" : product === "legal_addon" ? "Learn and add" : "Add"}
      </Button>
    </div>
  );
}

function AddProductDetail({ product, seats, totals, onPortal }: { product: ProductCode; seats: number; totals: { monthly: number }; onPortal: () => void }) {
  const meta = productMeta[product];
  const monthly = PLAN_PRICES[meta.plan].monthlyCents * seats;
  const prorated = Math.round((monthly * 16) / 30);
  return (
    <FinancialPreview
      rows={[
        [`${meta.short}`, `${formatMoney(PLAN_PRICES[meta.plan].monthlyCents)}/month per user`],
        [`× ${seats} active users`, formatMoney(monthly)],
        ["Prorated charge today", formatMoney(prorated)],
        [`Full charge starts ${nextRenewal}`, `${formatMoney(monthly)}/mo`],
        ["New monthly total", `${formatMoney(totals.monthly + monthly)}/mo`]
      ]}
      note={product === "legal_addon" ? "Eclipse Legal stays out of Suite savings and is billed as a specialized add-on." : "If Suite pricing is cheaper, the Suite switcher will show the lower monthly total before confirmation."}
      confirm="Confirm in Stripe portal"
      onConfirm={onPortal}
    />
  );
}

function RemoveProductDetail({ product, onPortal }: { product: ProductCode; onPortal: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> {productMeta[product].short} stays active until {nextRenewal}. No one loses access today.
      </div>
      <InfoList
        title="What will happen"
        items={[
          `Access continues until ${billingPeriodEnd}.`,
          `Your next bill removes ${productMeta[product].short}.`,
          "Admins can export data before access ends.",
          "Re-subscribing within 90 days restores preserved data."
        ]}
      />
      <InfoList
        title="What happens to data"
        items={["Schedules, chats, tasks, invoices, and related records are preserved for 90 days.", "After 90 days, product data follows the retention and anonymization policy."]}
      />
      <ReasonBox />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPortal}>Confirm in Stripe portal</Button>
        <Button variant="outline">Keep product</Button>
      </div>
    </div>
  );
}

function SuiteDetail({ seats, totals, onPortal }: { seats: number; totals: { individualCoreMonthly: number; suiteMonthly: number }; onPortal: () => void }) {
  const savings = totals.individualCoreMonthly - totals.suiteMonthly;
  return (
    <FinancialPreview
      rows={[
        ["Timekeeping + Eclipse + Mission Command separately", `${formatMoney(totals.individualCoreMonthly)}/mo`],
        ["Eclipse Suite", `${formatMoney(totals.suiteMonthly)}/mo`],
        [`Savings for ${seats} active users`, `${formatMoney(savings)}/mo (${formatMoney(savings * 12)}/yr)`],
        ["Timing", `New pricing starts ${nextRenewal}`]
      ]}
      note="Same core products, same features, lower bundled price. Eclipse Legal remains a separate specialized add-on."
      confirm="Switch in Stripe portal"
      onConfirm={onPortal}
    />
  );
}

function AnnualDetail({ plan, seats, totals, onPortal }: { plan: PlanCode | null; seats: number; totals: { monthly: number; annual: number; annualSavings: number }; onPortal: () => void }) {
  return (
    <FinancialPreview
      rows={[
        ["Current monthly", `${formatMoney(totals.monthly)} × 12 = ${formatMoney(totals.monthly * 12)}/yr`],
        ["Annual", `${formatMoney(totals.annual)}/yr`],
        ["You would save", `${formatMoney(totals.annualSavings)}/yr`],
        ["Timing", `Annual billing starts ${nextRenewal}`],
        ["Next charge after that", "Jul 1, 2027"]
      ]}
      note={`${plan ? PLAN_NAMES[plan] : "This plan"} uses the existing 20% annual discount for ${seats} seats. Refund policy is shown before checkout in the Stripe portal.`}
      confirm="Switch in Stripe portal"
      onConfirm={onPortal}
    />
  );
}

function PaymentDetail({ organizationName, onPortal }: { organizationName: string; onPortal: () => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentCard label="Primary" card="Visa ending in 4242" detail="Expires 12/27 · Last used Jun 1 (success)" />
        <PaymentCard label="Backup" card="Mastercard ending in 1234" detail="Expires 08/26 · Used if primary fails" />
      </div>
      <div className="rounded-md border border-border p-5">
        <p className="font-semibold">Billing details</p>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Detail label="Billing name" value={organizationName} />
          <Detail label="Billing email" value="billing@acmecorp.com" />
          <Detail label="Billing address" value="123 Commerce Way, Birmingham, AL 35242" />
          <Detail label="Tax ID" value="XX-XXXXXXX (US EIN)" />
        </dl>
      </div>
      <p className="text-sm text-muted-foreground">Card details are tokenized by the payment processor. Card numbers never touch Eclipse servers.</p>
      <Button onClick={onPortal}>Open secure payment portal</Button>
    </div>
  );
}

function InvoicesDetail({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Filter: All</Button>
          <Button variant="outline">Year: 2026</Button>
        </div>
        <Button variant="outline"><Download className="h-4 w-4" /> Export all</Button>
      </div>
      <InvoiceRows onOpen={onOpen} />
    </div>
  );
}

function InvoiceRows({ compact = false, onOpen }: { compact?: boolean; onOpen: () => void }) {
  const invoices = [
    ["Jun 1, 2026", "INV-2026-06", "$1,392.47", "Paid"],
    ["May 1, 2026", "INV-2026-05", "$1,390.00", "Paid"],
    ["Apr 15, 2026", "INV-2026-04a", "$304.00", "Paid (add)"],
    ["Apr 1, 2026", "INV-2026-04", "$1,086.00", "Paid"]
  ];
  return (
    <div className="overflow-hidden rounded-md border border-border">
      {invoices.slice(0, compact ? 3 : invoices.length).map(([date, number, amount, status]) => (
        <button key={number} type="button" onClick={onOpen} className="grid w-full grid-cols-[1fr_auto] gap-3 border-b border-border bg-white/55 p-3 text-left text-sm last:border-0 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <span>{date}</span>
          <span className="hidden md:block">{number}</span>
          <span className="font-semibold">{amount}</span>
          <span className="hidden text-emerald-700 md:block">{status}</span>
          <span className="text-primary">Details</span>
        </button>
      ))}
    </div>
  );
}

function InvoiceDetail({ plan, seats, totals }: { plan: PlanCode | null; seats: number; totals: { monthly: number; legalMonthly: number } }) {
  const tax = Math.round((totals.monthly + 247) * 0.04);
  return (
    <div className="space-y-5">
      <dl className="grid gap-3 text-sm md:grid-cols-3">
        <Detail label="Issued" value="Jun 1, 2026" />
        <Detail label="Paid" value="Jun 1, 2026 · Visa 4242" />
        <Detail label="Period" value="Jun 1 – Jun 30, 2026" />
      </dl>
      <div className="rounded-md border border-border p-5">
        <p className="font-semibold">Line items</p>
        <div className="mt-4 space-y-3 text-sm">
          <Line label={plan ? PLAN_NAMES[plan] : "Subscription"} detail={`${seats} users × ${formatMoney(plan ? PLAN_PRICES[plan].monthlyCents : 0)}/user/month`} amount={formatMoney(totals.monthly)} />
          <Line label="SMS overage" detail="247 messages over 5,000 included × $0.01" amount="$2.47" />
          <Line label="Tax (Alabama, 4%)" detail="Calculated from billing address" amount={formatMoney(tax)} />
          <Line label="Total" detail="" amount={formatMoney(totals.monthly + 247 + tax)} strong />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button><Download className="h-4 w-4" /> Download PDF</Button>
        <Button variant="outline">Email copy</Button>
      </div>
    </div>
  );
}

function UsageDetail({ seats }: { seats: number }) {
  return (
    <div className="space-y-5">
      <UsageBar label="Active users this month" value={seats} max={seats} caption={`${seats} / unlimited`} />
      <UsageBar label="SMS sent this month" value={1247} max={5000} caption="1,247 / 5,000 included" />
      <UsageBar label="Storage used" value={4.2} max={50} caption="4.2 GB / 50 GB" />
      <UsageBar label="API calls" value={42156} max={100000} caption="42,156 / 100,000" />
      <div className="rounded-md border border-border p-5">
        <p className="font-semibold">Top SMS users</p>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Mike Johnson · 247 sent / 19 received</p>
          <p>Sarah Chen · 189 sent / 8 received</p>
          <p>Aisha Patel · 132 sent / 11 received</p>
        </div>
      </div>
    </div>
  );
}

function CancelDetail({ onPortal, onPause }: { onPortal: () => void; onPause: () => void }) {
  return (
    <div className="space-y-5">
      <InfoList
        title="What happens"
        items={[
          `Access continues until ${billingPeriodEnd}.`,
          "No partial refund because service continues through the paid period.",
          `After ${billingPeriodEnd}, the account becomes read-only.`,
          `Data is preserved for 90 days, until ${retentionEnd}.`
        ]}
      />
      <div className="rounded-md border border-border p-5">
        <p className="font-semibold">Alternatives</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline">Remove a product</Button>
          <Button variant="outline">Compare tiers</Button>
          <Button variant="outline" onClick={onPause}><Pause className="h-4 w-4" /> Pause instead</Button>
        </div>
      </div>
      <ReasonBox />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPortal}>Confirm in Stripe portal</Button>
        <Button variant="outline">Never mind</Button>
      </div>
    </div>
  );
}

function PauseDetail({ onPortal }: { onPortal: () => void }) {
  return (
    <div className="space-y-5">
      <InfoList title="How it works" items={["Pause for 30 or 60 days.", "No charges during the pause.", "All data stays preserved.", "Users cannot sign in while paused."]} />
      <div className="grid gap-3 md:grid-cols-3">
        {["30 days · resume Jul 30, 2026", "60 days · resume Aug 29, 2026", "Custom date"].map((item) => (
          <button key={item} className="rounded-md border border-border bg-white p-4 text-left text-sm hover:border-primary">{item}</button>
        ))}
      </div>
      <Button onClick={onPortal}>Pause in Stripe portal</Button>
    </div>
  );
}

function AuditDetail() {
  const rows = [
    ["Jun 1, 2026 10:14 AM", "sarah@acmecorp.com", "Added Mission Command to plan"],
    ["Jun 1, 2026 10:15 AM", "sarah@acmecorp.com", "Confirmed $304.00 prorated charge"],
    ["May 28, 2026 3:22 PM", "accountant@acmecorp.com", "Viewed invoice INV-2026-05"],
    ["Apr 15, 2026 11:00 AM", "mike@acmecorp.com", "Updated primary payment method"]
  ];
  return (
    <div className="space-y-3">
      {rows.map(([time, actor, action]) => (
        <div key={`${time}-${action}`} className="grid gap-2 rounded-md border border-border bg-white/65 p-3 text-sm md:grid-cols-[1.2fr_1fr_2fr]">
          <span className="text-muted-foreground">{time}</span>
          <span>{actor}</span>
          <span className="font-medium">{action}</span>
        </div>
      ))}
      <Button variant="outline"><Download className="h-4 w-4" /> Export audit log</Button>
    </div>
  );
}

function FinancialPreview({ rows, note, confirm, onConfirm }: { rows: string[][]; note: string; confirm: string; onConfirm: () => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border p-5">
        <p className="font-semibold">Financial impact</p>
        <div className="mt-4 divide-y divide-border text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-5 py-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-right font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <ShieldCheck className="mr-2 inline h-4 w-4" /> {note}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onConfirm}>{confirm} <ArrowRight className="h-4 w-4" /></Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

function ActionPanel({ title, body, button, onClick }: { title: string; body: string; button: string; onClick: () => void }) {
  return (
    <div className="rounded-md border border-border p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button className="mt-4" variant="outline" onClick={onClick}>{button}</Button>
    </div>
  );
}

function PaymentCard({ label, card, detail }: { label: string; card: string; detail: string }) {
  return (
    <div className="rounded-md border border-border p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-3 font-semibold"><CreditCard className="mr-2 inline h-4 w-4" /> {card}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Line({ label, detail, amount, strong = false }: { label: string; detail: string; amount: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-5", strong && "border-t border-border pt-3 text-base font-semibold")}>
      <div>
        <p className="font-medium">{label}</p>
        {detail ? <p className="text-muted-foreground">{detail}</p> : null}
      </div>
      <p className="font-semibold">{amount}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border p-5">
      <p className="font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}><Check className="mr-2 inline h-4 w-4 text-emerald-700" /> {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReasonBox() {
  return (
    <div className="rounded-md border border-border p-5">
      <p className="font-semibold">Reason (optional)</p>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        {["Too expensive", "Not using it enough", "Missing features", "Switching tools", "Business closing", "Other"].map((reason) => (
          <label key={reason} className="flex items-center gap-2 rounded-md border border-border bg-white/55 p-3">
            <input type="radio" name="billing-reason" /> {reason}
          </label>
        ))}
      </div>
    </div>
  );
}
