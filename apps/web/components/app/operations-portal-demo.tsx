"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileSignature,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  Send,
  Settings,
  Ticket,
  UserRound,
  UsersRound
} from "lucide-react";
import { portalBrand } from "@/lib/portal-brand";
import { type CourseCatalogItem, type PortalRole, type PortalViewer, type StaffShift, type TrainingAssignment } from "@/lib/operations-portal-data";
import { getClientName, invoiceTotal, useOperationsPortalStore, visibleForViewer, type ClientDocument, type ClientInvoice, type ClientProject, type DemoHighlight, type MessageThread, type SupportTicket } from "@/lib/operations-portal-store";
import type { PortalPage } from "@/lib/operations-portal-store";
import { can, isOperationsAdmin, isOperationsManager, resourceScope, scopedEmployeeIds, visibleOperationsNav, type PermissionScope } from "@/lib/operations-permissions";

type Surface = "operations" | "client";

type DemoProps = {
  surface: Surface;
};

type LearningPath = {
  id: string;
  name: string;
  kind: "new_hire" | "role_based" | "promotion" | "compliance" | "manual";
  courseIds: string[];
};

const clientNav: Array<{ page: PortalPage; label: string; icon: typeof LayoutDashboard }> = [
  { page: "dashboard", label: "Home", icon: LayoutDashboard },
  { page: "projects", label: "Projects", icon: FolderKanban },
  { page: "invoices", label: "Invoices", icon: ReceiptText },
  { page: "documents", label: "Documents", icon: FileSignature },
  { page: "messages", label: "Messages", icon: MessageSquareText },
  { page: "tickets", label: "Support", icon: Ticket }
];

const operationsNavIcons: Record<PortalPage, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  "action-center": ClipboardList,
  "my-timekeeping": Clock3,
  timekeeping: Clock3,
  "my-schedule": CalendarDays,
  scheduling: CalendarDays,
  billing: ReceiptText,
  hr: UsersRound,
  documents: FileSignature,
  ticketing: Ticket,
  chat: MessageSquareText,
  lms: BookOpenCheck,
  knowledge: FileText,
  "company-home": Home,
  "client-back-office": Building2,
  settings: Settings,
  profile: UserRound,
  "time-off": CalendarDays,
  projects: FolderKanban,
  invoices: ReceiptText,
  messages: MessageSquareText,
  tickets: Ticket,
  clients: UsersRound
};

const projectStatuses: ClientProject["status"][] = ["Discovery", "In progress", "Client review", "Blocked", "Launched"];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function badgeClass(status: string) {
  if (status === "paid" || status === "signed" || status === "Launched" || status === "green" || status === "closed") return "bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-200";
  if (status === "payable" || status === "awaiting_signature" || status === "Client review" || status === "waiting_on_staff") return "bg-secondary/55 text-primary dark:bg-secondary/20 dark:text-[#edf0ce]";
  if (status === "Blocked" || status === "overdue" || status === "red" || status === "high") return "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200";
  return "bg-cream text-muted-foreground dark:bg-white/10 dark:text-white/70";
}

function denyReason(label: string) {
  return window.prompt(`${label}. Enter a reason:`)?.trim() ?? "";
}

function surfaceForRole(role: PortalRole) {
  return role === "client" ? "Client Portal" : "Operations Hub";
}

const demoSteps = [
  { label: "Staff issues an invoice", highlight: "invoice" },
  { label: "Client pays the invoice", highlight: "invoice" },
  { label: "Staff pushes a document", highlight: "document" },
  { label: "Client e-signs", highlight: "document" },
  { label: "Client sends a message", highlight: "message" },
  { label: "Staff replies", highlight: "message" },
  { label: "Staff updates project status", highlight: "project" }
] satisfies Array<{ label: string; highlight: Exclude<DemoHighlight, null> }>;

function highlightClass(active: boolean) {
  return active ? "ring-2 ring-secondary ring-offset-2 ring-offset-background motion-safe:animate-pulse" : "";
}

function actorForPane(role: "staff" | "client", clientId: string): PortalViewer {
  return role === "client" ? { role: "client", clientId } : { role: "admin" };
}

export function OperationsPortalDemo({ surface }: DemoProps) {
  const store = useOperationsPortalStore();

  const isClient = store.viewer.role === "client";
  const navItems = isClient ? clientNav : visibleOperationsNav(store.viewer).map((item) => ({ ...item, icon: operationsNavIcons[item.page] }));
  const clientId = isClient ? store.viewer.clientId ?? store.selectedClientId : store.selectedClientId;
  const selectedClient = store.clients.find((client) => client.id === clientId) ?? store.clients[0];
  const visibleProjects = visibleForViewer(store.projects, store.viewer);
  const visibleInvoices = visibleForViewer(store.invoices, store.viewer);
  const visibleDocuments = visibleForViewer(store.documents, store.viewer);
  const visibleThreads = visibleForViewer(store.threads, store.viewer);
  const visibleTickets = visibleForViewer(store.tickets, store.viewer);
  const selectedProject = visibleProjects.find((project) => project.id === store.selectedProjectId) ?? visibleProjects[0];
  const selectedInvoice = visibleInvoices.find((invoice) => invoice.id === store.selectedInvoiceId) ?? visibleInvoices[0];
  const selectedDocument = visibleDocuments.find((document) => document.id === store.selectedDocumentId) ?? visibleDocuments[0];
  const selectedThread = visibleThreads.find((thread) => thread.id === store.selectedThreadId) ?? visibleThreads[0];
  const selectedTicket = visibleTickets.find((ticket) => ticket.id === store.selectedTicketId) ?? visibleTickets[0];
  const demoClient = store.clients.find((client) => client.id === store.demoClientId) ?? store.clients[0];
  const demoProject = store.projects.find((project) => project.clientId === demoClient.id) ?? store.projects[0];
  const demoInvoice = store.invoices.find((invoice) => invoice.clientId === demoClient.id) ?? store.invoices[0];
  const demoDocument = store.documents.find((document) => document.clientId === demoClient.id) ?? store.documents[0];
  const demoThread = store.threads.find((thread) => thread.clientId === demoClient.id) ?? store.threads[0];
  const demoTicket = store.tickets.find((ticket) => ticket.clientId === demoClient.id) ?? store.tickets[0];
  const onDashboard = store.activePage === "dashboard" && !store.demoMode;

  function fireDemoStep(stepIndex = store.demoStepIndex) {
    const step = demoSteps[stepIndex];
    if (!step) return;

    if (stepIndex === 0) store.issueInvoice(demoInvoice.id);
    if (stepIndex === 1) store.markInvoicePaid(demoInvoice.id);
    if (stepIndex === 2) store.pushDocumentForSignature(demoDocument.id);
    if (stepIndex === 3) store.signDocument(demoDocument.id);
    if (stepIndex === 4) store.sendMessage(demoThread.id, "Can you confirm the latest timeline before our internal rollout meeting?", actorForPane("client", demoClient.id));
    if (stepIndex === 5) store.sendMessage(demoThread.id, "Confirmed. Your portal timeline and next milestone are updated for your team.", actorForPane("staff", demoClient.id));
    if (stepIndex === 6) store.updateProjectStatus(demoProject.id, demoProject.status === "Launched" ? "Client review" : "Launched");
    store.setDemoHighlight(step.highlight);
    store.setDemoStep(Math.min(stepIndex + 1, demoSteps.length));
    window.setTimeout(() => store.setDemoHighlight(null), 1500);
  }

  useEffect(() => {
    if (surface === "client" && store.viewer.role !== "client") {
      store.setViewer({ role: "client", clientId: store.selectedClientId });
    }
    if (surface === "operations" && store.viewer.role === "client") {
      store.setViewer({ role: "admin" });
    }
  }, []);

  useEffect(() => {
    if (!store.demoMode || !store.demoAutoplay) return;

    const timer = window.setInterval(() => {
      const current = useOperationsPortalStore.getState();
      if (!current.demoAutoplay || !current.demoMode) return;
      if (current.demoStepIndex >= demoSteps.length) {
        current.resetDemo();
        current.setDemoMode(true);
        current.setDemoAutoplay(true);
        return;
      }
      fireDemoStep(current.demoStepIndex);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [store.demoMode, store.demoAutoplay, store.demoStepIndex, demoClient.id, demoInvoice.id, demoDocument.id, demoThread.id, demoProject.id]);

  const metrics = [
    { label: isClient ? "Open projects" : "Active clients", value: isClient ? String(visibleProjects.length) : String(store.clients.length) },
    { label: isClient ? "Payable invoices" : "Client invoices", value: String(visibleInvoices.filter((invoice) => invoice.status === "payable" || invoice.status === "sent").length) },
    { label: isClient ? "Awaiting signature" : "Signature queue", value: String(visibleDocuments.filter((document) => document.status === "awaiting_signature").length) },
    { label: isClient ? "Support tickets" : "Inbox + tickets", value: String(visibleThreads.length + visibleTickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed").length) }
  ];

  return (
    <section className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href="/templates" className={`${portalBrand.fonts.title} text-3xl leading-none text-cream`}>{portalBrand.logoText}</Link>
        {!isClient ? <div className="mt-5"><NotificationBell surface="sidebar" /></div> : null}
        <nav className="mt-7 grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.page} onClick={() => store.setActivePage(item.page)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${store.activePage === item.page ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                <Icon className="h-[18px] w-[18px] text-secondary" />
                <span className="min-w-0 flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="md:pl-64">
        <div className="px-4 py-5 md:px-8 md:py-8 xl:px-10">
          {onDashboard ? (
            <header className="rounded-md bg-primary p-5 text-white md:p-7">
              <div className="grid gap-5 xl:grid-cols-[1fr_520px] xl:items-end">
                <div>
                  <p className="text-sm font-semibold text-secondary">Operations Hub + Client Portal</p>
                  <h1 className="mt-3 max-w-5xl font-title text-5xl leading-[0.9] text-cream md:text-7xl">
                    Same data, different front doors.
                  </h1>
                  <p className="mt-5 max-w-3xl text-sm leading-6 text-white/74 md:text-base">
                    Flip the demo viewer, issue an invoice, pay it from the client side, sign documents, exchange messages, and watch the same entities update across both surfaces.
                  </p>
                </div>
                <ViewerSwitcher selectedClientId={selectedClient.id} />
              </div>
            </header>
          ) : (
            <ModuleTopBar selectedClientId={selectedClient.id} navItems={navItems} isClient={isClient} />
          )}

          {store.demoMode ? (
            <>
              <DemoControlBar onRunStep={fireDemoStep} />
              <section className="mt-5 grid gap-4 xl:grid-cols-2">
                <DemoPane
                  label="Staff - what your team sees"
                  viewer={actorForPane("staff", demoClient.id)}
                  clientId={demoClient.id}
                  project={demoProject}
                  invoice={demoInvoice}
                  document={demoDocument}
                  thread={demoThread}
                  ticket={demoTicket}
                  highlight={store.demoHighlight}
                />
                <DemoPane
                  label="Client - what your customer sees"
                  viewer={actorForPane("client", demoClient.id)}
                  clientId={demoClient.id}
                  project={demoProject}
                  invoice={demoInvoice}
                  document={demoDocument}
                  thread={demoThread}
                  ticket={demoTicket}
                  highlight={store.demoHighlight}
                />
              </section>
            </>
          ) : (
            <>
          {onDashboard ? (
            <section className="mt-5 grid gap-4 md:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-md border border-border bg-white/65 p-4 dark:border-white/10 dark:bg-[#15231a]">
                  <p className="text-sm text-muted-foreground dark:text-white/62">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-ink dark:text-cream">{metric.value}</p>
                </div>
              ))}
            </section>
          ) : null}

          <section className={onDashboard ? "mt-5" : "mt-4"}>
            {isClient ? (
              <ClientPortalWorkspace
                clientId={selectedClient.id}
                project={selectedProject}
                invoice={selectedInvoice}
                document={selectedDocument}
                thread={selectedThread}
                ticket={selectedTicket}
                projects={visibleProjects}
                invoices={visibleInvoices}
                documents={visibleDocuments}
                threads={visibleThreads}
                tickets={visibleTickets}
              />
            ) : (
              <OperationsWorkspace />
            )}
          </section>
            </>
          )}
        </div>
      </main>
    </section>
  );
}

function ViewerSwitcher({ selectedClientId }: { selectedClientId: string }) {
  const { clients, viewer, demoMode, setViewer, setDemoMode, resetDemo } = useOperationsPortalStore();
  const roleValue = viewer.role === "client" ? "client" : viewer.role === "manager" ? "manager" : viewer.role === "employee" ? "employee" : "owner";
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];

  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/52">{demoMode ? "Demo Mode" : "Demo viewer"}</p>
          <p className="mt-1 text-sm text-white/72">{demoMode ? "Presentation split for prospects." : "Switch roles to prove shared data."}</p>
        </div>
        <button onClick={() => setDemoMode(!demoMode)} aria-pressed={demoMode} className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${demoMode ? "border-secondary bg-secondary text-primary" : "border-white/15 text-white/80 hover:bg-white/10"}`}>
          <LayoutDashboard className="h-4 w-4" /> Demo Mode
        </button>
        {viewer.role !== "client" ? <NotificationBell surface="header" /> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {!demoMode ? (
          <label className="grid min-w-0 gap-2 text-sm font-semibold text-white/70">
            View
            <span className="relative min-w-0">
              <select value={roleValue} onChange={(event) => setViewer(event.target.value === "client" ? { role: "client", clientId: selectedClientId } : { role: event.target.value as Exclude<PortalRole, "client"> })} className="h-11 w-full min-w-0 appearance-none truncate rounded-md border border-white/15 bg-[#101a14] py-0 pl-3 pr-12 text-white">
                <option value="owner">Owner/Admin view</option>
                <option value="manager">Manager view (as Marcus)</option>
                <option value="employee">Staff view</option>
                <option value="client">Client view</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
            </span>
          </label>
        ) : (
          <button onClick={() => { resetDemo(); setDemoMode(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-sm font-semibold text-white/80 hover:bg-white/10">
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
        )}
        <div className="grid min-w-0 gap-2 text-sm font-semibold text-white/70">
          Current surface
          <div className="flex h-11 min-w-0 items-center justify-between gap-3 rounded-md border border-white/15 bg-[#101a14] px-3 text-white">
            <span className="truncate">{surfaceForRole(viewer.role)}</span>
            <span className="truncate text-xs font-medium text-white/52">{selectedClient?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleTopBar({ selectedClientId, navItems, isClient }: { selectedClientId: string; navItems: Array<{ page: PortalPage; label: string; icon: typeof LayoutDashboard }>; isClient: boolean }) {
  const { clients, viewer, activePage, demoMode, setViewer, setDemoMode, resetDemo } = useOperationsPortalStore();
  const roleValue = viewer.role === "client" ? "client" : viewer.role === "manager" ? "manager" : viewer.role === "employee" ? "employee" : "owner";
  const activeLabel = navItems.find((item) => item.page === activePage)?.label ?? (isClient ? "Client Portal" : "Operations Hub");
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];

  return (
    <header className="rounded-md border border-border bg-white/75 p-3 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary dark:text-secondary">{isClient ? "Client Portal" : "Operations Hub"}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{activeLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isClient ? <NotificationBell surface="topbar" /> : null}
          <button onClick={() => setDemoMode(!demoMode)} aria-pressed={demoMode} className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${demoMode ? "border-secondary bg-secondary text-primary" : "border-border text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8"}`}>
            <LayoutDashboard className="h-4 w-4" /> Demo Mode
          </button>
          {demoMode ? (
            <button onClick={() => { resetDemo(); setDemoMode(true); }} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          ) : (
            <label className="relative">
              <span className="sr-only">View</span>
              <select value={roleValue} onChange={(event) => setViewer(event.target.value === "client" ? { role: "client", clientId: selectedClientId } : { role: event.target.value as Exclude<PortalRole, "client"> })} className="h-10 min-w-[190px] appearance-none rounded-md border border-border bg-white py-0 pl-3 pr-10 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
                <option value="owner">Owner/Admin view</option>
                <option value="manager">Manager view</option>
                <option value="employee">Staff view</option>
                <option value="client">Client view</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          )}
          <div className="flex h-10 min-w-[210px] items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
            <span className="truncate">{surfaceForRole(viewer.role)}</span>
            <span className="truncate text-xs font-medium text-muted-foreground dark:text-white/52">{selectedClient?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationBell({ surface }: { surface: "sidebar" | "header" | "topbar" }) {
  const store = useOperationsPortalStore();
  const [open, setOpen] = useState(false);
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = isOperationsAdmin(store.viewer);
  const items = [
    ...store.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId)).map((request) => ({
      id: request.id,
      type: "PTO",
      title: employeeName(request.employeeId),
      meta: `${request.dates} · ${request.hours}h ${request.type}`,
      primaryLabel: "Approve",
      primary: () => store.approvePtoRequest(request.id),
      dangerLabel: "Deny",
      danger: () => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); }
    })),
    ...store.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId)).map((entry) => ({
      id: entry.id,
      type: entry.status === "needs_correction" ? "Correction" : "Timesheet",
      title: employeeName(entry.employeeId),
      meta: `${entry.date} · ${entry.hours}h${entry.correctedHours ? ` -> ${entry.correctedHours}h` : ""}`,
      primaryLabel: "Approve",
      primary: () => store.approveTimeEntry(entry.id),
      dangerLabel: entry.status === "needs_correction" ? "Deny" : undefined,
      danger: entry.status === "needs_correction" ? () => { const reason = denyReason("Deny correction"); if (reason) store.denyTimeCorrection(entry.id, reason); } : undefined
    })),
    ...store.shifts.filter((shift) => shift.status === "swap_requested" && shift.employeeId && scopedIds.includes(shift.employeeId)).map((shift) => ({
      id: shift.id,
      type: "Swap",
      title: employeeName(shift.employeeId!),
      meta: `${shift.day} · ${shift.site}${shift.swapWithEmployeeId ? ` · ${employeeName(shift.swapWithEmployeeId)}` : ""}`,
      primaryLabel: "Approve",
      primary: () => store.approveShiftSwap(shift.id),
      dangerLabel: "Deny",
      danger: () => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(shift.id, reason); }
    })),
    ...(admin ? store.invoices.filter((invoice) => invoice.status === "overdue").map((invoice) => ({
      id: invoice.id,
      type: "Invoice",
      title: invoice.number,
      meta: `${getClientName(store, invoice.clientId)} · ${money(invoiceTotal(invoice))}`,
      primaryLabel: "Mark paid",
      primary: () => store.markInvoicePaid(invoice.id),
      dangerLabel: undefined,
      danger: undefined
    })) : []),
    ...(admin ? store.threads.filter((thread) => thread.messages.at(-1)?.authorRole === "client").map((thread) => ({
      id: thread.id,
      type: "Message",
      title: getClientName(store, thread.clientId),
      meta: thread.subject,
      primaryLabel: "Reply",
      primary: () => store.sendMessage(thread.id, "Thanks, we have this and will follow up with the next step shortly.", { role: "admin" }),
      dangerLabel: undefined,
      danger: undefined
    })) : [])
  ];
  const count = items.length;
  const buttonClass = surface === "sidebar"
    ? "flex w-full items-center justify-between rounded-md border border-white/12 bg-white/8 px-3 py-2.5 text-left text-sm font-semibold text-white/82 hover:bg-white/12"
    : "relative inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8";
  const panelClass = surface === "sidebar"
    ? "left-0 top-12 w-[360px]"
    : "right-0 top-12 w-[390px]";

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={buttonClass}>
        <span className="inline-flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>
        {count ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">{count}</span> : null}
      </button>
      {open ? (
        <div className={`absolute z-50 mt-2 max-h-[70vh] overflow-auto rounded-md border border-border bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#15231a] ${panelClass}`}>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-secondary">Notifications</p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-white/62">{count ? `${count} scoped action${count === 1 ? "" : "s"}` : "All clear"}</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-primary dark:border-white/10 dark:text-secondary">Close</button>
          </div>
          <div className="mt-3 grid gap-2">
            {items.length ? items.slice(0, 12).map((item) => (
              <article key={`${item.type}-${item.id}`} className="rounded-md bg-cream/70 p-3 dark:bg-white/8">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-sm bg-secondary/40 px-2 py-0.5 text-xs font-semibold text-primary dark:text-[#edf0ce]">{item.type}</span>
                    <p className="mt-2 text-sm font-semibold text-ink dark:text-cream">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-white/62">{item.meta}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SmallAction onClick={() => { item.primary(); }}>{item.primaryLabel}</SmallAction>
                  {item.danger && item.dangerLabel ? <SmallAction variant="danger" onClick={() => { item.danger?.(); }}>{item.dangerLabel}</SmallAction> : null}
                </div>
              </article>
            )) : <p className="rounded-md bg-cream/70 p-3 text-sm text-muted-foreground dark:bg-white/8 dark:text-white/62">No approvals, corrections, overdue invoices, or client replies need attention.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DemoControlBar({ onRunStep }: { onRunStep: (stepIndex?: number) => void }) {
  const { demoStepIndex, demoAutoplay, setDemoStep, setDemoAutoplay, resetDemo, setDemoMode } = useOperationsPortalStore();
  const currentStep = demoSteps[demoStepIndex];

  return (
    <section className="mt-5 rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]" aria-label="Demo Mode controls">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">Guided Demo Mode</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{currentStep ? currentStep.label : "Demo complete"}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDemoStep(Math.max(0, demoStepIndex - 1))} disabled={demoStepIndex === 0} className="h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary disabled:opacity-45 dark:border-white/10 dark:text-secondary">
            Back
          </button>
          <button onClick={() => currentStep ? onRunStep(demoStepIndex) : null} disabled={!currentStep} className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">
            {currentStep ? "Fire current step" : "Run reset to restart"}
          </button>
          <button onClick={() => setDemoAutoplay(!demoAutoplay)} aria-pressed={demoAutoplay} className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${demoAutoplay ? "bg-secondary text-primary" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>
            {demoAutoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {demoAutoplay ? "Pause" : "Auto-play"}
          </button>
          <button onClick={() => { resetDemo(); setDemoMode(true); }} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">
            <RotateCcw className="h-4 w-4" /> Reset demo
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-7">
        {demoSteps.map((step, index) => (
          <button
            key={step.label}
            onClick={() => onRunStep(index)}
            disabled={index !== demoStepIndex}
            className={`min-h-16 rounded-md border p-2 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-secondary ${index < demoStepIndex ? "border-green-200 bg-green-50 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-200" : index === demoStepIndex ? "border-primary bg-secondary/35 text-primary dark:border-secondary/50 dark:bg-secondary/15 dark:text-[#edf0ce]" : "border-border bg-cream/45 text-muted-foreground opacity-65 dark:border-white/10 dark:bg-white/6 dark:text-white/50"}`}
          >
            <span className="block text-[11px] uppercase tracking-[0.12em]">Step {index + 1}</span>
            <span className="mt-1 block leading-4">{step.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DemoPane({
  label,
  viewer,
  clientId,
  project,
  invoice,
  document,
  thread,
  ticket,
  highlight
}: {
  label: string;
  viewer: PortalViewer;
  clientId: string;
  project: ClientProject;
  invoice: ClientInvoice;
  document: ClientDocument;
  thread: MessageThread;
  ticket?: SupportTicket;
  highlight: DemoHighlight;
}) {
  const store = useOperationsPortalStore();
  const isClient = viewer.role === "client";
  const visibleMessages = thread.messages.slice(-3);

  return (
    <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]" aria-label={label}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4 dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">{label}</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{isClient ? getClientName(store, clientId) : "Operations Hub"}</h2>
        </div>
        <span className="rounded-sm bg-secondary/45 px-2 py-1 text-xs font-semibold text-primary dark:bg-secondary/15 dark:text-[#edf0ce]">
          {isClient ? "Client-scoped data only" : "All clients + admin controls"}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <PresenterCard title={isClient ? "Invoice visible to client" : "Invoice editor"} icon={ReceiptText} active={highlight === "invoice"}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink dark:text-cream">{invoice.number}</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{money(invoiceTotal(invoice))} due {invoice.dueDate}</p>
            </div>
            <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(invoice.status)}`}>{statusLabel(invoice.status)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground dark:text-white/58">{isClient ? "The same invoice becomes payable here as soon as staff issues it." : "Staff can issue this invoice; payment from the portal updates this editor."}</p>
        </PresenterCard>

        <PresenterCard title={isClient ? "Document for e-signature" : "Document delivery"} icon={FileSignature} active={highlight === "document"}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink dark:text-cream">{document.title}</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">Updated {document.updatedAt}</p>
            </div>
            <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(document.status)}`}>{statusLabel(document.status)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground dark:text-white/58">{isClient ? "Clients only see documents shared with them, plus e-sign status." : "Staff pushes the document; signature status rolls back into the back office."}</p>
        </PresenterCard>

        <PresenterCard title={isClient ? "Project status" : "Project/job status"} icon={FolderKanban} active={highlight === "project"}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink dark:text-cream">{project.name}</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{project.nextMilestone}</p>
            </div>
            <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(project.status)}`}>{project.status}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground dark:text-white/58">{isClient ? "The customer sees progress without internal staff tooling." : "Staff status changes publish to the portal instantly."}</p>
        </PresenterCard>

        <PresenterCard title={isClient ? "Conversation with your team" : "Client inbox"} icon={MessageSquareText} active={highlight === "message"}>
          <p className="font-semibold text-ink dark:text-cream">{thread.subject}</p>
          <div className="mt-3 grid gap-2" aria-live="polite">
            {visibleMessages.map((message) => (
              <div key={message.id} className={`rounded-sm px-3 py-2 ${message.authorRole === "client" ? "bg-secondary/30 dark:bg-[#243820]" : "bg-cream/75 dark:bg-[#1b2d21]"}`}>
                <p className="text-xs font-semibold text-ink dark:text-cream">{message.authorName}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-white/62">{message.body}</p>
              </div>
            ))}
          </div>
        </PresenterCard>

        {ticket ? (
          <PresenterCard title={isClient ? "Support ticket" : "Ticket queue"} icon={Ticket} active={highlight === "ticket"}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink dark:text-cream">{ticket.subject}</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">Last update {ticket.lastUpdate}</p>
              </div>
              <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.status)}`}>{statusLabel(ticket.status)}</span>
            </div>
          </PresenterCard>
        ) : null}
      </div>
    </section>
  );
}

function PresenterCard({ title, icon: Icon, active, children }: { title: string; icon: typeof LayoutDashboard; active: boolean; children: React.ReactNode }) {
  return (
    <article className={`rounded-md border border-border bg-cream/55 p-4 transition dark:border-white/10 dark:bg-[#0f1a14] ${highlightClass(active)}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary dark:text-secondary" />
        <h3 className="text-sm font-semibold text-ink dark:text-cream">{title}</h3>
      </div>
      {children}
    </article>
  );
}

function ClientPortalWorkspace({
  clientId,
  project,
  invoice,
  document,
  thread,
  ticket,
  projects,
  invoices,
  documents,
  threads,
  tickets
}: {
  clientId: string;
  project?: ClientProject;
  invoice?: ClientInvoice;
  document?: ClientDocument;
  thread?: MessageThread;
  ticket?: SupportTicket;
  projects: ClientProject[];
  invoices: ClientInvoice[];
  documents: ClientDocument[];
  threads: MessageThread[];
  tickets: SupportTicket[];
}) {
  const store = useOperationsPortalStore();
  if (store.activePage === "dashboard") return <ClientDashboardPanel clientId={clientId} project={project} invoice={invoice} document={document} thread={thread} ticket={ticket} />;
  if (store.activePage === "projects") return <ClientProjectsPortal projects={projects} selectedProject={project} />;
  if (store.activePage === "invoices") return <ClientInvoicesPortal invoices={invoices} selectedInvoice={invoice} />;
  if (store.activePage === "documents") return <ClientDocumentsPortal documents={documents} selectedDocument={document} />;
  if (store.activePage === "messages") return <ClientMessagesPortal threads={threads} selectedThread={thread} />;
  if (store.activePage === "tickets") return <ClientTicketsPortal tickets={tickets} selectedTicket={ticket} />;
  return <ClientDashboardPanel clientId={clientId} project={project} invoice={invoice} document={document} thread={thread} ticket={ticket} />;
}

function OperationsWorkspace() {
  const store = useOperationsPortalStore();
  const admin = isOperationsAdmin(store.viewer);

  if (store.activePage === "dashboard") return <ExecutiveDashboardPanel scope={resourceScope(store.viewer, "dashboard")} />;
  if (store.activePage === "action-center") return <ExecutiveDashboardPanel scope={resourceScope(store.viewer, "dashboard")} />;
  if (store.activePage === "timekeeping" || store.activePage === "my-timekeeping") return <TimeClockPanel scope={resourceScope(store.viewer, "timekeeping")} />;
  if (store.activePage === "scheduling" || store.activePage === "my-schedule") return <ScheduleCalendarPanel scope={resourceScope(store.viewer, "scheduling")} />;
  if (store.activePage === "billing") return can(store.viewer, "manageBilling") ? <BillingDashboardPanel /> : <StaffNoAccess label="Invoicing & Billing" />;
  if (store.activePage === "hr") return <PeopleHubPanel scope={resourceScope(store.viewer, "hr")} />;
  if (store.activePage === "profile") return <ProfilePanel scope={resourceScope(store.viewer, "profile")} />;
  if (store.activePage === "time-off") return <MyTimeOffPanel scope={resourceScope(store.viewer, "timeOff")} />;
  if (store.activePage === "documents") return <FileLibraryPanel scope={resourceScope(store.viewer, "documents")} />;
  if (store.activePage === "ticketing") return <TicketBoardPanel scope={resourceScope(store.viewer, "ticketing")} />;
  if (store.activePage === "chat") return <MessagingAppPanel scope={resourceScope(store.viewer, "chat")} />;
  if (store.activePage === "lms") return <LearningPortalPanel scope={resourceScope(store.viewer, "lms")} />;
  if (store.activePage === "knowledge") return <HelpCenterPanel admin={admin} />;
  if (store.activePage === "company-home") return <IntranetFeedPanel admin={admin} />;
  if (store.activePage === "client-back-office") return can(store.viewer, "manageClientBackOffice") ? <ClientManagementPanel /> : <StaffNoAccess label="Client Back-Office" />;
  if (store.activePage === "settings") return can(store.viewer, "manageSettings") ? <SettingsLayoutPanel /> : <StaffNoAccess label="Settings" />;
  return <ExecutiveDashboardPanel scope={resourceScope(store.viewer, "dashboard")} />;
}

function currentEmployeeId(viewer: PortalViewer) {
  if (viewer.role === "manager") return "employee-marcus";
  if (viewer.role === "owner") return "employee-dale";
  if (viewer.role === "admin") return "employee-carol";
  return "employee-jamal";
}

function employeeName(employeeId: string) {
  const store = useOperationsPortalStore.getState();
  return store.employees.find((employee) => employee.id === employeeId)?.name ?? "Employee";
}

function scopeLabel(scope: PermissionScope) {
  if (scope === "all") return "Admin";
  if (scope === "team") return "Manager";
  if (scope === "self") return "Staff";
  return "No access";
}

function ActionCenterPanel() {
  const store = useOperationsPortalStore();
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = isOperationsAdmin(store.viewer);
  const pendingPto = store.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId));
  const pendingTime = store.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId));
  const pendingSwaps = store.shifts.filter((shift) => shift.status === "swap_requested" && shift.employeeId && scopedIds.includes(shift.employeeId));
  const tickets = store.tickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed" && scopedIds.includes(ticket.assigneeId)).slice(0, 8);
  const overdueTraining = store.training.filter((item) => item.status === "overdue" && scopedIds.includes(item.employeeId)).slice(0, 8);
  const overdueInvoices = admin ? store.invoices.filter((invoice) => invoice.status === "overdue").slice(0, 8) : [];
  const clientThreads = admin ? store.threads.filter((thread) => thread.messages.at(-1)?.authorRole === "client").slice(0, 8) : [];

  return (
    <RolePanel eyebrow="Needs your attention" title={admin ? "Company-wide approvals and follow-ups" : "Team approvals and follow-ups"} icon={ClipboardList}>
      <div className="grid gap-3">
        {pendingPto.map((request) => (
          <ActionRow key={request.id} label={`PTO · ${employeeName(request.employeeId)} · ${request.dates}`} value={`${request.hours}h · ${request.type}`}>
            <SmallAction onClick={() => store.approvePtoRequest(request.id)}>Approve</SmallAction>
            <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); }}>Deny</SmallAction>
          </ActionRow>
        ))}
        {pendingTime.map((entry) => (
          <ActionRow key={entry.id} label={`${entry.status === "needs_correction" ? "Correction" : "Timesheet"} · ${employeeName(entry.employeeId)} · ${entry.date}`} value={`${entry.hours}h${entry.correctedHours ? ` → ${entry.correctedHours}h` : ""}`}>
            <SmallAction onClick={() => store.approveTimeEntry(entry.id)}>Approve</SmallAction>
            {entry.status === "needs_correction" ? <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny correction"); if (reason) store.denyTimeCorrection(entry.id, reason); }}>Deny</SmallAction> : null}
          </ActionRow>
        ))}
        {pendingSwaps.map((shift) => (
          <ActionRow key={shift.id} label={`Swap · ${shift.employeeId ? employeeName(shift.employeeId) : "Open"} · ${shift.day}`} value={`${shift.site} · with ${shift.swapWithEmployeeId ? employeeName(shift.swapWithEmployeeId) : "unassigned"}`}>
            <SmallAction onClick={() => store.approveShiftSwap(shift.id)}>Approve</SmallAction>
            <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(shift.id, reason); }}>Deny</SmallAction>
          </ActionRow>
        ))}
        {tickets.map((ticket) => (
          <ActionRow key={ticket.id} label={`Ticket · ${employeeName(ticket.assigneeId)} · ${ticket.priority}`} value={`${ticket.subject} · ${statusLabel(ticket.status)}`}>
            {ticket.status === "resolved" ? <SmallAction variant="danger" onClick={() => { if (window.confirm("Close this ticket?")) store.updateTicket(ticket.id, { status: "closed" }, "Ticket closed from action center."); }}>Close</SmallAction> : <SmallAction onClick={() => store.updateTicket(ticket.id, { status: ticket.status === "open" ? "waiting_on_client" : "resolved" }, "Updated from action center.")}>{ticket.status === "open" ? "Advance" : "Resolve"}</SmallAction>}
          </ActionRow>
        ))}
        {overdueTraining.map((item) => (
          <ActionRow key={item.id} label={`LMS overdue · ${employeeName(item.employeeId)}`} value={item.course}>
            <SmallAction onClick={() => store.assignCourse([item.employeeId], item.courseId)}>Reassign</SmallAction>
            <SmallAction variant="danger" onClick={() => { if (window.confirm("Remove this training assignment?")) store.removeTrainingAssignment(item.id); }}>Remove</SmallAction>
          </ActionRow>
        ))}
        {overdueInvoices.map((invoice) => (
          <ActionRow key={invoice.id} label={`Overdue invoice · ${invoice.number}`} value={`${getClientName(store, invoice.clientId)} · ${money(invoiceTotal(invoice))}`}>
            <SmallAction onClick={() => store.markInvoicePaid(invoice.id)}>Mark paid</SmallAction>
          </ActionRow>
        ))}
        {clientThreads.map((thread) => (
          <ActionRow key={thread.id} label={`Client reply needed · ${getClientName(store, thread.clientId)}`} value={thread.subject}>
            <SmallAction onClick={() => store.sendMessage(thread.id, "Thanks, we have this and will follow up with the next step shortly.", { role: "admin" })}>Reply</SmallAction>
          </ActionRow>
        ))}
      </div>
    </RolePanel>
  );
}

function OperationsDashboardPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const myId = currentEmployeeId(store.viewer);
  const scopedEntries = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId));
  const scopedTasks = store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done");
  const scopedTraining = store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "complete");
  const scopedPto = store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "pending");
  const myHours = store.timeEntries.filter((entry) => entry.employeeId === myId).reduce((sum, entry) => sum + entry.hours, 0);
  const revenue = store.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const ar = store.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const openTasks = admin ? store.tasks.filter((task) => task.status !== "done") : scopedTasks;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">{scopeLabel(scope)} dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{admin ? "Company-wide operating snapshot" : manager ? "Marcus's Field Operations snapshot" : "Jamal's personal work snapshot"}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {admin ? (
            <>
              <MetricTile label="Revenue collected" value={money(revenue)} />
              <MetricTile label="Accounts receivable" value={money(ar)} />
              <MetricTile label="Team hours today" value={`${store.timeEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}h`} />
              <MetricTile label="Utilization" value="82%" />
            </>
          ) : manager ? (
            <>
              <MetricTile label="Team hours today" value={`${scopedEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}h`} />
              <MetricTile label="Team utilization" value="78%" />
              <MetricTile label="PTO coverage" value={`${scopedPto.length} pending`} />
              <MetricTile label="Open team tasks" value={String(scopedTasks.length)} />
            </>
          ) : (
            <>
              <MetricTile label="My hours this period" value={`${myHours.toFixed(1)}h`} />
              <MetricTile label="Next shift" value={store.shifts.find((shift) => shift.employeeId === myId)?.time ?? "No shift"} />
              <MetricTile label="Open tasks" value={String(openTasks.length)} />
              <MetricTile label="Training due" value={String(scopedTraining.length)} />
            </>
          )}
        </div>
      </section>
      <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">{admin ? "Management actions" : manager ? "Team focus" : "Today"}</p>
        <div className="mt-4 grid gap-3">
          {openTasks.slice(0, 4).map((task) => <InfoRow key={task.id} label={scope === "self" ? task.source : employeeName(task.employeeId)} value={task.title} />)}
        </div>
      </section>
    </div>
  );
}

function TimekeepingPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const rows = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId));
  return (
    <RolePanel eyebrow={admin ? "Timekeeping" : manager ? "Team Timekeeping" : "My Timekeeping"} title={admin ? "All timesheets and correction queue" : manager ? "Reports' timesheets and correction queue" : "Shift clock, my hours, and corrections"} icon={Clock3}>
      <div className="grid gap-3">
        {scope === "self" ? <button className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]"><Clock3 className="h-4 w-4" /> Clock in/out</button> : null}
        {rows.map((entry) => (
          <ActionRow key={entry.id} label={`${scope === "self" ? "Me" : employeeName(entry.employeeId)} · ${entry.date}`} value={`${entry.hours}h${entry.correctedHours ? ` → ${entry.correctedHours}h` : ""} · ${statusLabel(entry.status)}${entry.resolvedAt ? ` · ${entry.resolvedAt}` : ""}`}>
            {scope === "all" || scope === "team" ? (
              <>
                {entry.status !== "approved" ? <SmallAction onClick={() => store.approveTimeEntry(entry.id)}>Approve</SmallAction> : null}
                {entry.status === "needs_correction" ? <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny correction"); if (reason) store.denyTimeCorrection(entry.id, reason); }}>Deny</SmallAction> : null}
              </>
            ) : <SmallAction variant="quiet" onClick={() => undefined}>Request correction</SmallAction>}
          </ActionRow>
        ))}
      </div>
    </RolePanel>
  );
}

function SchedulingPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const rows = store.shifts.filter((shift) => shift.status === "open" || (shift.employeeId ? scopedIds.includes(shift.employeeId) : false));
  return (
    <RolePanel eyebrow={admin ? "Scheduling" : manager ? "Team Schedule" : "My Schedule"} title={admin ? "Build and publish the company schedule" : manager ? "Build and publish schedules for direct reports" : "My published shifts and swap requests"} icon={CalendarDays}>
      <div className="grid gap-3">
        {rows.map((shift) => (
          <ActionRow key={shift.id} label={`${scope === "self" ? shift.day : shift.employeeId ? employeeName(shift.employeeId) : "Open shift"} · ${shift.site}`} value={`${shift.time} · ${statusLabel(shift.status)}${shift.swapWithEmployeeId ? ` · swap with ${employeeName(shift.swapWithEmployeeId)}` : ""}${shift.resolvedAt ? ` · ${shift.resolvedAt}` : ""}`}>
            {(scope === "all" || scope === "team") && shift.status === "swap_requested" ? (
              <>
                <SmallAction onClick={() => store.approveShiftSwap(shift.id)}>Approve</SmallAction>
                <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(shift.id, reason); }}>Deny</SmallAction>
              </>
            ) : null}
          </ActionRow>
        ))}
        {scope === "all" || scope === "team" ? <button className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Publish scoped schedule</button> : <button className="inline-flex h-11 w-fit rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">Request swap / availability change</button>}
      </div>
    </RolePanel>
  );
}

function BillingPanel() {
  const store = useOperationsPortalStore();
  const overdue = store.invoices.filter((invoice) => invoice.status === "overdue");
  const paid = store.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  return (
    <RolePanel eyebrow="Invoicing & Billing" title="Create, edit, send, and collect invoices" icon={ReceiptText}>
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile label="Invoices seeded" value={String(store.invoices.length)} />
          <MetricTile label="Revenue collected" value={money(paid)} />
          <MetricTile label="Overdue follow-ups" value={String(overdue.length)} />
        </div>
        {store.invoices.slice(0, 18).map((invoice) => (
          <ActionRow key={invoice.id} label={`${invoice.number} · ${getClientName(store, invoice.clientId)}`} value={`${money(invoiceTotal(invoice))} · ${statusLabel(invoice.status)} · ${invoice.dueDate}`}>
            {invoice.status === "draft" ? <SmallAction onClick={() => store.markInvoiceSent(invoice.id)}>Mark sent</SmallAction> : null}
            {invoice.status !== "paid" ? <SmallAction onClick={() => store.markInvoicePaid(invoice.id)}>Mark paid</SmallAction> : null}
            <SmallAction variant="quiet" onClick={() => { const next = Number(window.prompt("New amount for first line item", String(invoice.lineItems[0]?.amount ?? 0))); if (Number.isFinite(next)) store.updateInvoiceLineItem(invoice.id, 0, next); }}>Edit line</SmallAction>
          </ActionRow>
        ))}
        <button className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Create invoice</button>
      </div>
    </RolePanel>
  );
}

function HrPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const myId = currentEmployeeId(store.viewer);
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const ptoRows = store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId));
  const onboarding = store.onboardingTasks.filter((task) => scopedIds.includes(task.employeeId));
  return (
    <RolePanel eyebrow={admin ? "HR" : manager ? "Team PTO" : "My Time Off"} title={admin ? "PTO approvals, onboarding, directory, and roles" : manager ? "Approve PTO and review balances for direct reports" : "My PTO requests and balances"} icon={UsersRound}>
      <div className="grid gap-3">
        {(admin || manager) ? store.employees.filter((item) => scopedIds.includes(item.id)).slice(0, 12).map((item) => <InfoRow key={item.id} label={`${item.name} · ${item.department}`} value={`${item.ptoBalance}h PTO · ${statusLabel(item.status)}`} />) : null}
        {ptoRows.map((request) => (
          <ActionRow key={request.id} label={`${scope === "self" ? "My request" : employeeName(request.employeeId)} · ${request.dates}`} value={`${statusLabel(request.status)} · ${request.type} · ${request.hours}h${request.resolvedAt ? ` · ${request.resolvedAt}` : ""}${request.resolutionNote ? ` · ${request.resolutionNote}` : ""}`}>
            {(admin || manager) && request.status === "pending" ? (
              <>
                <SmallAction onClick={() => store.approvePtoRequest(request.id)}>Approve</SmallAction>
                <SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); }}>Deny</SmallAction>
              </>
            ) : null}
          </ActionRow>
        ))}
        {onboarding.map((task) => (
          <ActionRow key={task.id} label={`Onboarding · ${employeeName(task.employeeId)}`} value={`${task.title} · ${statusLabel(task.status)}`}>
            {(admin || manager) && task.status !== "done" ? <SmallAction onClick={() => store.completeOnboardingTask(task.id)}>Check off</SmallAction> : null}
          </ActionRow>
        ))}
      </div>
    </RolePanel>
  );
}

function ProfilePanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const employee = store.employees.find((item) => item.id === currentEmployeeId(store.viewer)) ?? store.employees[0];
  const manager = employee.managerId ? store.employees.find((item) => item.id === employee.managerId) : undefined;
  const reports = store.employees.filter((item) => item.managerId === employee.id);
  return (
    <RolePanel eyebrow="My Profile" title={`${employee.name} · ${employee.title}`} icon={UserRound}>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-md border border-border bg-cream/70 p-5 dark:border-white/10 dark:bg-white/8">
          <div className="grid h-20 w-20 place-items-center rounded-md bg-primary text-2xl font-semibold text-white dark:bg-secondary dark:text-[#101a14]">{employee.avatar}</div>
          <p className="mt-4 font-semibold text-ink dark:text-cream">{employee.email}</p>
          <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{employee.phone}</p>
        </div>
        <div className="grid gap-3">
          <InfoRow label="Team" value={`${employee.department} · ${employee.location}`} />
          <InfoRow label="Manager" value={manager?.name ?? "No manager"} />
          <InfoRow label="Employment" value={`${statusLabel(employee.status)} · hired ${employee.hireDate}`} />
          <InfoRow label="Emergency contact" value={employee.emergencyContact} />
          <InfoRow label="Notification preferences" value="Email summaries, urgent SMS, client reply alerts" />
          {scope === "self" ? <button className="inline-flex h-11 w-fit rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">Edit personal fields</button> : null}
          {reports.length ? <InfoRow label="Direct reports" value={reports.map((item) => item.name).join(", ")} /> : null}
        </div>
      </div>
    </RolePanel>
  );
}

function TimeOffPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const employee = store.employees.find((item) => item.id === currentEmployeeId(store.viewer)) ?? store.employees[0];
  const requests = store.ptoRequests.filter((request) => request.employeeId === employee.id);
  return (
    <RolePanel eyebrow="My Time Off" title="Balances, requests, and upcoming approved time away" icon={CalendarDays}>
      <div className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile label="Accrued" value={`${employee.ptoAccrued}h`} />
          <MetricTile label="Used" value={`${employee.ptoUsed}h`} />
          <MetricTile label="Remaining" value={`${employee.ptoBalance}h`} />
        </div>
        <div className="grid gap-3">
          {requests.map((request) => <InfoRow key={request.id} label={`${request.dates} · ${request.type}`} value={`${statusLabel(request.status)}${request.notification ? ` · ${request.notification}` : ""}`} />)}
          <label className="grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">Request dates
            <input className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Next Friday, 8 hours" />
          </label>
          <button className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Submit time off request</button>
        </div>
        <p className="rounded-md bg-cream/70 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/8 dark:text-white/68">Upcoming calendar is fed from approved PTO in the shared seed, so Company Home and HR stay in sync.</p>
      </div>
    </RolePanel>
  );
}

function OperationsDocumentsPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const docs = admin ? store.documents : store.documents.filter((document) => document.status !== "draft");
  return (
    <RolePanel eyebrow="Documents" title={admin ? "Templates, branded documents, and client e-sign delivery" : "Shared documents and templates I can use"} icon={FileSignature}>
      <div className="grid gap-3">
        {store.documentTemplates.map((template) => <InfoRow key={template.id} label={`Template · ${template.title}`} value={`${template.category} · updated ${template.updatedAt}`} />)}
        {docs.map((document) => <InfoRow key={document.id} label={document.title} value={admin ? `${getClientName(store, document.clientId)} · ${statusLabel(document.status)}` : statusLabel(document.status)} />)}
        {admin ? <button className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Create / push document</button> : null}
      </div>
    </RolePanel>
  );
}

function OperationsTicketingPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const tasks = store.tasks.filter((task) => scopedIds.includes(task.employeeId));
  const tickets = admin ? store.tickets : store.tickets.filter((ticket) => scopedIds.includes(ticket.assigneeId));
  return (
    <RolePanel eyebrow={admin ? "Ticketing" : manager ? "Team Tasks" : "My Tasks/Tickets"} title={admin ? "Full queue, triage, assignment, and client-originated tickets" : manager ? "Team queue, assignment, and report-owned tickets" : "Tickets assigned to me and tickets I open"} icon={Ticket}>
      <div className="grid gap-3">
        {tasks.map((task) => <InfoRow key={task.id} label={`${scope === "self" ? task.source : employeeName(task.employeeId)} · ${statusLabel(task.status)}`} value={task.title} />)}
        {tickets.slice(0, 12).map((ticket) => (
          <ActionRow key={ticket.id} label={`${ticket.source} · ${ticket.priority} · ${employeeName(ticket.assigneeId)}`} value={`${ticket.subject} · ${statusLabel(ticket.status)}`}>
            {(admin || manager) ? (
              <>
                {ticket.status === "resolved" ? <SmallAction variant="danger" onClick={() => { if (window.confirm("Close this ticket?")) store.updateTicket(ticket.id, { status: "closed" }, "Ticket closed from Operations Hub."); }}>Close</SmallAction> : <SmallAction onClick={() => store.updateTicket(ticket.id, { status: ticket.status === "open" ? "waiting_on_client" : "resolved" }, "Ticket updated from Operations Hub.")}>{ticket.status === "open" ? "Advance" : "Resolve"}</SmallAction>}
                <SmallAction variant="quiet" onClick={() => store.updateTicket(ticket.id, { priority: ticket.priority === "high" ? "normal" : "high" })}>{ticket.priority === "high" ? "Normal" : "High"}</SmallAction>
                <SmallAction variant="quiet" onClick={() => { const assigneeId = window.prompt("Assign to employee id", ticket.assigneeId); if (assigneeId) store.updateTicket(ticket.id, { assigneeId }); }}>Assign</SmallAction>
              </>
            ) : null}
          </ActionRow>
        ))}
        {scope === "self" ? <button className="inline-flex h-11 w-fit rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">Open internal ticket</button> : null}
      </div>
    </RolePanel>
  );
}

function InternalChatPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const myId = currentEmployeeId(store.viewer);
  const threads = scope === "all" ? store.chatThreads : store.chatThreads.filter((thread) => thread.type === "channel" || thread.memberIds.includes(myId));
  const [selectedId, setSelectedId] = useState(threads[0]?.id);
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  return (
    <TwoColumn
      list={threads.map((thread) => <RowButton key={thread.id} active={thread.id === selected?.id} title={thread.name} meta={`${thread.type} · ${thread.messages.length} messages`} onClick={() => setSelectedId(thread.id)} />)}
      detail={selected ? (
        <DetailShell eyebrow="Internal chat" title={selected.name} icon={MessageSquareText}>
          <div className="grid gap-3">
            {selected.messages.map((message) => (
              <div key={message.id} className="rounded-md bg-cream/75 p-3 dark:bg-[#1b2d21]">
                <p className="text-sm font-semibold text-ink dark:text-cream">{employeeName(message.employeeId)} <span className="font-normal text-muted-foreground dark:text-white/50">{message.at}</span></p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/68">{message.body}</p>
              </div>
            ))}
          </div>
        </DetailShell>
      ) : null}
    />
  );
}

function LmsPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const admin = scope === "all";
  const manager = scope === "team";
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const rows = store.training.filter((item) => scopedIds.includes(item.employeeId));
  const course = store.courseCatalog[0];
  return (
    <RolePanel eyebrow={admin ? "LMS" : manager ? "Team Training" : "My Training"} title={admin ? "Build, assign, and review completion" : manager ? "Assign courses and review completion for direct reports" : "Assigned courses and my certificates"} icon={BookOpenCheck}>
      <div className="grid gap-3">
        <div className="rounded-md border border-border bg-cream/70 p-4 dark:border-white/10 dark:bg-white/8">
          <p className="font-semibold text-ink dark:text-cream">{course.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/66">{course.description}</p>
          <div className="mt-3 grid gap-2">{course.lessons.map((lesson) => <InfoRow key={lesson.title} label={lesson.title} value={lesson.body} />)}</div>
          <p className="mt-3 text-sm font-semibold text-primary dark:text-secondary">{course.quiz}</p>
        </div>
        {rows.filter((item) => item.status !== "removed").map((item) => (
          <ActionRow key={item.id} label={`${scope === "self" ? "Due " + item.due : employeeName(item.employeeId)} · ${item.due}`} value={`${item.course} · ${statusLabel(item.status)} · ${item.progress}%`}>
            {(admin || manager) ? <SmallAction variant="danger" onClick={() => { if (window.confirm("Remove this LMS assignment?")) store.removeTrainingAssignment(item.id); }}>Remove</SmallAction> : null}
          </ActionRow>
        ))}
        {admin || manager ? <button onClick={() => store.assignCourse(scopedIds, course.id)} className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Assign {manager ? "team" : "scoped"} course</button> : null}
      </div>
    </RolePanel>
  );
}

function KnowledgePanel({ admin }: { admin: boolean }) {
  const store = useOperationsPortalStore();
  const [query, setQuery] = useState("");
  const articles = store.knowledgeArticles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <RolePanel eyebrow="Knowledge Base" title={admin ? "Create, edit, and publish SOPs" : "Read SOPs and operating playbooks"} icon={FileText}>
      <div className="grid gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Search SOPs" />
        {articles.map((article) => <InfoRow key={article.id} label={`${article.category} · ${employeeName(article.authorId)} · ${article.updatedAt}`} value={article.title} />)}
        {admin ? <button className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Create article</button> : null}
      </div>
    </RolePanel>
  );
}

function CompanyHomePanel({ admin }: { admin: boolean }) {
  const store = useOperationsPortalStore();
  const approvedPto = store.ptoRequests.filter((request) => request.status === "approved").slice(0, 5);
  return (
    <RolePanel eyebrow="Company Home" title={admin ? "Post announcements, quick links, and directory updates" : "Announcements, quick links, and directory"} icon={Home}>
      <div className="grid gap-3">
        {store.announcements.map((announcement) => (
          <ActionRow key={announcement.id} label={`${employeeName(announcement.authorId)} · ${announcement.at}`} value={`${announcement.title} · ${announcement.body}`}>
            {admin ? (
              <>
                <SmallAction variant="quiet" onClick={() => { const body = window.prompt("Edit announcement body", announcement.body); if (body) store.editAnnouncement(announcement.id, body); }}>Edit</SmallAction>
                <SmallAction variant="danger" onClick={() => { if (window.confirm("Remove this announcement?")) store.removeAnnouncement(announcement.id); }}>Remove</SmallAction>
              </>
            ) : null}
          </ActionRow>
        ))}
        {store.quickLinks.map((link) => <InfoRow key={link.label} label="Quick link" value={link.label} />)}
        {store.events.map((event) => <InfoRow key={event.id} label="Upcoming event" value={`${event.title} · ${event.at}`} />)}
        {approvedPto.map((request) => <InfoRow key={request.id} label="Who's out" value={`${employeeName(request.employeeId)} · ${request.dates}`} />)}
        {admin ? <button onClick={() => { const title = window.prompt("Announcement title"); const body = title ? window.prompt("Announcement body") : ""; if (title && body) store.postAnnouncement(title, body); }} className="inline-flex h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">Post announcement</button> : null}
      </div>
    </RolePanel>
  );
}

function ClientBackOfficePanel() {
  const store = useOperationsPortalStore();
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <ClientsPanel selectedClientId={store.selectedClientId} />
    </div>
  );
}

function SettingsPanel() {
  return (
    <RolePanel eyebrow="Settings" title="Business, roles, modules, and portal configuration" icon={Settings}>
      <div className="grid gap-3">
        <InfoRow label="Role policy" value="Owner/Admin manage everything; managers get scoped team operations" />
        <InfoRow label="Client Portal" value="Enabled for selected client packages" />
        <InfoRow label="Module toggles" value="Role gates apply after module visibility" />
      </div>
    </RolePanel>
  );
}

function StaffNoAccess({ label }: { label: string }) {
  return (
    <RolePanel eyebrow="Scoped access" title={`${label} is admin-only`} icon={Settings}>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground dark:text-white/66">Staff viewers are scoped to their own work. Managers are scoped to direct reports. Neither role can access finances, non-report employee data, client back-office tools, or settings.</p>
    </RolePanel>
  );
}

function ExecutiveDashboardPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = scope === "all";
  const manager = scope === "team";
  const entries = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId));
  const paid = store.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const receivable = store.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const recent = [
    ...store.threads.map((thread) => ({ id: thread.id, label: getClientName(store, thread.clientId), value: thread.messages.at(-1)?.body ?? thread.subject, page: "client-back-office" as PortalPage })),
    ...store.tickets.slice(0, 4).map((ticket) => ({ id: ticket.id, label: ticket.source === "client" ? "Client ticket" : "Internal ticket", value: ticket.subject, page: "ticketing" as PortalPage }))
  ].slice(0, 6);

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-md bg-primary p-5 text-white dark:bg-[#253629]">
          <p className="text-sm font-semibold text-secondary">{scopeLabel(scope)} executive overview</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-cream">{admin ? "Company health across revenue, work, and follow-ups." : manager ? "Team performance and coverage for direct reports." : "My day, hours, training, and active work."}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Today", "This week", "Pay period"].map((label) => <button key={label} className="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-white/78 hover:bg-white/10">{label}</button>)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Clickthroughs</p>
          <div className="mt-4 grid gap-2">
            <SmallAction onClick={() => store.setActivePage(scope === "self" ? "my-timekeeping" : "timekeeping")}>Open timekeeping</SmallAction>
            {admin ? <SmallAction variant="quiet" onClick={() => store.setActivePage("billing")}>Open billing</SmallAction> : null}
            <SmallAction variant="quiet" onClick={() => store.setActivePage("ticketing")}>Open tickets</SmallAction>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile label={admin ? "Revenue collected" : "Hours this period"} value={admin ? money(paid) : `${entries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}h`} />
        <MetricTile label={admin ? "Accounts receivable" : "Open tasks"} value={admin ? money(receivable) : String(store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done").length)} />
        <MetricTile label="Utilization" value={scope === "self" ? "76%" : scope === "team" ? "78%" : "82%"} />
        <MetricTile label="Operations health" value={scope === "self" ? "On track" : "Stable"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_360px]">
        <ChartPanel title="Revenue trend" bars={[62, 48, 72, 68, 86, 74]} labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
        <ChartPanel title="AR aging" bars={[80, 54, 32, 18]} labels={["0-15", "16-30", "31-60", "60+"]} />
        <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Recent activity</p>
          <div className="mt-4 grid gap-3">
            {recent.map((item) => (
              <button key={item.id} onClick={() => store.setActivePage(item.page)} className="rounded-sm bg-cream/70 p-3 text-left hover:bg-secondary/25 dark:bg-white/8">
                <p className="text-sm font-semibold text-ink dark:text-cream">{item.label}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground dark:text-white/62">{item.value}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function TriageInboxPanel() {
  const store = useOperationsPortalStore();
  const [filter, setFilter] = useState("all");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = isOperationsAdmin(store.viewer);
  const items = [
    ...store.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId)).map((request) => ({ id: request.id, type: "PTO", title: employeeName(request.employeeId), meta: `${request.dates} · ${request.hours}h ${request.type}`, approve: () => store.approvePtoRequest(request.id), deny: () => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); } })),
    ...store.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId)).map((entry) => ({ id: entry.id, type: entry.status === "needs_correction" ? "Correction" : "Timesheet", title: employeeName(entry.employeeId), meta: `${entry.date} · ${entry.hours}h${entry.correctedHours ? ` -> ${entry.correctedHours}h` : ""}`, approve: () => store.approveTimeEntry(entry.id), deny: entry.status === "needs_correction" ? () => { const reason = denyReason("Deny correction"); if (reason) store.denyTimeCorrection(entry.id, reason); } : undefined })),
    ...store.shifts.filter((shift) => shift.status === "swap_requested" && shift.employeeId && scopedIds.includes(shift.employeeId)).map((shift) => ({ id: shift.id, type: "Shift swap", title: employeeName(shift.employeeId!), meta: `${shift.day} · ${shift.site} · ${shift.swapWithEmployeeId ? employeeName(shift.swapWithEmployeeId) : "open"}`, approve: () => store.approveShiftSwap(shift.id), deny: () => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(shift.id, reason); } })),
    ...(admin ? store.invoices.filter((invoice) => invoice.status === "overdue").map((invoice) => ({ id: invoice.id, type: "Invoice", title: invoice.number, meta: `${getClientName(store, invoice.clientId)} · ${money(invoiceTotal(invoice))}`, approve: () => store.markInvoicePaid(invoice.id), deny: undefined })) : []),
    ...(admin ? store.threads.filter((thread) => thread.messages.at(-1)?.authorRole === "client").map((thread) => ({ id: thread.id, type: "Client message", title: getClientName(store, thread.clientId), meta: thread.subject, approve: () => store.sendMessage(thread.id, "Thanks, we have this and will follow up with the next step shortly.", { role: "admin" }), deny: undefined })) : [])
  ];
  const visible = filter === "all" ? items : items.filter((item) => item.type === filter);
  const groups = Array.from(new Set(items.map((item) => item.type)));

  return (
    <section className="grid gap-5 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">Triage inbox</p>
        <button onClick={() => setFilter("all")} className={`mt-4 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold ${filter === "all" ? "bg-secondary/35 text-primary" : "hover:bg-cream dark:hover:bg-white/8"}`}><span>All items</span></button>
        {groups.map((group) => <button key={group} onClick={() => setFilter(group)} className={`mt-2 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold ${filter === group ? "bg-secondary/35 text-primary" : "hover:bg-cream dark:hover:bg-white/8"}`}><span>{group}</span></button>)}
      </aside>
      <div className="rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]">
        <div className="border-b border-border p-5 dark:border-white/10">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Notifications</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Scoped action queue</h2>
        </div>
        <div className="divide-y divide-border dark:divide-white/10">
          {visible.map((item) => (
            <article key={`${item.type}-${item.id}`} className="grid gap-3 p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
              <span className="w-fit rounded-sm bg-secondary/35 px-2 py-1 text-xs font-semibold text-primary dark:text-[#edf0ce]">{item.type}</span>
              <div>
                <p className="font-semibold text-ink dark:text-cream">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{item.meta}</p>
              </div>
              <div className="flex gap-2">
                <SmallAction onClick={item.approve}>{item.type === "Client message" ? "Reply" : item.type === "Invoice" ? "Mark paid" : "Approve"}</SmallAction>
                {item.deny ? <SmallAction variant="danger" onClick={item.deny}>Deny</SmallAction> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimeClockPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const self = scope === "self";
  const currentId = currentEmployeeId(store.viewer);
  const rows = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId)).slice(0, self ? 7 : 35);
  const current = store.timeEntries.find((entry) => entry.employeeId === currentId && entry.clockedIn);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="rounded-md bg-primary p-5 text-white dark:bg-[#253629]">
          <p className="text-sm font-semibold text-secondary">{self ? "Time clock" : "Team timekeeping"}</p>
          <h2 className="mt-4 text-5xl font-semibold text-cream">{current ? "Clocked in" : self ? "Ready" : `${rows.filter((entry) => entry.status !== "approved").length} to review`}</h2>
          <p className="mt-3 text-sm text-white/68">{current ? `${current.shift} · elapsed shift shown from live punch seed` : self ? "Clock in/out uses the shared timekeeping state." : "Approve timesheets and corrections in the grid."}</p>
          {self ? <button onClick={() => store.toggleClock(currentId)} className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-secondary px-4 text-sm font-semibold text-primary"><Clock3 className="h-4 w-4" /> {current ? "Clock out" : "Clock in"}</button> : null}
        </div>
        <div className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Today's punches</p>
          <div className="mt-4 grid gap-2">
            {rows.filter((entry) => entry.date === "Today").slice(0, 8).map((entry) => <InfoRow key={entry.id} label={employeeName(entry.employeeId)} value={`${entry.shift} · ${entry.hours}h · ${statusLabel(entry.status)}`} />)}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]">
        <div className="grid min-w-[760px] grid-cols-[180px_repeat(5,minmax(110px,1fr))_130px] border-b border-border bg-cream/60 text-sm font-semibold dark:border-white/10 dark:bg-white/8">
          <div className="p-3">Employee</div>{days.map((day) => <div key={day} className="p-3">{day}</div>)}<div className="p-3">Action</div>
        </div>
        <div className="overflow-x-auto">
          {(self ? [currentId] : scopedIds.slice(0, 10)).map((employeeId) => {
            const employeeRows = rows.filter((entry) => entry.employeeId === employeeId);
            return (
              <div key={employeeId} className="grid min-w-[760px] grid-cols-[180px_repeat(5,minmax(110px,1fr))_130px] border-b border-border last:border-b-0 dark:border-white/10">
                <div className="p-3 text-sm font-semibold text-ink dark:text-cream">{employeeName(employeeId)}</div>
                {days.map((day, index) => {
                  const entry = employeeRows[index] ?? employeeRows[0];
                  return <div key={day} className="p-3 text-sm text-muted-foreground dark:text-white/62">{entry ? `${entry.hours}h · ${statusLabel(entry.status)}` : "No punch"}</div>;
                })}
                <div className="p-3">{employeeRows.some((entry) => entry.status !== "approved") && !self ? <SmallAction onClick={() => employeeRows.filter((entry) => entry.status !== "approved").forEach((entry) => store.approveTimeEntry(entry.id))}>Approve</SmallAction> : self ? <SmallAction variant="quiet" onClick={() => window.alert("Correction request queued in demo mode.")}>Correct</SmallAction> : <span className="text-sm text-muted-foreground">Approved</span>}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ScheduleCalendarPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [view, setView] = useState<"week" | "month">("week");
  const [syncState, setSyncState] = useState<"loading" | "ready" | "error">("loading");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const canManageSchedule = scope === "all" || scope === "team";
  const employees = store.employees.filter((employee) => scopedIds.includes(employee.id)).slice(0, canManageSchedule ? 9 : 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  useEffect(() => {
    let active = true;
    setSyncState("loading");
    fetch("/api/operations-portal/scheduling")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load persisted schedule.")))
      .then((data: { shifts: StaffShift[] }) => {
        if (!active) return;
        store.setSchedulingCache(data.shifts);
        setSyncState("ready");
      })
      .catch(() => {
        if (!active) return;
        setSyncState("error");
      });
    return () => {
      active = false;
    };
  }, [store.viewer.role]);

  async function createShift(status: StaffShift["status"]) {
    const employeeId = status === "open" ? undefined : window.prompt("Employee id", employees[0]?.id ?? currentEmployeeId(store.viewer))?.trim();
    const day = window.prompt("Day", "Thu next week")?.trim();
    const time = window.prompt("Time", "9:00 AM - 3:00 PM")?.trim();
    const site = window.prompt("Site", "Cahaba Brewing Co.")?.trim();
    if (!day || !time || !site) return;
    const response = await fetch("/api/operations-portal/scheduling", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ employeeId, day, time, site, status })
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error ?? "Unable to create shift.");
      return;
    }
    store.upsertSchedulingShift(data.shift);
  }

  async function claimShift(shift: StaffShift, employeeId: string) {
    const response = await fetch("/api/operations-portal/scheduling", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shiftId: shift.id, employeeId })
    });
    const data = await response.json();
    if (response.ok) {
      store.upsertSchedulingShift(data.shift);
      return;
    }
    store.claimShift(shift.id, employeeId);
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">Scheduling calendar</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{canManageSchedule ? "Week grid by employee" : "My schedule and swaps"}</h2>
          <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{syncState === "ready" ? "Schedule is synced to Postgres." : syncState === "loading" ? "Loading persisted schedule..." : "Using local cache; schedule API unavailable."}</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`h-10 rounded-md px-3 text-sm font-semibold ${view === item ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{item}</button>)}
          {canManageSchedule ? <SmallAction onClick={() => createShift("published")}>New shift</SmallAction> : null}
          {canManageSchedule ? <SmallAction variant="quiet" onClick={() => createShift("open")}>Open shift</SmallAction> : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]">
        <div className="grid min-w-[820px] grid-cols-[180px_repeat(5,minmax(120px,1fr))] border-b border-border bg-cream/60 dark:border-white/10 dark:bg-white/8">
          <div className="p-3 text-sm font-semibold">Employee</div>{days.map((day) => <div key={day} className="p-3 text-sm font-semibold">{view === "week" ? day : `${day} · month`}</div>)}
        </div>
        {employees.map((employee) => (
          <div key={employee.id} className="grid min-w-[820px] grid-cols-[180px_repeat(5,minmax(120px,1fr))] border-b border-border last:border-b-0 dark:border-white/10">
            <div className="p-3 text-sm font-semibold text-ink dark:text-cream">{employee.name}</div>
            {days.map((day) => {
              const shift = store.shifts.find((item) => item.employeeId === employee.id && item.day.startsWith(day));
              return (
                <div key={day} className="min-h-24 p-2">
                  {shift ? (
                    <div className={`rounded-md border p-2 text-xs ${shift.status === "swap_requested" ? "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100" : "border-secondary/40 bg-secondary/20 text-primary dark:text-[#edf0ce]"}`}>
                      <p className="font-semibold">{shift.time}</p>
                      <p className="mt-1">{shift.site}</p>
                      {shift.status === "swap_requested" ? <div className="mt-2 flex gap-1">{canManageSchedule ? <><button onClick={() => store.approveShiftSwap(shift.id)} className="rounded bg-primary px-2 py-1 text-white">Approve</button><button onClick={() => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(shift.id, reason); }} className="rounded border border-red-300 px-2 py-1">Deny</button></> : <span>Swap requested</span>}</div> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {store.shifts.filter((shift) => shift.status === "open").map((shift) => <ActionRow key={shift.id} label={`Open shift · ${shift.day}`} value={`${shift.site} · ${shift.time}`}><SmallAction onClick={() => claimShift(shift, canManageSchedule ? employees[0]?.id ?? currentEmployeeId(store.viewer) : currentEmployeeId(store.viewer))}>{canManageSchedule ? "Assign" : "Claim"}</SmallAction></ActionRow>)}
      </div>
    </section>
  );
}

function BillingDashboardPanel() {
  const store = useOperationsPortalStore();
  const [selectedId, setSelectedId] = useState(store.selectedInvoiceId);
  const selected = store.invoices.find((invoice) => invoice.id === selectedId) ?? store.invoices[0];
  const outstanding = store.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const overdue = store.invoices.filter((invoice) => invoice.status === "overdue");
  const paid = store.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  return (
    <section className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3"><MetricTile label="Outstanding" value={money(outstanding)} /><MetricTile label="Overdue" value={`${overdue.length} · ${money(overdue.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0))}`} /><MetricTile label="Paid this period" value={money(paid)} /></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]">
          <div className="border-b border-border p-4 dark:border-white/10"><p className="text-sm font-semibold text-primary dark:text-secondary">Invoice table</p></div>
          <div className="divide-y divide-border dark:divide-white/10">
            {store.invoices.slice(0, 18).map((invoice) => <button key={invoice.id} onClick={() => setSelectedId(invoice.id)} className={`grid w-full gap-2 p-3 text-left md:grid-cols-[110px_1fr_120px_90px] ${invoice.id === selected.id ? "bg-secondary/20" : "hover:bg-cream/70 dark:hover:bg-white/8"}`}><span className="font-semibold">{invoice.number}</span><span>{getClientName(store, invoice.clientId)}</span><span>{money(invoiceTotal(invoice))}</span><span className={`w-fit rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(invoice.status)}`}>{statusLabel(invoice.status)}</span></button>)}
          </div>
        </div>
        <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Document preview</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{selected.number}</h2>
          <div className="mt-5 rounded-md border border-border bg-cream/55 p-4 dark:border-white/10 dark:bg-white/8"><InvoiceDetail invoice={selected} isClient={false} /></div>
          <SmallAction variant="quiet" onClick={() => window.alert("PDF generated from the selected invoice demo data.")}>Generate PDF</SmallAction>
        </section>
      </div>
    </section>
  );
}

function PeopleHubPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [tab, setTab] = useState<"people" | "timeoff" | "onboarding">("people");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const canApprove = scope === "all" || scope === "team";
  const people = store.employees.filter((employee) => scopedIds.includes(employee.id));
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary dark:text-secondary">People hub</p><h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Directory, Time Off, and onboarding</h2></div><div className="flex gap-2">{(["people", "timeoff", "onboarding"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`h-10 rounded-md px-3 text-sm font-semibold ${tab === item ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{item === "timeoff" ? "Time Off" : item}</button>)}</div></div>
      {tab === "people" ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{people.map((employee) => <article key={employee.id} className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><div className="grid h-12 w-12 place-items-center rounded-sm bg-primary text-sm font-semibold text-white dark:bg-secondary dark:text-[#101a14]">{employee.avatar}</div><p className="mt-4 font-semibold text-ink dark:text-cream">{employee.name}</p><p className="text-sm text-muted-foreground dark:text-white/62">{employee.title}</p><InfoRow label="PTO balance" value={`${employee.ptoBalance}h`} /></article>)}</div> : null}
      {tab === "timeoff" ? <div className="grid gap-3">{store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId)).map((request) => <ActionRow key={request.id} label={`${employeeName(request.employeeId)} · ${request.dates}`} value={`${statusLabel(request.status)} · ${request.hours}h · ${request.type}`}>{canApprove && request.status === "pending" ? <><SmallAction onClick={() => store.approvePtoRequest(request.id)}>Approve</SmallAction><SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); }}>Deny</SmallAction></> : null}</ActionRow>)}</div> : null}
      {tab === "onboarding" ? <OnboardingModule canAdmin={canApprove} /> : null}
    </section>
  );
}

type OnboardingOverview = {
  isDemo: boolean;
  instance: { id: string; employeeId: string; status: "not_started" | "in_progress" | "complete"; percent: number };
  employeeName: string;
  tasks: Array<{ id: string; key: string; title: string; type: string; position: number; required: boolean; config: Record<string, unknown>; status: string; data: Record<string, unknown>; completedAt: string | null }>;
  documents: Array<{ id: string; title: string; kind: "handbook" | "policy" | "video"; body: string | null; url: string | null; versionHash: string; requiresAck: boolean }>;
  employees: Array<{ employeeId: string; name: string; status: string; percent: number; outstanding: string[] }>;
};

function OnboardingModule({ canAdmin }: { canAdmin: boolean }) {
  const [overview, setOverview] = useState<OnboardingOverview | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedTask = overview?.tasks.find((task) => task.id === selectedTaskId) ?? overview?.tasks.find((task) => task.status !== "complete") ?? overview?.tasks[0];

  useEffect(() => {
    let active = true;
    fetch("/api/operations-portal/onboarding?employeeId=employee-nina")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load onboarding.")))
      .then((data: OnboardingOverview) => {
        if (!active) return;
        setOverview(data);
        setSelectedTaskId(data.tasks.find((task) => task.status !== "complete")?.id ?? data.tasks[0]?.id ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function saveTask(task: NonNullable<typeof selectedTask>, data: Record<string, unknown>, signature?: { kind: "typed" | "drawn"; value: string; docRef: string }) {
    setSaving(true);
    const response = await fetch("/api/operations-portal/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ employeeId: overview?.instance.employeeId, taskTemplateId: task.id, type: task.type, data, signature })
    });
    const next = await response.json();
    setSaving(false);
    if (!response.ok) {
      window.alert(next.error ?? "Unable to save onboarding step.");
      return;
    }
    setOverview(next);
    setSelectedTaskId(next.tasks.find((item: OnboardingOverview["tasks"][number]) => item.status !== "complete")?.id ?? task.id);
  }

  async function completeInstance() {
    if (!overview) return;
    const response = await fetch("/api/operations-portal/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "complete-instance", employeeId: overview.instance.employeeId })
    });
    const next = await response.json();
    if (response.ok) setOverview(next);
  }

  if (!overview) {
    return <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm text-muted-foreground dark:text-white/62">Loading persisted onboarding...</p></section>;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <aside className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">HR tracker</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-cream">{overview.employeeName}</h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream dark:bg-white/10"><div className="h-full bg-primary dark:bg-secondary" style={{ width: `${overview.instance.percent}%` }} /></div>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white/62">{overview.instance.percent}% complete · {statusLabel(overview.instance.status)}</p>
        <div className="mt-5 grid gap-2">
          {overview.tasks.map((task) => (
            <button key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`rounded-md p-3 text-left ${task.id === selectedTask?.id ? "bg-secondary/25 text-primary" : "bg-cream/70 text-ink hover:bg-secondary/15 dark:bg-white/8 dark:text-cream"}`}>
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{task.title}</span><span className={`rounded-sm px-2 py-0.5 text-xs ${task.status === "complete" ? "bg-green-50 text-green-700" : "bg-white/70 text-muted-foreground"}`}>{task.status === "complete" ? "Done" : task.required ? "Required" : "Optional"}</span></div>
            </button>
          ))}
        </div>
        {canAdmin ? <button onClick={completeInstance} className="mt-4 h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-white dark:bg-[#4f6a57]">Mark instance complete</button> : null}
      </aside>
      <div className="grid gap-5">
        <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">New-hire wizard</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{selectedTask?.title ?? "All done"}</h2>
          <p className="mt-2 text-sm text-muted-foreground dark:text-white/62">Progress saves after every step. Sensitive fields are write-only and stored encrypted; HR sees masked values.</p>
          {selectedTask ? <OnboardingTaskForm task={selectedTask} documents={overview.documents} saving={saving} onSave={(data, signature) => saveTask(selectedTask, data, signature)} /> : null}
        </section>
        {canAdmin ? (
          <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
            <p className="text-sm font-semibold text-primary dark:text-secondary">Checklist builder</p>
            <div className="mt-4 grid gap-3">{overview.tasks.map((task) => <InfoRow key={task.id} label={`${task.position}. ${task.title}`} value={`${task.type}${task.required ? " · required" : " · optional"}`} />)}</div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function OnboardingTaskForm({ task, documents, saving, onSave }: { task: OnboardingOverview["tasks"][number]; documents: OnboardingOverview["documents"]; saving: boolean; onSave: (data: Record<string, unknown>, signature?: { kind: "typed" | "drawn"; value: string; docRef: string }) => void }) {
  const [data, setData] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState("");
  const [opened, setOpened] = useState(false);
  const doc = task.type === "video" ? documents.find((item) => item.kind === "video") : documents.find((item) => item.requiresAck);
  const needsSignature = ["document_ack", "i9", "w4", "signoff"].includes(task.type);
  const canSubmit = task.type !== "document_ack" || opened;

  function setField(key: string, value: string) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (!canSubmit) return;
    const payload = task.type === "document_ack" && doc ? { ...data, documentId: doc.id, versionHash: doc.versionHash } : data;
    onSave(payload, needsSignature && signature.trim() ? { kind: "typed", value: signature.trim(), docRef: `${task.key}:${doc?.versionHash ?? "v1"}` } : undefined);
    setData({});
    setSignature("");
    setOpened(false);
  }

  return (
    <div className="mt-6 grid gap-4">
      {task.type === "video" ? <div className="rounded-md bg-cream/70 p-4 dark:bg-white/8"><p className="font-semibold text-ink dark:text-cream">{doc?.title ?? "Welcome video"}</p><p className="mt-2 text-sm text-muted-foreground dark:text-white/62">{doc?.url ?? "Demo welcome video"}</p></div> : null}
      {task.type === "address" ? <><TextField label="Phone" value={data.phone} onChange={(value) => setField("phone", value)} /><TextField label="Mailing address" value={data.address} onChange={(value) => setField("address", value)} /></> : null}
      {task.type === "emergency_contact" ? <><TextField label="Name" value={data.name} onChange={(value) => setField("name", value)} /><TextField label="Relationship" value={data.relationship} onChange={(value) => setField("relationship", value)} /><TextField label="Phone" value={data.phone} onChange={(value) => setField("phone", value)} /></> : null}
      {task.type === "direct_deposit" ? <><TextField label="Bank name" value={data.bankName} onChange={(value) => setField("bankName", value)} /><TextField label="Routing number" value={data.routingNumber} onChange={(value) => setField("routingNumber", value)} /><TextField label="Account number" value={data.accountNumber} onChange={(value) => setField("accountNumber", value)} /><TextField label="Account type" value={data.accountType} onChange={(value) => setField("accountType", value)} /><p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Sensitive: stored encrypted and shown back only as masked last-four values.</p></> : null}
      {task.type === "i9" ? <><TextField label="Citizenship / work authorization attestation" value={data.attestation} onChange={(value) => setField("attestation", value)} /><TextField label="SSN or USCIS number" value={data.ssn} onChange={(value) => setField("ssn", value)} /><TextField label="Employer Section 2 note (HR side)" value={data.section2} onChange={(value) => setField("section2", value)} /></> : null}
      {task.type === "w4" ? <><TextField label="Filing status" value={data.filingStatus} onChange={(value) => setField("filingStatus", value)} /><TextField label="Extra withholding" value={data.extraWithholding} onChange={(value) => setField("extraWithholding", value)} /></> : null}
      {task.type === "document_ack" ? <div className="rounded-md border border-border bg-cream/70 p-4 dark:border-white/10 dark:bg-white/8"><p className="font-semibold text-ink dark:text-cream">{doc?.title}</p><p className="mt-3 max-h-44 overflow-auto text-sm leading-6 text-muted-foreground dark:text-white/62" onScroll={() => setOpened(true)}>{doc?.body}</p><button onClick={() => setOpened(true)} className="mt-3 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">Open/read document</button></div> : null}
      {task.type === "signoff" || task.type === "custom_form" ? <TextField label="Notes" value={data.notes} onChange={(value) => setField("notes", value)} /> : null}
      {needsSignature ? <TextField label="Typed signature" value={signature} onChange={setSignature} /> : null}
      <button disabled={saving || !canSubmit} onClick={submit} className="h-11 w-fit rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">{saving ? "Saving..." : task.status === "complete" ? "Update step" : "Save step"}</button>
    </div>
  );
}

function TextField({ label, value = "", onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" /></label>;
}

function MyTimeOffPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const employee = store.employees.find((item) => item.id === currentEmployeeId(store.viewer)) ?? store.employees[0];
  const [dates, setDates] = useState("");
  const [hours, setHours] = useState("8");
  const requests = store.ptoRequests.filter((request) => request.employeeId === employee.id);
  return (
    <section className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricTile label="Accrued" value={`${employee.ptoAccrued}h`} />
        <MetricTile label="Used" value={`${employee.ptoUsed}h`} />
        <MetricTile label="Remaining" value={`${employee.ptoBalance}h`} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-3">{requests.map((request) => <InfoRow key={request.id} label={`${request.dates} · ${request.type}`} value={`${statusLabel(request.status)}${request.notification ? ` · ${request.notification}` : ""}`} />)}</div>
        <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">My Time Off</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-cream">Submit request</h2>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">Dates
            <input value={dates} onChange={(event) => setDates(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Next Friday" />
          </label>
          <label className="mt-3 grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">Hours
            <input value={hours} onChange={(event) => setHours(event.target.value)} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="8" />
          </label>
          <button disabled={!dates.trim() || !Number.isFinite(Number(hours))} onClick={() => { store.submitPtoRequest(employee.id, dates.trim(), Number(hours)); setDates(""); setHours("8"); }} className="mt-4 inline-flex h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">Submit time off request</button>
        </section>
      </div>
    </section>
  );
}

function FileLibraryPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [selectedId, setSelectedId] = useState(store.documents[0]?.id);
  const admin = scope === "all";
  const docs = admin ? store.documents : store.documents.filter((document) => document.status !== "draft");
  const selected = docs.find((document) => document.id === selectedId) ?? docs[0];
  const categories = Array.from(new Set(store.documentTemplates.map((template) => template.category)));
  return (
    <section className="grid gap-5 xl:grid-cols-[240px_1fr_380px]">
      <aside className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm font-semibold text-primary dark:text-secondary">Folders</p><div className="mt-4 grid gap-2">{categories.map((category) => <button key={category} className="rounded-md bg-cream/70 px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-secondary/25 dark:bg-white/8 dark:text-cream">{category}</button>)}</div></aside>
      <div className="grid content-start gap-4">
        <div className="grid gap-3 md:grid-cols-2">{store.documentTemplates.map((template) => <button key={template.id} onClick={() => window.alert(`Generated ${template.title} with selected client data.`)} className="rounded-md border border-border bg-white/70 p-4 text-left hover:border-primary/50 dark:border-white/10 dark:bg-[#15231a]"><FileText className="h-5 w-5 text-primary dark:text-secondary" /><p className="mt-3 font-semibold text-ink dark:text-cream">{template.title}</p><p className="text-sm text-muted-foreground dark:text-white/62">{template.category} · {template.updatedAt}</p></button>)}</div>
        <div className="grid gap-3 md:grid-cols-2">{docs.map((document) => <button key={document.id} onClick={() => setSelectedId(document.id)} className={`rounded-md border p-4 text-left ${document.id === selected?.id ? "border-primary bg-secondary/20" : "border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]"}`}><FileSignature className="h-5 w-5 text-primary dark:text-secondary" /><p className="mt-3 font-semibold text-ink dark:text-cream">{document.title}</p><span className={`mt-3 inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(document.status)}`}>{statusLabel(document.status)}</span></button>)}</div>
      </div>
      {selected ? <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm font-semibold text-primary dark:text-secondary">Preview pane</p><h2 className="mt-2 text-2xl font-semibold text-ink dark:text-cream">{selected.title}</h2><div className="mt-5 rounded-md bg-cream/70 p-4 dark:bg-white/8"><DocumentDetail document={selected} isClient={false} /></div><SmallAction variant="quiet" onClick={() => window.alert("Document downloaded from demo library.")}>Download</SmallAction></section> : null}
    </section>
  );
}

function TicketBoardPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [mode, setMode] = useState<"board" | "queue">("board");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const tickets = scope === "all" ? store.tickets : store.tickets.filter((ticket) => scopedIds.includes(ticket.assigneeId));
  const columns: Array<{ key: SupportTicket["status"]; label: string }> = [{ key: "open", label: "Open" }, { key: "waiting_on_staff", label: "In progress" }, { key: "waiting_on_client", label: "Waiting" }, { key: "resolved", label: "Resolved" }];
  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const progressCount = tickets.filter((ticket) => ticket.status === "waiting_on_staff").length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length;
  return (
    <section className="grid gap-5">
      <div className="rounded-md bg-[#1f211f] p-5 text-white shadow-sm dark:bg-[#1b211d]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-secondary">Ticketing</p>
            <h2 className="mt-2 text-3xl font-semibold text-cream">Move issues across columns rather than a flat inbox.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { const subject = window.prompt("New ticket subject"); if (subject?.trim()) store.openTicket(subject.trim()); }} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/20 px-3 text-sm font-semibold text-white hover:bg-white/10">
              + New ticket
            </button>
            <button onClick={() => setMode(mode === "board" ? "queue" : "board")} className="h-10 rounded-md border border-white/20 px-3 text-sm font-semibold text-white/78 hover:bg-white/10">{mode === "board" ? "Queue table" : "Kanban board"}</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <TicketMetric label="Open" value={String(openCount)} />
          <TicketMetric label="In progress" value={String(progressCount)} />
          <TicketMetric label="Resolved (7d)" value={String(resolvedCount)} />
          <TicketMetric label="Avg first response" value="2.4h" />
        </div>
      </div>
      {mode === "board" ? <div className="grid gap-3 xl:grid-cols-4">{columns.map((column) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === column.key).slice(0, 6);
        return (
          <div key={column.key} className="rounded-md bg-[#222522] p-3 text-white dark:bg-[#1a211c]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white/82">{column.label}</p>
              <span className="rounded-full border border-white/18 px-2 py-0.5 text-xs text-white/70">{columnTickets.length}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {columnTickets.map((ticket) => (
                <article key={ticket.id} className="rounded-md border border-white/12 bg-white/6 p-3 transition hover:border-secondary/60 hover:bg-white/10">
                  <p className="text-sm font-semibold leading-snug text-white">{ticket.subject}</p>
                  <p className="mt-2 text-xs text-white/62">{getClientName(store, ticket.clientId)}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.priority)}`}>{ticket.priority === "normal" ? "Med" : ticket.priority}</span>
                    <span className="text-xs text-white/58">{ticket.lastUpdate}</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-white dark:bg-secondary dark:text-primary">{employeeName(ticket.assigneeId).split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <SmallAction variant="quiet" onClick={() => store.setSelectedTicket(ticket.id)}>Detail</SmallAction>
                    <SmallAction onClick={() => store.updateTicket(ticket.id, { status: ticket.status === "open" ? "waiting_on_staff" : ticket.status === "waiting_on_staff" ? "waiting_on_client" : ticket.status === "waiting_on_client" ? "resolved" : "closed" }, "Ticket moved on board.")}>{ticket.status === "resolved" ? "Close" : "Move"}</SmallAction>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}</div> : <div className="grid gap-3">{tickets.slice(0, 16).map((ticket) => <ActionRow key={ticket.id} label={`${ticket.subject} · ${ticket.priority}`} value={`${getClientName(store, ticket.clientId)} · ${statusLabel(ticket.status)} · ${ticket.lastUpdate}`}><SmallAction onClick={() => store.updateTicket(ticket.id, { status: ticket.status === "resolved" ? "closed" : "resolved" }, "Updated from queue table.")}>{ticket.status === "resolved" ? "Close" : "Resolve"}</SmallAction></ActionRow>)}</div>}
      {store.selectedTicketId ? <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><TicketDetail ticket={store.tickets.find((ticket) => ticket.id === store.selectedTicketId) ?? tickets[0]} /></section> : null}
    </section>
  );
}

function TicketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/6 p-4">
      <p className="text-sm text-white/68">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MessagingAppPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const myId = currentEmployeeId(store.viewer);
  const threads = scope === "all" ? store.chatThreads : store.chatThreads.filter((thread) => thread.type === "channel" || thread.memberIds.includes(myId));
  const [selectedId, setSelectedId] = useState(threads[0]?.id);
  const [body, setBody] = useState("");
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  return (
    <section className="grid min-h-[680px] overflow-hidden rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a] lg:grid-cols-[280px_1fr_280px]">
      <aside className="border-r border-border p-3 dark:border-white/10"><p className="p-2 text-sm font-semibold text-primary dark:text-secondary">Channels + DMs</p>{threads.map((thread) => <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`mt-2 w-full rounded-md p-3 text-left ${thread.id === selected?.id ? "bg-secondary/25" : "hover:bg-cream dark:hover:bg-white/8"}`}><p className="font-semibold text-ink dark:text-cream">{thread.name}</p><p className="text-sm text-muted-foreground dark:text-white/62">{thread.messages.length} messages</p></button>)}</aside>
      <main className="flex min-h-[520px] flex-col p-4">{selected ? <><div className="border-b border-border pb-4 dark:border-white/10"><h2 className="text-2xl font-semibold text-ink dark:text-cream">{selected.name}</h2></div><div className="flex-1 overflow-auto py-4"><div className="grid gap-3">{selected.messages.map((message) => <div key={message.id} className={`max-w-[78%] rounded-md p-3 ${message.employeeId === myId ? "ml-auto bg-secondary/30" : "bg-cream/75 dark:bg-white/8"}`}><p className="text-sm font-semibold text-ink dark:text-cream">{employeeName(message.employeeId)} <span className="font-normal text-muted-foreground">{message.at}</span></p><p className="mt-1 text-sm text-muted-foreground dark:text-white/68">{message.body}</p></div>)}</div></div><ReplyBox value={body} onChange={setBody} onSend={() => { if (body.trim()) { store.sendChatMessage(selected.id, body.trim(), myId); setBody(""); } }} /></> : null}</main>
      <aside className="border-l border-border p-4 dark:border-white/10"><p className="text-sm font-semibold text-primary dark:text-secondary">Context</p><InfoRow label="Unread" value={String(threads.filter((thread) => thread.messages.at(-1)?.employeeId !== myId).length)} /><InfoRow label="Members" value={String(selected?.memberIds.length ?? 0)} /></aside>
    </section>
  );
}

function LearningPortalPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [tab, setTab] = useState<"mine" | "catalog" | "manage">("mine");
  const [selectedCourseId, setSelectedCourseId] = useState(store.courseCatalog[0]?.id ?? "");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(store.training.find((item) => item.status !== "complete" && item.status !== "removed")?.id ?? "");
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [syncState, setSyncState] = useState("Seed preview");
  const [assignMode, setAssignMode] = useState<"course" | "path">("path");
  const [assignCourseId, setAssignCourseId] = useState(store.courseCatalog[0]?.id ?? "");
  const [assignPathId, setAssignPathId] = useState("path-new-hire");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignReason, setAssignReason] = useState<NonNullable<TrainingAssignment["reason"]>>("manual");
  const [assignDueDate, setAssignDueDate] = useState("");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = scope === "all" || scope === "team";
  const rows = store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "removed");
  const activeEnrollment = rows.find((item) => item.id === selectedEnrollmentId) ?? rows.find((item) => item.status !== "complete") ?? rows[0];
  const activeCourse = store.courseCatalog.find((course) => course.id === (activeEnrollment?.courseId ?? selectedCourseId)) ?? store.courseCatalog[0];
  const required = rows.filter((item) => item.status === "overdue" || (item.dueDate && item.status !== "complete")).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const inProgress = rows.filter((item) => item.status === "in_progress");
  const assigned = rows.filter((item) => item.status === "assigned");
  const completed = rows.filter((item) => item.status === "complete");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/operations-portal/learning")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Learning sync unavailable.");
        if (!cancelled) {
          store.setLearningCache(data.courses as CourseCatalogItem[], data.training as TrainingAssignment[]);
          setPaths(data.paths ?? []);
          setSyncState("Synced to Postgres");
        }
      })
      .catch((error) => {
        if (!cancelled) setSyncState(error instanceof Error ? error.message : "Seed preview");
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!assignEmployeeId && scopedIds[0]) setAssignEmployeeId(scopedIds[0]);
  }, [assignEmployeeId, scopedIds]);

  async function refreshFromResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Learning save failed.");
    store.setLearningCache(data.courses as CourseCatalogItem[], data.training as TrainingAssignment[]);
    setPaths(data.paths ?? paths);
    setSyncState("Saved to Postgres");
  }

  async function completeSelected() {
    if (!activeEnrollment) return;
    setSyncState("Saving completion...");
    try {
      await refreshFromResponse(await fetch("/api/operations-portal/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", enrollmentId: activeEnrollment.id }) }));
      store.completeTrainingAssignment(activeEnrollment.id);
    } catch (error) {
      store.completeTrainingAssignment(activeEnrollment.id);
      setSyncState(error instanceof Error ? error.message : "Completion saved locally");
    }
  }

  async function assignSelection() {
    const payload = {
      employeeIds: assignEmployeeId === "team" ? scopedIds : [assignEmployeeId],
      courseIds: assignMode === "course" ? [assignCourseId] : undefined,
      pathId: assignMode === "path" ? assignPathId : undefined,
      reason: assignReason,
      dueDate: assignDueDate || undefined
    };
    setSyncState("Assigning...");
    try {
      await refreshFromResponse(await fetch("/api/operations-portal/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
    } catch (error) {
      const fallbackCourseIds = assignMode === "path" ? (paths.find((path) => path.id === assignPathId)?.courseIds ?? [assignCourseId]) : [assignCourseId];
      fallbackCourseIds.forEach((courseId) => store.assignCourse(payload.employeeIds, courseId, store.viewer, assignReason, assignDueDate || undefined));
      setSyncState(error instanceof Error ? error.message : "Assigned locally");
    }
  }

  async function selfEnroll(courseId: string) {
    setSyncState("Enrolling...");
    try {
      await refreshFromResponse(await fetch("/api/operations-portal/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeIds: [currentEmployeeId(store.viewer)], courseIds: [courseId], reason: "manual" }) }));
    } catch (error) {
      store.assignCourse([currentEmployeeId(store.viewer)], courseId, store.viewer, "manual");
      setSyncState(error instanceof Error ? error.message : "Enrolled locally");
    }
  }

  async function removeAssignment(enrollmentId: string) {
    setSyncState("Removing...");
    try {
      await refreshFromResponse(await fetch("/api/operations-portal/learning", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId }) }));
    } catch (error) {
      store.removeTrainingAssignment(enrollmentId);
      setSyncState(error instanceof Error ? error.message : "Removed locally");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">{[
          ["mine", "My Learning"],
          ["catalog", "Browse catalog"],
          ...(admin ? [["manage", "Manage assignments"]] : [])
        ].map(([id, label]) => <button key={id} onClick={() => setTab(id as typeof tab)} className={`h-10 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{label}</button>)}</div>
        <p className="text-sm text-muted-foreground dark:text-white/60">{syncState}</p>
      </div>

      {tab === "mine" ? <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <div className="grid gap-4">
          <LearningBucket title="Required & due" items={required} admin={admin} selectedId={activeEnrollment?.id} onSelect={setSelectedEnrollmentId} onRemove={removeAssignment} />
          <LearningBucket title="In progress" items={inProgress} admin={admin} selectedId={activeEnrollment?.id} onSelect={setSelectedEnrollmentId} onRemove={removeAssignment} />
          <LearningBucket title="Assigned, not started" items={assigned} admin={admin} selectedId={activeEnrollment?.id} onSelect={setSelectedEnrollmentId} onRemove={removeAssignment} />
          <details className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><summary className="cursor-pointer font-semibold text-ink dark:text-cream">Completed + certificates</summary><div className="mt-3 grid gap-2">{completed.map((item) => <button key={item.id} onClick={() => setSelectedEnrollmentId(item.id)} className="rounded-sm bg-cream/70 p-3 text-left text-sm dark:bg-white/8"><span className="font-semibold">{item.course}</span><span className="ml-2 text-muted-foreground">{item.certificateIssued ?? "Certificate ready"}</span></button>)}</div></details>
        </div>
        <CoursePlayer course={activeCourse} assignment={activeEnrollment} onComplete={completeSelected} />
      </div> : null}

      {tab === "catalog" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{store.courseCatalog.map((course) => <article key={course.id} className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><button onClick={() => { setSelectedCourseId(course.id); setTab("mine"); }} className="grid aspect-video w-full place-items-center rounded-sm bg-primary text-secondary dark:bg-secondary dark:text-primary"><BookOpenCheck className="h-8 w-8" /></button><p className="mt-3 font-semibold text-ink dark:text-cream">{course.title}</p><p className="text-sm text-muted-foreground dark:text-white/62">{course.category} · {course.duration}</p><p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/68">{course.description}</p><SmallAction onClick={() => { setAssignMode("course"); setAssignCourseId(course.id); setAssignReason("manual"); if (admin) setTab("manage"); else void selfEnroll(course.id); }}>{admin ? "Assign" : "Self-enroll"}</SmallAction></article>)}</div> : null}

      {tab === "manage" && admin ? <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Assign training</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Mode<select value={assignMode} onChange={(event) => setAssignMode(event.target.value as typeof assignMode)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]"><option value="path">Learning path</option><option value="course">Single course</option></select></label>
            {assignMode === "path" ? <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Path<select value={assignPathId} onChange={(event) => setAssignPathId(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]">{(paths.length ? paths : [{ id: "path-new-hire", name: "New Hire", kind: "new_hire", courseIds: [] }]).map((path) => <option key={path.id} value={path.id}>{path.name}</option>)}</select></label> : <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Course<select value={assignCourseId} onChange={(event) => setAssignCourseId(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]">{store.courseCatalog.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>}
            <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Target<select value={assignEmployeeId} onChange={(event) => setAssignEmployeeId(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]"><option value="team">{scope === "team" ? "My team" : "All scoped employees"}</option>{store.employees.filter((employee) => scopedIds.includes(employee.id)).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Reason<select value={assignReason} onChange={(event) => setAssignReason(event.target.value as typeof assignReason)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]"><option value="new_hire">New hire</option><option value="role_change">Role change</option><option value="promotion">Promotion</option><option value="compliance">Compliance</option><option value="corrective">Corrective</option><option value="manual">Manual</option></select></label>
            <label className="grid gap-1 text-sm font-semibold text-ink dark:text-cream">Due date<input type="date" value={assignDueDate} onChange={(event) => setAssignDueDate(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 dark:border-white/10 dark:bg-[#0f1a14]" /></label>
            <SmallAction onClick={assignSelection}>Assign training</SmallAction>
          </div>
        </section>
        <section className="grid content-start gap-3">
          <div className="grid gap-3 md:grid-cols-3"><MetricTile label="Overdue" value={String(rows.filter((item) => item.status === "overdue").length)} /><MetricTile label="In progress" value={String(inProgress.length)} /><MetricTile label="Completed" value={String(completed.length)} /></div>
          {rows.map((item) => <ActionRow key={item.id} label={`${employeeName(item.employeeId)} · ${item.due}`} value={`${item.course} · ${statusLabel(item.reason ?? "manual")} · ${item.progress}%`}><SmallAction variant="danger" onClick={() => removeAssignment(item.id)}>Remove</SmallAction></ActionRow>)}
        </section>
      </div> : null}
    </section>
  );
}

function LearningBucket({ title, items, admin, selectedId, onSelect, onRemove }: { title: string; items: TrainingAssignment[]; admin: boolean; selectedId?: string; onSelect: (id: string) => void; onRemove: (id: string) => void }) {
  return <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><div className="flex items-center justify-between"><p className="font-semibold text-ink dark:text-cream">{title}</p></div><div className="mt-3 grid gap-2">{items.length ? items.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={`rounded-md border p-3 text-left ${selectedId === item.id ? "border-primary bg-secondary/20" : "border-border bg-cream/60 dark:border-white/10 dark:bg-white/8"}`}><p className="font-semibold text-ink dark:text-cream">{admin ? `${employeeName(item.employeeId)} · ${item.course}` : item.course}</p><p className="text-sm text-muted-foreground dark:text-white/62">{item.due} · Assigned: {statusLabel(item.reason ?? "manual")} · {item.progress}%</p>{admin ? <span onClick={(event) => { event.stopPropagation(); onRemove(item.id); }} className="mt-2 inline-flex text-xs font-semibold text-red-700 dark:text-red-200">Remove</span> : null}</button>) : <p className="text-sm text-muted-foreground">Nothing here.</p>}</div></section>;
}

function CoursePlayer({ course, assignment, onComplete }: { course?: CourseCatalogItem; assignment?: TrainingAssignment; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  useEffect(() => setAnswers({}), [course?.id]);
  if (!course) return null;
  const currentLesson = Math.min(assignment?.currentLesson ?? 0, Math.max(course.lessons.length - 1, 0));
  const questions = course.quizQuestions ?? [];
  const answered = questions.length > 0 && questions.every((_, index) => typeof answers[index] === "number");
  const score = questions.length ? Math.round((questions.filter((question, index) => answers[index] === question.correctIndex).length / questions.length) * 100) : 0;
  const passed = answered && score >= 80;
  return <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm font-semibold text-primary dark:text-secondary">Course player</p><h2 className="mt-2 text-2xl font-semibold text-ink dark:text-cream">{course.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/68">{course.description}</p>{assignment ? <p className="mt-3 rounded-sm bg-secondary/20 px-3 py-2 text-sm font-semibold text-primary dark:text-secondary">Assigned: {statusLabel(assignment.reason ?? "manual")} · {assignment.due}</p> : null}<div className="mt-4 grid gap-2">{course.lessons.map((lesson, index) => <div key={lesson.title} className={`rounded-sm p-3 ${index === currentLesson ? "bg-primary text-white dark:bg-[#4f6a57]" : "bg-cream/75 dark:bg-white/8"}`}><p className="font-semibold">{lesson.title}</p><p className={`mt-2 whitespace-pre-line text-sm leading-6 ${index === currentLesson ? "text-white/75" : "text-muted-foreground dark:text-white/64"}`}>{lesson.body}</p></div>)}</div><div className="mt-4 rounded-sm border border-border p-4 text-sm dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-ink dark:text-cream">End quiz</p><p className="mt-1 text-muted-foreground dark:text-white/66">{course.quiz}</p></div>{answered ? <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${passed ? "bg-green-50 text-green-700 dark:bg-green-400/15 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-200"}`}>{score}%</span> : null}</div><div className="mt-4 grid gap-4">{questions.map((question, questionIndex) => <div key={question.prompt} className="rounded-sm bg-cream/70 p-3 dark:bg-white/8"><p className="font-semibold text-ink dark:text-cream">{question.prompt}</p><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => { const selected = answers[questionIndex] === optionIndex; const correct = answered && optionIndex === question.correctIndex; return <button key={option} onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} className={`rounded-sm border px-3 py-2 text-left ${correct ? "border-green-400 bg-green-50 text-green-800 dark:border-green-400/40 dark:bg-green-400/10 dark:text-green-100" : selected ? "border-primary bg-secondary/25 text-primary dark:border-secondary/50 dark:text-[#edf0ce]" : "border-border bg-white/70 text-muted-foreground hover:bg-secondary/15 dark:border-white/10 dark:bg-[#0f1a14] dark:text-white/68"}`}>{option}</button>; })}</div>{typeof answers[questionIndex] === "number" ? <p className="mt-2 text-xs leading-5 text-muted-foreground dark:text-white/62">{question.explanation}</p> : null}</div>)}</div></div>{assignment?.status === "complete" ? <p className="mt-4 text-sm font-semibold text-green-700 dark:text-green-200">Certificate ready.</p> : <button onClick={() => { if (passed) onComplete(); }} className={`mt-4 h-9 rounded-md px-3 text-sm font-semibold ${passed ? "bg-primary text-white hover:bg-primary/90 dark:bg-[#4f6a57]" : "cursor-not-allowed border border-border text-muted-foreground dark:border-white/10 dark:text-white/50"}`}>{passed ? "Issue certificate" : answered ? "Retake to reach 80%" : "Answer quiz to finish"}</button>}</section>;
}

function HelpCenterPanel({ admin }: { admin: boolean }) {
  const store = useOperationsPortalStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(store.knowledgeArticles[0]?.id);
  const articles = store.knowledgeArticles.filter((article) => `${article.title} ${article.category}`.toLowerCase().includes(query.toLowerCase()));
  const selected = articles.find((article) => article.id === selectedId) ?? articles[0];
  const categories = Array.from(new Set(store.knowledgeArticles.map((article) => article.category)));
  return <section className="grid gap-5 lg:grid-cols-[260px_1fr_260px]"><aside className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-md border border-border px-3 dark:border-white/10 dark:bg-[#0f1a14]" placeholder="Search wiki" />{categories.map((category) => <p key={category} className="mt-3 text-sm font-semibold text-muted-foreground">{category}</p>)}</aside><main className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">{selected ? <><p className="text-sm font-semibold text-primary dark:text-secondary">{selected.category}</p><h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{selected.title}</h2><p className="mt-4 text-sm leading-7 text-muted-foreground dark:text-white/68">{selected.body}</p>{admin ? <SmallAction onClick={() => window.alert("Article created/published in demo knowledge base.")}>Create/publish</SmallAction> : null}</> : null}</main><aside className="grid content-start gap-2">{articles.slice(0, 8).map((article) => <button key={article.id} onClick={() => setSelectedId(article.id)} className="rounded-md border border-border bg-white/70 p-3 text-left dark:border-white/10 dark:bg-[#15231a]"><p className="font-semibold text-ink dark:text-cream">{article.title}</p><p className="text-sm text-muted-foreground">{article.updatedAt}</p></button>)}</aside></section>;
}

function IntranetFeedPanel({ admin }: { admin: boolean }) {
  const store = useOperationsPortalStore();
  const approvedPto = store.ptoRequests.filter((request) => request.status === "approved").slice(0, 5);
  return <section className="grid gap-5 xl:grid-cols-[1fr_360px]"><main className="grid gap-4">{store.announcements.map((announcement, index) => <article key={announcement.id} className={`${index === 0 ? "bg-primary text-white" : "border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a]"} rounded-md p-5`}><p className={`text-sm font-semibold ${index === 0 ? "text-secondary" : "text-primary dark:text-secondary"}`}>{employeeName(announcement.authorId)} · {announcement.at}</p><h2 className={`mt-2 ${index === 0 ? "text-4xl text-cream" : "text-2xl text-ink dark:text-cream"} font-semibold`}>{announcement.title}</h2><p className={`mt-3 text-sm leading-6 ${index === 0 ? "text-white/72" : "text-muted-foreground dark:text-white/68"}`}>{announcement.body}</p>{admin ? <div className="mt-4 flex gap-2"><SmallAction variant="quiet" onClick={() => { const body = window.prompt("Edit announcement body", announcement.body); if (body) store.editAnnouncement(announcement.id, body); }}>Edit</SmallAction><SmallAction variant="danger" onClick={() => store.removeAnnouncement(announcement.id)}>Remove</SmallAction></div> : null}</article>)}</main><aside className="grid content-start gap-4"><section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><p className="font-semibold text-ink dark:text-cream">Quick links</p>{store.quickLinks.map((link) => <button key={link.label} onClick={() => store.setActivePage(link.label.includes("Time") ? "my-timekeeping" : "knowledge")} className="mt-2 block w-full rounded-sm bg-cream/70 p-2 text-left text-sm dark:bg-white/8">{link.label}</button>)}</section><section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><p className="font-semibold text-ink dark:text-cream">Who's out today</p>{approvedPto.map((request) => <InfoRow key={request.id} label={employeeName(request.employeeId)} value={request.dates} />)}</section><section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><p className="font-semibold text-ink dark:text-cream">Events</p>{store.events.map((event) => <InfoRow key={event.id} label={event.title} value={event.at} />)}</section>{admin ? <SmallAction onClick={() => { const title = window.prompt("Announcement title"); const body = title ? window.prompt("Announcement body") : ""; if (title && body) store.postAnnouncement(title, body); }}>Post announcement</SmallAction> : null}</aside></section>;
}

function ClientManagementPanel() {
  const store = useOperationsPortalStore();
  const [tab, setTab] = useState("Overview");
  const clientId = store.selectedClientId;
  return <section className="grid gap-5 xl:grid-cols-[320px_1fr]"><ClientsPanel selectedClientId={clientId} /><main className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><div className="flex flex-wrap gap-2">{["Overview", "Invoices", "Documents", "Messages", "Projects/Jobs"].map((item) => <button key={item} onClick={() => setTab(item)} className={`h-10 rounded-md px-3 text-sm font-semibold ${tab === item ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{item}</button>)}</div><div className="mt-5"><ClientRecord clientId={clientId} />{tab === "Invoices" ? <InvoicesPanel invoices={store.invoices.filter((item) => item.clientId === clientId)} selectedInvoice={store.invoices.find((item) => item.clientId === clientId)} isClient={false} /> : null}{tab === "Documents" ? <DocumentsPanel documents={store.documents.filter((item) => item.clientId === clientId)} selectedDocument={store.documents.find((item) => item.clientId === clientId)} isClient={false} /> : null}{tab === "Messages" ? <MessagesPanel threads={store.threads.filter((item) => item.clientId === clientId)} selectedThread={store.threads.find((item) => item.clientId === clientId)} isClient={false} /> : null}{tab === "Projects/Jobs" ? <ProjectsPanel projects={store.projects.filter((item) => item.clientId === clientId)} selectedProject={store.projects.find((item) => item.clientId === clientId)} isClient={false} /> : null}</div></main></section>;
}

function SettingsLayoutPanel() {
  const sections = ["Company & branding", "Module toggles", "Users & roles", "Integrations", "Billing"];
  const [section, setSection] = useState(sections[0]);
  return <section className="grid gap-5 lg:grid-cols-[260px_1fr]"><aside className="rounded-md border border-border bg-white/70 p-3 dark:border-white/10 dark:bg-[#15231a]">{sections.map((item) => <button key={item} onClick={() => setSection(item)} className={`mt-2 w-full rounded-md p-3 text-left text-sm font-semibold ${section === item ? "bg-secondary/25 text-primary" : "hover:bg-cream dark:hover:bg-white/8"}`}>{item}</button>)}</aside><main className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm font-semibold text-primary dark:text-secondary">Settings</p><h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{section}</h2><div className="mt-5 grid gap-3"><InfoRow label="Persisted demo state" value="Enabled" /><InfoRow label="Scope enforcement" value="Role-gated" /><InfoRow label="Module toggles" value="Visible nav updates through permissions helper" /><SmallAction onClick={() => window.alert(`${section} saved in demo settings.`)}>Save changes</SmallAction></div></main></section>;
}

function ClientDashboardPanel(props: { clientId: string; project?: ClientProject; invoice?: ClientInvoice; document?: ClientDocument; thread?: MessageThread; ticket?: SupportTicket }) {
  return <DashboardPanel isClient clientId={props.clientId} project={props.project} invoice={props.invoice} document={props.document} thread={props.thread} ticket={props.ticket} />;
}

function ClientProjectsPortal({ projects, selectedProject }: { projects: ClientProject[]; selectedProject?: ClientProject }) {
  return <ProjectsPanel projects={projects} selectedProject={selectedProject} isClient />;
}

function ClientInvoicesPortal({ invoices, selectedInvoice }: { invoices: ClientInvoice[]; selectedInvoice?: ClientInvoice }) {
  return <InvoicesPanel invoices={invoices} selectedInvoice={selectedInvoice} isClient />;
}

function ClientDocumentsPortal({ documents, selectedDocument }: { documents: ClientDocument[]; selectedDocument?: ClientDocument }) {
  return <DocumentsPanel documents={documents} selectedDocument={selectedDocument} isClient />;
}

function ClientMessagesPortal({ threads, selectedThread }: { threads: MessageThread[]; selectedThread?: MessageThread }) {
  return <MessagesPanel threads={threads} selectedThread={selectedThread} isClient />;
}

function ClientTicketsPortal({ tickets, selectedTicket }: { tickets: SupportTicket[]; selectedTicket?: SupportTicket }) {
  return <TicketsPanel tickets={tickets} selectedTicket={selectedTicket} isClient />;
}

function ChartPanel({ title, bars, labels }: { title: string; bars: number[]; labels: string[] }) {
  return <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]"><p className="text-sm font-semibold text-primary dark:text-secondary">{title}</p><div className="mt-6 flex h-48 items-end gap-3">{bars.map((bar, index) => <div key={labels[index]} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-sm bg-secondary" style={{ height: `${Math.max(12, bar)}%` }} /><span className="text-xs text-muted-foreground dark:text-white/62">{labels[index]}</span></div>)}</div></section>;
}

function RolePanel({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink dark:text-cream">{title}</h2>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-sm bg-secondary text-primary dark:bg-secondary/80 dark:text-[#101a14]"><Icon className="h-5 w-5" /></span>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-cream/65 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
      <p className="text-sm text-muted-foreground dark:text-white/62">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink dark:text-cream">{value}</p>
    </div>
  );
}

function ActionRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-cream/70 px-3 py-3 dark:bg-white/8">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink dark:text-cream">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{value}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SmallAction({ children, onClick, variant = "primary" }: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "danger" | "quiet" }) {
  return (
    <button onClick={onClick} className={`h-9 rounded-md px-3 text-sm font-semibold ${variant === "danger" ? "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-400/30 dark:text-red-200 dark:hover:bg-red-400/10" : variant === "quiet" ? "border border-border text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8" : "bg-primary text-white hover:bg-primary/90 dark:bg-[#4f6a57]"}`}>
      {children}
    </button>
  );
}

function DashboardPanel(props: { isClient: boolean; clientId: string; project?: ClientProject; invoice?: ClientInvoice; document?: ClientDocument; thread?: MessageThread; ticket?: SupportTicket }) {
  const store = useOperationsPortalStore();
  const title = props.isClient ? `${getClientName(store, props.clientId)} portal` : "Back-office command center";
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">{props.isClient ? "Client view" : "Staff view"}</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{title}</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {props.project ? <SummaryCard icon={FolderKanban} title={props.project.name} text={`Project status: ${props.project.status}`} action="Open project" onClick={() => store.setSelectedProject(props.project!.id)} /> : null}
          {props.invoice ? <SummaryCard icon={ReceiptText} title={props.invoice.number} text={`${money(invoiceTotal(props.invoice))} · ${statusLabel(props.invoice.status)}`} action={props.isClient ? "View invoice" : "Edit invoice"} onClick={() => store.setSelectedInvoice(props.invoice!.id)} /> : null}
          {props.document ? <SummaryCard icon={FileSignature} title={props.document.title} text={`Document is ${statusLabel(props.document.status)}`} action={props.isClient ? "View document" : "Manage document"} onClick={() => store.setSelectedDocument(props.document!.id)} /> : null}
          {props.ticket ? <SummaryCard icon={Ticket} title={props.ticket.subject} text={`Ticket is ${statusLabel(props.ticket.status)}`} action="Open ticket" onClick={() => store.setSelectedTicket(props.ticket!.id)} /> : null}
        </div>
      </section>
      <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">Money shot</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink dark:text-cream">Try this round trip</h2>
        <ol className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground dark:text-white/66">
          <li className="rounded-sm bg-cream/70 p-3 dark:bg-white/8">1. In Admin view, issue a draft invoice or push a draft document.</li>
          <li className="rounded-sm bg-cream/70 p-3 dark:bg-white/8">2. Switch to Client view and pay/sign it.</li>
          <li className="rounded-sm bg-cream/70 p-3 dark:bg-white/8">3. Switch back to Admin view: the same record is updated.</li>
        </ol>
      </section>
    </div>
  );
}

function ClientsPanel({ selectedClientId }: { selectedClientId: string }) {
  const store = useOperationsPortalStore();
  return (
    <TwoColumn
      list={store.clients.map((client) => (
        <button key={client.id} onClick={() => store.setSelectedClient(client.id)} className={`rounded-md border p-4 text-left ${client.id === selectedClientId ? "border-primary bg-secondary/25 dark:border-secondary/50 dark:bg-secondary/15" : "border-border bg-white/65 dark:border-white/10 dark:bg-[#15231a]"}`}>
          <p className="font-semibold text-ink dark:text-cream">{client.name}</p>
          <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{client.industry}</p>
          <span className={`mt-3 inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(client.health)}`}>{client.health}</span>
        </button>
      ))}
      detail={<DetailShell eyebrow="Client record" title={getClientName(store, selectedClientId)} icon={Building2}><ClientRecord clientId={selectedClientId} /></DetailShell>}
    />
  );
}

function ProjectsPanel({ projects, selectedProject, isClient }: { projects: ClientProject[]; selectedProject?: ClientProject; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <TwoColumn
      list={projects.map((project) => <RowButton key={project.id} active={project.id === selectedProject?.id} title={project.name} meta={`${getClientName(store, project.clientId)} · ${project.status}`} onClick={() => store.setSelectedProject(project.id)} />)}
      detail={selectedProject ? <DetailShell eyebrow={isClient ? "Project status" : "Project/job admin"} title={selectedProject.name} icon={FolderKanban}><ProjectDetail project={selectedProject} isClient={isClient} /></DetailShell> : null}
    />
  );
}

function InvoicesPanel({ invoices, selectedInvoice, isClient }: { invoices: ClientInvoice[]; selectedInvoice?: ClientInvoice; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <TwoColumn
      list={invoices.map((invoice) => <RowButton key={invoice.id} active={invoice.id === selectedInvoice?.id} title={invoice.number} meta={`${getClientName(store, invoice.clientId)} · ${money(invoiceTotal(invoice))}`} badge={invoice.status} onClick={() => store.setSelectedInvoice(invoice.id)} />)}
      detail={selectedInvoice ? <DetailShell eyebrow={isClient ? "Payable invoice" : "Invoice editor"} title={selectedInvoice.number} icon={ReceiptText}><InvoiceDetail invoice={selectedInvoice} isClient={isClient} /></DetailShell> : null}
    />
  );
}

function DocumentsPanel({ documents, selectedDocument, isClient }: { documents: ClientDocument[]; selectedDocument?: ClientDocument; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <TwoColumn
      list={documents.map((document) => <RowButton key={document.id} active={document.id === selectedDocument?.id} title={document.title} meta={`${getClientName(store, document.clientId)} · ${document.updatedAt}`} badge={document.status} onClick={() => store.setSelectedDocument(document.id)} />)}
      detail={selectedDocument ? <DetailShell eyebrow={isClient ? "Shared document" : "Document delivery"} title={selectedDocument.title} icon={FileSignature}><DocumentDetail document={selectedDocument} isClient={isClient} /></DetailShell> : null}
    />
  );
}

function MessagesPanel({ threads, selectedThread, isClient }: { threads: MessageThread[]; selectedThread?: MessageThread; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <TwoColumn
      list={threads.map((thread) => <RowButton key={thread.id} active={thread.id === selectedThread?.id} title={thread.subject} meta={`${getClientName(store, thread.clientId)} · ${thread.messages.length} messages`} onClick={() => store.setSelectedThread(thread.id)} />)}
      detail={selectedThread ? <DetailShell eyebrow={isClient ? "Message thread" : "Client inbox"} title={selectedThread.subject} icon={MessageSquareText}><ThreadDetail thread={selectedThread} /></DetailShell> : null}
    />
  );
}

function TicketsPanel({ tickets, selectedTicket, isClient }: { tickets: SupportTicket[]; selectedTicket?: SupportTicket; isClient: boolean }) {
  const store = useOperationsPortalStore();
  const [subject, setSubject] = useState("");
  return (
    <TwoColumn
      list={
        <>
          <div className="rounded-md border border-border bg-white/65 p-3 dark:border-white/10 dark:bg-[#15231a]">
            <label className="grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">Open ticket
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="New support request" />
            </label>
            <button onClick={() => { if (subject.trim()) { store.openTicket(subject.trim()); setSubject(""); } }} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white dark:bg-[#4f6a57]">
              <Ticket className="h-4 w-4" /> Create
            </button>
          </div>
          {tickets.map((ticket) => <RowButton key={ticket.id} active={ticket.id === selectedTicket?.id} title={ticket.subject} meta={`${getClientName(store, ticket.clientId)} · ${ticket.priority}`} badge={ticket.status} onClick={() => store.setSelectedTicket(ticket.id)} />)}
        </>
      }
      detail={selectedTicket ? <DetailShell eyebrow={isClient ? "Support request" : "Ticket queue"} title={selectedTicket.subject} icon={Ticket}><TicketDetail ticket={selectedTicket} /></DetailShell> : null}
    />
  );
}

function ClientRecord({ clientId }: { clientId: string }) {
  const store = useOperationsPortalStore();
  const contact = store.contacts.find((item) => item.clientId === clientId);
  const invoice = store.invoices.find((item) => item.clientId === clientId && item.status !== "paid") ?? store.invoices.find((item) => item.clientId === clientId);
  const document = store.documents.find((item) => item.clientId === clientId && item.status !== "signed") ?? store.documents.find((item) => item.clientId === clientId);
  const thread = store.threads.find((item) => item.clientId === clientId);
  return (
    <div className="grid gap-3">
      <InfoRow label="Primary contact" value={contact ? `${contact.name}, ${contact.title}` : "Not assigned"} />
      <InfoRow label="Projects" value={String(store.projects.filter((item) => item.clientId === clientId).length)} />
      <InfoRow label="Open tickets" value={String(store.tickets.filter((item) => item.clientId === clientId && item.status !== "resolved" && item.status !== "closed").length)} />
      <div className="flex flex-wrap gap-2">
        {thread ? <SmallAction onClick={() => store.sendMessage(thread.id, "Ridgeway has this update and will follow up with the next step shortly.", { role: "admin" })}>Reply to client</SmallAction> : null}
        {invoice ? <SmallAction onClick={() => store.issueInvoice(invoice.id)}>Issue invoice</SmallAction> : null}
        {document ? <SmallAction onClick={() => store.pushDocumentForSignature(document.id)}>Push e-sign</SmallAction> : null}
      </div>
    </div>
  );
}

function ProjectDetail({ project, isClient }: { project: ClientProject; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <div className="grid gap-5">
      <InfoRow label="Client" value={getClientName(store, project.clientId)} />
      <InfoRow label="Next milestone" value={project.nextMilestone} />
      <span className={`w-fit rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(project.status)}`}>{project.status}</span>
      {!isClient ? (
        <label className="grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">Update status
          <select value={project.status} onChange={(event) => store.updateProjectStatus(project.id, event.target.value as ClientProject["status"])} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
            {projectStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      ) : (
        <p className="rounded-md bg-cream/70 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/8 dark:text-white/68">Your team can see the current status and milestone without internal staff notes, schedules, or back-office tools.</p>
      )}
    </div>
  );
}

function InvoiceDetail({ invoice, isClient }: { invoice: ClientInvoice; isClient: boolean }) {
  const store = useOperationsPortalStore();
  const payable = invoice.status === "payable" || invoice.status === "sent" || invoice.status === "overdue";
  return (
    <div className="grid gap-5">
      <InfoRow label="Client" value={getClientName(store, invoice.clientId)} />
      <InfoRow label="Due date" value={invoice.dueDate} />
      <div className="grid gap-2">
        {invoice.lineItems.map((item) => <InfoRow key={item.label} label={item.label} value={money(item.amount)} />)}
      </div>
      <InfoRow label="Total" value={money(invoiceTotal(invoice))} strong />
      <span className={`w-fit rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(invoice.status)}`}>{statusLabel(invoice.status)}</span>
      {isClient ? (
        <button disabled={!payable} onClick={() => store.markInvoicePaid(invoice.id)} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">
          <CheckCircle2 className="h-4 w-4" /> Pay invoice
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => store.issueInvoice(invoice.id)} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">
            <Send className="h-4 w-4" /> Issue/send to portal
          </button>
          {invoice.status === "draft" ? (
            <button onClick={() => store.markInvoiceSent(invoice.id)} className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">
              Mark sent
            </button>
          ) : null}
          <button onClick={() => store.markInvoicePaid(invoice.id)} className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">
            Mark paid
          </button>
          <button onClick={() => { const next = Number(window.prompt("New first line amount", String(invoice.lineItems[0]?.amount ?? 0))); if (Number.isFinite(next)) store.updateInvoiceLineItem(invoice.id, 0, next); }} className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">
            Edit line item
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentDetail({ document, isClient }: { document: ClientDocument; isClient: boolean }) {
  const store = useOperationsPortalStore();
  return (
    <div className="grid gap-5">
      <InfoRow label="Client" value={getClientName(store, document.clientId)} />
      <InfoRow label="Last updated" value={document.updatedAt} />
      <span className={`w-fit rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(document.status)}`}>{statusLabel(document.status)}</span>
      {isClient ? (
        <button disabled={document.status !== "awaiting_signature"} onClick={() => store.signDocument(document.id)} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">
          <FileSignature className="h-4 w-4" /> E-sign document
        </button>
      ) : (
        <button onClick={() => store.pushDocumentForSignature(document.id)} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">
          <FileText className="h-4 w-4" /> Push for e-signature
        </button>
      )}
    </div>
  );
}

function ThreadDetail({ thread }: { thread: MessageThread }) {
  const store = useOperationsPortalStore();
  const [body, setBody] = useState("");
  return (
    <div>
      <MessageList messages={thread.messages} />
      <ReplyBox value={body} onChange={setBody} onSend={() => { if (body.trim()) { store.sendMessage(thread.id, body.trim()); setBody(""); } }} />
    </div>
  );
}

function TicketDetail({ ticket }: { ticket: SupportTicket }) {
  const store = useOperationsPortalStore();
  const [body, setBody] = useState("");
  const canManage = store.viewer.role === "owner" || store.viewer.role === "admin" || store.viewer.role === "manager";
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.status)}`}>{statusLabel(ticket.status)}</span>
        <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.priority)}`}>{ticket.priority}</span>
      </div>
      {canManage ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {ticket.status === "resolved" ? <SmallAction variant="danger" onClick={() => { if (window.confirm("Close this ticket?")) store.updateTicket(ticket.id, { status: "closed" }, "Ticket closed from detail view."); }}>Close ticket</SmallAction> : <SmallAction onClick={() => store.updateTicket(ticket.id, { status: ticket.status === "open" ? "waiting_on_client" : "resolved" }, "Ticket status updated from detail view.")}>{ticket.status === "open" ? "Advance status" : "Resolve"}</SmallAction>}
          <SmallAction variant="quiet" onClick={() => store.updateTicket(ticket.id, { priority: ticket.priority === "high" ? "normal" : "high" })}>{ticket.priority === "high" ? "Set normal" : "Set high"}</SmallAction>
          <SmallAction variant="quiet" onClick={() => { const assigneeId = window.prompt("Assign to employee id", ticket.assigneeId); if (assigneeId) store.updateTicket(ticket.id, { assigneeId }); }}>Reassign</SmallAction>
        </div>
      ) : null}
      <MessageList messages={ticket.messages} />
      <ReplyBox value={body} onChange={setBody} onSend={() => { if (body.trim()) { store.replyToTicket(ticket.id, body.trim()); setBody(""); } }} />
    </div>
  );
}

function MessageList({ messages }: { messages: Array<{ id: string; authorRole: PortalRole; authorName: string; body: string; at: string }> }) {
  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <div key={message.id} className={`rounded-md p-3 ${message.authorRole === "client" ? "bg-secondary/30 dark:bg-[#243820]" : "bg-cream/75 dark:bg-[#1b2d21]"}`}>
          <p className="text-sm font-semibold text-ink dark:text-cream">{message.authorName} <span className="font-normal text-muted-foreground dark:text-white/50">{message.at}</span></p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/68">{message.body}</p>
        </div>
      ))}
    </div>
  );
}

function ReplyBox({ value, onChange, onSend }: { value: string; onChange: (value: string) => void; onSend: () => void }) {
  return (
    <div className="mt-5 grid gap-3">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded-md border border-border bg-white px-3 py-2 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Write a reply" />
      <button onClick={onSend} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">
        <Send className="h-4 w-4" /> Send reply
      </button>
    </div>
  );
}

function TwoColumn({ list, detail }: { list: React.ReactNode; detail: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="grid content-start gap-3">{list}</div>
      <div>{detail}</div>
    </div>
  );
}

function RowButton({ active, title, meta, badge, onClick }: { active: boolean; title: string; meta: string; badge?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-md border p-4 text-left transition ${active ? "border-primary bg-secondary/25 dark:border-secondary/50 dark:bg-secondary/15" : "border-border bg-white/65 hover:border-primary/50 dark:border-white/10 dark:bg-[#15231a]"}`}>
      <p className="font-semibold text-ink dark:text-cream">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{meta}</p>
      {badge ? <span className={`mt-3 inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(badge)}`}>{statusLabel(badge)}</span> : null}
    </button>
  );
}

function DetailShell({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return (
    <section className="min-h-[520px] rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink dark:text-cream">{title}</h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-secondary text-primary dark:bg-secondary/80 dark:text-[#101a14]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function SummaryCard({ icon: Icon, title, text, action, onClick }: { icon: typeof LayoutDashboard; title: string; text: string; action: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-md border border-border bg-cream/65 p-4 text-left transition hover:border-primary/50 dark:border-white/10 dark:bg-[#0f1a14]">
      <Icon className="h-5 w-5 text-primary dark:text-secondary" />
      <p className="mt-4 font-semibold text-ink dark:text-cream">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/62">{text}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary dark:text-secondary">{action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
    </button>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-sm bg-cream/70 px-3 py-3 dark:bg-white/8">
      <span className="text-sm text-muted-foreground dark:text-white/62">{label}</span>
      <span className={`${strong ? "text-xl" : "text-sm"} text-right font-semibold text-ink dark:text-cream`}>{value}</span>
    </div>
  );
}
