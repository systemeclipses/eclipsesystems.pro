"use client";

import { useState } from "react";
import { Bell, CalendarDays, Check, ChevronRight, Clock, Eye, Globe2, MapPinned, PlugZap, Save, ScrollText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TimekeepingSettings } from "@/src/db/queries/timekeeping-settings";

type SectionId = "pay-rules" | "holidays" | "pto-categories" | "geofences" | "automation" | "visibility" | "notifications" | "integrations";

const sections: Array<{ id: SectionId; label: string; icon: typeof Clock; disabled?: boolean }> = [
  { id: "pay-rules", label: "Pay Rules", icon: Clock },
  { id: "holidays", label: "Holidays", icon: CalendarDays },
  { id: "pto-categories", label: "PTO Categories", icon: ScrollText },
  { id: "geofences", label: "Geofences", icon: MapPinned },
  { id: "automation", label: "Automation Rules", icon: Sparkles },
  { id: "visibility", label: "Visibility & Privacy", icon: Eye },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: PlugZap, disabled: true }
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type PtoCategorySetting = {
  id: string;
  name: string;
  isPaid: boolean;
  accrualRule: unknown;
  capHours: string | null;
  weeklyMaxHours: string | null;
  noticeDays: number;
  probationApplies: boolean;
  negativeBalanceAllowed: boolean;
};

export function TimekeepingSettingsClient({ initialSettings, initialPtoCategories }: { initialSettings: TimekeepingSettings; initialPtoCategories: PtoCategorySetting[] }) {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("pay-rules");
  const [settings, setSettings] = useState(initialSettings);
  const [ptoCategories, setPtoCategories] = useState(initialPtoCategories);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorySavingId, setCategorySavingId] = useState<string | null>(null);

  function updatePayRules(next: Partial<TimekeepingSettings["payRules"]>) {
    setSettings((current) => ({ ...current, payRules: { ...current.payRules, ...next } }));
    setDirty(true);
  }

  function updateVisibility(next: Partial<TimekeepingSettings["visibility"]>) {
    setSettings((current) => ({ ...current, visibility: { ...current.visibility, ...next } }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const response = await fetch("/api/settings/timekeeping", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ settings })
    });
    setSaving(false);
    if (response.ok) {
      setSettings(await response.json() as TimekeepingSettings);
      setDirty(false);
      router.refresh();
    }
  }

  async function updatePtoBalancePolicy(categoryId: string, negativeBalanceAllowed: boolean) {
    setCategorySavingId(categoryId);
    const response = await fetch("/api/settings/timekeeping", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "update_pto_category_balance_policy", categoryId, negativeBalanceAllowed })
    });
    setCategorySavingId(null);

    if (response.ok) {
      const category = await response.json() as PtoCategorySetting;
      setPtoCategories((current) => current.map((item) => item.id === category.id ? { ...item, negativeBalanceAllowed: category.negativeBalanceAllowed } : item));
      router.refresh();
    }
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-secondary">Settings <ChevronRight className="h-4 w-4" /> Timekeeping & PTO</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-title text-5xl leading-[0.9] text-cream md:text-7xl">Timekeeping & PTO</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">Configure payroll rules, PTO policies, geofence behavior, visibility, and notification defaults.</p>
            <p className="mt-3 text-xs text-white/55">Last edited by {settings.lastEditedBy ?? "system"} on {settings.lastEditedAt ? new Date(settings.lastEditedAt).toLocaleDateString() : "not yet saved"}</p>
          </div>
          <Button onClick={save} disabled={!dirty || saving} className="h-12 bg-cream px-5 text-primary hover:bg-white">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="rounded-md border border-border bg-white/65 p-2 lg:sticky lg:top-5 lg:self-start">
          {sections.map(({ id, label, icon: Icon, disabled }) => (
            <button
              key={id}
              onClick={() => !disabled && setActive(id)}
              disabled={disabled}
              className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold ${active === id ? "bg-primary text-white" : disabled ? "cursor-not-allowed text-muted-foreground/45" : "text-muted-foreground hover:bg-secondary/70 hover:text-ink"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {disabled ? <span className="ml-auto rounded-sm bg-cream px-2 py-0.5 text-[11px] text-muted-foreground">Soon</span> : null}
            </button>
          ))}
        </nav>

        <div className="min-h-[640px] rounded-md border border-border bg-white/65">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-white/90 p-4 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Settings / Timekeeping & PTO</p>
              <h2 className="mt-1 text-xl font-semibold">{sections.find((section) => section.id === active)?.label}</h2>
            </div>
            <Button onClick={save} disabled={!dirty || saving} className="h-10">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          {active === "pay-rules" ? (
            <div className="space-y-6 p-5">
              <SettingsGroup title="Defaults" description="These defaults drive regular, overtime, break, and pay-period calculations for new employees.">
                <NumberField label="Standard workweek hours" value={settings.payRules.standardWorkweekHours} onChange={(value) => updatePayRules({ standardWorkweekHours: value })} />
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Overtime threshold basis
                  <select value={settings.payRules.overtimeBasis} onChange={(event) => updatePayRules({ overtimeBasis: event.target.value as "weekly" | "daily" })} className="h-11 rounded-md border border-border bg-white px-3 text-ink">
                    <option value="weekly">Hours per week</option>
                    <option value="daily">Hours per day</option>
                  </select>
                </label>
                <NumberField label={settings.payRules.overtimeBasis === "weekly" ? "Overtime threshold, hours/week" : "Overtime threshold, hours/day"} value={settings.payRules.overtimeThreshold} onChange={(value) => updatePayRules({ overtimeThreshold: value })} />
                <NumberField label="Overtime multiplier" value={settings.payRules.overtimeMultiplier} step="0.1" onChange={(value) => updatePayRules({ overtimeMultiplier: value })} />
                <Toggle label="Enable double-time" checked={settings.payRules.doubleTimeEnabled} onChange={(checked) => updatePayRules({ doubleTimeEnabled: checked })} />
                {settings.payRules.doubleTimeEnabled ? (
                  <>
                    <NumberField label="Double-time threshold" value={settings.payRules.doubleTimeThreshold} onChange={(value) => updatePayRules({ doubleTimeThreshold: value })} />
                    <NumberField label="Double-time multiplier" value={settings.payRules.doubleTimeMultiplier} step="0.1" onChange={(value) => updatePayRules({ doubleTimeMultiplier: value })} />
                  </>
                ) : null}
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Default pay period
                  <select value={settings.payRules.payPeriod} onChange={(event) => updatePayRules({ payPeriod: event.target.value as TimekeepingSettings["payRules"]["payPeriod"] })} className="h-11 rounded-md border border-border bg-white px-3 text-ink">
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Pay period start day
                  <select value={settings.payRules.payPeriodStartDay} onChange={(event) => updatePayRules({ payPeriodStartDay: event.target.value })} className="h-11 rounded-md border border-border bg-white px-3 text-ink">
                    {days.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Round punches
                  <select value={settings.payRules.punchRoundingMinutes} onChange={(event) => updatePayRules({ punchRoundingMinutes: Number(event.target.value) as 0 | 1 | 5 | 10 | 15 })} className="h-11 rounded-md border border-border bg-white px-3 text-ink">
                    <option value={0}>Off</option>
                    <option value={1}>Nearest 1 minute</option>
                    <option value={5}>Nearest 5 minutes</option>
                    <option value={10}>Nearest 10 minutes</option>
                    <option value={15}>Nearest 15 minutes</option>
                  </select>
                </label>
                <Toggle label="Paid breaks" checked={settings.payRules.paidBreaks} onChange={(checked) => updatePayRules({ paidBreaks: checked })} />
              </SettingsGroup>

              <SettingsGroup title="Auto Clock-Out" description="Safety net for forgotten clock-outs. Auto clock-out always flags the shift for manager review.">
                <Toggle label="Enable auto clock-out" checked={settings.payRules.autoClockOut.enabled} onChange={(checked) => updatePayRules({ autoClockOut: { ...settings.payRules.autoClockOut, enabled: checked } })} />
                <NumberField label="Maximum shift length before auto clock-out" value={settings.payRules.autoClockOut.thresholdHours} step="0.25" onChange={(value) => updatePayRules({ autoClockOut: { ...settings.payRules.autoClockOut, thresholdHours: value } })} />
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Synthetic end time
                  <select value={settings.payRules.autoClockOut.syntheticEndStrategy} onChange={(event) => updatePayRules({ autoClockOut: { ...settings.payRules.autoClockOut, syntheticEndStrategy: event.target.value as TimekeepingSettings["payRules"]["autoClockOut"]["syntheticEndStrategy"] } })} className="h-11 rounded-md border border-border bg-white px-3 text-ink">
                    <option value="threshold_time">Clock-in time plus threshold</option>
                    <option value="last_location_ping">Last location ping</option>
                    <option value="shift_start_plus_8">Shift start plus 8 hours</option>
                  </select>
                </label>
                <Toggle label="Notify manager" checked={settings.payRules.autoClockOut.notifyManager} onChange={(checked) => updatePayRules({ autoClockOut: { ...settings.payRules.autoClockOut, notifyManager: checked } })} />
                <Toggle label="Notify employee" checked={settings.payRules.autoClockOut.notifyEmployee} onChange={(checked) => updatePayRules({ autoClockOut: { ...settings.payRules.autoClockOut, notifyEmployee: checked } })} />
                <div className="rounded-md border border-dashed border-border bg-cream/50 p-4 text-sm text-muted-foreground">
                  Role and site threshold overrides are supported in config and will get dedicated editors in the next admin pass.
                </div>
              </SettingsGroup>

              <SettingsGroup title="Shift Differentials" description="Off by default. Add rules later for nights, weekends, or specific shifts.">
                <Toggle label="Enable shift differentials" checked={settings.payRules.shiftDifferentialsEnabled} onChange={(checked) => updatePayRules({ shiftDifferentialsEnabled: checked })} />
                <div className="rounded-md border border-dashed border-border bg-cream/50 p-4 text-sm text-muted-foreground">
                  Differential editor: name, days, time range, multiplier or flat add-on. Ready for the next iteration.
                </div>
              </SettingsGroup>

              <SettingsGroup title="Per-Employee Overrides" description="Overrides require an employee, effective date, and audit reason.">
                <div className="rounded-md border border-dashed border-border bg-cream/50 p-4 text-sm text-muted-foreground">
                  Search/select employee, apply override, and show effective-dated history. Pay rate management stays on the employee record.
                </div>
              </SettingsGroup>
            </div>
          ) : null}

          {active === "visibility" ? (
            <div className="space-y-6 p-5">
              <SettingsGroup title="Team Calendar Visibility" description="Choose how much PTO context employees can see.">
                {[
                  ["off", "Off", "Only managers and admins see the team calendar."],
                  ["names", "Names only", "Employees see who is out, with no category shown."],
                  ["category", "Names + category", "Employees see who is out and PTO type."],
                  ["full", "Full detail", "Names, category, and notes are visible."]
                ].map(([value, label, description]) => (
                  <label key={value} className="flex gap-3 rounded-md border border-border bg-white p-3 text-sm">
                    <input type="radio" name="visibility" checked={settings.visibility.teamCalendar === value} onChange={() => updateVisibility({ teamCalendar: value as TimekeepingSettings["visibility"]["teamCalendar"] })} />
                    <span><span className="block font-semibold text-ink">{label}</span><span className="text-muted-foreground">{description}</span></span>
                  </label>
                ))}
                <Toggle label="Show pay rate on employee profile" checked={settings.visibility.showPayRate} onChange={(checked) => updateVisibility({ showPayRate: checked })} />
                <Toggle label="Show coworker contact info" checked={settings.visibility.showCoworkerContactInfo} onChange={(checked) => updateVisibility({ showCoworkerContactInfo: checked })} />
                <Toggle label="Manager can see employee home address" checked={settings.visibility.managerCanSeeHomeAddress} onChange={(checked) => updateVisibility({ managerCanSeeHomeAddress: checked })} />
              </SettingsGroup>
            </div>
          ) : null}

          {active === "pto-categories" ? (
            <div className="space-y-6 p-5">
              <SettingsGroup title="Request Balance Policy" description="Choose whether each PTO category blocks requests that exceed the employee's available balance. When allowed, the request still goes to manager review with a warning and audit trail.">
                <div className="md:col-span-2 overflow-hidden rounded-md border border-border bg-white">
                  <div className="grid grid-cols-[1.2fr_0.7fr_1fr] gap-3 border-b border-border bg-cream/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    <span>Category</span>
                    <span>Balance</span>
                    <span>Policy</span>
                  </div>
                  {ptoCategories.map((category) => (
                    <div key={category.id} className="grid grid-cols-[1.2fr_0.7fr_1fr] gap-3 border-b border-border px-4 py-4 text-sm last:border-b-0">
                      <div>
                        <p className="font-semibold text-ink">{category.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{category.isPaid ? "Paid PTO" : "Unpaid leave"} · Notice {category.noticeDays}d</p>
                      </div>
                      <span className="text-muted-foreground">{category.capHours ? `Cap ${category.capHours}h` : "No cap"}</span>
                      <Toggle
                        label={category.negativeBalanceAllowed ? "Allow insufficient balance requests" : "Block insufficient balance requests"}
                        checked={category.negativeBalanceAllowed}
                        onChange={(checked) => updatePtoBalancePolicy(category.id, checked)}
                        disabled={categorySavingId === category.id || !category.isPaid}
                      />
                    </div>
                  ))}
                </div>
                <div className="md:col-span-2 rounded-md border border-dashed border-border bg-cream/50 p-4 text-sm leading-6 text-muted-foreground">
                  Unpaid leave does not require a balance. Paid categories default to blocking insufficient-balance requests until an admin explicitly enables this policy.
                </div>
              </SettingsGroup>
            </div>
          ) : null}

          {!["pay-rules", "visibility", "pto-categories"].includes(active) ? <Placeholder section={active} /> : null}
        </div>
      </div>
    </section>
  );
}

function SettingsGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-muted-foreground">
      {label}
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-11 rounded-md border border-border bg-white px-3 text-ink" />
    </label>
  );
}

function Toggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex min-h-11 items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-sm font-medium text-ink ${disabled ? "opacity-60" : ""}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5" />
    </label>
  );
}

function Placeholder({ section }: { section: SectionId }) {
  const copy: Record<SectionId, string> = {
    "pay-rules": "",
    holidays: "Calendar, inline holiday list, federal preload, recurring holidays, and department/site applicability live here.",
    "pto-categories": "Category table, paid/unpaid indicators, accrual rules, blackout ranges, approvals, and year-end handling live here.",
    geofences: "Map, site radii, address lookup, out-of-bounds behavior, and employee assignment controls live here.",
    automation: "Rule list and dropdown-driven builder. Rules remain disabled unless explicitly enabled.",
    visibility: "",
    notifications: "Role-based notification matrices for email, in-app, and push defaults live here.",
    integrations: "QuickBooks, Gusto, ADP, Paychex, Slack, and calendar sync are Phase 3 placeholders."
  };

  return (
    <div className="grid min-h-[480px] place-items-center p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-secondary text-primary">
          <Globe2 className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-semibold">Section scaffolded</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy[section]}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-cream px-3 py-2 text-xs font-semibold text-primary"><Check className="h-3.5 w-3.5" /> Ready for the next implementation pass</p>
      </div>
    </div>
  );
}
