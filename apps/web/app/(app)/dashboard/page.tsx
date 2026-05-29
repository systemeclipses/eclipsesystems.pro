import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Clock3, FileText, FolderKanban, LockKeyhole, MessageSquareText, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { DashboardClockWidget } from "@/components/dashboard/dashboard-clock-widget";
import { ProductRecommendations } from "@/components/billing/product-recommendations";
import { getRunningTimerCountForUser } from "@/src/db/queries/dashboard";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";
import { getCurrentShiftState } from "@/src/db/queries/shift-state-machine";
import { getManagerTimekeepingQueue, getTeamTimesheets, getTimekeepingDashboardPulse, getTimekeepingOverview } from "@/src/db/queries/timekeeping";
import { getTimekeepingSettings } from "@/src/db/queries/timekeeping-settings";
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

function getLatestPunchToday(entries: Array<{ started_at: Date; ended_at: Date | null }>) {
  const today = new Date().toDateString();
  const punches = entries.flatMap((entry) => {
    const values = [{ label: "Clocked in", time: entry.started_at }];
    if (entry.ended_at) values.push({ label: "Clocked out", time: entry.ended_at });
    return values;
  }).filter((punch) => punch.time.toDateString() === today);

  punches.sort((a, b) => b.time.getTime() - a.time.getTime());
  const latest = punches[0];
  return latest ? { label: latest.label, time: latest.time.toISOString() } : null;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDateShort(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
}

function formatTimeShort(value: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(value);
}

function formatElapsed(value: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function compactList(entries: Array<[string, number]>) {
  return entries.length ? entries.map(([label, count]) => `${label} ${count}`).join("  ·  ") : "No data yet";
}

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const session = await auth();
  const runningTimerCount = await getRunningTimerCountForUser(userId, orgId);
  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  const productContext = await getProductUiContext(userId, orgId);
  const timekeepingOverview = productContext.entitledProducts.includes("timekeeping") ? await getTimekeepingOverview(userId, orgId) : null;
  const currentShift = timekeepingOverview ? await getCurrentShiftState(orgId, timekeepingOverview.membership.id) : null;
  const latestPunch = timekeepingOverview ? getLatestPunchToday(timekeepingOverview.entries) : null;
  const isTimekeepingOnly = productContext.entitledProducts.length === 1 && productContext.entitledProducts[0] === "timekeeping";
  const isTimekeepingAdmin = Boolean(timekeepingOverview && ["owner", "admin", "manager"].includes(timekeepingOverview.membership.role));
  const currentPlan = isPlanCode(subscription?.plan) ? subscription.plan : null;
  const currentPlanName = currentPlan ? PLAN_NAMES[currentPlan] : "your current plan";
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const visibleWorkTiles = productContext.showLockedProducts ? workTiles : workTiles.filter((tile) => canUseFeature(currentPlan, tile.feature));
  const flowSteps = [
    { label: "Capture", text: "Start or resume timers as work happens.", href: "/timer", feature: null },
    { label: "Review", text: "Check timesheets before billing.", href: "/timesheet", feature: null },
    { label: "Bill", text: "Prepare invoices from approved work.", href: "/invoices", feature: "invoicing" }
  ].filter((step) => productContext.showLockedProducts || canUseFeature(currentPlan, step.feature as PlanFeature | null));
  const showMissionPanel = productContext.showLockedProducts || canUseFeature(currentPlan, "shifts");

  if (isTimekeepingOnly && !isTimekeepingAdmin) redirect("/timekeeping");

  if (isTimekeepingOnly && timekeepingOverview && isTimekeepingAdmin) {
    const settings = await getTimekeepingSettings(orgId);
    const [teamTimesheets, managerQueue, pulse] = await Promise.all([
      getTeamTimesheets({ organizationId: orgId, settings }),
      getManagerTimekeepingQueue(orgId),
      getTimekeepingDashboardPulse(orgId)
    ]);

    return (
      <TimekeepingAdminDashboard
        teamTimesheets={teamTimesheets}
        managerQueue={managerQueue}
        pulse={pulse}
        userName={session?.user?.name || session?.user?.email || "Account"}
      />
    );
  }

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

          {timekeepingOverview ? (
            <DashboardClockWidget
              initialRunning={timekeepingOverview.running ? { id: timekeepingOverview.running.id, started_at: timekeepingOverview.running.started_at.toISOString() } : null}
              initialState={currentShift?.state ?? "CLOCKED_OUT"}
              initialLatestPunch={latestPunch}
            />
          ) : (
            <div className="rounded-md border border-white/15 bg-white/10 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-cream">Running now</p>
                <Clock3 className="h-5 w-5 text-secondary" />
              </div>
              <p className="mt-6 font-title text-7xl leading-none text-white">{runningTimerCount}</p>
              <p className="mt-2 text-sm text-white/70">{runningTimerCount === 1 ? "timer" : "timers"} in motion</p>
              <div className="mt-6 rounded-sm bg-cream p-3 text-ink">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold">{runningTimerCount > 0 ? "Active timer running" : "No active timer"}</p>
              </div>
            </div>
          )}
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
                : "group h-full rounded-md border border-secondary/20 bg-[hsl(var(--primary)_/_0.12)] p-3 transition hover:-translate-y-0.5 hover:bg-white  dark:hover:bg-white/12";

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
            <section className="rounded-md border border-secondary/20 bg-[hsl(var(--primary)_/_0.12)] p-5">
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
                    ? "grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-border bg-cream/45 p-3 text-muted-foreground "
                    : "grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-border bg-[hsl(var(--secondary)_/_0.16)] p-3 dark:text-white";
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
          <section className="rounded-md border border-secondary/20 bg-[hsl(var(--primary)_/_0.12)] p-5">
            <p className="text-sm font-semibold text-primary dark:text-white">Workspace health</p>
            <div className="mt-5 grid gap-3">
              {[
                [timekeepingOverview ? "Clock status" : "Timer coverage", timekeepingOverview ? (timekeepingOverview.running ? "Clocked in" : "Idle") : (runningTimerCount > 0 ? "Active" : "Idle")],
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

function TimekeepingAdminDashboard({
  teamTimesheets,
  managerQueue,
  pulse,
  userName
}: {
  teamTimesheets: Awaited<ReturnType<typeof getTeamTimesheets>>;
  managerQueue: Awaited<ReturnType<typeof getManagerTimekeepingQueue>>;
  pulse: Awaited<ReturnType<typeof getTimekeepingDashboardPulse>>;
  userName: string;
}) {
  const now = new Date();
  const pendingTimesheets = teamTimesheets.insights.pending;
  const flaggedPunches = managerQueue.flaggedEntries.length;
  const pendingPto = managerQueue.pendingRequests.length;
  const missedClockOuts = pulse.activeShifts.filter((shift) => shift.state === "PENDING_REVIEW" || Date.now() - shift.started_at.getTime() > 12 * 60 * 60 * 1000).length;
  const totalHours = teamTimesheets.rows.reduce((sum, row) => sum + row.total_hours, 0);
  const laborCost = teamTimesheets.insights.laborCost;
  const overtimeEmployees = teamTimesheets.rows.filter((row) => row.overtime_hours > 0).length;
  const elapsedPercent = Math.min(100, Math.round((now.getDay() / 7) * 100));
  const projectedLabor = elapsedPercent > 0 ? laborCost / (elapsedPercent / 100) : laborCost;
  const visibleShifts = pulse.activeShifts.slice(0, 8);
  const recentEvents = pulse.recentActivity.length ? pulse.recentActivity : [];

  const attentionCards = [
    { label: "Timesheets to Approve", value: pendingTimesheets, href: "/timekeeping?tab=hours&status=pending" },
    { label: "Punches Flagged", value: flaggedPunches, href: "/timekeeping?tab=hours&status=flagged" },
    { label: "PTO Requests", value: pendingPto, href: "/timekeeping?tab=pto&status=pending" },
    { label: "Missed Clock-Outs", value: missedClockOuts, href: "/timekeeping?tab=hours&issue=missed-clock-out" }
  ];

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Timekeeping</p>
          <h1 className="mt-2 font-title text-5xl leading-none text-ink dark:text-white">Dashboard</h1>
        </div>
        <div className="flex items-start gap-3">
          <p className="rounded-sm border border-secondary/20 bg-[hsl(var(--primary)_/_0.12)] px-3 py-2 text-sm font-semibold text-primary dark:text-secondary">
            {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric" }).format(now)}
          </p>
          <DashboardAccountMenu userName={userName} />
        </div>
      </div>

      <DashboardSection title="Attention">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionCards.map((card) => (
            <Link key={card.label} href={card.href} className={`rounded-md border p-4 transition hover:-translate-y-0.5 ${card.value > 0 ? "border-secondary/70 bg-[hsl(var(--secondary)_/_0.3)] dark:bg-[hsl(var(--secondary)_/_0.22)]" : "border-secondary/30 bg-[hsl(var(--secondary)_/_0.12)]"}`}>
              <p className="font-title text-6xl leading-none text-primary dark:text-secondary">{card.value}</p>
              <p className="mt-3 min-h-10 text-sm font-semibold text-ink dark:text-white">{card.label}</p>
              <p className={`mt-4 text-sm font-semibold ${card.value > 0 ? "text-primary dark:text-secondary" : "text-muted-foreground"}`}>
                {card.value > 0 ? "Review" : "Clear"}
              </p>
            </Link>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title="Right Now">
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-md border border-primary/30 bg-primary p-5 text-white dark:border-secondary/20 dark:bg-[hsl(var(--primary)_/_0.9)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-cream/80 dark:text-secondary">Currently on the clock</h2>
              <Link href="/timekeeping?tab=hours&view=live" className="text-sm font-semibold text-secondary">See all</Link>
            </div>
            <div className="mt-5 space-y-3">
              {visibleShifts.length ? visibleShifts.map((shift) => (
                <div key={shift.id} className="grid gap-2 rounded-sm bg-white/8 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      <span className="mr-2 text-secondary">●</span>{shift.employee_name || shift.employee_email}
                    </p>
                    <p className="mt-1 text-xs text-white/62">{formatTimeShort(shift.started_at)} · {formatElapsed(shift.started_at)}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase text-secondary">{shift.state === "ON_BREAK" ? "On break" : "Active"}</p>
                </div>
              )) : (
                <div className="rounded-sm bg-white/8 p-4 text-sm font-semibold text-cream/80">No one is clocked in right now.</div>
              )}
            </div>
            {pulse.activeShifts.length > visibleShifts.length ? <p className="mt-4 text-sm text-white/62">+{pulse.activeShifts.length - visibleShifts.length} more on the clock</p> : null}
          </section>

          <section className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.14)] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Today</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["Out today", pulse.today.outCount],
                ["On clock now", pulse.today.onClockCount],
                ["Coming in soon", pulse.today.comingInSoonCount]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-3 last:border-b-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-xl font-semibold text-ink dark:text-white">{value}</span>
                </div>
              ))}
              <div className="rounded-sm bg-[hsl(var(--secondary)_/_0.24)] p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Labor today</p>
                <p className="mt-1 text-2xl font-semibold text-primary dark:text-secondary">{formatMoney(pulse.today.laborCost)}</p>
              </div>
            </div>
          </section>
        </div>
      </DashboardSection>

      <DashboardSection title="This Pay Period">
        <section className="rounded-md border border-primary/30 bg-primary p-5 text-white dark:border-secondary/20 dark:bg-[hsl(var(--primary)_/_0.9)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-cream/80 dark:text-secondary">Hours & Labor Cost</h2>
              <p className="mt-2 text-sm text-white/62">Current team totals, projected from the pace so far.</p>
            </div>
            <Link href="/timekeeping?tab=hours" className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary/80">Full breakdown</Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <MetricBlock label="Total hours so far" value={totalHours.toFixed(1)} />
            <MetricBlock label="Labor cost so far" value={formatMoney(laborCost)} />
            <MetricBlock label="Projected" value={formatMoney(projectedLabor)} />
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-sm bg-white/12">
            <div className="h-full rounded-sm bg-secondary" style={{ width: `${Math.max(8, elapsedPercent)}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-white/62">{elapsedPercent}% of week elapsed</p>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SmallInfoCard title="Overtime" value={`${teamTimesheets.insights.overtimeHours.toFixed(1)} h`} lines={[`${overtimeEmployees} employees with OT`, "Track trend in reports"]} href="/timekeeping?tab=hours&view=overtime" />
          <SmallInfoCard title="PTO Usage" value={`${pulse.upcomingPtoCount} upcoming`} lines={[`${pendingPto} awaiting approval`, `${pulse.today.outCount} out today`]} href="/timekeeping?tab=pto" />
        </div>
      </DashboardSection>

      <DashboardSection title="Activity">
        <section className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.12)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent events</h2>
          <div className="mt-5 space-y-3">
            {recentEvents.length ? recentEvents.map((event) => (
              <div key={event.id} className="grid gap-1 border-b border-border pb-3 last:border-b-0">
                <p className="text-sm font-semibold text-ink dark:text-white">{event.action.replaceAll("_", " ").toLowerCase()}</p>
                <p className="text-xs text-muted-foreground">{formatTimeShort(event.created_at)} · {event.target_type}{event.reason ? ` · ${event.reason}` : ""}</p>
              </div>
            )) : <p className="text-sm font-semibold text-muted-foreground">No recent activity yet.</p>}
          </div>
        </section>
      </DashboardSection>

      <DashboardSection title="Roster">
        <div className="grid gap-5 lg:grid-cols-2">
          <RosterList title="Probation Ending Soon" rows={pulse.roster.probationEndingSoon.map((member) => `${member.employee_name || member.employee_email} · ${member.probation_ends_at ? formatDateShort(member.probation_ends_at) : "Soon"}`)} href="/people?status=probation" />
          <RosterList title="Anniversaries" rows={pulse.roster.anniversaries.map((member) => `${member.employee_name || member.employee_email} · ${formatDateShort(member.anniversary)}`)} href="/people?sort=hire-date" />
        </div>
        <section className="mt-5 rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.12)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Headcount</h2>
          <p className="mt-4 font-title text-5xl leading-none text-primary dark:text-secondary">{pulse.roster.activeCount}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">active employees</p>
          <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
            <p>By status: Active {pulse.roster.activeCount} · Probation {pulse.roster.probationCount} · LOA {pulse.roster.loaCount}</p>
            <p>By site: {compactList(pulse.roster.departments)}</p>
            <p>By role: {compactList(pulse.roster.roles)}</p>
          </div>
          <Link href="/people" className="mt-5 inline-flex rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary/80">View people</Link>
        </section>
      </DashboardSection>

      <DashboardSection title="Other Products">
        <section className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.1)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <ProductDiscoveryCard title="Invoicing" text="Bill clients for work tracked in Eclipse." href="/features/invoicing" />
            <ProductDiscoveryCard title="Mission Cmd" text="Add scheduling, chat, and team tasks." href="/features/mission-command" />
          </div>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">Suite combines Timekeeping, Invoicing, and Mission Command in one workspace.</p>
          <Link href="/settings/billing" className="mt-3 inline-flex rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary/80">See suite plans</Link>
        </section>
      </DashboardSection>
    </section>
  );
}

function DashboardAccountMenu({ userName }: { userName: string }) {
  return (
    <details className="relative hidden md:block">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.14)] px-3 text-sm font-semibold text-primary transition hover:bg-[hsl(var(--secondary)_/_0.22)] dark:text-white">
        <span className="grid h-7 w-7 place-items-center rounded-sm bg-secondary text-primary">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="max-w-40 truncate">{userName}</span>
      </summary>
      <div className="absolute right-0 top-12 z-30 grid w-60 gap-1 rounded-md border border-secondary/20 bg-background p-2 text-sm shadow-xl dark:bg-[#132017]">
        <Link href="/settings/account#profile" className="rounded-sm px-2 py-2 font-semibold text-foreground hover:bg-[hsl(var(--secondary)_/_0.16)]">My Profile</Link>
        <Link href="/settings/account#notifications" className="rounded-sm px-2 py-2 font-semibold text-foreground hover:bg-[hsl(var(--secondary)_/_0.16)]">Notification Settings</Link>
        <Link href="/help-center" className="rounded-sm px-2 py-2 font-semibold text-foreground hover:bg-[hsl(var(--secondary)_/_0.16)]">Help & Support</Link>
        <Link href="/api/auth/signout" className="rounded-sm px-2 py-2 font-semibold text-foreground hover:bg-[hsl(var(--secondary)_/_0.16)]">Sign out</Link>
      </div>
    </details>
  );
}

function DashboardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-[hsl(35_69%_90%)] p-4 dark:bg-[hsl(var(--secondary)_/_0.22)]">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">{value}</p>
    </div>
  );
}

function SmallInfoCard({ title, value, lines, href }: { title: string; value: string; lines: string[]; href: string }) {
  return (
    <section className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.12)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
      <p className="mt-4 font-title text-5xl leading-none text-primary dark:text-secondary">{value}</p>
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
      <Link href={href} className="mt-5 inline-flex rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary/80">See details</Link>
    </section>
  );
}

function RosterList({ title, rows, href }: { title: string; rows: string[]; href: string }) {
  return (
    <section className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.12)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map((row) => <p key={row} className="text-sm font-semibold text-ink dark:text-white">{row}</p>) : <p className="text-sm font-semibold text-muted-foreground">Nothing coming up.</p>}
      </div>
      <Link href={href} className="mt-5 inline-flex rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-secondary/80">See all</Link>
    </section>
  );
}

function ProductDiscoveryCard({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link href={href} className="rounded-md border border-secondary/30 bg-[hsl(var(--secondary)_/_0.18)] p-4 transition hover:bg-[hsl(var(--secondary)_/_0.28)]">
      <p className="text-base font-semibold text-ink dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{text}</p>
      <p className="mt-4 text-sm font-semibold text-primary dark:text-secondary">Learn more</p>
    </Link>
  );
}
