"use client";

import { useState } from "react";
import type React from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  Clock3,
  Database,
  Download,
  Eye,
  FileWarning,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  RadioTower,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SecuritySettings = {
  requireMfaForAdmins: boolean;
  requireMfaForAll: boolean;
  enforceStrongPasswords: boolean;
  blockNonUsSignins: boolean;
  idleTimeoutDays: number;
  absoluteTimeoutDays: number;
  ssoProvider: string | null;
  ssoStatus: "not_configured" | "active" | "error" | "paused";
  allowEmployeeDataExports: boolean;
  notifySuspiciousSignins: boolean;
  dataResidency: string;
  logRetentionHotDays: number;
  logRetentionColdYears: number;
} | null;

type SecurityEvent = {
  id: string;
  eventType: string;
  severity: string;
  outcome: string;
  targetType: string | null;
  occurredAt: Date;
};

type ServiceCheck = {
  serviceName: string;
  status: string;
  latencyP95Ms: number | null;
  errorRateBasisPoints: number | null;
  saturationBasisPoints: number | null;
};

type Monitor = {
  name: string;
  serviceName: string;
  cadenceMinutes: number;
  status: string;
  lastDurationMs: number | null;
};

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  affectedServices: string[];
  customerImpact: string | null;
  startedAt: Date;
};

type Modal = "security" | "sessions" | "sso" | "audit" | "privacy" | "service" | "alerts" | "incident" | null;

export function SecurityObservabilityClient({ settings, auditCount, securityEvents, services, monitors, incidents, canManage }: {
  settings: SecuritySettings;
  auditCount: number;
  securityEvents: SecurityEvent[];
  services: ServiceCheck[];
  monitors: Monitor[];
  incidents: Incident[];
  canManage: boolean;
}) {
  const [modal, setModal] = useState<Modal>(null);
  const policy = settings ?? {
    requireMfaForAdmins: true,
    requireMfaForAll: false,
    enforceStrongPasswords: true,
    blockNonUsSignins: false,
    idleTimeoutDays: 30,
    absoluteTimeoutDays: 90,
    ssoProvider: "Okta",
    ssoStatus: "active" as const,
    allowEmployeeDataExports: true,
    notifySuspiciousSignins: true,
    dataResidency: "US East",
    logRetentionHotDays: 90,
    logRetentionColdYears: 7
  };
  const activeIncidents = incidents.length;
  const degradedServices = services.filter((service) => service.status !== "ok").length;

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-border bg-white/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Settings → Security & Observability</p>
            <h1 className="mt-3 text-3xl font-semibold">Trust operations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Security controls, audit visibility, service health, incidents, and synthetic monitoring in one operator-grade workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("audit")}><Search className="h-4 w-4" /> Audit log</Button>
            <Button variant="outline" onClick={() => setModal("alerts")}><Bell className="h-4 w-4" /> Alert routes</Button>
            {canManage ? <Button onClick={() => setModal("security")}><ShieldCheck className="h-4 w-4" /> Configure security</Button> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthStat icon={<ShieldCheck className="h-5 w-5" />} label="Security posture" value={policy.requireMfaForAdmins ? "Admin MFA on" : "Needs review"} tone={policy.requireMfaForAdmins ? "good" : "warn"} />
        <HealthStat icon={<Activity className="h-5 w-5" />} label="Platform health" value={degradedServices ? `${degradedServices} degraded` : "All core services ok"} tone={degradedServices ? "warn" : "good"} />
        <HealthStat icon={<Siren className="h-5 w-5" />} label="Active incidents" value={`${activeIncidents}`} tone={activeIncidents ? "warn" : "good"} />
        <HealthStat icon={<FileWarning className="h-5 w-5" />} label="Audit entries" value={auditCount.toLocaleString()} tone="neutral" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Security Settings" icon={<LockKeyhole className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("security")}>Manage</Button>}>
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleRow label="Require MFA for admins and owners" active={policy.requireMfaForAdmins} />
            <ToggleRow label="Require MFA for all users" active={policy.requireMfaForAll} />
            <ToggleRow label="Enforce strong passwords" active={policy.enforceStrongPasswords} />
            <ToggleRow label="Block sign-ins outside the US" active={policy.blockNonUsSignins} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniMetric label="Idle timeout" value={`${policy.idleTimeoutDays} days`} />
            <MiniMetric label="Max session" value={`${policy.absoluteTimeoutDays} days`} />
            <MiniMetric label="Data residency" value={policy.dataResidency} />
          </div>
        </Panel>

        <Panel title="Authentication & Sessions" icon={<KeyRound className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("sessions")}>View sessions</Button>}>
          <div className="space-y-3 text-sm">
            <DetailLine label="SSO provider" value={policy.ssoProvider ?? "Not configured"} status={policy.ssoStatus === "active" ? "ok" : "warn"} />
            <DetailLine label="Suspicious sign-in notifications" value={policy.notifySuspiciousSignins ? "Enabled" : "Disabled"} status={policy.notifySuspiciousSignins ? "ok" : "warn"} />
            <DetailLine label="Session token handling" value="Server-side, hashed, rotated after privilege changes" status="ok" />
            <DetailLine label="Sensitive actions" value="Re-authentication required" status="ok" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Service Health" icon={<Gauge className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("service")}>Deep dive</Button>}>
          <div className="space-y-3">
            {services.map((service) => <ServiceRow key={service.serviceName} service={service} />)}
          </div>
        </Panel>

        <Panel title="Synthetic Monitoring" icon={<RadioTower className="h-5 w-5" />}>
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <div key={monitor.name} className="rounded-md border border-border bg-white/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{monitor.name}</p>
                  <StatusPill status={monitor.status} />
                </div>
                <p className="mt-1 text-muted-foreground">{monitor.serviceName} · every {monitor.cadenceMinutes}m · last {monitor.lastDurationMs ?? 0}ms</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Security Events" icon={<ShieldAlert className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("audit")}>Review</Button>}>
          <SecurityEvents rows={securityEvents} />
        </Panel>

        <Panel title="Incident Response" icon={<AlertTriangle className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("incident")}>Runbook</Button>}>
          {incidents.length ? (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-semibold">{incident.title}</p>
                  <p className="mt-1">{incident.severity.toUpperCase()} · {incident.status} · {incident.affectedServices.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <Check className="mr-2 inline h-4 w-4" /> No active incidents. SEV-0/1 postmortems are due within 5 business days when they occur.
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MiniMetric label="P1 page target" value="5 min ack" />
            <MiniMetric label="Breach notice target" value="72 hours" />
          </div>
        </Panel>
      </div>

      <Panel title="Data Protection & Compliance" icon={<Database className="h-5 w-5" />} action={<Button variant="outline" onClick={() => setModal("privacy")}>Manage privacy</Button>}>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniMetric label="Tenant isolation" value="RLS enforced" />
          <MiniMetric label="Hot logs" value={`${policy.logRetentionHotDays} days`} />
          <MiniMetric label="Cold audit retention" value={`${policy.logRetentionColdYears} years`} />
          <MiniMetric label="Employee data exports" value={policy.allowEmployeeDataExports ? "Allowed" : "Disabled"} />
          <MiniMetric label="Card data" value="Tokenized by Stripe" />
          <MiniMetric label="Trust center" value="Ready for public page" />
        </div>
      </Panel>

      {modal ? (
        <Modal title={modalTitle(modal)} onClose={() => setModal(null)}>
          {modal === "security" ? <SecurityConfig policy={policy} /> : null}
          {modal === "sessions" ? <SessionsView /> : null}
          {modal === "sso" ? <SsoView /> : null}
          {modal === "audit" ? <AuditView events={securityEvents} auditCount={auditCount} /> : null}
          {modal === "privacy" ? <PrivacyView policy={policy} /> : null}
          {modal === "service" ? <ServiceDeepDive services={services} monitors={monitors} /> : null}
          {modal === "alerts" ? <AlertsView /> : null}
          {modal === "incident" ? <IncidentRunbook /> : null}
        </Modal>
      ) : null}
    </section>
  );
}

function HealthStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "good" | "warn" | "neutral" }) {
  return (
    <div className={cn("rounded-md border p-4", tone === "good" && "border-emerald-200 bg-emerald-50", tone === "warn" && "border-amber-200 bg-amber-50", tone === "neutral" && "border-border bg-white/70")}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-white/70 text-primary">{icon}</span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-white/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-white/60 p-3 text-sm">
      <span>{label}</span>
      <span className={cn("rounded-sm px-2 py-1 text-xs font-semibold", active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>{active ? "On" : "Off"}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-cream/60 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DetailLine({ label, value, status }: { label: string; value: string; status: "ok" | "warn" }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-white/60 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-semibold", status === "ok" ? "text-emerald-700" : "text-amber-700")}>{value}</span>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceCheck }) {
  return (
    <div className="rounded-md border border-border bg-white/60 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{service.serviceName}</p>
        <StatusPill status={service.status} />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <span>p95 {service.latencyP95Ms ?? 0}ms</span>
        <span>Error {((service.errorRateBasisPoints ?? 0) / 100).toFixed(2)}%</span>
        <span>Saturation {Math.round((service.saturationBasisPoints ?? 0) / 100)}%</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const good = ["ok", "passing", "resolved", "active"].includes(status);
  const bad = ["down", "failing", "critical"].includes(status);
  return <span className={cn("rounded-sm px-2 py-1 text-xs font-semibold", good ? "bg-emerald-50 text-emerald-700" : bad ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>{status.replace("_", " ")}</span>;
}

function SecurityEvents({ rows }: { rows: SecurityEvent[] }) {
  const fallback = [
    { id: "login", eventType: "login_success", severity: "info", outcome: "success", targetType: "session", occurredAt: new Date("2026-06-15T14:32:00Z") },
    { id: "denied", eventType: "permission_denied", severity: "warning", outcome: "blocked", targetType: "compensation", occurredAt: new Date("2026-06-14T19:11:00Z") },
    { id: "role", eventType: "role_changed", severity: "info", outcome: "success", targetType: "membership", occurredAt: new Date("2026-06-12T15:22:00Z") }
  ];
  const events = rows.length ? rows : fallback;
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="grid gap-2 rounded-md border border-border bg-white/60 p-3 text-sm md:grid-cols-[1fr_1fr_auto]">
          <span className="font-semibold">{event.eventType.replace(/_/g, " ")}</span>
          <span className="text-muted-foreground">{event.targetType ?? "system"} · {event.outcome}</span>
          <StatusPill status={event.severity} />
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 md:p-8">
      <div className="w-full max-w-5xl rounded-md border border-border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function modalTitle(modal: Exclude<Modal, null>) {
  return {
    security: "Security Configuration",
    sessions: "Active Sessions",
    sso: "Single Sign-On",
    audit: "Audit Log",
    privacy: "Data & Privacy",
    service: "Service Observability",
    alerts: "Alert Routing",
    incident: "Incident Response Runbook"
  }[modal];
}

function SecurityConfig({ policy }: { policy: NonNullable<SecuritySettings> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow label="Require MFA for admins and owners" active={policy.requireMfaForAdmins} />
        <ToggleRow label="Require MFA for all users" active={policy.requireMfaForAll} />
        <ToggleRow label="Enforce strong passwords" active={policy.enforceStrongPasswords} />
        <ToggleRow label="Block sign-ins from outside the US" active={policy.blockNonUsSignins} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Idle timeout<input className="h-11 rounded-md border border-border bg-white px-3 text-ink" defaultValue={`${policy.idleTimeoutDays} days`} /></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Maximum session<input className="h-11 rounded-md border border-border bg-white px-3 text-ink" defaultValue={`${policy.absoluteTimeoutDays} days`} /></label>
      </div>
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <ShieldCheck className="mr-2 inline h-4 w-4" /> Owner-level and billing changes require re-authentication even when the session is valid.
      </div>
      <Button>Save security settings</Button>
    </div>
  );
}

function SessionsView() {
  const sessions = [
    ["MacBook Pro", "Chrome · Birmingham, AL", "Just now", "This session"],
    ["iPhone 15", "iOS app · Birmingham, AL", "2 hours ago", "Revoke"],
    ["Windows laptop", "Edge · Atlanta, GA", "8 days ago", "Revoke"]
  ];
  return (
    <div className="space-y-3">
      {sessions.map(([device, detail, active, action]) => (
        <div key={device} className="flex flex-col gap-3 rounded-md border border-border bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
          <div><p className="font-semibold">{device}</p><p className="mt-1 text-sm text-muted-foreground">{detail} · Last active {active}</p></div>
          <Button variant="outline">{action}</Button>
        </div>
      ))}
      <Button variant="outline">Sign out all other sessions</Button>
    </div>
  );
}

function SsoView() {
  return (
    <div className="space-y-4">
      <MiniMetric label="Provider" value="Okta" />
      <MiniMetric label="Provisioning" value="SCIM ready" />
      <MiniMetric label="Group mapping" value="Acme-Admins → Admin" />
      <Button>Manage SSO</Button>
    </div>
  );
}

function AuditView({ events, auditCount }: { events: SecurityEvent[]; auditCount: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <p className="text-sm text-muted-foreground">{auditCount.toLocaleString()} tenant audit entries retained.</p>
        <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
      </div>
      <SecurityEvents rows={events} />
      <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        Enterprise tiers can enable hash-chained audit log verification for tamper evidence.
      </div>
    </div>
  );
}

function PrivacyView({ policy }: { policy: NonNullable<SecuritySettings> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InfoBlock icon={<UserCheck className="h-5 w-5" />} title="Right to access" body="Generate a secure JSON/PDF package with profile, timesheets, PTO, schedules, messages, and audit references." />
      <InfoBlock icon={<FileWarning className="h-5 w-5" />} title="Right to deletion" body="Delete or anonymize eligible data while retaining payroll and legal records through their required retention windows." />
      <InfoBlock icon={<Globe2 className="h-5 w-5" />} title="Data residency" body={policy.dataResidency} />
      <InfoBlock icon={<Database className="h-5 w-5" />} title="Tenant isolation" body="Postgres RLS plus scoped object storage paths protect against cross-tenant leaks." />
    </div>
  );
}

function ServiceDeepDive({ services, monitors }: { services: ServiceCheck[]; monitors: Monitor[] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border p-4">
        <p className="font-semibold">Four golden signals</p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {["Latency", "Traffic", "Errors", "Saturation"].map((signal) => <MiniMetric key={signal} label={signal} value="Tracked" />)}
        </div>
      </div>
      <div className="grid gap-3">
        {services.map((service) => <ServiceRow key={service.serviceName} service={service} />)}
      </div>
      <div className="rounded-md border border-border p-4">
        <p className="font-semibold">Synthetic critical flows</p>
        <p className="mt-2 text-sm text-muted-foreground">{monitors.length} monitors cover login, clock in/out, PTO, scheduling, invoicing, and webhook delivery.</p>
      </div>
    </div>
  );
}

function AlertsView() {
  const routes = [
    ["P1", "Site down, auth broken, data loss, active security incident", "24/7 page"],
    ["P2", "Single provider down, elevated errors, critical job failed", "Business-hours page"],
    ["P3", "Feature error spike, cost anomaly, isolated customer issue", "Ticket"],
    ["P4", "Low-priority trends and recommendations", "Digest"]
  ];
  return (
    <div className="space-y-3">
      {routes.map(([tier, trigger, route]) => (
        <div key={tier} className="grid gap-2 rounded-md border border-border bg-white/70 p-4 text-sm md:grid-cols-[auto_1fr_auto]">
          <span className="font-semibold">{tier}</span>
          <span className="text-muted-foreground">{trigger}</span>
          <span className="font-medium">{route}</span>
        </div>
      ))}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Every alert needs severity, team, summary, context, and a runbook link.</div>
    </div>
  );
}

function IncidentRunbook() {
  return (
    <div className="space-y-4">
      {["Acknowledge within target", "Triage scope and customer impact", "Communicate internally and on status page", "Mitigate before deep investigation", "Resolve, monitor, and write postmortem"].map((step, index) => (
        <div key={step} className="rounded-md border border-border bg-white/70 p-4 text-sm">
          <p className="font-semibold">{index + 1}. {step}</p>
        </div>
      ))}
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        SEV-0/1 incidents require customer communications and postmortem within 5 business days.
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        <p className="font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
