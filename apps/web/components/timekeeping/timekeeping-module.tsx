"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Coffee, FileDown, MapPin, MessageSquare, MoreHorizontal, Plus, Send, Settings, ShieldCheck, Sparkles, Timer, WifiOff, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  description: string | null;
  punch_note: string | null;
  started_at: Date | string;
  ended_at: Date | string | null;
  duration_seconds: number | null;
  status: string;
  review_flag: string | null;
};

type Running = Entry | null;

type Category = {
  id: string;
  name: string;
  is_paid: boolean;
  accrued: string | null;
  used: string | null;
  pending: string | null;
  adjusted: string | null;
  notice_days: number;
  probation_applies: boolean;
  negative_balance_allowed: boolean;
  blackout_dates: string[];
};

type RequestRow = {
  id: string;
  category_name: string;
  starts_at: Date | string;
  ends_at: Date | string;
  hours: string;
  status: "draft" | "pending" | "needs_revision" | "approved" | "denied" | "cancelled" | "revoked" | "completed";
  employee_note: string | null;
  manager_note: string | null;
  submitted_at: Date | string;
};

type ValidationIssue = {
  code: string;
  severity: "error" | "warning" | "info";
  field?: string;
  message: string;
  overridable?: boolean;
};

type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  computed: {
    hours_requested: number;
    balance_before: number;
    balance_after: number;
    business_days: number;
    affected_dates: string[];
  };
};

type ClockSuccess = {
  title: string;
  subtitle: string;
  detail: string;
  earned?: string;
} | null;

type ManagerQueue = {
  pendingRequests: Array<{
    id: string;
    employee_name: string | null;
    employee_email: string;
    category_name: string;
    starts_at: Date | string;
    ends_at: Date | string;
    hours: string;
    employee_note: string | null;
    submitted_at: Date | string;
  }>;
  flaggedEntries: Array<{
    id: string;
    employee_name: string | null;
    employee_email: string;
    started_at: Date | string;
    ended_at: Date | string | null;
    review_flag: string | null;
    punch_note: string | null;
  }>;
};

type Props = {
  running: Running;
  entries: Entry[];
  categories: Category[];
  requests: RequestRow[];
  managerQueue: ManagerQueue;
  hasPtoToday: boolean;
  role: string;
  summary: {
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    earnings: number;
    payRateCents: number;
  };
  paidBreaks: boolean;
  timesheet: {
    employee: { id: string; employee_name: string | null; employee_email: string; payRateCents: number };
    pay_period: { start: string; end: string; status: string };
    summary: Record<string, number>;
    days: Array<{
      date: string;
      hours: number;
      pay: number;
      punches: Entry[];
      breaks: Array<{ start: string; end: string; paid: boolean }>;
      pto: Array<{ id: string; category_name: string; hours: string; status: string }>;
      holiday: null | { name: string; multiplier: number };
      status: string;
    }>;
    status: string;
    calculation_explanation: string;
  };
  teamTimesheets: null | {
    rows: Array<{
      membership_id: string;
      employee_name: string | null;
      employee_email: string;
      department: string | null;
      regular_hours: number;
      overtime_hours: number;
      holiday_hours: number;
      pto_hours: number;
      total_hours: number;
      total_pay: number;
      status: string;
    }>;
    insights: { pending: number; flagged: number; approved: number; overtimeHours: number; laborCost: number; currentlyClockedIn: number };
  };
  managerV2: null | {
    templates: Array<{ id: string; name: string; action: string; enabled: boolean; lastTriggeredAt: string | null; triggerCount: number }>;
    coverageRules: Array<{ id: string; name: string; severity: "soft" | "hard"; enabled: boolean; minimumRequired: number; daysOfWeek: number[]; startsAtTime: string | null; endsAtTime: string | null }>;
    insights: Array<{ id: string; title: string; body: string; severity: string; type: string }>;
    recentMessages: Array<{ id: string; requestId: string; body: string; createdAt: string }>;
    reactions: Array<{ id: string; requestId: string; reaction: string | null; message: string | null; createdAt: string }>;
    stats: { activeTemplates: number; coverageGapsThisMonth: number; messagesLast30Days: number; reactionsLast30Days: number };
  };
  currentShift: { state: "CLOCKED_OUT" | "CLOCKED_IN" | "ON_BREAK" | "PENDING_REVIEW" | "LOCKED"; shift: null | { startedAt: string; currentBreakStartedAt: string | null; flagReason: string | null } };
};

const tabs = [
  { id: "clock", label: "Clock", icon: Clock3 },
  { id: "timesheet", label: "Hours", icon: Timer },
  { id: "pto", label: "PTO", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

type TabId = (typeof tabs)[number]["id"];

function readTab(value: string | null): TabId {
  return tabs.some((tab) => tab.id === value) ? (value as TabId) : "clock";
}

function secondsFor(entry: Entry) {
  if (entry.duration_seconds !== null) return entry.duration_seconds;
  if (!entry.ended_at) return Math.max(0, Math.floor((Date.now() - new Date(entry.started_at).getTime()) / 1000));
  return Math.max(0, Math.floor((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / 1000));
}

function hours(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

function dateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatShortDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function parseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function responseErrorMessage(response: Response, text: string, fallback: string) {
  const payload = parseJson<{ error?: string }>(text);
  if (payload?.error) return payload.error;
  const pageTitle = text.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
  if (pageTitle) return `${fallback} (${response.status}: ${pageTitle})`;
  return `${fallback} (${response.status})`;
}

export function TimekeepingModule({ running, entries, categories, requests, managerQueue, hasPtoToday, role, summary, paidBreaks, timesheet, teamTimesheets, managerV2, currentShift }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => readTab(searchParams.get("tab")));
  const [active, setActive] = useState(running);
  const [shiftState, setShiftState] = useState(currentShift.state);
  const [breakStartedAt, setBreakStartedAt] = useState<string | null>(currentShift.shift?.currentBreakStartedAt ?? null);
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState("");
  const [clockError, setClockError] = useState<string | null>(null);
  const [clockNotice, setClockNotice] = useState<string | null>(null);
  const [clockPending, setClockPending] = useState(false);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const [online, setOnline] = useState(true);
  const [ptoError, setPtoError] = useState<string | null>(null);
  const [ptoNotice, setPtoNotice] = useState<string | null>(null);
  const [requestFilter, setRequestFilter] = useState<RequestRow["status"] | "all">("pending");
  const [timesheetView, setTimesheetView] = useState<"hours" | "earnings" | "calendar">("hours");
  const [expandedDay, setExpandedDay] = useState<string | null>(timesheet.days.find((day) => day.hours > 0)?.date ?? null);
  const [teamStatusFilter, setTeamStatusFilter] = useState<string>("all");
  const [clockSuccess, setClockSuccess] = useState<ClockSuccess>(null);
  const [pastPunchOpen, setPastPunchOpen] = useState(false);
  const [pastPunchPending, setPastPunchPending] = useState(false);
  const [ptoFlowOpen, setPtoFlowOpen] = useState(false);
  const [ptoStep, setPtoStep] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => {
    setTab(readTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    const syncOnlineState = () => setOnline(navigator.onLine);
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  const runningDuration = active ? secondsFor(active) : 0;
  void tick;
  const filteredRequests = requestFilter === "all" ? requests : requests.filter((request) => request.status === requestFilter);
  const isManager = ["owner", "admin", "manager"].includes(role);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const defaultPtoHours = useMemo(() => "8.00", []);
  const defaultPtoDraft = useMemo(() => ({
    categoryId: categories[0]?.id ?? "",
    startsAt: dateInputValue(now),
    endsAt: dateInputValue(tomorrow),
    hours: defaultPtoHours,
    employeeNote: ""
  }), [categories, defaultPtoHours]);
  const [ptoDraft, setPtoDraft] = useState(defaultPtoDraft);
  const [ptoValidation, setPtoValidation] = useState<ValidationResult | null>(null);

  const selectedCategory = categories.find((category) => category.id === ptoDraft.categoryId) ?? categories[0] ?? null;
  const breakDuration = breakStartedAt ? Math.max(0, Math.floor((Date.now() - new Date(breakStartedAt).getTime()) / 1000)) : 0;

  function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  useEffect(() => {
    if (!ptoDraft.categoryId || !ptoDraft.startsAt || !ptoDraft.endsAt || !ptoDraft.hours) return;
    const handle = window.setTimeout(async () => {
      const response = await fetch("/api/pto/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ptoDraft)
      });
      if (response.ok) setPtoValidation(await response.json() as ValidationResult);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [ptoDraft]);

  async function getLocation() {
    if (!navigator.geolocation) return null;
    return new Promise<{ latitude: number; longitude: number; accuracy?: number | null } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
        () => resolve(null),
        { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
      );
    });
  }

  async function punch() {
    if (!active && hasPtoToday && !window.confirm("You have approved PTO today. Clock in anyway? Your manager will be able to review the overlap.")) return;
    vibrate(12);
    setClockPending(true);
    setClockError(null);
    setClockNotice(null);
    if (active) {
      const currentResponse = await fetch("/api/punches/current", { cache: "no-store" });
      if (currentResponse.ok) {
        const current = parseJson<{ state?: typeof shiftState; current_break_start?: string | null }>(await currentResponse.text());
        if (current?.state === "CLOCKED_OUT") {
          setActive(null);
          setBreakStartedAt(null);
          setShiftState("CLOCKED_OUT");
          setClockPending(false);
          setClockNotice("You were already clocked out. The timer has been refreshed.");
          router.refresh();
          return;
        }
        if (current?.state) {
          setShiftState(current.state);
          setBreakStartedAt(current.current_break_start ?? null);
        }
      }
    }
    const location = await getLocation();
    setGpsUnavailable(!location);
    const response = await fetch(active ? "/api/time-entries/stop" : "/api/time-entries/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: active?.id,
        requestId: crypto.randomUUID(),
        note,
        location,
        platform: navigator.platform,
        offline: !navigator.onLine
      })
    });
    const responseText = await response.text();
    const payload = parseJson<{ error?: string; current_state?: typeof shiftState; id?: string; started_at?: string; flags?: string[] }>(responseText);
    setClockPending(false);
    if (!response.ok) {
      setClockError(payload?.error ?? responseErrorMessage(response, responseText, "Unable to punch."));
      return;
    }

    setNote("");
    if (active) {
      const duration = secondsFor(active);
      const earned = money(Math.round((duration / 3600) * summary.payRateCents));
      const subtitle = `at ${format(new Date(), "h:mm a")}`;
      setClockNotice(`Clocked out. ${formatDuration(duration)} recorded.`);
      setClockSuccess({ title: "Clocked out", subtitle, detail: `${formatDuration(duration)} worked`, earned });
      vibrate([20, 30, 20]);
      window.setTimeout(() => setClockSuccess(null), 2200);
      setActive(null);
      setBreakStartedAt(null);
      setShiftState("CLOCKED_OUT");
    } else {
      setClockNotice("Clocked in successfully.");
      setShiftState(payload?.current_state ?? "CLOCKED_IN");
      setActive({ id: payload?.id ?? crypto.randomUUID(), description: null, punch_note: note || null, started_at: payload?.started_at ?? new Date().toISOString(), ended_at: null, duration_seconds: null, status: payload?.flags?.length ? "flagged" : "draft", review_flag: payload?.flags?.[0] ?? null });
      setClockSuccess({ title: "Clocked in", subtitle: `at ${format(new Date(payload?.started_at ?? new Date()), "h:mm a")}`, detail: "Main Site" });
      vibrate([20, 30, 20]);
      window.setTimeout(() => setClockSuccess(null), 1400);
    }
    router.refresh();
  }

  async function toggleBreak() {
    const ending = shiftState === "ON_BREAK";
    const response = await fetch(ending ? "/api/punches/break/end" : "/api/punches/break/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: crypto.randomUUID(), note, platform: navigator.platform, offline: !navigator.onLine })
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; state?: typeof shiftState } | null;
    if (!response.ok) {
      setClockError(payload?.error ?? "Unable to update break.");
      return;
    }
    if (ending) {
      vibrate(18);
      setBreakStartedAt(null);
      setShiftState("CLOCKED_IN");
      setClockNotice("Break ended. Shift timer resumed.");
      return;
    }
    vibrate(18);
    setBreakStartedAt(new Date().toISOString());
    setShiftState("ON_BREAK");
    setClockNotice("Break started.");
  }

  async function submitPto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPtoError(null);
    setPtoNotice(null);
    const payload = { ...ptoDraft, acknowledgeWarnings: ptoValidation?.warnings.filter((warning) => warning.overridable).map((warning) => warning.code) ?? [] };
    const response = await fetch("/api/pto/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = (await response.json().catch(() => null)) as { error?: string; warnings?: string[]; validation?: ValidationResult } | null;
    if (!response.ok) {
      if (body?.validation) setPtoValidation(body.validation);
      setPtoError(body?.validation?.errors[0]?.message ?? body?.error ?? "Unable to submit PTO request.");
      return;
    }
    if (body?.validation?.warnings?.length) setPtoNotice(body.validation.warnings[0].message);
    setPtoDraft(defaultPtoDraft);
    setPtoValidation(null);
    setPtoFlowOpen(false);
    setPtoStep(0);
    setPtoNotice("Request submitted. Your manager will review it.");
    vibrate([20, 30, 20]);
    router.refresh();
  }

  async function submitPastPunch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") ?? "");
    const startedAt = `${date}T${String(form.get("startTime") ?? "08:00")}`;
    const endedAt = `${date}T${String(form.get("endTime") ?? "17:00")}`;
    setPastPunchPending(true);
    setClockError(null);
    const response = await fetch("/api/time-entries/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        description: String(form.get("type") ?? "Past punch correction"),
        startedAt,
        endedAt,
        reason: String(form.get("reason") ?? "")
      })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPastPunchPending(false);
    if (!response.ok) {
      setClockError(body?.error ?? "Unable to submit past punch.");
      return;
    }
    setPastPunchOpen(false);
    setClockNotice("Past punch submitted for review.");
    router.refresh();
  }

  async function cancelRequest(id: string) {
    const response = await fetch(`/api/pto/requests/${id}/cancel`, { method: "POST" });
    if (!response.ok) {
      setPtoError("Unable to cancel request.");
      return;
    }
    setSelectedRequest(null);
    setPtoNotice("Request canceled.");
    router.refresh();
  }

  async function decideRequest(id: string, status: "approved" | "denied") {
    await fetch(`/api/pto/requests/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
  }

  function statusTone(status: string) {
    if (status === "approved") return "bg-green-50 text-green-700";
    if (status === "completed") return "bg-blue-50 text-blue-700";
    if (status === "revoked" || status === "denied" || status === "cancelled") return "bg-red-50 text-red-700";
    if (status === "flagged") return "bg-red-50 text-red-700";
    if (status === "pending" || status === "needs_revision") return "bg-amber-50 text-amber-700";
    return "bg-cream text-primary";
  }

  const employeeName = timesheet.employee.employee_name?.split(" ")[0] ?? "there";
  const lastCompletedEntry = entries.find((entry) => entry.ended_at);
  const todayKey = format(now, "yyyy-MM-dd");
  const todaySeconds = entries
    .filter((entry) => format(new Date(entry.started_at), "yyyy-MM-dd") === todayKey)
    .reduce((sum, entry) => sum + secondsFor(entry), 0);
  const currentShiftEarned = money(Math.round((runningDuration / 3600) * summary.payRateCents));
  const todayEarned = money(Math.round((todaySeconds / 3600) * summary.payRateCents));
  const clockActionLabel = active ? shiftState === "ON_BREAK" ? "End Break" : "Clock Out" : hasPtoToday ? "Clock In Anyway" : "Clock In";
  const clockButtonTone = active ? shiftState === "ON_BREAK" ? "bg-[#D97706] hover:bg-[#b96305]" : "bg-[#DC2626] hover:bg-[#b91c1c]" : "bg-[#16A34A] hover:bg-[#15803d]";

  return (
    <section className="space-y-5 pb-24 md:pb-0">
      {tab !== "clock" ? <div className="hidden overflow-hidden rounded-md bg-primary p-5 text-white md:block md:p-7">
        <p className="text-sm font-semibold text-secondary">Timekeeping and PTO</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-title text-5xl leading-[0.9] text-cream md:text-7xl">Workforce hours.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">Clock events, pay-period review, PTO balances, approvals, and audit trails in one payroll-ready workspace.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
            <Metric label="Total" value={`${summary.totalHours.toFixed(2)}h`} />
            <Metric label="OT" value={`${summary.overtimeHours.toFixed(2)}h`} />
            <Metric label="Rate" value={money(summary.payRateCents)} />
            <Metric label="Earned" value={money(Math.round(summary.earnings * 100))} />
          </div>
        </div>
      </div> : null}

      <div className={`${tab === "clock" ? "md:hidden" : "hidden md:flex"} gap-2 overflow-x-auto rounded-md border border-border bg-white/65 p-2`}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary/70 hover:text-ink"}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "clock" ? (
        <div className="mx-auto w-full max-w-5xl space-y-10 px-0 py-2 sm:px-2 md:py-6">
          {!online ? (
            <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              <WifiOff className="h-4 w-4 shrink-0" />
              Offline - your punches will sync when you are back online.
            </div>
          ) : null}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-ink md:text-3xl">
              {active ? shiftState === "ON_BREAK" ? "On break" : "You're clocked in" : `${greetingFor(now)}, ${employeeName}`}
            </h1>
            <p className="text-base text-muted-foreground">
              {active
                ? shiftState === "ON_BREAK"
                  ? `Started at ${breakStartedAt ? format(new Date(breakStartedAt), "h:mm a") : "now"} · Break is ${paidBreaks ? "paid" : "unpaid"}`
                  : `Started at ${format(new Date(active.started_at), "h:mm a")} at Main Site`
                : format(now, "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          <div className="mx-auto flex max-w-[720px] flex-col items-center">
            {hasPtoToday && !active ? (
              <div className="mb-5 flex w-full gap-3 rounded-md border border-[#d7ddbc] bg-secondary/70 p-3 text-sm text-[#35483b]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>You have approved PTO today. Clocking in is not required.</p>
              </div>
            ) : null}
            {gpsUnavailable ? (
              <div className="mb-5 flex w-full gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Could not verify your location. This punch will be flagged for review.</p>
              </div>
            ) : null}
            {clockNotice ? <p className="mb-5 w-full rounded-md bg-secondary/70 p-3 text-sm font-semibold text-primary">{clockNotice}</p> : null}
            {clockError ? <p className="mb-5 w-full rounded-md bg-red-50 p-3 text-sm text-red-700">{clockError}</p> : null}

            {active ? (
              <div className="mb-8 w-full rounded-md border border-border bg-white/80 px-5 py-6 text-center shadow-sm">
                {shiftState === "ON_BREAK" ? (
                  <>
                    <p className="font-mono text-5xl font-semibold tabular-nums text-ink md:text-7xl">Break: {formatDuration(breakDuration)}</p>
                    <p className="mt-4 font-mono text-2xl text-muted-foreground md:text-3xl">Shift: {formatDuration(runningDuration)}</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-6xl font-semibold tabular-nums text-ink md:text-8xl">{formatDuration(runningDuration)}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">hours · minutes · seconds</p>
                  </>
                )}
              </div>
            ) : null}

            <button
              onClick={shiftState === "ON_BREAK" ? toggleBreak : punch}
              disabled={clockPending || shiftState === "LOCKED"}
              aria-label={clockActionLabel}
              className={`grid min-h-[260px] w-full place-items-center rounded-2xl px-8 py-16 text-center text-white shadow-xl shadow-black/10 transition hover:scale-[1.01] hover:shadow-2xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65 md:min-h-[300px] ${clockButtonTone}`}
            >
              <span>
                <span className="block text-5xl font-bold uppercase tracking-[0.02em] md:text-6xl">{clockPending ? "Processing..." : clockActionLabel}</span>
                {!active ? (
                  <span className="mt-8 inline-flex items-center gap-2 text-xl font-semibold text-white/90 md:text-2xl"><MapPin className="h-6 w-6" /> Main Site</span>
                ) : null}
              </span>
            </button>

            {active && paidBreaks ? (
              <button onClick={shiftState === "ON_BREAK" ? punch : toggleBreak} className="mt-5 inline-flex min-h-12 min-w-52 items-center justify-center gap-2 rounded-md border border-border bg-white px-5 text-sm font-semibold text-ink shadow-sm hover:bg-cream">
                <Coffee className="h-4 w-4" />
                {shiftState === "ON_BREAK" ? "Clock Out (skip break end)" : "Take a Break"}
              </button>
            ) : null}
          </div>

          <div className="mx-auto grid max-w-[720px] gap-4 md:grid-cols-2">
            <ClockSummaryCard
              label={active ? "This Shift" : "Last Shift"}
              value={active ? formatShortDuration(runningDuration) : lastCompletedEntry ? formatShortDuration(secondsFor(lastCompletedEntry)) : "No shift yet"}
              detail={active ? `${currentShiftEarned} earned` : lastCompletedEntry ? `${format(new Date(lastCompletedEntry.started_at), "EEE, MMM d")} · ${money(Math.round((secondsFor(lastCompletedEntry) / 3600) * summary.payRateCents))}` : "Start your first shift"}
              href="/timekeeping?tab=timesheet"
            />
            <ClockSummaryCard
              label={active ? "Today Total" : "This Week"}
              value={active ? formatShortDuration(todaySeconds) : `${summary.totalHours.toFixed(1)} hrs`}
              detail={active ? todayEarned : `${money(Math.round(summary.earnings * 100))} earned`}
              href="/timekeeping?tab=timesheet"
            />
          </div>

          <div className="mx-auto grid max-w-[720px] gap-4 border-t border-border pt-8 md:grid-cols-[1fr_240px]">
            <label className="grid gap-2 text-sm font-medium text-muted-foreground">
              Punch note
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-ink outline-none ring-primary/25 focus:ring-2" placeholder="Forgot badge, GPS issue, starting break..." />
            </label>
            <div className="grid content-start gap-2">
              <button onClick={() => setPastPunchOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary">
                <Plus className="h-4 w-4" />
                Add a past punch
              </button>
              <button onClick={() => setTab("timesheet")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary">
                View this period
              </button>
            </div>
          </div>

          <section className="mx-auto max-w-[720px] space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent Activity</h2>
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm last:border-b-0">
                <div>
                  <p className="font-semibold">{format(new Date(entry.started_at), "MMM d, h:mm a")}{entry.ended_at ? ` - ${format(new Date(entry.ended_at), "h:mm a")}` : " - now"}</p>
                  <p className="mt-1 text-muted-foreground">{entry.ended_at ? `${formatShortDuration(secondsFor(entry))} worked` : "Clocked in at Main Site"}</p>
                </div>
                {entry.review_flag ? <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Review</span> : null}
              </div>
            ))}
            {!entries.length ? <p className="text-sm text-muted-foreground">Recent punches appear here after the first shift.</p> : null}
          </section>
        </div>
      ) : null}

      {tab === "timesheet" ? (
        <div className="space-y-5">
          {isManager && teamTimesheets ? (
            <section className="space-y-4 rounded-md border border-border bg-white/65 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Team Timesheets</p>
                  <h2 className="mt-1 text-2xl font-semibold">{format(new Date(timesheet.pay_period.start), "MMM d")} - {format(new Date(timesheet.pay_period.end), "MMM d, yyyy")}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10"><ChevronLeft className="h-4 w-4" /> Prev</Button>
                  <Button variant="outline" className="h-10">This Period <ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-10">Bulk Approve</Button>
                  <Button variant="outline" className="h-10"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Insight label="Pending approvals" value={teamTimesheets.insights.pending} onClick={() => setTeamStatusFilter("pending")} />
                <Insight label="Flagged punches" value={teamTimesheets.insights.flagged} onClick={() => setTeamStatusFilter("flagged")} />
                <Insight label="Approved" value={teamTimesheets.insights.approved} onClick={() => setTeamStatusFilter("approved")} />
                <Insight label="OT this period" value={`${teamTimesheets.insights.overtimeHours.toFixed(1)}h`} onClick={() => setTeamStatusFilter("all")} />
                <Insight label="Labor cost" value={money(Math.round(teamTimesheets.insights.laborCost * 100))} onClick={() => setTeamStatusFilter("all")} />
              </div>
              <div className="flex flex-wrap gap-2 rounded-md bg-cream/55 p-3">
                <select className="h-10 rounded-md border border-border bg-white px-3 text-sm"><option>Department</option></select>
                <select className="h-10 rounded-md border border-border bg-white px-3 text-sm"><option>Site</option></select>
                <select value={teamStatusFilter} onChange={(event) => setTeamStatusFilter(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                  <option value="approved">Approved</option>
                  <option value="open">Open</option>
                </select>
                <input className="h-10 min-w-52 rounded-md border border-border bg-white px-3 text-sm" placeholder="Search employees" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-secondary/70 text-left">
                    <tr>
                      <th className="p-3"><input type="checkbox" /></th>
                      <th>Employee</th>
                      <th>Hours</th>
                      <th>OT</th>
                      <th>Holiday</th>
                      <th>PTO</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamTimesheets.rows.filter((row) => teamStatusFilter === "all" || row.status === teamStatusFilter).map((row) => (
                      <tr key={row.membership_id} className="border-t border-border">
                        <td className="p-3"><input type="checkbox" /></td>
                        <td><span className="font-semibold">{row.employee_name || row.employee_email}</span><span className="block text-xs text-muted-foreground">{row.department || "No department"}</span></td>
                        <td>{row.total_hours.toFixed(2)}</td>
                        <td>{row.overtime_hours.toFixed(2)}</td>
                        <td>{row.holiday_hours.toFixed(2)}</td>
                        <td>{row.pto_hours.toFixed(2)}</td>
                        <td>{money(Math.round(row.total_pay * 100))}</td>
                        <td><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${statusTone(row.status)}`}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-4 rounded-md border border-border bg-white/65 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{isManager ? "Employee detail" : "Timesheet"}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{format(new Date(timesheet.pay_period.start), "MMM d")} - {format(new Date(timesheet.pay_period.end), "MMM d, yyyy")}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-10"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-10">This Period <ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-10"><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-10"><FileDown className="h-4 w-4" /> Export</Button>
                </div>
              </div>
              <div className="rounded-md border border-border bg-cream/55 p-4">
                <p className="text-sm font-semibold text-muted-foreground">Summary</p>
                <div className="mt-4 grid gap-3">
                  <SummaryLine label="Regular" hours={timesheet.summary.regular_hours} pay={timesheet.summary.regular_pay} />
                  <SummaryLine label="Overtime" hours={timesheet.summary.overtime_hours} pay={timesheet.summary.overtime_pay} note="1.5x" />
                  <SummaryLine label="Holiday" hours={timesheet.summary.holiday_hours} pay={timesheet.summary.holiday_pay} note="Configured multiplier" />
                  <SummaryLine label="PTO" hours={timesheet.summary.pto_hours} pay={timesheet.summary.pto_pay} />
                  <div className="border-t border-border pt-3">
                    <SummaryLine label="Total" hours={timesheet.summary.total_hours} pay={timesheet.summary.total_pay} strong />
                  </div>
                </div>
                <p className={`mt-4 inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${statusTone(timesheet.status)}`}>Status: {timesheet.status}</p>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {["hours", "earnings", "calendar"].map((view) => (
                  <button key={view} onClick={() => setTimesheetView(view as "hours" | "earnings" | "calendar")} className={`h-10 rounded-md px-3 text-sm font-semibold capitalize ${timesheetView === view ? "bg-primary text-white" : "bg-cream text-muted-foreground"}`}>{view}</button>
                ))}
              </div>
              {timesheetView === "hours" ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Daily breakdown</h3>
                  {timesheet.days.map((day) => (
                    <div key={day.date} className={`rounded-md border border-border ${day.hours ? "bg-white" : "bg-white/45 text-muted-foreground"}`}>
                      <button onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)} className="flex w-full items-center justify-between gap-3 p-3 text-left text-sm">
                        <span className="font-semibold">{format(new Date(`${day.date}T00:00:00`), "EEE, MMM d")}</span>
                        <span>{day.hours.toFixed(2)} hrs</span>
                        <span>{money(Math.round(day.pay * 100))}</span>
                        <ChevronDown className={`h-4 w-4 transition ${expandedDay === day.date ? "rotate-180" : ""}`} />
                      </button>
                      {expandedDay === day.date ? (
                        <div className="space-y-2 border-t border-border p-3 text-sm">
                          {day.punches.map((entry) => (
                            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-cream/55 p-3">
                              <span>{format(new Date(entry.started_at), "h:mm a")} to {entry.ended_at ? format(new Date(entry.ended_at), "h:mm a") : "now"}</span>
                              <span>Main Site</span>
                              <span>{formatDuration(secondsFor(entry))}</span>
                              <button className="text-xs font-semibold text-primary">Flag for review</button>
                            </div>
                          ))}
                          {day.pto.map((request) => <p key={request.id} className="rounded-md bg-secondary/70 p-3">PTO - {request.category_name} · {hours(request.hours)} hrs</p>)}
                          {!day.punches.length && !day.pto.length ? <p>No punches or PTO recorded.</p> : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {timesheetView === "earnings" ? (
                <div className="space-y-3 rounded-md border border-border bg-white p-4 text-sm">
                  <p>{timesheet.summary.regular_hours.toFixed(2)} hrs x {money(timesheet.employee.payRateCents)} = {money(Math.round(timesheet.summary.regular_pay * 100))}</p>
                  <p>{timesheet.summary.overtime_hours.toFixed(2)} hrs x {money(timesheet.employee.payRateCents)} x 1.5 = {money(Math.round(timesheet.summary.overtime_pay * 100))}</p>
                  <p>{timesheet.summary.pto_hours.toFixed(2)} PTO hrs x {money(timesheet.employee.payRateCents)} = {money(Math.round(timesheet.summary.pto_pay * 100))}</p>
                  <p className="border-t border-border pt-3 font-semibold">{timesheet.calculation_explanation}</p>
                </div>
              ) : null}
              {timesheetView === "calendar" ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {timesheet.days.map((day) => <div key={day.date} className={`min-h-24 rounded-md border border-border p-3 text-sm ${statusTone(day.status)}`}><p className="font-semibold">{format(new Date(`${day.date}T00:00:00`), "EEE d")}</p><p className="mt-3">{day.hours.toFixed(1)} hrs</p></div>)}
                </div>
              ) : null}
            </section>
            <aside className="space-y-3 rounded-md border border-border bg-white/65 p-5">
              <h2 className="font-semibold">Review tools</h2>
              <p className="text-sm leading-6 text-muted-foreground">Pay period closes Sunday at 11:59 PM. Submit after the period ends, then managers can approve or send back with a note.</p>
              <Button className="h-11 w-full">Submit Timesheet</Button>
              {isManager ? (
                <>
                  <Button className="h-11 w-full bg-[#2f6f4f]">Approve Timesheet</Button>
                  <Button variant="outline" className="h-11 w-full">Send Back</Button>
                  {role === "owner" || role === "admin" ? <Button variant="outline" className="h-11 w-full">Lock for Payroll</Button> : null}
                </>
              ) : null}
              <div className="rounded-md border border-dashed border-border bg-cream/50 p-4 text-sm text-muted-foreground">Audit panel will show edits, approvals, locks, and notes as events accumulate.</div>
            </aside>
          </div>
        </div>
      ) : null}

      {tab === "pto" ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            {categories.map((category) => {
              const available = Number(category.accrued ?? 0) + Number(category.adjusted ?? 0) - Number(category.used ?? 0) - Number(category.pending ?? 0);
              return (
                <div key={category.id} className="rounded-md border border-border bg-white/65 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">{category.name}</h2>
                    <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary">{category.is_paid ? "Paid" : "Unpaid"}</span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{available.toFixed(2)}h</p>
                  <p className="mt-2 text-xs text-muted-foreground">Accrued {hours(category.accrued)} · Used {hours(category.used)} · Pending {hours(category.pending)}</p>
                  {category.is_paid && category.negative_balance_allowed ? <p className="mt-3 rounded-sm bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Requests can exceed balance</p> : null}
                </div>
              );
            })}
          </div>

          <Button onClick={() => { setPtoFlowOpen(true); setPtoStep(0); }} className="h-12 w-full lg:hidden">
            Request Time Off
          </Button>

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <form onSubmit={submitPto} className="hidden rounded-md border border-border bg-white/65 p-5 lg:block">
              <h2 className="font-semibold">Request time off</h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Category
                  <select name="categoryId" required value={ptoDraft.categoryId} onChange={(event) => setPtoDraft((current) => ({ ...current, categoryId: event.target.value }))} className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2">
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Start
                  <input name="startsAt" type="datetime-local" value={ptoDraft.startsAt} onChange={(event) => setPtoDraft((current) => ({ ...current, startsAt: event.target.value }))} required className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  End
                  <input name="endsAt" type="datetime-local" value={ptoDraft.endsAt} onChange={(event) => setPtoDraft((current) => ({ ...current, endsAt: event.target.value }))} required className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Hours
                  <input name="hours" type="number" min="0.25" step="0.25" value={ptoDraft.hours} onChange={(event) => setPtoDraft((current) => ({ ...current, hours: event.target.value }))} required className="h-11 rounded-md border border-border bg-white px-3 text-ink outline-none ring-primary/25 focus:ring-2" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">
                  Note
                  <textarea name="employeeNote" value={ptoDraft.employeeNote} onChange={(event) => setPtoDraft((current) => ({ ...current, employeeNote: event.target.value }))} className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-ink outline-none ring-primary/25 focus:ring-2" />
                </label>
              </div>
              {ptoValidation ? (
                <div className="mt-4 space-y-2">
                  <div className="rounded-md border border-border bg-white p-3 text-xs text-muted-foreground">
                    Balance {ptoValidation.computed.balance_before.toFixed(2)}h → {ptoValidation.computed.balance_after.toFixed(2)}h · {ptoValidation.computed.business_days} business days
                  </div>
                  {ptoValidation.issues.map((issue) => (
                    <p key={`${issue.code}-${issue.message}`} className={`rounded-md p-3 text-sm ${issue.severity === "error" ? "bg-red-50 text-red-700" : issue.severity === "warning" ? "bg-amber-50 text-amber-700" : "bg-secondary/70 text-primary"}`}>
                      {issue.message}
                    </p>
                  ))}
                </div>
              ) : null}
              {ptoError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{ptoError}</p> : null}
              {ptoNotice ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">{ptoNotice}</p> : null}
              <Button disabled={Boolean(ptoValidation && !ptoValidation.valid)} className="mt-5 h-11 w-full">Submit request</Button>
            </form>

            <div className="rounded-md border border-border bg-white/65">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <h2 className="font-semibold">My requests</h2>
                <select value={requestFilter} onChange={(event) => setRequestFilter(event.target.value as RequestRow["status"] | "all")} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
                  {["pending", "needs_revision", "approved", "denied", "cancelled", "revoked", "completed", "all"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </div>
              <div className="divide-y divide-border">
                {filteredRequests.map((request) => (
                  <button key={request.id} onClick={() => setSelectedRequest(request)} className="grid w-full gap-2 p-4 text-left text-sm transition hover:bg-cream/55 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-semibold">{request.category_name} · {hours(request.hours)}h</p>
                      <p className="mt-1 text-muted-foreground">{format(new Date(request.starts_at), "MMM d")} to {format(new Date(request.ends_at), "MMM d, yyyy")} · {request.status}</p>
                      {request.manager_note ? <p className="mt-1 text-xs text-muted-foreground">Manager: {request.manager_note}</p> : null}
                    </div>
                    <span className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary">{format(new Date(request.submitted_at), "MMM d")}</span>
                  </button>
                ))}
                {!filteredRequests.length ? <p className="p-5 text-sm text-muted-foreground">No requests in this view.</p> : null}
              </div>
            </div>
          </div>

          {isManager ? (
            <div className="space-y-5">
              {managerV2 ? (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Active templates" value={String(managerV2.stats.activeTemplates)} />
                    <Metric label="Coverage gaps" value={String(managerV2.stats.coverageGapsThisMonth)} />
                    <Metric label="Messages" value={String(managerV2.stats.messagesLast30Days)} />
                    <Metric label="Reactions" value={String(managerV2.stats.reactionsLast30Days)} />
                  </div>

                  {managerV2.insights.length ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {managerV2.insights.map((insight) => (
                        <div key={insight.id} className="rounded-md border border-[#d7ddbc] bg-secondary/70 p-4 text-sm">
                          <p className="flex items-center gap-2 font-semibold text-primary"><Sparkles className="h-4 w-4" /> {insight.title}</p>
                          <p className="mt-2 leading-6 text-[#35483b]">{insight.body}</p>
                          <button className="mt-3 text-xs font-semibold text-primary">Why am I seeing this?</button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-5 lg:grid-cols-2">
                    <ManagerPanel title="Approval Templates" count={managerV2.templates.length}>
                      {managerV2.templates.map((template) => (
                        <div key={template.id} className="rounded-md border border-border bg-white p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold">{template.name}</p>
                            <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${template.enabled ? "bg-green-50 text-green-700" : "bg-cream text-muted-foreground"}`}>{template.enabled ? "Active" : "Off"}</span>
                          </div>
                          <p className="mt-2 text-muted-foreground">{template.action.replaceAll("_", " ")} · triggered {template.triggerCount} times</p>
                          <div className="mt-3 flex gap-2 text-xs font-semibold text-primary"><button>Edit</button><button>Disable</button><button>Delete</button></div>
                        </div>
                      ))}
                      {!managerV2.templates.length ? <p className="text-sm text-muted-foreground">No templates yet. Add routine auto-approval patterns from this section.</p> : null}
                    </ManagerPanel>

                    <ManagerPanel title="Coverage Rules" count={managerV2.coverageRules.length}>
                      {managerV2.coverageRules.map((rule) => (
                        <div key={rule.id} className="rounded-md border border-border bg-white p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold">{rule.name}</p>
                            <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${rule.severity === "hard" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{rule.severity}</span>
                          </div>
                          <p className="mt-2 text-muted-foreground">Minimum {rule.minimumRequired} employees · {rule.startsAtTime ?? "all day"} to {rule.endsAtTime ?? "all day"}</p>
                          <p className="mt-2 text-xs font-semibold text-primary">Calendar warning enabled for matching PTO windows</p>
                        </div>
                      ))}
                      {!managerV2.coverageRules.length ? <p className="text-sm text-muted-foreground">No coverage rules yet. Add minimum staffing rules in admin settings.</p> : null}
                    </ManagerPanel>
                  </div>
                </>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
              <ManagerPanel title="Pending requests" count={managerQueue.pendingRequests.length}>
                {managerQueue.pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-md border border-border bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{request.employee_name || request.employee_email} · {request.category_name}</p>
                      {managerV2?.coverageRules.some((rule) => rule.enabled) ? <span className="rounded-sm bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Coverage check</span> : null}
                    </div>
                    <p className="mt-1 text-muted-foreground">{format(new Date(request.starts_at), "MMM d")} to {format(new Date(request.ends_at), "MMM d")} · {hours(request.hours)}h</p>
                    {managerV2?.templates.some((template) => template.enabled) ? <p className="mt-2 rounded-sm bg-secondary/70 px-2 py-1 text-xs font-semibold text-primary">May match an approval template. Blockers still apply.</p> : null}
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => decideRequest(request.id, "approved")} className="h-9"><Check className="h-4 w-4" /> Approve</Button>
                      <Button onClick={() => decideRequest(request.id, "denied")} variant="outline" className="h-9"><X className="h-4 w-4" /> Deny</Button>
                      <Button onClick={async () => { await fetch(`/api/pto/requests/${request.id}/send-back`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note: "Please revise this request." }) }); router.refresh(); }} variant="outline" className="h-9">Send Back</Button>
                      <Button onClick={async () => { const body = window.prompt("Message to employee"); if (!body) return; await fetch(`/api/pto/requests/${request.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) }); router.refresh(); }} variant="outline" className="h-9"><MessageSquare className="h-4 w-4" /> Ask</Button>
                    </div>
                  </div>
                ))}
              </ManagerPanel>
              <ManagerPanel title="Flagged punches" count={managerQueue.flaggedEntries.length}>
                {managerQueue.flaggedEntries.map((entry) => (
                  <div key={entry.id} className="rounded-md border border-border bg-white p-3 text-sm">
                    <p className="font-semibold">{entry.employee_name || entry.employee_email}</p>
                    <p className="mt-1 text-muted-foreground">{format(new Date(entry.started_at), "MMM d, h:mm a")} · {entry.review_flag?.replaceAll("_", " ")}</p>
                    {entry.punch_note ? <p className="mt-2 text-xs text-muted-foreground">{entry.punch_note}</p> : null}
                  </div>
                ))}
              </ManagerPanel>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="mx-auto max-w-xl space-y-5">
          <div className="rounded-md border border-border bg-white/65 p-5">
            <p className="text-sm font-semibold text-muted-foreground">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold">{timesheet.employee.employee_name ?? "Employee"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pay rate {money(summary.payRateCents)} · {summary.totalHours.toFixed(1)}h this week</p>
          </div>

          <div className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">Time Off</h2>
            <div className="mt-4 space-y-3 text-sm">
              {categories.map((category) => {
                const available = Number(category.accrued ?? 0) + Number(category.adjusted ?? 0) - Number(category.used ?? 0) - Number(category.pending ?? 0);
                return (
                  <div key={category.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <span>
                      <span className="block font-semibold text-ink">{category.name}</span>
                      <span className="text-muted-foreground">{category.is_paid ? "Paid" : "Unpaid"} · notice {category.notice_days}d</span>
                    </span>
                    <span className="font-semibold">{available.toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-border bg-white/65 p-5">
            <h2 className="font-semibold">Settings</h2>
            <div className="mt-4 grid gap-2">
              <button onClick={() => setShowNotificationSettings(true)} className="flex h-11 items-center justify-between rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink">Notifications <ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
              <button onClick={() => router.push("/settings/account#display")} className="flex h-11 items-center justify-between rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink">Display preferences <ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
              <button onClick={() => router.push("/settings/account")} className="flex h-11 items-center justify-between rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink">Profile and password <ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
              <button className="flex h-11 items-center justify-between rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink">Help center <ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </div>
        </div>
      ) : null}

      {clockSuccess ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-cream px-5 text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#2f6f4f] text-white">
              <Check className="h-12 w-12" />
            </div>
            <h2 className="mt-8 text-3xl font-semibold">{clockSuccess.title}</h2>
            <p className="mt-2 text-lg text-muted-foreground">{clockSuccess.subtitle}</p>
            <p className="mt-8 text-2xl font-semibold">{clockSuccess.detail}</p>
            {clockSuccess.earned ? <p className="mt-2 text-lg text-muted-foreground">{clockSuccess.earned} earned</p> : null}
            <Button onClick={() => setClockSuccess(null)} className="mt-10 h-12 w-full">Done</Button>
          </div>
        </div>
      ) : null}

      {pastPunchOpen ? (
        <div className="fixed inset-0 z-50 bg-primary/35 p-4 backdrop-blur-sm">
          <form onSubmit={submitPastPunch} className="mx-auto mt-8 max-w-md rounded-md border border-border bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Add Past Punch</h2>
              <button type="button" onClick={() => setPastPunchOpen(false)} className="grid h-10 w-10 place-items-center rounded-md border border-border"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Date<input name="date" type="date" defaultValue={dateInputValue(new Date()).slice(0, 10)} className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">Start<input name="startTime" type="time" defaultValue="08:00" className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
                <label className="grid gap-2 text-sm font-medium text-muted-foreground">End<input name="endTime" type="time" defaultValue="17:00" className="h-11 rounded-md border border-border bg-white px-3 text-ink" /></label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Type<select name="type" className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option>Clock correction</option><option>Forgot clock in</option><option>Forgot clock out</option></select></label>
              <label className="grid gap-2 text-sm font-medium text-muted-foreground">Reason<textarea name="reason" required className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-ink" placeholder="Forgot to clock in" /></label>
            </div>
            <p className="mt-4 rounded-md bg-cream/70 p-3 text-sm text-muted-foreground">This creates a correction entry for manager review.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button disabled={pastPunchPending} className="h-11">{pastPunchPending ? "Submitting..." : "Submit"}</Button>
              <Button type="button" variant="outline" onClick={() => setPastPunchOpen(false)} className="h-11">Cancel</Button>
            </div>
          </form>
        </div>
      ) : null}

      {ptoFlowOpen ? (
        <div className="fixed inset-0 z-50 bg-cream p-4 md:hidden">
          <form onSubmit={submitPto} className="mx-auto flex h-full max-w-md flex-col">
            <div className="flex min-h-12 items-center justify-between gap-3">
              <button type="button" onClick={() => ptoStep === 0 ? setPtoFlowOpen(false) : setPtoStep((step) => Math.max(0, step - 1))} className="grid h-11 w-11 place-items-center rounded-md border border-border bg-white">
                {ptoStep === 0 ? <X className="h-4 w-4" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              <p className="font-semibold">{ptoStep === 0 ? "Request Time Off" : selectedCategory?.name ?? "PTO"}</p>
              <span className="w-11 text-right text-xs font-semibold text-muted-foreground">{ptoStep + 1}/4</span>
            </div>

            <div className="flex-1 overflow-y-auto py-5">
              {ptoStep === 0 ? (
                <div>
                  <h2 className="text-2xl font-semibold">What type?</h2>
                  <div className="mt-5 grid gap-3">
                    {categories.map((category) => {
                      const available = Number(category.accrued ?? 0) + Number(category.adjusted ?? 0) - Number(category.used ?? 0) - Number(category.pending ?? 0);
                      return (
                        <button key={category.id} type="button" onClick={() => { setPtoDraft((current) => ({ ...current, categoryId: category.id })); setPtoStep(1); }} className={`rounded-md border p-4 text-left ${ptoDraft.categoryId === category.id ? "border-primary bg-white" : "border-border bg-white/75"}`}>
                          <span className="block font-semibold">{category.name}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{category.is_paid ? `${available.toFixed(1)}h available` : "No balance required"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {ptoStep === 1 ? (
                <div className="grid gap-4">
                  <h2 className="text-2xl font-semibold">When?</h2>
                  <label className="grid gap-2 text-sm font-medium text-muted-foreground">Start<input type="datetime-local" value={ptoDraft.startsAt} onChange={(event) => setPtoDraft((current) => ({ ...current, startsAt: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" /></label>
                  <label className="grid gap-2 text-sm font-medium text-muted-foreground">End<input type="datetime-local" value={ptoDraft.endsAt} onChange={(event) => setPtoDraft((current) => ({ ...current, endsAt: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" /></label>
                  <label className="grid gap-2 text-sm font-medium text-muted-foreground">Hours<input type="number" min="0.25" step="0.25" value={ptoDraft.hours} onChange={(event) => setPtoDraft((current) => ({ ...current, hours: event.target.value }))} className="h-12 rounded-md border border-border bg-white px-3 text-ink" /></label>
                  {ptoValidation ? <p className="rounded-md bg-white p-3 text-sm text-muted-foreground">{ptoValidation.computed.business_days} business days · balance after {ptoValidation.computed.balance_after.toFixed(1)}h</p> : null}
                  {ptoValidation?.issues.filter((issue) => ["start", "end", "hours"].includes(issue.field ?? "") || issue.severity === "error").map((issue) => (
                    <p key={`${issue.code}-mobile-date`} className={`rounded-md p-3 text-sm ${issue.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{issue.message}</p>
                  ))}
                </div>
              ) : null}

              {ptoStep === 2 ? (
                <div className="grid gap-4">
                  <h2 className="text-2xl font-semibold">Anything to share?</h2>
                  <textarea value={ptoDraft.employeeNote} onChange={(event) => setPtoDraft((current) => ({ ...current, employeeNote: event.target.value }))} className="min-h-44 rounded-md border border-border bg-white px-3 py-3 text-ink" placeholder="Family trip already booked" />
                  <p className="text-sm text-muted-foreground">Optional. Your manager will see this with your request.</p>
                </div>
              ) : null}

              {ptoStep === 3 ? (
                <div className="grid gap-4">
                  <h2 className="text-2xl font-semibold">Review your request</h2>
                  <div className="rounded-md border border-border bg-white p-4">
                    <p className="font-semibold">{selectedCategory?.name ?? "PTO"}</p>
                    <p className="mt-2 text-muted-foreground">{format(new Date(ptoDraft.startsAt), "MMM d")} to {format(new Date(ptoDraft.endsAt), "MMM d, yyyy")}</p>
                    <p className="mt-4 text-2xl font-semibold">{Number(ptoDraft.hours || 0).toFixed(1)} hours</p>
                    {ptoValidation ? <p className="mt-3 text-sm text-muted-foreground">Balance now {ptoValidation.computed.balance_before.toFixed(1)}h · after {ptoValidation.computed.balance_after.toFixed(1)}h</p> : null}
                  </div>
                  {ptoDraft.employeeNote ? <p className="rounded-md bg-white p-3 text-sm">Note: {ptoDraft.employeeNote}</p> : null}
                  {ptoValidation?.issues.map((issue) => (
                    <p key={`${issue.code}-mobile-review`} className={`rounded-md p-3 text-sm ${issue.severity === "error" ? "bg-red-50 text-red-700" : issue.severity === "warning" ? "bg-amber-50 text-amber-700" : "bg-secondary/70 text-primary"}`}>{issue.message}</p>
                  ))}
                  {ptoError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{ptoError}</p> : null}
                </div>
              ) : null}
            </div>

            <div className="border-t border-border bg-cream pt-3">
              {ptoStep < 3 ? (
                <Button type="button" onClick={() => setPtoStep((step) => Math.min(3, step + 1))} disabled={ptoStep === 1 && Boolean(ptoValidation && !ptoValidation.valid)} className="h-12 w-full">Continue</Button>
              ) : (
                <Button disabled={Boolean(ptoValidation && !ptoValidation.valid)} className="h-12 w-full"><Send className="h-4 w-4" /> Submit Request</Button>
              )}
            </div>
          </form>
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 bg-primary/35 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-8 max-w-md rounded-md border border-border bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Request Detail</h2>
              <button onClick={() => setSelectedRequest(null)} className="grid h-10 w-10 place-items-center rounded-md border border-border"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 rounded-md bg-cream/70 p-4">
              <p className="font-semibold">{selectedRequest.category_name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{format(new Date(selectedRequest.starts_at), "MMM d")} to {format(new Date(selectedRequest.ends_at), "MMM d, yyyy")}</p>
              <p className="mt-4 text-2xl font-semibold">{hours(selectedRequest.hours)} hours</p>
              <span className={`mt-3 inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${statusTone(selectedRequest.status)}`}>{selectedRequest.status.replace("_", " ")}</span>
            </div>
            {selectedRequest.employee_note ? <div className="mt-4 text-sm"><p className="font-semibold">Your note</p><p className="mt-2 text-muted-foreground">{selectedRequest.employee_note}</p></div> : null}
            {selectedRequest.manager_note ? <div className="mt-4 text-sm"><p className="font-semibold">Manager note</p><p className="mt-2 text-muted-foreground">{selectedRequest.manager_note}</p></div> : null}
            <div className="mt-4 border-t border-border pt-4 text-sm">
              <p className="font-semibold">History</p>
              <p className="mt-2 text-muted-foreground">{format(new Date(selectedRequest.submitted_at), "MMM d, h:mm a")} · You submitted the request</p>
            </div>
            {["pending", "needs_revision", "approved"].includes(selectedRequest.status) && new Date(selectedRequest.starts_at) > new Date() ? (
              <Button onClick={() => window.confirm("Cancel this PTO request?") ? cancelRequest(selectedRequest.id) : undefined} variant="outline" className="mt-5 h-11 w-full border-red-200 text-red-700">Cancel Request</Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showNotificationSettings ? (
        <div className="fixed inset-0 z-50 bg-cream p-4 md:hidden">
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowNotificationSettings(false)} className="grid h-11 w-11 place-items-center rounded-md border border-border bg-white"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <div className="mt-5 space-y-5">
              {[
                ["PTO", ["Request approved", "Request denied", "Needs revision"]],
                ["Hours", ["Missed clock-out", "Weekly summary"]],
                ["Accrual", ["PTO accrued", "Balance near cap", "PTO expiring"]]
              ].map(([group, items]) => (
                <div key={group as string} className="rounded-md border border-border bg-white p-4">
                  <p className="font-semibold">{group as string}</p>
                  <div className="mt-3 grid gap-2">
                    {(items as string[]).map((item) => (
                      <button key={item} className="flex h-11 items-center justify-between rounded-md bg-cream/70 px-3 text-sm">
                        <span>{item}</span>
                        <span className="inline-flex items-center gap-2 text-muted-foreground"><Bell className="h-4 w-4" /> push</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-md border border-border bg-white p-4">
                <p className="font-semibold">Quiet hours</p>
                <p className="mt-2 text-sm text-muted-foreground">9:00 PM to 7:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-12px_30px_rgba(24,29,25,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`grid min-h-14 place-items-center rounded-md px-2 text-[11px] font-semibold ${tab === id ? "bg-primary text-white" : "text-muted-foreground"}`}>
              <span className="relative mb-1">
                <Icon className="h-5 w-5" />
                {id === "clock" && shiftState !== "CLOCKED_OUT" ? <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${shiftState === "ON_BREAK" ? "bg-amber-400" : shiftState === "PENDING_REVIEW" || shiftState === "LOCKED" ? "bg-amber-500" : "bg-green-500"}`} /> : null}
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 font-semibold text-cream">{value}</p>
    </div>
  );
}

function ClockSummaryCard({ label, value, detail, href }: { label: string; value: string; detail: string; href: string }) {
  return (
    <a href={href} className="block min-h-40 rounded-md border border-border bg-white/75 p-5 text-left shadow-sm transition hover:border-primary/40 hover:bg-white">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-6 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      <span className="mt-5 inline-flex text-sm font-semibold text-primary">View hours →</span>
    </a>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-cream/60 p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function SummaryLine({ label, hours, pay, note, strong = false }: { label: string; hours: number; pay: number; note?: string; strong?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_auto] gap-3 text-sm ${strong ? "text-lg font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{hours.toFixed(2)} hrs</span>
      <span>{money(Math.round(pay * 100))}{note ? <span className="ml-2 text-xs text-muted-foreground">({note})</span> : null}</span>
    </div>
  );
}

function Insight({ label, value, onClick }: { label: string; value: string | number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-md border border-border bg-white p-3 text-left transition hover:border-primary/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </button>
  );
}

function ManagerPanel({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-white/65 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary">{count}</span>
      </div>
      <div className="grid gap-3">{count ? children : <p className="text-sm text-muted-foreground">Nothing needs review.</p>}</div>
    </section>
  );
}
