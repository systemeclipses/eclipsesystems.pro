"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Archive, Check, Clock3, DollarSign, UserMinus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type Member = {
  id: string;
  role: string;
  payRateCents: number;
  name: string | null;
  email: string;
};

type Dashboard = {
  stats: {
    active: number;
    overdueFinalPay: number;
    dueThisWeek: number;
    archivingSoon: number;
  };
  rows: Array<{
    id: string;
    state: string;
    departureType: string;
    finalDay: Date | string;
    finalPayDueAt: Date | string | null;
    accessEndsAt: Date | string | null;
    employeeName: string | null;
    employeeEmail: string;
  }>;
};

type Detail = {
  record: {
    id: string;
    state: string;
    departureType: string;
    finalDay: Date | string;
    finalPayDueAt: Date | string | null;
    accessEndsAt: Date | string | null;
    employeeName: string | null;
    employeeEmail: string;
    payRateCents: number;
  };
  checklist: Array<{ id: string; title: string; completedAt: Date | string | null; dueAt: Date | string | null }>;
  finalPay: null | {
    id: string;
    status: string;
    regularHours: string;
    overtimeHours: string;
    regularPayCents: number;
    overtimePayCents: number;
    ptoPayoutCents: number;
    adjustmentCents: number;
    totalCents: number;
  };
  events: Array<{ id: string; eventType: string; message: string | null; createdAt: Date | string }>;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function dateLabel(value: Date | string | null) {
  if (!value) return "Not set";
  return format(new Date(value), "MMM d, yyyy");
}

export function OffboardingAdminClient({ dashboard, members, details }: { dashboard: Dashboard; members: Member[]; details: Detail[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(details[0]?.record.id ?? dashboard.rows[0]?.id ?? "");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const selected = details.find((detail) => detail.record.id === selectedId) ?? details[0] ?? null;

  async function initiate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const departureType = String(form.get("departureType") ?? "voluntary_notice");
    if (departureType.includes("involuntary") && confirm !== "TERMINATE") return;
    setPending(true);
    await fetch("/api/offboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        membershipId: String(form.get("membershipId") ?? ""),
        departureType,
        finalDay: String(form.get("finalDay") ?? ""),
        effectiveDate: String(form.get("effectiveDate") || form.get("finalDay") || ""),
        workState: String(form.get("workState") ?? ""),
        reasonPrivate: String(form.get("reasonPrivate") ?? ""),
        noteToEmployee: String(form.get("noteToEmployee") ?? ""),
        notifyEmployee: form.get("notifyEmployee") === "on"
      })
    });
    setPending(false);
    router.refresh();
  }

  async function post(path: string) {
    await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat icon={UserMinus} label="Active offboardings" value={dashboard.stats.active} />
        <Stat icon={AlertTriangle} label="Final pay overdue" value={dashboard.stats.overdueFinalPay} danger={dashboard.stats.overdueFinalPay > 0} />
        <Stat icon={Clock3} label="Deadlines this week" value={dashboard.stats.dueThisWeek} />
        <Stat icon={Archive} label="Archive in 30 days" value={dashboard.stats.archivingSoon} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-md border border-border bg-white/65 p-5">
          <h2 className="font-semibold">Initiate Offboarding</h2>
          <form onSubmit={initiate} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">Employee<select name="membershipId" required className="h-11 rounded-md border border-border bg-white px-3 text-ink">{members.map((member) => <option key={member.id} value={member.id}>{member.name || member.email}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">Departure type<select name="departureType" className="h-11 rounded-md border border-border bg-white px-3 text-ink">
              <option value="voluntary_notice">Voluntary resignation, notice given</option>
              <option value="voluntary_immediate">Voluntary, immediate</option>
              <option value="involuntary_for_cause">For cause</option>
              <option value="involuntary_without_cause">Without cause / layoff</option>
              <option value="fixed_term_end">End of fixed-term contract</option>
              <option value="job_abandonment">Job abandonment</option>
              <option value="retirement">Retirement</option>
              <option value="death">End of employment - death</option>
            </select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Final day<input name="finalDay" type="date" required className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Effective<input name="effectiveDate" type="date" className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">Work state<input name="workState" className="h-11 rounded-md border border-border bg-white px-3 text-ink" placeholder="CA" /></label>
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">HR-only reason<textarea name="reasonPrivate" className="min-h-20 rounded-md border border-border bg-white px-3 py-2 text-ink" /></label>
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">Employee note<textarea name="noteToEmployee" className="min-h-20 rounded-md border border-border bg-white px-3 py-2 text-ink" /></label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input name="notifyEmployee" type="checkbox" defaultChecked /> Notify employee</label>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-semibold">Sensitive action</p>
              <p className="mt-1">For involuntary terminations, type TERMINATE before submitting.</p>
              <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-amber-200 px-3 text-ink" placeholder="TERMINATE" />
            </div>
            <Button disabled={pending || !members.length} className="h-11">{pending ? "Starting..." : "Start offboarding"}</Button>
          </form>
        </section>

        <section className="space-y-5">
          <div className="rounded-md border border-border bg-white/65">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Compliance Queue</h2>
            </div>
            <div className="divide-y divide-border">
              {dashboard.rows.map((row) => (
                <button key={row.id} onClick={() => setSelectedId(row.id)} className={`grid w-full gap-2 p-4 text-left text-sm md:grid-cols-[1fr_auto] ${selectedId === row.id ? "bg-secondary/50" : "hover:bg-cream/60"}`}>
                  <span>
                    <span className="block font-semibold">{row.employeeName || row.employeeEmail}</span>
                    <span className="mt-1 block text-muted-foreground">{row.departureType.replaceAll("_", " ")} · final day {dateLabel(row.finalDay)}</span>
                  </span>
                  <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${row.finalPayDueAt && new Date(row.finalPayDueAt) < new Date() && !["completed", "archived"].includes(row.state) ? "bg-red-50 text-red-700" : "bg-cream text-primary"}`}>{row.state.replaceAll("_", " ")}</span>
                </button>
              ))}
              {!dashboard.rows.length ? <p className="p-5 text-sm text-muted-foreground">No offboarding records yet.</p> : null}
            </div>
          </div>

          {selected ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-md border border-border bg-white/65 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Offboarding Workspace</p>
                    <h2 className="mt-1 text-2xl font-semibold">{selected.record.employeeName || selected.record.employeeEmail}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Status: {selected.record.state.replaceAll("_", " ")} · Last day {dateLabel(selected.record.finalDay)}</p>
                  </div>
                  <Button onClick={() => post(`/api/offboarding/${selected.record.id}/final-pay/generate`)} variant="outline" className="h-10"><DollarSign className="h-4 w-4" /> Generate Final Pay</Button>
                </div>

                <div className="mt-5 rounded-md border border-border bg-cream/55 p-4">
                  <h3 className="font-semibold">Checklist</h3>
                  <div className="mt-3 grid gap-2">
                    {selected.checklist.map((item) => (
                      <button key={item.id} onClick={() => item.completedAt ? undefined : post(`/api/offboarding/${selected.record.id}/checklist/${item.id}`)} className="flex items-center justify-between gap-3 rounded-md bg-white p-3 text-left text-sm">
                        <span className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-sm border ${item.completedAt ? "border-primary bg-primary text-white" : "border-border"}`}>{item.completedAt ? <Check className="h-3.5 w-3.5" /> : null}</span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.dueAt ? dateLabel(item.dueAt) : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-border bg-white p-4">
                  <h3 className="font-semibold">Audit Trail</h3>
                  <div className="mt-3 space-y-3">
                    {selected.events.map((event) => (
                      <div key={event.id} className="text-sm">
                        <p className="font-semibold">{format(new Date(event.createdAt), "MMM d, h:mm a")} · {event.eventType.replaceAll(".", " ")}</p>
                        {event.message ? <p className="mt-1 text-muted-foreground">{event.message}</p> : null}
                      </div>
                    ))}
                    {!selected.events.length ? <p className="text-sm text-muted-foreground">No events logged yet.</p> : null}
                  </div>
                </div>
              </section>

              <aside className="space-y-4 rounded-md border border-border bg-white/65 p-5">
                <h3 className="font-semibold">Final Pay</h3>
                {selected.finalPay ? (
                  <div className="space-y-3 text-sm">
                    <PayLine label="Regular" value={`${selected.finalPay.regularHours}h · ${money(selected.finalPay.regularPayCents)}`} />
                    <PayLine label="Overtime" value={`${selected.finalPay.overtimeHours}h · ${money(selected.finalPay.overtimePayCents)}`} />
                    <PayLine label="PTO payout" value={money(selected.finalPay.ptoPayoutCents)} />
                    <PayLine label="Adjustments" value={money(selected.finalPay.adjustmentCents)} />
                    <div className="border-t border-border pt-3">
                      <PayLine label="Total" value={money(selected.finalPay.totalCents)} strong />
                    </div>
                    <p className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary">Status: {selected.finalPay.status}</p>
                    {selected.finalPay.status === "draft" ? <Button onClick={() => post(`/api/offboarding/${selected.record.id}/final-pay/approve`)} className="h-11 w-full">Approve & Lock</Button> : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Generate final pay after hours and PTO are ready.</p>
                )}
                <div className="rounded-md bg-cream/70 p-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-ink">Compliance</p>
                  <p className="mt-1">Final pay due {dateLabel(selected.record.finalPayDueAt)}.</p>
                  <p className="mt-1">Read-only access until {dateLabel(selected.record.accessEndsAt)}.</p>
                </div>
              </aside>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, danger = false }: { icon: LucideIcon; label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-border bg-white/65"}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function PayLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "text-lg font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
