import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, FileText, MessageSquareText, ReceiptText, ShieldCheck, TimerReset, UsersRound } from "lucide-react";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getRunningTimerCountForUser } from "@/src/db/queries/dashboard";
import { auth } from "@/src/auth";

const workTiles = [
  { label: "Timesheet", href: "/timesheet", icon: CalendarDays, note: "Review tracked hours" },
  { label: "Projects", href: "/projects", icon: FileText, note: "Client work and budgets" },
  { label: "Invoices", href: "/invoices", icon: ReceiptText, note: "Draft and send billing" },
  { label: "Mission", href: "/shifts", icon: UsersRound, note: "Shifts and coverage" }
] as const;

const operations = [
  ["Approvals", "0", "Ready for review"],
  ["Draft invoices", "0", "Waiting on approved time"],
  ["Coverage alerts", "0", "No open gaps"]
] as const;

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const session = await auth();
  const runningTimerCount = await getRunningTimerCountForUser(userId, orgId);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const runningLabel = runningTimerCount === 1 ? "timer" : "timers";

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
          <div className="grid gap-3 md:grid-cols-4">
            {workTiles.map((tile) => {
              const Icon = tile.icon;

              return (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="group rounded-md border border-border bg-white/65 p-4 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-sm bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-5 text-lg font-semibold">{tile.label}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{tile.note}</p>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-md border border-border bg-white/65 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Today&apos;s flow</p>
                  <h2 className="mt-2 font-title text-4xl leading-none text-ink dark:text-white">From time to invoice</h2>
                </div>
                <Clock3 className="h-6 w-6 text-primary" />
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ["Capture", "Start or resume timers as work happens.", "/timer"],
                  ["Review", "Check timesheets before billing.", "/timesheet"],
                  ["Bill", "Prepare invoices from approved work.", "/invoices"]
                ].map(([label, text, href], index) => (
                  <Link key={label} href={href} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-border bg-cream/70 p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-sm bg-primary text-sm font-semibold text-white">0{index + 1}</span>
                    <span>
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block text-sm text-muted-foreground">{text}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-border bg-[#2f4135] p-5 text-white">
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
            </section>
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

          <section className="rounded-md border border-border bg-secondary p-5 text-ink">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-5 font-title text-4xl leading-none">Ready for deeper records.</h2>
            <p className="mt-4 text-sm leading-6 text-[#35483b]">
              Projects, invoices, shifts, chat, and legal matter workflows are already in the workspace when you need them.
            </p>
            <Link href="/settings/billing" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Manage plan <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </aside>
      </div>
    </section>
  );
}
