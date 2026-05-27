import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Clock3, FileText, FolderKanban, LockKeyhole, MessageSquareText, ReceiptText, Scale, TimerReset, UsersRound } from "lucide-react";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { ProductRecommendations } from "@/components/billing/product-recommendations";
import { getRunningTimerCountForUser } from "@/src/db/queries/dashboard";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";
import { getProductUiContext } from "@/src/billing/entitlements";
import { auth } from "@/src/auth";
import { hasPlanFeature, PLAN_NAMES, type PlanCode, type PlanFeature } from "@eclipsesystems/shared/plans";

const workTiles = [
  { label: "Timer", href: "/timer", icon: Clock3, note: "Track work as it happens", feature: null },
  { label: "Timesheet", href: "/timesheet", icon: CalendarDays, note: "Review tracked hours", feature: null },
  { label: "Eclipse Invoicing", href: "/projects", icon: FolderKanban, note: "Clients, projects, and invoices", feature: "projects" },
  { label: "Shifts", href: "/shifts", icon: FileText, note: "Schedules and coverage", feature: "shifts" },
  { label: "Reports", href: "/reports", icon: BarChart3, note: "Operational visibility", feature: "reporting" }
] as const;

const operations = [
  ["Approvals", "0", "Ready for review"],
  ["Draft invoices", "0", "Waiting on approved time"],
  ["Coverage alerts", "0", "No open gaps"]
] as const;

function isPlanCode(plan: string | null | undefined): plan is PlanCode {
  return plan === "timekeeping" || plan === "mission_command" || plan === "eclipse" || plan === "suite" || plan === "legal_addon";
}

function canUseFeature(plan: PlanCode | null, feature: PlanFeature | null) {
  return !feature || (plan ? hasPlanFeature(plan, feature) : false);
}

function requiredProductLabel(feature: PlanFeature | null) {
  if (feature === "shifts" || feature === "chat") return "Mission Command";
  if (feature === "projects" || feature === "invoicing") return "Eclipse Invoicing";
  if (feature === "reporting") return "Eclipse Timekeeping";
  if (feature === "legal") return "Eclipse Legal";
  return "Eclipse Timekeeping";
}

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const session = await auth();
  const runningTimerCount = await getRunningTimerCountForUser(userId, orgId);
  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  const productContext = await getProductUiContext(userId, orgId);
  const currentPlan = isPlanCode(subscription?.plan) ? subscription.plan : null;
  const currentPlanName = currentPlan ? PLAN_NAMES[currentPlan] : "your current plan";
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const runningLabel = runningTimerCount === 1 ? "timer" : "timers";
  const visibleWorkTiles = productContext.showLockedProducts ? workTiles : workTiles.filter((tile) => canUseFeature(currentPlan, tile.feature));
  const flowSteps = [
    { label: "Capture", text: "Start or resume timers as work happens.", href: "/timer", feature: null },
    { label: "Review", text: "Check timesheets before billing.", href: "/timesheet", feature: null },
    { label: "Bill", text: "Prepare invoices from approved work.", href: "/invoices", feature: "invoicing" }
  ].filter((step) => productContext.showLockedProducts || canUseFeature(currentPlan, step.feature as PlanFeature | null));
  const showMissionPanel = productContext.showLockedProducts || canUseFeature(currentPlan, "shifts");

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md bg-primary text-white">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <p className="text-sm font-semibold text-secondary">Live workspace</p>
            <h1 className="mt-4 max-w-3xl font-title text-6xl leading-[0.86] text-cream md:text-7xl">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
              Keep today&apos;s time, billing, schedules, and legal work moving from one operational view.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/timer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-cream px-4 text-sm font-semibold text-primary transition hover:bg-white"
              >
                Start timer <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/timesheet"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open timesheet
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-white/15 bg-white/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-cream">Running now</p>
              <TimerReset className="h-5 w-5 text-secondary" />
            </div>
            <p className="mt-6 font-title text-7xl leading-none text-white">{runningTimerCount}</p>
            <p className="mt-2 text-sm text-white/70">{runningLabel} in motion</p>
            <div className="mt-6 rounded-sm bg-cream p-3 text-ink">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-semibold">{runningTimerCount > 0 ? "Active timer running" : "No active timer"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <div className="grid auto-rows-[156px] content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {visibleWorkTiles.map((tile) => {
              const Icon = tile.icon;
              const locked = !canUseFeature(currentPlan, tile.feature);
              const requiredProduct = requiredProductLabel(tile.feature);
              const upgradeHref = tile.feature ? `/settings/billing?upgrade=${tile.feature}` : "/settings/billing";
              const cardClassName = locked
                ? "h-full rounded-md border border-secondary/45 bg-secondary/18 p-3 text-foreground shadow-sm shadow-black/5 dark:border-secondary/25 dark:bg-[#1f2d23]"
                : "group h-full rounded-md border border-border bg-white/65 p-3 transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/8 dark:hover:bg-white/12";

              const content = (
                <div className="flex h-full flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className={locked ? "grid h-8 w-8 place-items-center rounded-sm bg-primary text-secondary" : "grid h-8 w-8 place-items-center rounded-sm bg-secondary text-primary"}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {locked ? (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-primary/15 bg-cream text-primary dark:border-secondary/25 dark:bg-secondary/15 dark:text-secondary" aria-label="Locked">
                        <LockKeyhole className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    )}
                  </div>
                  <div>
                    <p className={locked ? "text-base font-semibold leading-tight text-foreground dark:text-white" : "text-base font-semibold leading-tight"}>{tile.label}</p>
                    <p className="mt-1 text-xs leading-4 text-muted-foreground">{tile.note}</p>
                  </div>
                  {locked && productContext.showUpgradePrompts ? (
                    <Link
                      href={upgradeHref}
                      className="inline-flex h-7 w-fit items-center gap-2 rounded-md bg-primary px-2.5 text-xs font-semibold text-white transition hover:bg-[#3b5243]"
                    >
                      <LockKeyhole className="h-3 w-3" />
                      {requiredProduct}
                    </Link>
                  ) : locked ? <span className="inline-flex h-7 w-fit items-center gap-2 rounded-md bg-cream px-2.5 text-xs font-semibold text-primary"><LockKeyhole className="h-3 w-3" /> Locked</span> : null}
                </div>
              );

              return locked ? (
                <div key={tile.href} className={cardClassName} aria-disabled="true" title={`${tile.label} needs ${requiredProduct}. Your current plan is ${currentPlanName}.`}>
                  {content}
                </div>
              ) : (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className={cardClassName}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-md border border-border bg-white/65 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-white">Today&apos;s flow</p>
                  <h2 className="mt-2 font-title text-4xl leading-none text-ink dark:text-white">From time to invoice</h2>
                </div>
                <Clock3 className="h-6 w-6 text-primary" />
              </div>

              <div className="mt-6 grid gap-3">
                {flowSteps.map((step, index) => {
                  const locked = !canUseFeature(currentPlan, step.feature as PlanFeature | null);
                  const requiredProduct = requiredProductLabel(step.feature as PlanFeature | null);
                  const rowClassName = locked
                    ? "grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-border bg-cream/45 p-3 text-muted-foreground dark:bg-white/8"
                    : "grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-border bg-cream/70 p-3 dark:text-white";
                  const rowContent = (
                    <>
                      <span className={locked ? "grid h-9 w-9 place-items-center rounded-sm bg-muted text-sm font-semibold text-muted-foreground" : "grid h-9 w-9 place-items-center rounded-sm bg-primary text-sm font-semibold text-white"}>0{index + 1}</span>
                      <span>
                        <span className={locked ? "block text-sm font-semibold text-foreground/70 dark:text-white/70" : "block text-sm font-semibold dark:text-white"}>{step.label}</span>
                        <span className="block text-sm text-muted-foreground">{locked ? requiredProduct : step.text}</span>
                      </span>
                      {locked ? <LockKeyhole className="h-4 w-4 text-primary" /> : <ArrowRight className="h-4 w-4 text-primary" />}
                    </>
                  );

                  return locked ? (
                    <div key={step.label} className={rowClassName} aria-disabled="true">
                      {rowContent}
                    </div>
                  ) : (
                    <Link key={step.label} href={step.href} className={rowClassName}>
                      {rowContent}
                    </Link>
                  );
                })}
              </div>
            </section>

            {showMissionPanel ? <section className="rounded-md border border-border bg-[#2f4135] p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-cream">Mission Command</p>
                <MessageSquareText className="h-5 w-5 text-secondary" />
              </div>
              <h2 className="mt-4 font-title text-4xl leading-none text-white">Quiet board, clear next moves.</h2>
              <div className="mt-6 space-y-3">
                {operations.map(([label, value, note]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-sm bg-white/10 p-3">
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-1 text-xs text-white/65">{note}</p>
                    </div>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </section> : null}
          </div>
        </div>

        <aside className="grid gap-5">
          <section className="rounded-md border border-border bg-white/65 p-5">
            <p className="text-sm font-semibold text-primary dark:text-white">Workspace health</p>
            <div className="mt-5 grid gap-3">
              {[
                ["Timer coverage", runningTimerCount > 0 ? "Active" : "Idle"],
                ["Billing queue", "Clear"],
                ["Team signals", "Calm"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {productContext.showUpgradePrompts ? <ProductRecommendations currentPlan={subscription?.plan} context="dashboard" compact /> : null}
        </aside>
      </div>
    </section>
  );
}
