"use client";

import { useMemo, useState } from "react";
import type React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Eye,
  Activity,
  LockKeyhole,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UsersRound,
  RefreshCw,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type PlanTier, isFeatureLocked, isRoleLocked } from "@/lib/permissions";

type BuiltInRoleKey = "owner" | "admin" | "manager" | "team_lead" | "employee";
type ModalKind = "role" | "customize" | "builder" | "assign" | "bulk" | "groups" | "audit" | "transfer" | null;
type Member = { id: string; role: string; department: string | null; managerMembershipId: string | null; email: string | null; fullName: string | null };
type CustomRole = { id: string; roleKey: string; name: string; description: string | null; kind: string; baseRole: string | null; defaultScopeType: string };
type CustomGroup = { id: string; name: string; description: string | null };

const builtInRoles: Array<{ key: BuiltInRoleKey; name: string; description: string; scope: string; mutable: boolean }> = [
  { key: "owner", name: "Owner", description: "Full control of the organization. Exactly one person owns the account.", scope: "Whole organization", mutable: false },
  { key: "admin", name: "Admin", description: "Operational control of the organization, excluding owner-only powers and billing by default.", scope: "Configurable", mutable: true },
  { key: "manager", name: "Manager", description: "Oversee assigned employees: PTO, time review, scheduling, reports, and tasks.", scope: "Assigned employees", mutable: true },
  { key: "team_lead", name: "Team Lead", description: "Light coordination authority for small teams without sensitive HR access.", scope: "Assigned team", mutable: true },
  { key: "employee", name: "Employee", description: "Own time, own PTO, own profile, assigned tasks, and permitted team communication.", scope: "Self", mutable: false }
];

const categories = [
  {
    name: "Employee Management",
    selected: 3,
    total: 8,
    permissions: ["View employee directory", "Invite employees", "Edit basic details", "View compensation", "Edit compensation", "Deactivate employees"]
  },
  {
    name: "Time & Attendance",
    selected: 5,
    total: 9,
    permissions: ["View team timesheets", "Edit team time entries", "Approve timesheets", "Lock pay periods", "Override correction window"]
  },
  {
    name: "PTO & Leave",
    selected: 3,
    total: 7,
    permissions: ["Approve team PTO", "View PTO calendar", "Adjust balances", "Configure categories", "Override hard rules"]
  },
  {
    name: "Scheduling",
    selected: 4,
    total: 7,
    permissions: ["View team schedule", "Create shifts", "Modify shifts", "Approve swaps", "Manage open shifts"]
  },
  {
    name: "Mission Command",
    selected: 4,
    total: 12,
    permissions: ["Use chat", "Create channels", "Manage announcements", "Assign tasks", "Delete others' messages"]
  },
  {
    name: "Reports & Analytics",
    selected: 2,
    total: 8,
    permissions: ["View team reports", "View all reports", "Export data", "Custom report builder"]
  },
  {
    name: "Org Settings",
    selected: 1,
    total: 14,
    permissions: ["View settings", "Edit pay rules", "Manage sites", "Configure integrations", "Manage roles"]
  },
  {
    name: "Billing",
    selected: 0,
    total: 6,
    permissions: ["View billing", "Update payment", "Modify plan", "Cancel subscription", "Transfer ownership"]
  },
  {
    name: "Legal Matters",
    selected: 0,
    total: 5,
    permissions: ["Conflict checks", "Manage matters", "LEDES export", "Trust ledger", "UTBMS coding"]
  }
];

const rolePermissions: Record<BuiltInRoleKey, Record<string, string[]>> = {
  owner: {
    "Owner powers": ["Transfer ownership", "Delete organization", "Manage billing", "Grant or revoke any permission", "View all audit logs"],
    "Everything else": ["All admin permissions", "All manager permissions for all employees", "All employee self-service permissions"]
  },
  admin: {
    "Employee Management": ["Create, edit, and deactivate employees", "Manage sites", "Configure pay rules and PTO policies"],
    "Operations": ["Manage all schedules", "Review all time entries", "Approve all timesheets", "View all reports"],
    "Excluded by default": ["Billing", "Transfer ownership", "Delete organization"]
  },
  manager: {
    "Time & Attendance": ["View team timesheets", "Edit team time entries", "Approve weekly timesheets"],
    "PTO & Scheduling": ["Approve team PTO", "View team PTO calendar", "Create and modify team shifts"],
    "Excluded by default": ["Pay rate changes", "Org-wide settings", "Billing", "Sensitive HR fields"]
  },
  team_lead: {
    "Team coordination": ["View team schedule", "Create open shifts", "Approve team shift swaps", "Assign tasks"],
    "Communication": ["See team chat", "Send team updates"],
    "Excluded by default": ["Approve PTO", "Edit time entries", "Pay rate visibility", "Performance reports"]
  },
  employee: {
    "Self service": ["Clock in/out", "View own timesheets", "Submit PTO", "Update availability", "Complete assigned tasks"],
    "Communication": ["Read assigned team chats", "Acknowledge announcements"],
    "Excluded by default": ["Administrative settings", "Other employees' private data", "Billing"]
  }
};

export function RolesPermissionsClient({ members, roleCounts, customRoles, customGroups, canManage, canTransferOwnership, currentPlan = "starter" }: {
  members: Member[];
  roleCounts: Record<string, number>;
  customRoles: CustomRole[];
  customGroups: CustomGroup[];
  canManage: boolean;
  canTransferOwnership: boolean;
  currentPlan?: PlanTier;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedRole, setSelectedRole] = useState<BuiltInRoleKey>("manager");
  const [expandedCategory, setExpandedCategory] = useState("Time & Attendance");
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);

  async function runMaintenance() {
    setIsRunningMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}` // Ensure this is available or use a session-based check
        }
      });
      if (res.ok) alert("Maintenance completed successfully.");
      else alert("Maintenance failed. Check server logs.");
    } catch (e) {
      alert("Error triggering maintenance.");
    } finally {
      setIsRunningMaintenance(false);
    }
  }

  const departments = useMemo(() => Array.from(new Set(members.map((member) => member.department).filter(Boolean))) as string[], [members]);
  const privilegedInactive = members.filter((member) => ["owner", "admin", "manager"].includes(member.role)).slice(0, 2);
  const customRoleRows = customRoles.length
    ? customRoles
    : [
        { id: "sample-payroll", roleKey: "payroll_specialist", name: "Payroll Specialist", description: "View all timesheets, lock pay periods, no other admin access.", kind: "custom", baseRole: null, defaultScopeType: "all" },
        { id: "sample-hr", roleKey: "hr_coordinator", name: "HR Coordinator", description: "Employee data and PTO management without scheduling controls.", kind: "custom", baseRole: null, defaultScopeType: "all" }
      ];

  function openRole(role: BuiltInRoleKey) {
    setSelectedRole(role);
    setModal("role");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-border bg-white/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Settings → Roles & Permissions</p>
            <h1 className="mt-3 text-3xl font-semibold">Admin permissions and role management</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Built-in roles cover the common workforce hierarchy. Custom roles and scopes handle exceptions without over-granting access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("audit")}><ShieldCheck className="h-4 w-4" /> Audit log</Button>
            {canTransferOwnership ? <Button variant="outline" onClick={() => setModal("transfer")}><ArrowRight className="h-4 w-4" /> Transfer ownership</Button> : null}
            {canManage ? <Button onClick={() => setModal("builder")}><Plus className="h-4 w-4" /> Create custom role</Button> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SectionTitle title="Built-In Roles" subtitle="Five roles cover most organizations. Owner remains singular and protected." />
          {builtInRoles.map((role) => (
            <RoleRow
              key={role.key}
              title={role.name}
              description={role.description}
              count={roleCounts[role.key] ?? (role.key === "employee" ? roleCounts.member ?? 0 : 0)}
              badge={role.scope}
              locked={!role.mutable || isRoleLocked(currentPlan, role.key)}
              planLocked={isRoleLocked(currentPlan, role.key)}
              onView={() => openRole(role.key)}
              onCustomize={role.mutable && canManage ? () => { setSelectedRole(role.key); setModal("customize"); } : undefined}
            />
          ))}

          <SectionTitle title="Custom Roles" subtitle="Use these for one-off access patterns like payroll, HR, regional operations, or product-specific admins." />
          {customRoleRows.map((role) => (
            <RoleRow
              key={role.id}
              title={role.name}
              description={role.description ?? "Custom role"}
              count={members.filter((member) => member.role === role.roleKey).length}
              badge={`Scope: ${scopeLabel(role.defaultScopeType)}`}
              onView={() => setModal("role")}
              onCustomize={canManage ? () => setModal("builder") : undefined}
              custom
            />
          ))}
        </div>

        <aside className="space-y-4">
          <GovernanceCard members={members} privilegedInactive={privilegedInactive} />
          
          <div className="rounded-md border border-border bg-white/70 p-4">
            <div className="flex items-center gap-2 font-semibold">
              <Activity className="h-4 w-4 text-primary" />
              System Maintenance
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Run background tasks like auto clock-out and PTO accruals manually.</p>
            <Button 
              className="mt-4 w-full" 
              variant="outline" 
              onClick={runMaintenance}
              disabled={isRunningMaintenance}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRunningMaintenance && "animate-spin")} />
              {isRunningMaintenance ? "Running..." : "Run System Jobs"}
            </Button>
          </div>

          <div className="rounded-md border border-border bg-white/70 p-4">
            <p className="font-semibold">Custom groups</p>
            <p className="mt-1 text-sm text-muted-foreground">Groups become reusable permission scopes.</p>
            <div className="mt-4 space-y-2">
              {(customGroups.length ? customGroups : [{ id: "weekend", name: "Weekend coordinators", description: "3 members" }, { id: "field", name: "Field team alpha", description: "8 members" }]).map((group) => (
                <button key={group.id} onClick={() => setModal("groups")} className="w-full rounded-md border border-border bg-cream/60 p-3 text-left text-sm">
                  <span className="font-semibold">{group.name}</span>
                  <span className="mt-1 block text-muted-foreground">{group.description ?? "Custom group"}</span>
                </button>
              ))}
            </div>
            {canManage ? <Button className="mt-4 w-full" variant="outline" onClick={() => setModal("groups")}>Manage groups</Button> : null}
          </div>
          <div className="rounded-md border border-border bg-white/70 p-4">
            <p className="font-semibold">Quick setup</p>
            <p className="mt-1 text-sm text-muted-foreground">Templates can seed sensible roles for restaurants, retail, healthcare, construction, and office teams.</p>
            <div className="mt-3 grid gap-2">
              {["Small Business", "Mid-Market", "Enterprise"].map((template) => (
                <button key={template} className="rounded-md border border-border bg-white px-3 py-2 text-left text-sm font-medium hover:border-primary">{template}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-md border border-border bg-white/70 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Assign roles to people</p>
            <p className="mt-1 text-sm text-muted-foreground">Every assignment previews scope, notifies the affected user, and logs an audit event.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setModal("bulk")}>Bulk assignment</Button>
            {canManage ? <Button onClick={() => setModal("assign")}>Assign role</Button> : null}
          </div>
        </div>
      </div>

      {modal ? (
        <Modal title={modalTitle(modal, selectedRole)} onClose={() => setModal(null)}>
          {modal === "role" ? <RoleDetail role={selectedRole} /> : null}
          {modal === "customize" ? <CustomizeRole role={selectedRole} expanded={expandedCategory} setExpanded={setExpandedCategory} currentPlan={currentPlan} /> : null}
          {modal === "builder" ? <CustomRoleBuilder expanded={expandedCategory} setExpanded={setExpandedCategory} departments={departments} /> : null}
          {modal === "assign" ? <AssignRole members={members} departments={departments} /> : null}
          {modal === "bulk" ? <BulkAssignment members={members} /> : null}
          {modal === "groups" ? <GroupsView customGroups={customGroups} /> : null}
          {modal === "audit" ? <PermissionAudit /> : null}
          {modal === "transfer" ? <OwnershipTransfer members={members} /> : null}
        </Modal>
      ) : null}
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function RoleRow({ title, description, count, badge, locked, custom, onView, onCustomize }: {
  title: string;
  description: string;
  count: number;
  badge: string;
  locked?: boolean;
  planLocked?: boolean;
  custom?: boolean;
  onView: () => void;
  onCustomize?: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-white/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-md", custom ? "bg-secondary text-primary" : "bg-primary/10 text-primary")}>
            {locked ? <LockKeyhole className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("text-xl font-semibold", planLocked && "text-muted-foreground")}>{title}</h2>
              <span className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-muted-foreground">{count} {count === 1 ? "user" : "users"}</span>
              <span className="rounded-sm border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">{badge}</span>
              {planLocked && (
                <span className="rounded-sm bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 uppercase tracking-tighter">Upgrade required</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="outline" onClick={onView}><Eye className="h-4 w-4" /> View permissions</Button>
          {onCustomize ? <Button variant="outline" onClick={onCustomize}><SlidersHorizontal className="h-4 w-4" /> Customize</Button> : null}
        </div>
      </div>
    </div>
  );
}

function GovernanceCard({ members, privilegedInactive }: { members: Member[]; privilegedInactive: Member[] }) {
  const sensitive = [
    ["View compensation", Math.max(1, members.filter((member) => ["owner", "admin"].includes(member.role)).length)],
    ["Edit compensation", Math.max(1, members.filter((member) => member.role === "owner").length)],
    ["Override approvals", Math.max(1, members.filter((member) => ["owner", "admin"].includes(member.role)).length)],
    ["Manage roles", Math.max(1, members.filter((member) => ["owner", "admin"].includes(member.role)).length)]
  ];
  return (
    <div className="rounded-md border border-border bg-white/70 p-4">
      <p className="font-semibold">Permission distribution</p>
      <dl className="mt-4 space-y-2 text-sm">
        {builtInRoles.map((role) => (
          <div key={role.key} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{role.name}</dt>
            <dd className="font-semibold">{members.filter((member) => member.role === role.key || (role.key === "employee" && member.role === "member")).length}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-semibold">Sensitive permissions</p>
        <div className="mt-2 space-y-2 text-sm">
          {sensitive.map(([label, count]) => <p key={label} className="flex justify-between gap-3 text-muted-foreground"><span>{label}</span><span>{count} users</span></p>)}
        </div>
      </div>
      {privilegedInactive.length ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <AlertTriangle className="mr-2 inline h-4 w-4" /> Review privileged users who have not logged in recently.
        </div>
      ) : null}
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

function modalTitle(modal: Exclude<ModalKind, null>, role: BuiltInRoleKey) {
  const titles: Record<Exclude<ModalKind, null>, string> = {
    role: `${builtInRoles.find((item) => item.key === role)?.name ?? "Role"} — Permissions`,
    customize: `Customize ${builtInRoles.find((item) => item.key === role)?.name ?? "Role"} permissions`,
    builder: "Create Custom Role",
    assign: "Assign Role",
    bulk: "Bulk Role Assignment",
    groups: "Custom Groups",
    audit: "Permission Audit Log",
    transfer: "Transfer Ownership"
  };
  return titles[modal];
}

function RoleDetail({ role }: { role: BuiltInRoleKey }) {
  const definition = builtInRoles.find((item) => item.key === role)!;
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border bg-cream/60 p-4">
        <p className="font-semibold">Scope: {definition.scope}</p>
        <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(rolePermissions[role]).map(([category, permissions]) => (
          <div key={category} className="rounded-md border border-border bg-white/70 p-4">
            <p className="font-semibold">{category}</p>
            <div className="mt-3 space-y-2 text-sm">
              {permissions.map((permission) => (
                <p key={permission} className="flex gap-2 text-muted-foreground">
                  {category.includes("Excluded") ? <X className="mt-0.5 h-4 w-4 text-muted-foreground" /> : <Check className="mt-0.5 h-4 w-4 text-emerald-700" />}
                  {permission}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomizeRole({ role, expanded, setExpanded, currentPlan }: { role: BuiltInRoleKey; expanded: string; setExpanded: (value: string) => void; currentPlan: PlanTier }) {
  const definition = builtInRoles.find((item) => item.key === role)!;
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> Changes apply to every user with the {definition.name} role. For one person, create a custom role instead.
      </div>
      <PermissionSections expanded={expanded} setExpanded={setExpanded} currentPlan={currentPlan} />
      <DependencyWarning />
      <div className="flex flex-wrap gap-2">
        <Button>Save changes</Button>
        <Button variant="outline">Reset to defaults</Button>
      </div>
    </div>
  );
}

function CustomRoleBuilder({ expanded, setExpanded, departments }: { expanded: string; setExpanded: (value: string) => void; departments: string[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Name<input className="h-11 rounded-md border border-border bg-white px-3 text-ink" defaultValue="Payroll Specialist" /></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Description<input className="h-11 rounded-md border border-border bg-white px-3 text-ink" defaultValue="Handles payroll without other admin access" /></label>
      </div>
      <div className="rounded-md border border-border p-4">
        <p className="font-semibold">Start from</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="rounded-md border border-primary bg-primary/5 p-3 text-sm"><input className="mr-2" type="radio" name="start" defaultChecked /> Blank slate</label>
          <label className="rounded-md border border-border bg-white p-3 text-sm"><input className="mr-2" type="radio" name="start" /> Copy permissions from Manager</label>
        </div>
      </div>
      <div className="rounded-md border border-border p-4">
        <p className="font-semibold">Scope</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {["Themselves only", "Direct reports", departments[0] ? `${departments[0]} department` : "Specific department", "Specific site", "Custom group", "Whole organization"].map((scope, index) => (
            <label key={scope} className="rounded-md border border-border bg-white p-3 text-sm"><input className="mr-2" type="radio" name="scope" defaultChecked={index === 5} /> {scope}</label>
          ))}
        </div>
      </div>
      <PermissionSections expanded={expanded} setExpanded={setExpanded} />
      <PreviewBox />
      <div className="flex flex-wrap gap-2">
        <Button>Save role</Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

function PermissionSections({ expanded, setExpanded, currentPlan = "legal" }: { expanded: string; setExpanded: (value: string) => void; currentPlan?: PlanTier }) {
  return (
    <div className="rounded-md border border-border">
      {categories.map((category) => {
        const open = expanded === category.name;
        const locked = isFeatureLocked(currentPlan, category.name);
        return (
          <div key={category.name} className={cn("border-b border-border last:border-0", locked && "bg-muted/30 opacity-60")}>
            <button type="button" disabled={locked} onClick={() => setExpanded(open ? "" : category.name)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
              <span className="font-semibold">{category.name}</span>
              <div className="flex items-center gap-3">
                {locked && <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">{category.selected} of {category.total} selected <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} /></span>
              </div>
            </button>
            {open ? (
              <div className="grid gap-2 border-t border-border bg-white/55 p-4 md:grid-cols-2">
                {category.permissions.map((permission, index) => (
                  <label key={permission} className="rounded-md border border-border bg-background p-3 text-sm">
                    <input className="mr-2" type="checkbox" defaultChecked={index < Math.min(category.selected, category.permissions.length)} /> {permission}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DependencyWarning() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <AlertTriangle className="mr-2 inline h-4 w-4" /> You granted Approve PTO but did not grant View PTO requests. Without view access, they cannot see what to approve.
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline">Grant View PTO</Button>
        <Button variant="ghost">Continue without</Button>
      </div>
    </div>
  );
}

function PreviewBox() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="font-semibold">This role can</p>
        <ul className="mt-2 space-y-2">
          <li>View all timesheets and time entries</li>
          <li>Lock pay periods after review</li>
          <li>Generate payroll reports</li>
        </ul>
      </div>
      <div className="rounded-md border border-border bg-white/70 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-ink">This role cannot</p>
        <ul className="mt-2 space-y-2">
          <li>Edit time entries directly</li>
          <li>Change employee details</li>
          <li>Modify org settings or billing</li>
        </ul>
      </div>
    </div>
  );
}

function AssignRole({ members, departments }: { members: Member[]; departments: string[] }) {
  const target = members[0];
  const scopeCount = Math.max(1, members.filter((member) => member.department === (departments[0] ?? target?.department)).length);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Employee<select className="h-11 rounded-md border border-border bg-white px-3 text-ink">{members.map((member) => <option key={member.id}>{member.fullName || member.email}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">New role<select className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option>Manager</option><option>Team Lead</option><option>Admin</option></select></label>
      </div>
      <div className="rounded-md border border-border p-4">
        <p className="font-semibold">Scope</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <label className="rounded-md border border-border p-3 text-sm"><input className="mr-2" type="radio" name="assign-scope" /> Direct reports only</label>
          <label className="rounded-md border border-primary bg-primary/5 p-3 text-sm"><input className="mr-2" type="radio" name="assign-scope" defaultChecked /> {departments[0] ?? "Engineering"} team</label>
          <label className="rounded-md border border-border p-3 text-sm"><input className="mr-2" type="radio" name="assign-scope" /> Multiple groups</label>
        </div>
      </div>
      <PreviewSentence name={target?.fullName || target?.email || "This user"} count={scopeCount} department={departments[0] ?? "Engineering"} />
      <div className="rounded-md border border-border p-4">
        <label className="flex gap-2 text-sm"><input type="checkbox" defaultChecked /> Send the affected user a notification about this change</label>
        <textarea className="mt-3 min-h-24 w-full rounded-md border border-border bg-white p-3 text-sm" defaultValue="Your access has been updated. You can see the new capabilities from your dashboard." />
      </div>
      <Button>Assign role</Button>
    </div>
  );
}

function PreviewSentence({ name, count, department }: { name: string; count: number; department: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="font-semibold">{name} will be able to</p>
        <ul className="mt-2 space-y-2">
          <li>Approve PTO for {count} {department} team members</li>
          <li>Edit their time entries with audit trail</li>
          <li>Manage their schedules</li>
        </ul>
      </div>
      <div className="rounded-md border border-border bg-white/70 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-ink">{name} will not be able to</p>
        <ul className="mt-2 space-y-2">
          <li>Manage employees outside {department}</li>
          <li>See org-wide pay rates</li>
          <li>Change org settings or billing</li>
        </ul>
      </div>
    </div>
  );
}

function BulkAssignment({ members }: { members: Member[] }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline">Filter: All</Button>
        <p className="text-sm font-semibold">{Math.min(14, members.length)} selected</p>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border border-border">
        {members.slice(0, 14).map((member, index) => (
          <label key={member.id} className="flex items-center justify-between gap-3 border-b border-border p-3 text-sm last:border-0">
            <span><input className="mr-2" type="checkbox" defaultChecked={index < 8} /> {member.fullName || member.email}</span>
            <span className="text-muted-foreground">Currently: {member.role}</span>
          </label>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Change to<select className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option>Team Lead</option><option>Manager</option><option>Employee</option></select></label>
        <label className="grid gap-2 text-sm font-medium text-muted-foreground">Scope<select className="h-11 rounded-md border border-border bg-white px-3 text-ink"><option>Their own teams (auto-detect)</option><option>Direct reports</option><option>Whole organization</option></select></label>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> Any demotions or owner changes require explicit confirmation and are logged separately.
      </div>
      <Button>Apply changes</Button>
    </div>
  );
}

function GroupsView({ customGroups }: { customGroups: CustomGroup[] }) {
  const rows = customGroups.length ? customGroups : [{ id: "weekend", name: "Weekend coordinators", description: "3 members" }, { id: "field", name: "Field team alpha", description: "8 members" }];
  return (
    <div className="space-y-4">
      {rows.map((group) => (
        <div key={group.id} className="flex flex-col gap-3 rounded-md border border-border bg-white/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">{group.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="flex gap-2"><Button variant="outline">View</Button><Button variant="outline">Edit</Button></div>
        </div>
      ))}
      <Button><Plus className="h-4 w-4" /> Create group</Button>
    </div>
  );
}

function PermissionAudit() {
  const rows = [
    ["Jun 14, 11:32 AM", "sarah@acmecorp.com", "Granted: Approve PTO (Engineering team)", "Mike Johnson"],
    ["Jun 12, 9:15 AM", "jane@acmecorp.com", "Changed: Custom role Payroll Specialist", "1 affected user"],
    ["Jun 8, 2:47 PM", "System (HRIS sync)", "Updated: Employee to Manager", "Aisha Patel"],
    ["Jun 1, 10:00 AM", "mike@acmecorp.com", "Denied: View all compensation", "Permission not granted"]
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2"><Button variant="outline">All actions</Button><Button variant="outline">Last 30 days</Button></div>
        <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
      </div>
      {rows.map(([time, actor, action, target]) => (
        <div key={`${time}-${action}`} className="grid gap-2 rounded-md border border-border bg-white/70 p-4 text-sm md:grid-cols-[1fr_1fr_2fr_1fr]">
          <span className="text-muted-foreground">{time}</span>
          <span>{actor}</span>
          <span className="font-semibold">{action}</span>
          <span className="text-muted-foreground">{target}</span>
        </div>
      ))}
    </div>
  );
}

function OwnershipTransfer({ members }: { members: Member[] }) {
  const admins = members.filter((member) => ["admin", "owner"].includes(member.role));
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mr-2 inline h-4 w-4" /> Ownership grants billing, org deletion, and permission control. The recipient must accept within 7 days.
      </div>
      <label className="grid gap-2 text-sm font-medium text-muted-foreground">Transfer to<select className="h-11 rounded-md border border-border bg-white px-3 text-ink">{admins.map((member) => <option key={member.id}>{member.fullName || member.email}</option>)}</select></label>
      <textarea className="min-h-28 w-full rounded-md border border-border bg-white p-3 text-sm" placeholder="Why are you transferring? Optional, saved for records." />
      <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        The current owner becomes an Admin after transfer. The new owner must re-authenticate before accepting.
      </div>
      <Button>Send transfer request</Button>
    </div>
  );
}

function scopeLabel(scope: string) {
  return scope.replace(/_/g, " ");
}
