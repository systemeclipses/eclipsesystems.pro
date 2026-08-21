"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  Moon,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  Send,
  Settings,
  Sun,
  Ticket,
  UserRound,
  UsersRound
} from "lucide-react";
import { portalBrand } from "@/lib/portal-brand";
import { applyEclipseTheme, getStoredThemePreference, playEclipseTransition, resolveThemePreference, saveAccountThemePreference, type ThemePreference } from "@/components/app/theme-toggle";
import { type CourseCatalogItem, type PortalMessage, type PortalRole, type PortalViewer, type StaffShift, type StaffTimeEntry, type TicketCategory, type TrainingAssignment } from "@/lib/operations-portal-data";
import { getClientName, invoiceTotal, useOperationsPortalStore, visibleForViewer, type ClientDocument, type ClientInvoice, type ClientProject, type DemoHighlight, type MessageThread, type SupportTicket } from "@/lib/operations-portal-store";
import type { PortalPage } from "@/lib/operations-portal-store";
import { can, isOperationsAdmin, isOperationsManager, resourceScope, scopedEmployeeIds, visibleOperationsNav, type PermissionScope } from "@/lib/operations-permissions";

type Surface = "operations" | "client";
type TicketBoardColumnKey = "open" | "in_progress" | "resolved";

type DemoProps = {
  surface: Surface;
  ticketSlug?: string;
};

type LearningPath = {
  id: string;
  name: string;
  kind: "new_hire" | "role_based" | "promotion" | "compliance" | "manual";
  courseIds: string[];
};

type SidebarNavItem = { page: PortalPage; label: string; icon: typeof LayoutDashboard };
type ReportView = "general" | "monitoring" | "technicians" | "satisfaction";

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
const selectWithInsetArrow = "appearance-none bg-[position:calc(100%-1rem)_center] bg-[length:14px_14px] bg-no-repeat pr-12";
const selectArrowStyle = {
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23d9dec4' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function clockTimeMinutes(value?: string) {
  const match = value?.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function shiftDurationHours(time: string) {
  const [start, end] = time.split(" - ");
  const startMinutes = clockTimeMinutes(start);
  const endMinutes = clockTimeMinutes(end);
  if (startMinutes === null || endMinutes === null) return null;
  const durationMinutes = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return Math.round((durationMinutes / 60) * 100) / 100;
}

function entryHours(entry: StaffTimeEntry, now = new Date()) {
  if (entry.clockStartedAt) {
    const endedAt = entry.clockEndedAt ? new Date(entry.clockEndedAt) : entry.clockedIn ? now : null;
    if (endedAt) {
      const elapsed = Math.max(0, endedAt.getTime() - new Date(entry.clockStartedAt).getTime());
      return Math.round((elapsed / 3_600_000) * 100) / 100;
    }
  }

  return shiftDurationHours(entry.shift) ?? entry.hours;
}

function formatPunchTime(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function entryTimeRange(entry: StaffTimeEntry, now = new Date()) {
  if (entry.clockStartedAt) {
    const startedAt = formatPunchTime(entry.clockStartedAt) ?? entry.shift.split(" - ")[0] ?? "--";
    const endedAt = entry.clockEndedAt ? formatPunchTime(entry.clockEndedAt) : entry.clockedIn ? formatPunchTime(now.toISOString()) : null;
    if (endedAt) return { start: startedAt, end: endedAt };
  }

  const [start = "--", end = "--"] = entry.shift.split(" - ");
  return { start, end };
}

function periodRangeLabel(period: "week" | "month", offset: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const spanDays = period === "week" ? 7 : 30;
  start.setDate(start.getDate() - offset * spanDays);
  const end = new Date(start);
  end.setDate(start.getDate() + spanDays - 1);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString([], { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
  const endLabel = end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function weekDateLabel(offset: number) {
  if (offset === 0) return "Today";
  return `${offset} day${offset === 1 ? "" : "s"} ago`;
}

function compactWeekDateLabel(offset: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Yesterday";
  return `${offset} days ago`;
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

function slugifyTicketSubject(subject: string) {
  const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "ticket";
}

function ticketSlug(ticket: Pick<SupportTicket, "id" | "subject">) {
  return `${ticket.id}-${slugifyTicketSubject(ticket.subject)}`;
}

function ticketMatchesSlug(ticket: Pick<SupportTicket, "id" | "subject">, slug: string) {
  return slug === ticket.id || slug === ticketSlug(ticket) || slug.startsWith(`${ticket.id}-`);
}

function ticketDetailHref(surface: Surface, ticket: Pick<SupportTicket, "id" | "subject">) {
  return `${surface === "client" ? "/client-portal" : "/operations-hub"}/tickets/${ticketSlug(ticket)}`;
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

function uniqueNavItems(items: SidebarNavItem[]) {
  const byPage = new Map<PortalPage, SidebarNavItem>();
  items.forEach((item) => byPage.set(item.page, item));
  return Array.from(byPage.values());
}

function groupedOperationsNav(items: SidebarNavItem[]) {
  const available = uniqueNavItems(items);
  const byPage = new Map(available.map((item) => [item.page, item]));
  const pick = (pages: PortalPage[]) => pages.map((page) => byPage.get(page)).filter(Boolean) as SidebarNavItem[];
  return [
    { id: "workforce", label: "Workforce", icon: Clock3, items: pick(["my-timekeeping", "timekeeping", "my-schedule", "scheduling", "hr", "time-off"]) },
    { id: "client-ops", label: "Client Ops", icon: Building2, items: pick(["ticketing", "billing", "client-back-office", "documents"]) },
    { id: "comms", label: "Comms + Docs", icon: MessageSquareText, items: pick(["chat", "company-home", "knowledge"]) },
    { id: "learning", label: "Learning", icon: BookOpenCheck, items: pick(["lms"]) },
    { id: "admin", label: "Admin", icon: Settings, items: pick(["settings"]) }
  ].filter((group) => group.items.length > 0);
}

const reportViews: Array<{ id: ReportView; label: string; icon: typeof LayoutDashboard; items: string[] }> = [
  { id: "general", label: "General", icon: BarChart3, items: ["Executive overview", "Revenue trend", "Ticket volume", "Schedule coverage"] },
  { id: "monitoring", label: "Monitoring", icon: Bell, items: ["SLA breaches", "Open risk", "Overdue training", "PTO coverage"] },
  { id: "technicians", label: "Technicians", icon: UsersRound, items: ["Utilization", "First response", "Completion rate", "Training status"] },
  { id: "satisfaction", label: "Satisfaction", icon: CheckCircle2, items: ["Client sentiment", "Resolved tickets", "Repeat issues", "Portal adoption"] }
];

function actorForPane(role: "staff" | "client", clientId: string): PortalViewer {
  return role === "client" ? { role: "client", clientId } : { role: "admin" };
}

export function OperationsPortalDemo({ surface, ticketSlug: routeTicketSlug }: DemoProps) {
  const store = useOperationsPortalStore();

  const isClient = store.viewer.role === "client";
  const navItems = isClient ? clientNav : uniqueNavItems(visibleOperationsNav(store.viewer).map((item) => ({ ...item, icon: operationsNavIcons[item.page] })));
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({ workforce: true, "client-ops": true });
  const [sidebarMode, setSidebarMode] = useState<"main" | "reports">("main");
  const [activeReport, setActiveReport] = useState<ReportView | null>(null);
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
  const routeTicket = routeTicketSlug ? visibleTickets.find((ticket) => ticketMatchesSlug(ticket, routeTicketSlug)) : undefined;
  const demoClient = store.clients.find((client) => client.id === store.demoClientId) ?? store.clients[0];
  const demoProject = store.projects.find((project) => project.clientId === demoClient.id) ?? store.projects[0];
  const demoInvoice = store.invoices.find((invoice) => invoice.clientId === demoClient.id) ?? store.invoices[0];
  const demoDocument = store.documents.find((document) => document.clientId === demoClient.id) ?? store.documents[0];
  const demoThread = store.threads.find((thread) => thread.clientId === demoClient.id) ?? store.threads[0];
  const demoTicket = store.tickets.find((ticket) => ticket.clientId === demoClient.id) ?? store.tickets[0];
  const onDashboard = store.activePage === "dashboard" && !store.demoMode && !activeReport && !routeTicketSlug;
  const reportLabel = routeTicketSlug ? `Tickets / ${routeTicket?.subject ?? "Ticket"}` : activeReport ? reportViews.find((view) => view.id === activeReport)?.label ?? "Reports" : undefined;
  const selectedContact = selectedClient ? store.contacts.find((contact) => contact.id === selectedClient.primaryContactId) : undefined;
  const currentPerson = isClient
    ? selectedContact?.name ?? selectedClient?.name ?? "there"
    : store.employees.find((employee) => employee.id === currentEmployeeId(store.viewer))?.name ?? "there";
  const firstName = currentPerson.split(" ")[0] ?? "there";
  const dashboardGreeting = isClient
    ? {
        eyebrow: "Client Portal",
        title: `Welcome back, ${firstName}.`,
        body: "Your Eclipse project updates, invoices, documents, support tickets, and messages are ready in one place."
      }
    : store.viewer.role === "manager"
      ? {
          eyebrow: "Operations Hub",
          title: `Good to see you, ${firstName}.`,
          body: "Your Eclipse team schedule, time approvals, PTO coverage, tickets, and training follow-ups are ready for review."
        }
      : store.viewer.role === "employee"
        ? {
            eyebrow: "My Eclipse Workspace",
            title: `Welcome back, ${firstName}.`,
            body: "Your clock, schedule, tasks, training, PTO, and messages are lined up for today."
          }
        : {
            eyebrow: "Operations Hub",
            title: `Welcome back, ${firstName}.`,
            body: "Eclipse operations, client work, scheduling, billing, tickets, learning, and team activity are ready."
          };

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
    if (!routeTicketSlug) return;
    if (surface === "operations") {
      store.setActivePage("ticketing");
    } else {
      store.setActivePage("tickets");
    }
    if (routeTicket) store.setSelectedTicket(routeTicket.id);
  }, [routeTicketSlug, routeTicket?.id, surface]);

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
        <div className="flex items-center justify-between gap-3">
          <Link href="/templates" className={`${portalBrand.fonts.title} text-3xl leading-none text-cream`}>{portalBrand.logoText}</Link>
          {!isClient ? <NotificationBell surface="sidebar" /> : null}
        </div>
        <nav className="mt-7 grid flex-1 content-start gap-1">
          {isClient ? (
            <FlatSidebarNav items={navItems} activePage={store.activePage} onSelect={store.setActivePage} />
          ) : sidebarMode === "reports" ? (
            <ReportsSidebarNav activeReport={activeReport} onBack={() => setSidebarMode("main")} onSelect={(report) => { setActiveReport(report); store.setActivePage("dashboard"); }} />
          ) : (
            <GroupedSidebarNav
              items={navItems}
              activePage={store.activePage}
              reportsActive={Boolean(activeReport)}
              openGroups={openNavGroups}
              onReports={() => setSidebarMode("reports")}
              onToggle={(groupId) => setOpenNavGroups((current) => ({ ...current, [groupId]: !current[groupId] }))}
              onSelect={(page) => { setActiveReport(null); store.setActivePage(page); }}
            />
          )}
        </nav>
        {!isClient && sidebarMode === "main" ? <SidebarProfileButton active={store.activePage === "profile"} onSelect={() => { setActiveReport(null); store.setActivePage("profile"); }} /> : null}
      </aside>

      <main className="md:pl-64">
        <div className="px-4 py-5 md:px-8 md:py-8 xl:px-10">
          {onDashboard ? (
            <header className="rounded-md bg-primary p-5 text-white md:p-7">
              <div className="grid gap-5 xl:grid-cols-[1fr_520px] xl:items-end">
                <div>
                  <p className="text-sm font-semibold text-secondary">{dashboardGreeting.eyebrow}</p>
                  <h1 className="mt-3 max-w-5xl font-title text-5xl leading-[0.9] text-cream md:text-7xl">
                    {dashboardGreeting.title}
                  </h1>
                  <p className="mt-5 max-w-3xl text-sm leading-6 text-white/74 md:text-base">
                    {dashboardGreeting.body}
                  </p>
                </div>
                <ViewerSwitcher selectedClientId={selectedClient.id} />
              </div>
            </header>
          ) : (
            <ModuleTopBar selectedClientId={selectedClient.id} navItems={navItems} isClient={isClient} reportLabel={reportLabel} />
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
            {routeTicketSlug ? (
              <TicketRouteWorkspace ticket={routeTicket} surface={surface} />
            ) : activeReport && !isClient ? (
              <ReportsWorkspace report={activeReport} />
            ) : isClient ? (
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
  const { viewer, setViewer } = useOperationsPortalStore();
  const roleValue = viewer.role === "client" ? "client" : viewer.role === "manager" ? "manager" : viewer.role === "employee" ? "employee" : "owner";

  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/52">Eclipse Workspace</p>
          <p className="mt-1 text-sm text-white/72">Switch roles inside the Eclipse workspace.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
        <div className="grid min-w-0 gap-2 text-sm font-semibold text-white/70">
          Workspace
          <div className="flex h-11 min-w-0 items-center justify-between gap-3 rounded-md border border-white/15 bg-[#101a14] px-3 text-white">
            <span className="truncate">{surfaceForRole(viewer.role)}</span>
            <span className="truncate text-xs font-medium text-white/52">Eclipse</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlatSidebarNav({ items, activePage, onSelect }: { items: SidebarNavItem[]; activePage: PortalPage; onSelect: (page: PortalPage) => void }) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.page} onClick={() => onSelect(item.page)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${activePage === item.page ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            <Icon className="h-[18px] w-[18px] text-secondary" />
            <span className="min-w-0 flex-1">{item.label}</span>
          </button>
        );
      })}
    </>
  );
}

function GroupedSidebarNav({ items, activePage, reportsActive, openGroups, onReports, onToggle, onSelect }: { items: SidebarNavItem[]; activePage: PortalPage; reportsActive: boolean; openGroups: Record<string, boolean>; onReports: () => void; onToggle: (groupId: string) => void; onSelect: (page: PortalPage) => void }) {
  const groups = groupedOperationsNav(items);
  const home = items.find((item) => item.page === "dashboard");

  return (
    <>
      {home ? (
        <button onClick={() => onSelect(home.page)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${activePage === home.page ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
          {(() => {
            const HomeIcon = home.icon;
            return <HomeIcon className="h-[18px] w-[18px] text-secondary" />;
          })()}
          <span className="min-w-0 flex-1">{home.label}</span>
        </button>
      ) : null}
      <button onClick={onReports} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${reportsActive ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
        <BarChart3 className="h-[18px] w-[18px] text-secondary" />
        <span className="min-w-0 flex-1">Reports</span>
        <ArrowRight className="h-4 w-4 text-white/60" />
      </button>
      {groups.map((group) => {
        const Icon = group.icon;
        const active = group.items.some((item) => item.page === activePage);
        const open = openGroups[group.id] ?? active;
        return (
          <div key={group.id} className="grid gap-1">
            <button onClick={() => onToggle(group.id)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`} aria-expanded={open}>
              <Icon className="h-[18px] w-[18px] text-secondary" />
              <span className="min-w-0 flex-1">{group.label}</span>
              <ChevronDown className={`h-4 w-4 text-white/60 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open ? (
              <div className="ml-5 grid gap-1 border-l border-white/12 pl-2">
                {group.items.map((item) => (
                  <button key={item.page} onClick={() => onSelect(item.page)} className={`rounded-md px-3 py-2 text-left text-sm transition ${activePage === item.page ? "bg-secondary/20 text-white" : "text-white/62 hover:bg-white/8 hover:text-white"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function SidebarProfileButton({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const store = useOperationsPortalStore();
  const employee = store.employees.find((item) => item.id === currentEmployeeId(store.viewer)) ?? store.employees[0];
  return (
    <button onClick={onSelect} className={`mt-4 flex items-center gap-3 rounded-md border border-white/12 p-3 text-left transition ${active ? "bg-white/14 text-white" : "bg-white/6 text-white/75 hover:bg-white/10 hover:text-white"}`}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary/25 text-xs font-bold text-secondary">{employee.avatar}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{employee.name}</span>
        <span className="block truncate text-xs text-white/50">Profile</span>
      </span>
      <UserRound className="h-4 w-4 text-secondary" />
    </button>
  );
}

function ReportsSidebarNav({ activeReport, onBack, onSelect }: { activeReport: ReportView | null; onBack: () => void; onSelect: (report: ReportView) => void }) {
  const [openSections, setOpenSections] = useState<Record<ReportView, boolean>>({ general: true, monitoring: false, technicians: false, satisfaction: false });
  return (
    <div className="motion-safe:animate-in motion-safe:slide-in-from-right-4">
      <button onClick={onBack} className="mb-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] text-white/75 transition hover:bg-white/10 hover:text-white">
        <ArrowRight className="h-4 w-4 rotate-180 text-secondary" />
        <span>Back</span>
      </button>
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/42">Operational reports</p>
      <div className="mt-3 grid gap-1">
        {reportViews.map((view) => {
          const Icon = view.icon;
          const open = openSections[view.id] ?? activeReport === view.id;
          return (
            <div key={view.id} className="grid gap-1">
              <button onClick={() => { setOpenSections((current) => ({ ...current, [view.id]: !open })); onSelect(view.id); }} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${activeReport === view.id ? "bg-white/12 text-white" : "text-white/62 hover:bg-white/10 hover:text-white"}`}>
                <Icon className="h-[18px] w-[18px] text-secondary" />
                <span className="min-w-0 flex-1">{view.label}</span>
                <ChevronDown className={`h-4 w-4 text-white/50 transition ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <div className="ml-5 grid gap-1 border-l border-white/12 pl-2">
                  {view.items.map((item) => (
                    <button key={item} onClick={() => onSelect(view.id)} className="rounded-md px-3 py-1.5 text-left text-sm text-white/50 transition hover:bg-white/8 hover:text-white">
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleTopBar({ selectedClientId, navItems, isClient, reportLabel }: { selectedClientId: string; navItems: Array<{ page: PortalPage; label: string; icon: typeof LayoutDashboard }>; isClient: boolean; reportLabel?: string }) {
  const { viewer, activePage, setViewer } = useOperationsPortalStore();
  const roleValue = viewer.role === "client" ? "client" : viewer.role === "manager" ? "manager" : viewer.role === "employee" ? "employee" : "owner";
  const activeLabel = reportLabel ? `Reports / ${reportLabel}` : navItems.find((item) => item.page === activePage)?.label ?? (isClient ? "Client Portal" : "Operations Hub");

  return (
    <header className="rounded-md border border-border bg-white/75 p-3 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary dark:text-secondary">{isClient ? "Client Portal" : "Operations Hub"}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{activeLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex h-10 min-w-[210px] items-center justify-between gap-3 rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
            <span className="truncate">{surfaceForRole(viewer.role)}</span>
            <span className="truncate text-xs font-medium text-muted-foreground dark:text-white/52">Eclipse</span>
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
      meta: `${entry.date} · ${entryHours(entry).toFixed(2)}h${entry.correctedHours ? ` -> ${entry.correctedHours}h` : ""}`,
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
    ? "relative inline-flex h-12 min-w-12 items-center justify-center rounded-md bg-secondary px-3 text-[#203527] hover:bg-[#c4d19f]"
    : "relative inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8";
  const panelClass = surface === "sidebar"
    ? "left-0 top-12 w-[360px]"
    : "right-0 top-12 w-[390px]";

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={buttonClass}>
        <span className="inline-flex items-center gap-2"><Bell className={surface === "sidebar" ? "h-6 w-6" : "h-4 w-4"} />{surface === "sidebar" ? null : " Notifications"}</span>
        {count ? <span className={surface === "sidebar" ? "ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black leading-none text-secondary" : "rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary"}>{count}</span> : null}
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

function ReportsWorkspace({ report }: { report: ReportView }) {
  const store = useOperationsPortalStore();
  const view = reportViews.find((item) => item.id === report) ?? reportViews[0];
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = isOperationsAdmin(store.viewer);
  const visibleTickets = store.tickets.filter((ticket) => admin || scopedIds.includes(ticket.assigneeId));
  const openTickets = visibleTickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed");
  const overdueTickets = visibleTickets.filter(isTicketOverdue);
  const completedTraining = store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status === "complete").length;
  const activeTraining = store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "removed").length;
  const assignedShiftCount = store.shifts.filter((shift) => shift.employeeId && scopedIds.includes(shift.employeeId)).length;
  const utilization = Math.round((assignedShiftCount / Math.max(store.shifts.length, 1)) * 100);
  const reportMetrics: Record<ReportView, Array<{ label: string; value: string; detail: string }>> = {
    general: [
      { label: "Open tickets", value: String(openTickets.length), detail: "Across visible queues" },
      { label: "Scheduled shifts", value: String(assignedShiftCount), detail: "Current period coverage" },
      { label: "Invoices active", value: String(store.invoices.filter((invoice) => invoice.status !== "paid").length), detail: "Sent, payable, or overdue" },
      { label: "Training complete", value: `${Math.round((completedTraining / Math.max(activeTraining, 1)) * 100)}%`, detail: "Assigned enrollments" }
    ],
    monitoring: [
      { label: "SLA breached", value: String(overdueTickets.length), detail: "Due dates past target" },
      { label: "Waiting on client", value: String(visibleTickets.filter((ticket) => ticket.status === "waiting_on_client").length), detail: "Needs customer action" },
      { label: "Pending PTO", value: String(store.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId)).length), detail: "Approval queue" },
      { label: "Overdue LMS", value: String(store.training.filter((item) => item.status === "overdue" && scopedIds.includes(item.employeeId)).length), detail: "Training risk" }
    ],
    technicians: [
      { label: "Utilization", value: `${utilization}%`, detail: "Assigned scheduled work" },
      { label: "Assigned tickets", value: String(visibleTickets.filter((ticket) => ticket.assigneeId).length), detail: "Owned queue" },
      { label: "Resolved", value: String(visibleTickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length), detail: "Completed tickets" },
      { label: "Team members", value: String(scopedIds.length), detail: "Visible employees" }
    ],
    satisfaction: [
      { label: "Client replies", value: String(visibleTickets.filter((ticket) => ticket.source === "client").length), detail: "Portal-originated tickets" },
      { label: "Resolved tickets", value: String(visibleTickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length), detail: "Closed loop" },
      { label: "Repeat issues", value: String(visibleTickets.filter((ticket) => ticket.tags.includes("routine")).length), detail: "Routine recurring work" },
      { label: "Portal docs", value: String(store.documents.filter((document) => document.status !== "draft").length), detail: "Shared client artifacts" }
    ]
  };
  const rows = visibleTickets.slice(0, 6);

  return (
    <section className="grid gap-5">
      <div className="rounded-md border border-border bg-white/80 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary dark:text-secondary">Operational reports</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{view.label}</h2>
          </div>
          <span className="rounded-sm bg-cream px-3 py-2 text-sm font-semibold text-primary dark:bg-white/8 dark:text-secondary">Live demo data</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {reportMetrics[report].map((metric) => (
            <div key={metric.label} className="rounded-md border border-primary/15 bg-white/82 p-4 shadow-sm dark:border-secondary/20 dark:bg-[#203226]">
              <p className="text-sm font-bold text-primary dark:text-secondary">{metric.label}</p>
              <p className="mt-3 text-3xl font-black leading-none text-ink tabular-nums dark:text-cream">{metric.value}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground dark:text-white/64">{metric.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="rounded-md border border-border bg-white/80 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="font-semibold text-ink dark:text-cream">Report detail</p>
          <div className="mt-5 grid gap-3">
            {rows.map((ticket) => (
              <div key={ticket.id} className="grid gap-3 rounded-sm bg-cream/60 p-3 text-sm dark:bg-white/8 md:grid-cols-[1fr_140px_120px]">
                <div>
                  <p className="font-semibold text-ink dark:text-cream">{ticket.subject}</p>
                  <p className="mt-1 text-muted-foreground dark:text-white/62">{getClientName(store, ticket.clientId)} · {ticket.category}</p>
                </div>
                <span className={isTicketOverdue(ticket) ? "font-semibold text-red-700 dark:text-red-200" : "text-muted-foreground dark:text-white/62"}>{ticketSlaLabel(ticket)}</span>
                <span className={`w-fit rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.status)}`}>{statusLabel(ticket.status)}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="rounded-md border border-border bg-white/80 p-5 dark:border-white/10 dark:bg-[#15231a]">
          <p className="font-semibold text-ink dark:text-cream">{view.label} report menu</p>
          <div className="mt-4 grid gap-2">
            {view.items.map((item) => (
              <button key={item} className="rounded-sm border border-border px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8">{item}</button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
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
          <ActionRow key={entry.id} label={`${entry.status === "needs_correction" ? "Correction" : "Timesheet"} · ${employeeName(entry.employeeId)} · ${entry.date}`} value={`${entryHours(entry).toFixed(2)}h${entry.correctedHours ? ` → ${entry.correctedHours}h` : ""}`}>
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
  const dashboardNow = new Date();
  const myHours = store.timeEntries.filter((entry) => entry.employeeId === myId).reduce((sum, entry) => sum + entryHours(entry, dashboardNow), 0);
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
              <MetricTile label="Team hours today" value={`${store.timeEntries.reduce((sum, entry) => sum + entryHours(entry, dashboardNow), 0).toFixed(1)}h`} />
              <MetricTile label="Utilization" value="82%" />
            </>
          ) : manager ? (
            <>
              <MetricTile label="Team hours today" value={`${scopedEntries.reduce((sum, entry) => sum + entryHours(entry, dashboardNow), 0).toFixed(1)}h`} />
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
    <RolePanel eyebrow="Timekeeping" title={admin ? "All timesheets and correction queue" : manager ? "Reports' timesheets and correction queue" : "Shift clock, my hours, and corrections"} icon={Clock3}>
      <div className="grid gap-3">
        {scope === "self" ? <button className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]"><Clock3 className="h-4 w-4" /> Clock in/out</button> : null}
        {rows.map((entry) => (
          <ActionRow key={entry.id} label={`${scope === "self" ? "Me" : employeeName(entry.employeeId)} · ${entry.date}`} value={`${entryHours(entry).toFixed(2)}h${entry.correctedHours ? ` → ${entry.correctedHours}h` : ""} · ${statusLabel(entry.status)}${entry.resolvedAt ? ` · ${entry.resolvedAt}` : ""}`}>
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
    <RolePanel eyebrow="Schedule" title={admin || manager ? "Build and publish the company schedule" : "My published shifts and swap requests"} icon={CalendarDays}>
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
  const [period, setPeriod] = useState<"today" | "week" | "pay-period">("today");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const admin = scope === "all";
  const manager = scope === "team";
  const entries = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId));
  const paid = store.invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const receivable = store.invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const visibleTickets = admin ? store.tickets : store.tickets.filter((ticket) => scopedIds.includes(ticket.assigneeId));
  const openTickets = visibleTickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed");
  const overdueTickets = visibleTickets.filter(isTicketOverdue);
  const pendingApprovals = [
    ...store.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId)),
    ...store.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId)),
    ...store.shifts.filter((shift) => shift.status === "swap_requested" && shift.employeeId && scopedIds.includes(shift.employeeId))
  ];
  const periodMultiplier = period === "today" ? 1 : period === "week" ? 5 : 14;
  const periodEntries = entries.slice(0, periodMultiplier * (scope === "self" ? 1 : 4));
  const periodHours = periodEntries.reduce((sum, entry) => sum + entryHours(entry), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueAge = (invoice: ClientInvoice) => Math.floor((today.getTime() - new Date(`${invoice.dueDate}T00:00:00`).getTime()) / 86_400_000);
  const invoiceStatusTone: Record<ClientInvoice["status"], string> = {
    paid: "bg-[#78A887]",
    sent: "bg-[#7EA0B7]",
    payable: "bg-[#D6B15F]",
    overdue: "bg-[#C8796F]",
    draft: "bg-white/36"
  };
  const invoicePipeline = (["paid", "sent", "payable", "overdue", "draft"] as ClientInvoice["status"][]).map((status) => {
    const invoices = store.invoices.filter((invoice) => invoice.status === status);
    const total = invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    return {
      label: statusLabel(status),
      value: money(total),
      detail: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`,
      barValue: total,
      tone: invoiceStatusTone[status],
      page: "billing" as PortalPage
    };
  });
  const collectionBuckets = [
    { label: "Overdue", invoices: store.invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "draft" && dueAge(invoice) > 0), tone: "bg-[#C8796F]" },
    { label: "Due today", invoices: store.invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "draft" && dueAge(invoice) === 0), tone: "bg-[#D6B15F]" },
    { label: "Due this week", invoices: store.invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "draft" && dueAge(invoice) < 0 && dueAge(invoice) >= -7), tone: "bg-[#7EA0B7]" },
    { label: "Drafts to send", invoices: store.invoices.filter((invoice) => invoice.status === "draft"), tone: "bg-white/36" }
  ].map((bucket) => {
    const total = bucket.invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const nextInvoice = bucket.invoices[0];
    return {
      label: bucket.label,
      value: money(total),
      detail: nextInvoice ? `${bucket.invoices.length} invoices · next ${nextInvoice.number}` : "Nothing waiting here",
      barValue: total,
      tone: bucket.tone,
      page: "billing" as PortalPage
    };
  });
  const workloadQueue = [
    { label: "Open tickets", value: String(openTickets.length), detail: `${overdueTickets.length} past SLA`, barValue: openTickets.length, tone: "bg-[#7EA0B7]", page: "ticketing" as PortalPage },
    { label: "Approvals", value: String(pendingApprovals.length), detail: "PTO, time, and swaps", barValue: pendingApprovals.length, tone: "bg-[#D6B15F]", page: "action-center" as PortalPage },
    { label: "Open shifts", value: String(store.shifts.filter((shift) => shift.status === "open").length), detail: "Need coverage", barValue: store.shifts.filter((shift) => shift.status === "open").length, tone: "bg-[#C8796F]", page: scope === "self" ? "my-schedule" as PortalPage : "scheduling" as PortalPage },
    { label: "Training due", value: String(store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "complete" && item.status !== "removed").length), detail: "Assigned or overdue", barValue: store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "complete" && item.status !== "removed").length, tone: "bg-[#78A887]", page: "lms" as PortalPage }
  ];
  const coverageQueue = [
    { label: "On PTO", value: String(store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "approved").length), detail: "Blocked from scheduling", barValue: store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "approved").length, tone: "bg-[#78A887]", page: scope === "self" ? "time-off" as PortalPage : "scheduling" as PortalPage },
    { label: "Clocked in", value: String(store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId) && entry.clockedIn).length), detail: `${periodHours.toFixed(1)}h in this view`, barValue: store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId) && entry.clockedIn).length, tone: "bg-[#7EA0B7]", page: scope === "self" ? "my-timekeeping" as PortalPage : "timekeeping" as PortalPage },
    { label: "Needs correction", value: String(store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId) && entry.status === "needs_correction").length), detail: "Timesheets to review", barValue: store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId) && entry.status === "needs_correction").length, tone: "bg-[#C8796F]", page: scope === "self" ? "my-timekeeping" as PortalPage : "timekeeping" as PortalPage },
    { label: "Tasks open", value: String(store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done").length), detail: "Assigned work items", barValue: store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done").length, tone: "bg-[#D6B15F]", page: "action-center" as PortalPage }
  ];
  const pulseMetrics = [
    { label: admin ? "Collected" : "Worked", value: admin ? money(paid) : `${periodHours.toFixed(1)}h`, bar: admin ? Math.min(100, Math.round((paid / Math.max(paid + receivable, 1)) * 100)) : Math.min(100, Math.round(periodHours * 4)) },
    { label: admin ? "Receivable" : "Open tasks", value: admin ? money(receivable) : String(store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done").length), bar: admin ? Math.min(100, Math.round((receivable / Math.max(paid + receivable, 1)) * 100)) : 52 },
    { label: "Tickets", value: String(openTickets.length), bar: Math.min(100, openTickets.length * 9) },
    { label: "Approvals", value: String(pendingApprovals.length), bar: Math.min(100, pendingApprovals.length * 12) }
  ];
  const workMix = [
    { label: "Tickets", value: openTickets.length, tone: "bg-[#7EA0B7]" },
    { label: "Training", value: store.training.filter((item) => scopedIds.includes(item.employeeId) && item.status !== "complete" && item.status !== "removed").length, tone: "bg-[#D6B15F]" },
    { label: "PTO", value: store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "pending").length, tone: "bg-[#78A887]" },
    { label: "Invoices", value: admin ? store.invoices.filter((invoice) => invoice.status !== "paid").length : 0, tone: "bg-[#C8796F]" }
  ].filter((item) => item.value > 0 || admin);
  const attentionItems = [
    { label: "Overdue tickets", value: overdueTickets.length, action: "Review SLA queue", page: "ticketing" as PortalPage },
    { label: "Pending approvals", value: pendingApprovals.length, action: "Open action queue", page: "action-center" as PortalPage },
    { label: "Open receivables", value: admin ? money(receivable) : `${openTickets.length} tickets`, action: admin ? "Review invoices" : "Review tickets", page: admin ? "billing" as PortalPage : "ticketing" as PortalPage },
    { label: "Coverage risks", value: store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "approved").length, action: "Check schedule", page: scope === "self" ? "my-schedule" as PortalPage : "scheduling" as PortalPage }
  ];
  const commandNotes = [
    { label: "Next follow-up", value: openTickets[0]?.subject ?? "No open ticket follow-ups" },
    { label: "Busiest queue", value: openTickets.length >= pendingApprovals.length ? `${openTickets.length} active tickets` : `${pendingApprovals.length} approvals waiting` },
    { label: "Coverage", value: `${store.shifts.filter((shift) => shift.status === "open").length} open shifts · ${store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId) && request.status === "approved").length} on PTO` }
  ];
  const recent = [
    ...store.threads.map((thread) => ({ id: thread.id, label: getClientName(store, thread.clientId), value: thread.messages.at(-1)?.body ?? thread.subject, page: "client-back-office" as PortalPage })),
    ...store.tickets.slice(0, 4).map((ticket) => ({ id: ticket.id, label: ticket.source === "client" ? "Client ticket" : "Internal ticket", value: ticket.subject, page: "ticketing" as PortalPage }))
  ].slice(0, 6);

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-md bg-primary text-white dark:bg-[#253629]">
          <div className="grid items-stretch gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] md:p-6">
            <div className="flex h-full flex-col">
              <p className="text-sm font-semibold text-secondary">{scopeLabel(scope)} executive overview</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-cream">
                {admin ? "Eclipse command snapshot." : manager ? "Team coverage and follow-ups." : "Your day at Eclipse."}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72">
                {admin ? `${openTickets.length} open tickets, ${pendingApprovals.length} approvals, and ${money(receivable)} in receivables need attention.` : manager ? `${pendingApprovals.length} team approvals and ${openTickets.length} active tickets are in your queue.` : `${periodHours.toFixed(1)} hours, ${openTickets.length} tickets, and ${pendingApprovals.length} follow-ups are tied to your workspace.`}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["today", "Today"],
                  ["week", "This week"],
                  ["pay-period", "Pay period"]
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setPeriod(id as typeof period)} className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${period === id ? "border-secondary bg-secondary text-[#203527]" : "border-white/15 text-white/78 hover:bg-white/10"}`}>{label}</button>
                ))}
              </div>
              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {commandNotes.map((note) => (
                  <button key={note.label} onClick={() => store.setActivePage(note.label === "Coverage" ? scope === "self" ? "my-schedule" : "scheduling" : note.label === "Next follow-up" ? "ticketing" : "action-center")} className="rounded-md border border-white/12 bg-white/7 p-3 text-left transition hover:bg-white/12">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/42">{note.label}</p>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-cream">{note.value}</p>
                  </button>
                ))}
              </div>
              <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-4">
                {pulseMetrics.map((metric, index) => (
                  <div key={metric.label} className="rounded-md border border-white/12 bg-white/8 p-3">
                    <p className="text-xs font-semibold text-white/58">{metric.label}</p>
                    <p className="mt-2 text-2xl font-black text-cream tabular-nums">{metric.value}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/12">
                      <div className="h-full rounded-full bg-secondary transition-all duration-700 ease-out" style={{ width: `${Math.max(8, metric.bar)}%`, transitionDelay: `${index * 80}ms` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-white/12 bg-[#102017] p-4 shadow-inner">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-secondary">Needs attention</p>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-secondary motion-safe:animate-pulse" />
              </div>
              <div className="mt-4 grid gap-2">
                {attentionItems.map((item) => (
                  <button key={item.label} onClick={() => store.setActivePage(item.page)} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-sm bg-white/8 px-3 py-2 text-left transition hover:bg-white/12">
                    <span>
                      <span className="block text-sm font-semibold text-cream">{item.label}</span>
                      <span className="block text-xs text-white/52">{item.action}</span>
                    </span>
                    <span className="text-xl font-black text-secondary tabular-nums">{item.value}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/42">Work mix</p>
                <div className="mt-3 grid gap-2">
                  {workMix.map((item) => (
                    <div key={item.label} className="grid grid-cols-[80px_1fr_32px] items-center gap-2 text-xs">
                      <span className="font-semibold text-white/62">{item.label}</span>
                      <span className="h-2 rounded-full bg-white/10">
                        <span className={`block h-full rounded-full ${item.tone} transition-all duration-700`} style={{ width: `${Math.max(8, Math.min(100, item.value * 14))}%` }} />
                      </span>
                      <span className="text-right font-bold text-cream tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ClockInWidget employeeId={currentEmployeeId(store.viewer)} onReport={() => store.setActivePage(scope === "self" ? "my-timekeeping" : "timekeeping")} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile label={admin ? "Revenue collected" : "Hours this period"} value={admin ? money(paid) : `${entries.reduce((sum, entry) => sum + entryHours(entry), 0).toFixed(1)}h`} />
        <MetricTile label={admin ? "Accounts receivable" : "Open tasks"} value={admin ? money(receivable) : String(store.tasks.filter((task) => scopedIds.includes(task.employeeId) && task.status !== "done").length)} />
        <MetricTile label="Utilization" value={scope === "self" ? "76%" : scope === "team" ? "78%" : "82%"} />
        <MetricTile label="Operations health" value={scope === "self" ? "On track" : "Stable"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_360px]">
        <DashboardQueuePanel title={admin ? "Invoice pipeline" : "Workload queues"} summary={admin ? `${money(paid)} collected · ${money(receivable)} open` : `${openTickets.length} tickets · ${pendingApprovals.length} approvals`} items={admin ? invoicePipeline : workloadQueue} onOpen={(page) => store.setActivePage(page)} />
        <DashboardQueuePanel title={admin ? "Cash collection queue" : "Coverage and follow-up"} summary={admin ? "Due-date buckets from live invoices" : "Schedule, time, training, and tasks"} items={admin ? collectionBuckets : coverageQueue} onOpen={(page) => store.setActivePage(page)} />
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
    ...store.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId)).map((entry) => ({ id: entry.id, type: entry.status === "needs_correction" ? "Correction" : "Timesheet", title: employeeName(entry.employeeId), meta: `${entry.date} · ${entryHours(entry).toFixed(2)}h${entry.correctedHours ? ` -> ${entry.correctedHours}h` : ""}`, approve: () => store.approveTimeEntry(entry.id), deny: entry.status === "needs_correction" ? () => { const reason = denyReason("Deny correction"); if (reason) store.denyTimeCorrection(entry.id, reason); } : undefined })),
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
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [periodOffset, setPeriodOffset] = useState(0);
  const rows = store.timeEntries.filter((entry) => scopedIds.includes(entry.employeeId)).slice(0, self ? 7 : 35);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <ClockInWidget employeeId={currentId} />
        <EarningsSummaryPanel employeeId={currentId} period={period} offset={periodOffset} onPeriod={setPeriod} onOffset={setPeriodOffset} />
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
                  return <div key={day} className="p-3 text-sm text-muted-foreground dark:text-white/62">{entry ? `${entryHours(entry).toFixed(2)}h · ${statusLabel(entry.status)}` : "No punch"}</div>;
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
  type ShiftDraft = { employeeId: string; day: string; start: string; end: string; site: string; status: StaffShift["status"]; notes: string };
  const [view, setView] = useState<"week" | "month">("week");
  const [syncState, setSyncState] = useState<"loading" | "ready" | "error">("loading");
  const [visibleEmployeeIds, setVisibleEmployeeIds] = useState<string[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShiftDraft | null>(null);
  const [teamPick, setTeamPick] = useState("");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const canManageSchedule = scope === "all" || scope === "team";
  const roster = store.employees.filter((employee) => scopedIds.includes(employee.id));
  const approvedPtoByEmployee = new Map(store.ptoRequests.filter((request) => request.status === "approved").map((request) => [request.employeeId, request]));
  const employees = (visibleEmployeeIds.length ? visibleEmployeeIds : roster.slice(0, canManageSchedule ? 6 : 1).map((employee) => employee.id))
    .map((id) => roster.find((employee) => employee.id === id))
    .filter(Boolean) as typeof roster;
  const days = [
    { key: "Mon", label: "Mon, 8" },
    { key: "Tue", label: "Tue, 9" },
    { key: "Wed", label: "Wed, 10" },
    { key: "Thu", label: "Thu, 11" },
    { key: "Fri", label: "Fri, 12" },
    { key: "Sat", label: "Sat, 13" },
    { key: "Sun", label: "Sun, 14" }
  ];
  const selectedShift = selectedShiftId ? store.shifts.find((shift) => shift.id === selectedShiftId) : undefined;
  const openShifts = store.shifts.filter((shift) => shift.status === "open");
  const unshownEmployees = roster.filter((employee) => !employees.some((visible) => visible.id === employee.id));
  const draftPto = draft?.employeeId ? approvedPtoByEmployee.get(draft.employeeId) : undefined;

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

  useEffect(() => {
    if (visibleEmployeeIds.length || !roster.length) return;
    setVisibleEmployeeIds(roster.slice(0, canManageSchedule ? 6 : 1).map((employee) => employee.id));
  }, [roster.length, canManageSchedule, visibleEmployeeIds.length]);

  function splitShiftTime(time: string) {
    const [start = "9:00 AM", end = "5:00 PM"] = time.split(" - ");
    return { start, end };
  }

  function openShiftEditor(shift: StaffShift) {
    const time = splitShiftTime(shift.time);
    setSelectedShiftId(shift.id);
    setDraft({ employeeId: shift.employeeId ?? "", day: shift.day, start: time.start, end: time.end, site: shift.site, status: shift.status, notes: shift.resolutionNote ?? "" });
  }

  function openNewShift(day = "Mon this week", employeeId = "") {
    if (employeeId && approvedPtoByEmployee.has(employeeId)) {
      setSelectedShiftId(null);
      setDraft({ employeeId: "", day, start: "9:00 AM", end: "5:00 PM", site: "Open coverage", status: "open", notes: "" });
      return;
    }
    setSelectedShiftId(null);
    setDraft({ employeeId, day, start: "9:00 AM", end: "5:00 PM", site: employeeId ? "Cahaba Brewing Co." : "Open coverage", status: employeeId ? "published" : "open", notes: "" });
  }

  async function persistShift() {
    if (!draft) return;
    if (draft.employeeId && approvedPtoByEmployee.has(draft.employeeId)) {
      window.alert(`${employeeName(draft.employeeId)} is on approved PTO and cannot be assigned to this shift.`);
      return;
    }
    const employeeId = draft.employeeId || null;
    const status = employeeId ? draft.status === "open" ? "published" : draft.status : "open";
    const payload = { employeeId, day: draft.day, time: `${draft.start} - ${draft.end}`, site: draft.site, status };
    const response = await fetch("/api/operations-portal/scheduling", {
      method: selectedShift ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(selectedShift ? { shiftId: selectedShift.id, ...payload } : payload)
    });
    const data = await response.json();
    if (!response.ok) {
      window.alert(data.error ?? "Unable to save shift.");
      return;
    }
    store.upsertSchedulingShift(data.shift);
    if (data.shift.employeeId && !visibleEmployeeIds.includes(data.shift.employeeId)) setVisibleEmployeeIds((current) => [...current, data.shift.employeeId]);
    openShiftEditor(data.shift);
  }

  async function claimShift(shift: StaffShift, employeeId: string) {
    if (approvedPtoByEmployee.has(employeeId)) {
      window.alert(`${employeeName(employeeId)} is on approved PTO and cannot be assigned to this shift.`);
      return;
    }
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

  function addTeamMember() {
    if (!teamPick) return;
    setVisibleEmployeeIds((current) => current.includes(teamPick) ? current : [...current, teamPick]);
    setTeamPick("");
  }

  const dayTotals = days.map((day) => {
    const shifts = store.shifts.filter((shift) => shift.day.startsWith(day.key) && (shift.status === "open" || (shift.employeeId && employees.some((employee) => employee.id === shift.employeeId))));
    return { key: day.key, people: new Set(shifts.map((shift) => shift.employeeId).filter(Boolean)).size, hours: shifts.reduce((sum, shift) => sum + shiftHours(shift.time), 0) };
  });

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="grid gap-4">
        <div className="rounded-md border border-border bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary dark:text-secondary">Scheduling calendar</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{canManageSchedule ? "Build the weekly schedule" : "My schedule and swaps"}</h2>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{syncState === "ready" ? "Schedule is synced to Postgres." : syncState === "loading" ? "Loading persisted schedule..." : "Using local cache; schedule API unavailable."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="h-10 rounded-md bg-cream px-4 text-sm font-semibold text-ink dark:bg-white/10 dark:text-cream">Today</button>
              <div className="flex h-10 items-center rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">Jun 8, 2026 - Jun 14, 2026</div>
              {(["week", "month"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`h-10 rounded-md px-3 text-sm font-semibold ${view === item ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{item}</button>)}
              {canManageSchedule ? <SmallAction onClick={() => openNewShift("Mon this week", employees[0]?.id ?? "")}>Create shift</SmallAction> : null}
              {canManageSchedule ? <SmallAction variant="quiet" onClick={() => openNewShift("Mon this week")}>Open shift</SmallAction> : null}
            </div>
          </div>
          {canManageSchedule ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <select value={teamPick} onChange={(event) => setTeamPick(event.target.value)} className="h-10 min-w-[220px] rounded-md border border-border bg-white px-3 text-sm font-semibold dark:border-white/10 dark:bg-[#0f1a14]">
                <option value="">Add team member</option>
                {unshownEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{approvedPtoByEmployee.has(employee.id) ? " - On PTO" : ""}</option>)}
              </select>
              <SmallAction variant="quiet" onClick={addTeamMember}>Add Employees</SmallAction>
              <input placeholder="Search team or role" className="h-10 min-w-[220px] rounded-md border border-border bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f1a14]" />
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-md border border-border bg-white/70 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
          <div className="grid min-w-[1120px] grid-cols-[230px_repeat(7,minmax(126px,1fr))] border-b border-border bg-cream/60 dark:border-white/10 dark:bg-white/8">
            <div className="p-3 text-sm font-semibold text-muted-foreground">View by first name</div>{days.map((day) => <div key={day.key} className="p-3 text-center text-sm font-semibold text-ink dark:text-cream">{view === "week" ? day.label : `${day.key} · month`}</div>)}
          </div>
          <div className="grid min-w-[1120px] grid-cols-[230px_repeat(7,minmax(126px,1fr))] border-b border-border dark:border-white/10">
            <div className="p-3 text-sm font-semibold text-ink dark:text-cream">Open shifts ({openShifts.length})<p className="text-xs font-normal text-muted-foreground">{openShifts.reduce((sum, shift) => sum + shiftHours(shift.time), 0).toFixed(2)} hrs</p></div>
            {days.map((day) => {
              const shifts = openShifts.filter((shift) => shift.day.startsWith(day.key));
              return <div key={day.key} className="min-h-20 border-l border-border p-2 dark:border-white/10">{shifts.map((shift) => <ShiftBlock key={shift.id} shift={shift} onClick={() => openShiftEditor(shift)} />)}</div>;
            })}
          </div>
          {employees.map((employee) => (
            <div key={employee.id} className="grid min-w-[1120px] grid-cols-[230px_repeat(7,minmax(126px,1fr))] border-b border-border last:border-b-0 dark:border-white/10">
              <div className="flex items-center gap-3 p-3 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary/30 text-xs font-bold text-primary dark:bg-secondary/20 dark:text-secondary">{employee.avatar}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink dark:text-cream">{employee.name}</p>
                    {approvedPtoByEmployee.has(employee.id) ? <span className="shrink-0 rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-300/10 dark:text-amber-100">On PTO</span> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground dark:text-white/58">{employee.title}</p>
                </div>
              </div>
              {days.map((day) => {
                const shifts = store.shifts.filter((item) => item.employeeId === employee.id && item.day.startsWith(day.key));
                const pto = approvedPtoByEmployee.get(employee.id);
                return (
                  <div key={day.key} className="min-h-24 border-l border-border p-2 dark:border-white/10">
                    {shifts.map((shift) => <ShiftBlock key={shift.id} shift={shift} onClick={() => openShiftEditor(shift)} />)}
                    {pto && shifts.length === 0 ? <div className="grid h-full min-h-16 place-items-center rounded-md border border-amber-200 bg-amber-50/70 px-2 text-center text-xs font-bold text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">On PTO</div> : null}
                    {canManageSchedule && !pto && shifts.length === 0 ? <button onClick={() => openNewShift(`${day.key} this week`, employee.id)} className="h-full min-h-16 w-full rounded-md border border-dashed border-border text-xs font-semibold text-muted-foreground opacity-0 transition hover:opacity-100 dark:border-white/10">+ Shift</button> : null}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="grid min-w-[1120px] grid-cols-[230px_repeat(7,minmax(126px,1fr))] border-t border-border bg-[#edf0ce] text-primary dark:border-white/10 dark:bg-[#223225] dark:text-cream">
            <div className="p-3 text-sm font-bold">Wages / Hours</div>
            {dayTotals.map((total) => (
              <div key={total.key} className="border-l border-primary/15 bg-white/35 p-3 text-right dark:border-white/10 dark:bg-white/6">
                <p className="text-sm font-bold tabular-nums">${(total.hours * 50).toFixed(2)}</p>
                <p className="mt-1 text-xs font-semibold text-primary/70 dark:text-cream/68">{total.people} {total.people === 1 ? "employee" : "employees"} · {total.hours.toFixed(2)}h</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside className="rounded-md border border-border bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
        {draft ? (
          <div className="grid gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary dark:text-secondary">{selectedShift ? "Edit shift" : "New shift"}</p>
                <h3 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{draft.employeeId ? employeeName(draft.employeeId) : "Open shift"}</h3>
              </div>
              <button onClick={() => { setDraft(null); setSelectedShiftId(null); }} className="text-2xl leading-none text-muted-foreground hover:text-ink dark:hover:text-cream">x</button>
            </div>
            {selectedShift?.status === "swap_requested" ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100">Swap requested for this shift.</div> : null}
            {draftPto ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">{employeeName(draftPto.employeeId)} is on approved PTO ({draftPto.dates}) and cannot be scheduled.</div> : null}
            <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">Team member
              <select value={draft.employeeId} onChange={(event) => setDraft({ ...draft, employeeId: event.target.value, status: event.target.value ? "published" : "open" })} disabled={!canManageSchedule} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
                <option value="">Open shift</option>
                {roster.map((employee) => <option key={employee.id} value={employee.id} disabled={approvedPtoByEmployee.has(employee.id)}>{employee.name}{approvedPtoByEmployee.has(employee.id) ? " - On PTO" : ""}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">Start
                <input value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} disabled={!canManageSchedule} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">End
                <input value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} disabled={!canManageSchedule} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">Day
              <select value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} disabled={!canManageSchedule} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream">
                {days.map((day) => <option key={day.key} value={`${day.key} this week`}>{day.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">Site / role
              <input value={draft.site} onChange={(event) => setDraft({ ...draft, site: event.target.value })} disabled={!canManageSchedule} className="h-11 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-muted-foreground dark:text-white/62">Shift notes
              <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} disabled={!canManageSchedule} className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Leave a note for the employee." />
            </label>
            {canManageSchedule ? (
              <div className="flex flex-wrap gap-2">
                <SmallAction onClick={persistShift}>Save</SmallAction>
                {selectedShift?.status === "open" && draft.employeeId && !draftPto ? <SmallAction variant="quiet" onClick={() => claimShift(selectedShift, draft.employeeId)}>Assign</SmallAction> : null}
                {selectedShift?.status === "swap_requested" ? <><SmallAction variant="quiet" onClick={() => store.approveShiftSwap(selectedShift.id)}>Approve</SmallAction><SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny shift swap"); if (reason) store.denyShiftSwap(selectedShift.id, reason); }}>Deny</SmallAction></> : null}
                {selectedShift ? <SmallAction variant="quiet" onClick={() => setDraft({ ...draft, employeeId: "", status: "open" })}>Make open</SmallAction> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid min-h-[520px] place-items-center rounded-md border border-dashed border-border p-6 text-center dark:border-white/10">
            <div>
              <CalendarDays className="mx-auto h-10 w-10 text-primary dark:text-secondary" />
              <h3 className="mt-3 text-xl font-semibold text-ink dark:text-cream">Select a shift</h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-white/62">Click an existing shift or an empty cell to assign, edit, or publish coverage.</p>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}

function ClockInWidget({ employeeId, onReport }: { employeeId: string; onReport?: () => void }) {
  const store = useOperationsPortalStore();
  const [location, setLocation] = useState<"Office" | "Home" | "Field">("Office");
  const [now, setNow] = useState(() => new Date());
  const employee = store.employees.find((item) => item.id === employeeId) ?? store.employees[0];
  const current = store.timeEntries.find((entry) => entry.employeeId === employeeId && entry.clockedIn);
  const todaysEntries = store.timeEntries.filter((entry) => entry.employeeId === employeeId && entry.date === "Today");
  const todaysHours = todaysEntries.reduce((sum, entry) => sum + entryHours(entry, now), 0);
  const clockTime = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  const [clockValue, meridiem] = clockTime.split(" ");
  const lastPunch = current
    ? `Last clocked in at ${formatPunchTime(current.clockStartedAt) ?? punchTimeFromShift(current.shift, "in")}`
    : todaysEntries.length
      ? `Last clocked out at ${formatPunchTime(todaysEntries[0].clockEndedAt) || punchTimeFromShift(todaysEntries[0].shift, "out")}`
      : "Last clocked out: no punches today";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="grid content-start gap-4 rounded-md border border-border bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink dark:text-cream">Hi, {employee.name}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-white/62">{lastPunch}</p>
        </div>
        <span className="shrink-0 rounded-sm bg-secondary/25 px-2 py-1 text-[11px] font-bold text-secondary">{current ? "In" : "Out"}</span>
      </div>
      <div className={`mx-auto grid h-48 w-48 place-items-center rounded-full border-[10px] bg-white text-center shadow-inner transition-colors dark:bg-[#0f1a14] ${current ? "border-cream shadow-[0_0_26px_rgba(237,240,206,0.28)] dark:border-cream" : "border-border dark:border-white/10"}`}>
        <div>
          <p className="whitespace-nowrap text-[1.8rem] font-black leading-none tracking-normal text-ink tabular-nums dark:text-cream">{clockValue}</p>
          <p className="mt-2 text-[1.8rem] font-black leading-none tracking-normal text-ink dark:text-cream">{meridiem ?? ""}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-cream p-1 dark:bg-white/8">
        {(["Office", "Home", "Field"] as const).map((item) => (
          <button key={item} onClick={() => setLocation(item)} className={`h-8 rounded-full text-[11px] font-bold transition ${location === item ? "bg-secondary text-[#203527] shadow-sm" : "text-muted-foreground hover:bg-white/70 dark:hover:bg-white/10"}`}>
            {item}
          </button>
        ))}
      </div>
      <button onClick={() => store.toggleClock(employeeId)} className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-bold text-white shadow-sm transition ${current ? "bg-[#7d4b3f] hover:bg-[#6b4036]" : "bg-primary hover:bg-primary/90 dark:bg-[#4f6a57]"}`}>
        {current ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {current ? "Clock Out" : "Clock In"}
      </button>
      <div className="rounded-md bg-cream/70 px-4 py-3 text-center dark:bg-white/8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground dark:text-white/58">{current ? "Current session" : "Today total"}</p>
        <p className="mt-1 text-2xl font-black text-primary tabular-nums dark:text-secondary">{(current ? entryHours(current, now) : todaysHours).toFixed(2)}h</p>
      </div>
    </section>
  );
}

function punchTimeFromShift(shift: string, direction: "in" | "out") {
  const [startedAt, endedAt] = shift.split(" - ");
  const value = direction === "in" ? startedAt : endedAt;
  return value?.trim() || "just now";
}

function EarningsSummaryPanel({ employeeId, period, offset, onPeriod, onOffset }: { employeeId: string; period: "week" | "month"; offset: number; onPeriod: (period: "week" | "month") => void; onOffset: (updater: number | ((current: number) => number)) => void }) {
  const store = useOperationsPortalStore();
  const [now, setNow] = useState(() => new Date());
  const payRate = 24;
  const rows = store.timeEntries.filter((entry) => entry.employeeId === employeeId);
  const visibleRows = period === "week" ? rows.slice(Math.max(0, offset * 5), Math.max(0, offset * 5) + 5) : rows.slice(Math.max(0, offset * 18), Math.max(0, offset * 18) + 18);
  const totalHours = visibleRows.reduce((sum, entry) => sum + entryHours(entry, now), 0);
  const totalPay = totalHours * payRate;
  const currentRange = periodRangeLabel(period, offset);
  const previousRange = periodRangeLabel(period, offset + 1);
  const nextRange = offset > 0 ? periodRangeLabel(period, offset - 1) : null;
  const dailyRows = Array.from({ length: period === "week" ? 7 : 12 }, (_, index) => {
    const dayOffset = offset * 7 + index;
    const date = weekDateLabel(dayOffset);
    const entries = rows.filter((entry) => entry.date === date);
    const hours = entries.reduce((sum, entry) => sum + entryHours(entry, now), 0);
    const status = entries.some((entry) => entry.status === "needs_correction") ? "needs correction" : entries.some((entry) => entry.status === "pending") ? "pending" : entries.length ? "approved" : "no punches";
    const firstEntry = entries[entries.length - 1];
    const lastEntry = entries[0];
    const start = firstEntry ? entryTimeRange(firstEntry, now).start : "--";
    const end = lastEntry ? entryTimeRange(lastEntry, now).end : "--";
    return { id: date, label: compactWeekDateLabel(dayOffset), range: entries.length ? `${start} - ${end}` : "No punches", hours, status };
  });
  const weeklyRows = Array.from({ length: Math.ceil(visibleRows.length / 5) }, (_, index) => {
    const entries = visibleRows.slice(index * 5, index * 5 + 5);
    const hours = entries.reduce((sum, entry) => sum + entryHours(entry, now), 0);
    return {
      id: `week-${index}`,
      label: index === 0 ? "Week 1" : `Week ${index + 1}`,
      range: entries.length ? `${entries[entries.length - 1].date} - ${entries[0].date}` : "No entries",
      hours,
      status: entries.some((entry) => entry.status === "needs_correction") ? "needs correction" : entries.some((entry) => entry.status === "pending") ? "pending" : "approved"
    };
  }).filter((row) => row.hours > 0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-primary dark:text-secondary">Earnings + hours</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground dark:text-white/58">{currentRange}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onOffset((current) => current + 1)} className="min-h-9 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary dark:border-white/10 dark:text-secondary">{previousRange}</button>
          <button onClick={() => onOffset((current) => Math.max(0, current - 1))} disabled={!nextRange} className="min-h-9 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-secondary">{nextRange ?? "Current range"}</button>
          <select value={period} onChange={(event) => { onPeriod(event.target.value as "week" | "month"); onOffset(0); }} className="h-9 rounded-md border border-border bg-white px-2 text-sm font-semibold dark:border-white/10 dark:bg-[#0f1a14]">
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricTile label="Worked" value={`${totalHours.toFixed(1)}h`} />
        <MetricTile label="Made" value={money(totalPay)} />
        <MetricTile label="Status" value={visibleRows.some((entry) => entry.status === "pending") ? "Pending" : "Approved"} />
      </div>
      <div className="mt-4 grid gap-2">
        {period === "month" ? weeklyRows.map((row) => (
          <div key={row.id} className="grid gap-2 rounded-md bg-cream/70 px-3 py-3 text-sm dark:bg-white/8 sm:grid-cols-[1fr_auto]">
            <span className="font-semibold text-ink dark:text-cream">{row.label}<span className="ml-2 font-normal text-muted-foreground dark:text-white/50">{row.range}</span></span>
            <span className="text-muted-foreground dark:text-white/62">{row.hours.toFixed(1)}h · {money(row.hours * payRate)} · {row.status}</span>
          </div>
        )) : dailyRows.map((day) => (
          <div key={day.id} className="grid gap-3 rounded-md bg-cream/70 px-3 py-3 text-sm dark:bg-white/8 sm:grid-cols-[1fr_auto] sm:items-center">
            <span className="font-semibold text-ink dark:text-cream">{day.label}</span>
            <span className="flex flex-wrap gap-1.5 sm:justify-end">
              <span className="rounded-sm bg-white/70 px-2 py-1 text-xs font-semibold text-ink dark:bg-white/10 dark:text-cream">{day.range}</span>
              <span className="rounded-sm bg-secondary/30 px-2 py-1 text-xs font-bold text-primary tabular-nums dark:bg-secondary/15 dark:text-secondary">{day.hours.toFixed(2)}h</span>
              <span className="rounded-sm bg-primary/10 px-2 py-1 text-xs font-bold text-primary tabular-nums dark:bg-white/10 dark:text-cream">{money(day.hours * payRate)}</span>
              <span className={`rounded-sm px-2 py-1 text-xs font-bold capitalize ${day.status === "approved" ? "bg-green-50 text-green-700 dark:bg-green-300/10 dark:text-green-100" : day.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-100" : day.status === "needs correction" ? "bg-red-50 text-red-700 dark:bg-red-300/10 dark:text-red-100" : "bg-white/60 text-muted-foreground dark:bg-white/8 dark:text-white/58"}`}>{day.status}</span>
            </span>
          </div>
        ))}
        {period === "month" && weeklyRows.length === 0 ? <p className="rounded-md bg-cream/70 p-3 text-sm text-muted-foreground dark:bg-white/8 dark:text-white/62">No time entries in this period.</p> : null}
      </div>
    </section>
  );
}

function shiftHours(time: string) {
  return shiftDurationHours(time) ?? 0;
}

function ShiftBlock({ shift, onClick }: { shift: StaffShift; onClick: () => void }) {
  const open = shift.status === "open";
  const swap = shift.status === "swap_requested";
  return (
    <button onClick={onClick} className={`mb-2 w-full rounded-md border p-2 text-left text-xs transition hover:-translate-y-0.5 hover:shadow-sm ${swap ? "border-red-300 bg-red-50 text-red-800 dark:border-red-300/30 dark:bg-red-300/10 dark:text-red-100" : open ? "border-dashed border-primary/60 bg-secondary/25 text-primary dark:border-secondary/70 dark:bg-secondary/15 dark:text-secondary" : "border-secondary/40 bg-secondary/20 text-primary dark:text-[#edf0ce]"}`}>
      <p className="font-bold">{shift.time}</p>
      <p className="mt-1 truncate">{open ? "No role" : shift.site}</p>
      {open ? <p className="mt-1 text-[11px] opacity-75">{shift.site}</p> : null}
      {swap ? <p className="mt-2 rounded-sm bg-white/60 px-1.5 py-0.5 text-[11px] font-semibold dark:bg-white/10">Swap requested</p> : null}
    </button>
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
  const [tab, setTab] = useState<"people" | "timeoff">("people");
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const canApprove = scope === "all" || scope === "team";
  const people = store.employees.filter((employee) => scopedIds.includes(employee.id));
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary dark:text-secondary">People hub</p><h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">Directory and Time Off</h2></div><div className="flex gap-2">{(["people", "timeoff"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`h-10 rounded-md px-3 text-sm font-semibold ${tab === item ? "bg-primary text-white dark:bg-[#4f6a57]" : "border border-border text-primary dark:border-white/10 dark:text-secondary"}`}>{item === "people" ? "People" : "Time Off"}</button>)}</div></div>
      {tab === "people" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map((employee) => (
            <article key={employee.id} className="relative rounded-md border border-border bg-white/70 p-4 pr-20 dark:border-white/10 dark:bg-[#15231a]">
              <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-sm bg-primary text-sm font-semibold text-white dark:bg-secondary dark:text-[#101a14]">{employee.avatar}</div>
              <p className="font-semibold text-ink dark:text-cream">{employee.name}</p>
              <p className="text-sm text-muted-foreground dark:text-white/62">{employee.title}</p>
              <div className="pt-10">
                <InfoRow label="PTO balance" value={`${employee.ptoBalance}h`} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {tab === "timeoff" ? <div className="grid gap-3">{store.ptoRequests.filter((request) => scopedIds.includes(request.employeeId)).map((request) => <ActionRow key={request.id} label={`${employeeName(request.employeeId)} · ${request.dates}`} value={`${statusLabel(request.status)} · ${request.hours}h · ${request.type}`}>{canApprove && request.status === "pending" ? <><SmallAction onClick={() => store.approvePtoRequest(request.id)}>Approve</SmallAction><SmallAction variant="danger" onClick={() => { const reason = denyReason("Deny PTO request"); if (reason) store.denyPtoRequest(request.id, reason); }}>Deny</SmallAction></> : null}</ActionRow>)}</div> : null}
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
  const router = useRouter();
  const [mode, setMode] = useState<"queue" | "board">("queue");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | SupportTicket["priority"]>("all");
  const [savedView, setSavedView] = useState<"my" | "unassigned" | "overdue" | "client">("my");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scopedIds = scopedEmployeeIds(store.viewer, store.employees);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const currentEmployee = currentEmployeeId(store.viewer);
  const allScopedTickets = scope === "all" ? store.tickets : store.tickets.filter((ticket) => scopedIds.includes(ticket.assigneeId));
  const tickets = allScopedTickets
    .filter((ticket) => statusFilter === "all" || ticket.status === statusFilter)
    .filter((ticket) => priorityFilter === "all" || ticket.priority === priorityFilter)
    .filter((ticket) => {
      if (savedView === "my") return ticket.assigneeId === currentEmployee || scope === "all";
      if (savedView === "unassigned") return !ticket.assigneeId;
      if (savedView === "overdue") return isTicketOverdue(ticket);
      if (savedView === "client") return ticket.source === "client";
      return true;
    })
    .filter((ticket) => `${ticket.subject} ${ticket.description ?? ""} ${ticket.category} ${ticket.tags.join(" ")} ${getClientName(store, ticket.clientId)}`.toLowerCase().includes(query.toLowerCase()));
  const columns: Array<{ key: TicketBoardColumnKey; label: string; targetStatus: SupportTicket["status"] }> = [
    { key: "open", label: "Open", targetStatus: "open" },
    { key: "in_progress", label: "In progress", targetStatus: "waiting_on_staff" },
    { key: "resolved", label: "Resolved", targetStatus: "resolved" }
  ];
  const boardColumnFor = (status: SupportTicket["status"]) => status === "open" ? "open" : status === "resolved" || status === "closed" ? "resolved" : "in_progress";
  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const progressCount = tickets.filter((ticket) => boardColumnFor(ticket.status) === "in_progress").length;
  const resolvedCount = tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length;
  const patchTicket = async (ticketId: string, changes: Partial<SupportTicket>) => {
    store.updateTicket(ticketId, changes);
    const response = await fetch("/api/operations-portal/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId, ...changes }) });
    const data = await response.json();
    if (data.ticket) store.upsertTicket(data.ticket);
  };
  const onDragEnd = (event: DragEndEvent) => {
    const ticketId = String(event.active.id);
    const columnKey = event.over?.id as TicketBoardColumnKey | undefined;
    const column = columns.find((item) => item.key === columnKey);
    if (!column) return;
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket || ticket.status === column.targetStatus) return;
    void patchTicket(ticketId, { status: column.targetStatus });
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/operations-portal/tickets")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled && data?.tickets) store.setTicketCache(data.tickets); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const bulkChange = async (changes: Partial<SupportTicket>) => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((ticketId) => store.updateTicket(ticketId, changes));
    const response = await fetch("/api/operations-portal/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketIds: selectedIds, ...changes }) });
    const data = await response.json();
    if (Array.isArray(data.tickets)) data.tickets.forEach((ticket: SupportTicket) => store.upsertTicket(ticket));
    setSelectedIds([]);
  };
  const openTicketDetail = (ticket: SupportTicket) => {
    store.setSelectedTicket(ticket.id);
    router.push(ticketDetailHref("operations", ticket));
  };

  return (
    <section className="grid gap-5">
      <div className="rounded-md border border-border bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary dark:text-secondary">Help desk</p>
            <h2 className="mt-1 text-3xl font-semibold text-ink dark:text-cream">Tickets</h2>
          </div>
          <button onClick={async () => { const subject = window.prompt("New ticket subject"); if (subject?.trim()) { store.openTicket(subject.trim()); const response = await fetch("/api/operations-portal/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject.trim(), description: subject.trim(), clientId: store.selectedClientId, category: "Other", source: "internal" }) }); const data = await response.json(); if (data.ticket) { store.upsertTicket(data.ticket); openTicketDetail(data.ticket); } } }} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 dark:bg-[#4f6a57]">
            + New ticket
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border dark:border-white/10">
          <div className="flex gap-6">
            <button onClick={() => setMode("queue")} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${mode === "queue" ? "border-secondary text-ink dark:text-cream" : "border-transparent text-muted-foreground hover:text-ink dark:hover:text-cream"}`}>Tickets</button>
            <button onClick={() => setMode("board")} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${mode === "board" ? "border-secondary text-ink dark:text-cream" : "border-transparent text-muted-foreground hover:text-ink dark:hover:text-cream"}`}>Board</button>
          </div>
          <div className="flex flex-wrap gap-2 pb-3">
            <TicketMetric label="Open" value={String(openCount)} />
            <TicketMetric label="In progress" value={String(progressCount)} />
            <TicketMetric label="Resolved" value={String(resolvedCount)} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_170px_170px_190px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tickets" className="h-11 rounded-md border border-border bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f1a14]" />
          <select value={savedView} onChange={(event) => setSavedView(event.target.value as typeof savedView)} style={selectArrowStyle} className={`${selectWithInsetArrow} h-11 rounded-md border border-border bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f1a14]`}><option value="my">My tickets</option><option value="unassigned">Unassigned</option><option value="overdue">Overdue/SLA</option><option value="client">Client replies</option></select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={selectArrowStyle} className={`${selectWithInsetArrow} h-11 rounded-md border border-border bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f1a14]`}><option value="all">All statuses</option><option value="open">Open</option><option value="waiting_on_staff">In progress</option><option value="waiting_on_client">Waiting on client</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} style={selectArrowStyle} className={`${selectWithInsetArrow} h-11 rounded-md border border-border bg-white px-3 text-sm dark:border-white/10 dark:bg-[#0f1a14]`}><option value="all">All priorities</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
        </div>
      </div>
      {selectedIds.length ? <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-[#15231a]"><span className="font-semibold">{selectedIds.length} selected</span><SmallAction onClick={() => bulkChange({ status: "resolved" })}>Resolve</SmallAction><SmallAction variant="quiet" onClick={() => bulkChange({ assigneeId: currentEmployee })}>Assign to me</SmallAction><SmallAction variant="danger" onClick={() => bulkChange({ status: "closed" })}>Close</SmallAction></div> : null}
      {mode === "board" ? <DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="grid gap-3 xl:grid-cols-3">{columns.map((column) => {
        const columnTickets = tickets.filter((ticket) => boardColumnFor(ticket.status) === column.key).slice(0, 12);
        return (
          <TicketDropColumn key={column.key} id={column.key} label={column.label} count={columnTickets.length}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white/82">{column.label}</p>
              <span className="rounded-full border border-white/18 px-2 py-0.5 text-xs text-white/70">{columnTickets.length}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {columnTickets.map((ticket) => (
                <DraggableTicketCard key={ticket.id} ticket={ticket} clientName={getClientName(store, ticket.clientId)} selected={selectedIds.includes(ticket.id)} onSelect={(checked) => setSelectedIds((current) => checked ? [...current, ticket.id] : current.filter((id) => id !== ticket.id))} onOpen={() => openTicketDetail(ticket)} />
              ))}
            </div>
          </TicketDropColumn>
        );
      })}</div></DndContext> : <TicketQueueTable tickets={tickets} selectedIds={selectedIds} onSelect={(ticketId, checked) => setSelectedIds((current) => checked ? [...current, ticketId] : current.filter((id) => id !== ticketId))} onOpen={openTicketDetail} onPatch={patchTicket} />}
    </section>
  );
}

function TicketQueueTable({ tickets, selectedIds, onSelect, onOpen, onPatch }: { tickets: SupportTicket[]; selectedIds: string[]; onSelect: (ticketId: string, checked: boolean) => void; onOpen: (ticket: SupportTicket) => void; onPatch: (ticketId: string, changes: Partial<SupportTicket>) => Promise<void> }) {
  const store = useOperationsPortalStore();
  return (
    <section className="overflow-x-auto rounded-md border border-border bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
      <div className="min-w-[1080px]">
      <div className="grid grid-cols-[42px_1.7fr_160px_190px_120px_190px_116px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:border-white/10 dark:text-white/52">
        <span />
        <span>Details</span>
        <span>SLA</span>
        <span>Assigned technician</span>
        <span>Priority</span>
        <span>Activity status</span>
        <span>Status</span>
      </div>
      {tickets.slice(0, 36).map((ticket, index) => {
        const clientName = getClientName(store, ticket.clientId);
        const isUnread = ticket.source === "client" && ticket.status !== "closed";
        return (
          <div key={ticket.id} className="grid grid-cols-[42px_1.7fr_160px_190px_120px_190px_116px] items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 hover:bg-cream/55 dark:border-white/10 dark:hover:bg-white/6">
            <input type="checkbox" checked={selectedIds.includes(ticket.id)} onChange={(event) => onSelect(ticket.id, event.target.checked)} className="h-4 w-4" />
            <button onClick={() => onOpen(ticket)} className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-ink dark:text-cream">#{index + 13} {ticket.subject}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground dark:text-white/62"><span className="font-semibold text-primary dark:text-secondary">{clientName}</span> · {ticket.category}</p>
              <p className="mt-1 text-xs text-muted-foreground dark:text-white/50">Created {ticket.lastUpdate} · Modified just now</p>
            </button>
            <span className={`w-fit rounded-sm px-2.5 py-1 text-xs font-bold ${isTicketOverdue(ticket) ? "bg-red-100 text-red-800" : ticket.dueDate ? "bg-emerald-100 text-emerald-800" : "bg-cream text-muted-foreground dark:bg-white/8"}`}>{ticketSlaLabel(ticket).replace("Due in ", "")}</span>
            <button onClick={() => onPatch(ticket.id, { assigneeId: ticket.assigneeId || "employee-jamal" })} className={`text-left text-sm font-semibold ${ticket.assigneeId ? "text-ink dark:text-cream" : "text-primary dark:text-secondary"}`}>{ticket.assigneeId ? employeeName(ticket.assigneeId) : "Assign"}</button>
            <span className="text-sm text-ink dark:text-cream">{ticket.priority === "high" ? "Critical" : ticket.priority === "normal" ? "Normal" : "Low"}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/62"><span className={`h-2 w-2 rounded-full ${isUnread ? "bg-secondary" : ticket.status === "waiting_on_client" ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />{isUnread ? "Unread" : ticket.status === "waiting_on_client" ? "Awaiting customer response" : "Read"}</span>
            <button onClick={() => onPatch(ticket.id, { status: ticket.status === "resolved" ? "closed" : "resolved" })} className={`h-8 rounded-sm px-3 text-xs font-bold uppercase ${ticket.status === "waiting_on_client" ? "bg-secondary text-primary" : ticket.status === "resolved" || ticket.status === "closed" ? "bg-cream text-ink dark:bg-white/10 dark:text-cream" : "bg-primary text-white dark:bg-[#4f6a57]"}`}>{ticket.status === "waiting_on_client" ? "Pending" : statusLabel(ticket.status)}</button>
          </div>
        );
      })}
      </div>
    </section>
  );
}

function TicketDropColumn({ id, children }: { id: TicketBoardColumnKey; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={`rounded-md p-3 text-white transition ${isOver ? "bg-[#334235]" : "bg-[#222522] dark:bg-[#1a211c]"}`}>{children}</div>;
}

function DraggableTicketCard({ ticket, clientName, selected, onSelect, onOpen }: { ticket: SupportTicket; clientName: string; selected: boolean; onSelect: (checked: boolean) => void; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  const style = { transform: CSS.Translate.toString(transform) };
  return (
    <article ref={setNodeRef} style={style} className={`rounded-md border border-white/12 bg-white/6 p-3 transition hover:border-secondary/60 hover:bg-white/10 ${isDragging ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} onClick={(event) => event.stopPropagation()} className="mt-1" />
        <button {...attributes} {...listeners} onClick={onOpen} className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing">
          <p className="text-sm font-semibold leading-snug text-white">{ticket.subject}</p>
          <p className="mt-2 text-xs text-white/62">{clientName} · {ticket.category}</p>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${badgeClass(ticket.priority)}`}>{ticket.priority === "normal" ? "Med" : ticket.priority}</span>
        <span className={`text-xs ${isTicketOverdue(ticket) ? "text-red-200" : "text-white/58"}`}>{ticketSlaLabel(ticket)}</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-white dark:bg-secondary dark:text-primary">{employeeName(ticket.assigneeId).split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">{ticket.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[11px] text-white/68">{tag}</span>)}</div>
    </article>
  );
}

function isTicketOverdue(ticket: SupportTicket) {
  return Boolean(ticket.dueDate && !["resolved", "closed"].includes(ticket.status) && new Date(`${ticket.dueDate}T23:59:59`).getTime() < Date.now());
}

function ticketSlaLabel(ticket: SupportTicket) {
  if (!ticket.dueDate) return "No SLA";
  const days = Math.ceil((new Date(`${ticket.dueDate}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

function TicketMetric({ label, value }: { label: string; value: string }) {
  const accent = label === "Open" ? "bg-[#D6B15F]" : label === "In progress" ? "bg-[#7EA0B7]" : "bg-[#78A887]";
  return (
    <div className="min-w-24 rounded-sm border border-white/10 bg-[#17291d] px-3 py-2 shadow-sm dark:bg-[#17291d]">
      <div className={`mb-2 h-1 w-8 rounded-full ${accent}`} />
      <p className="text-xs font-semibold text-white/72">{label}</p>
      <p className="mt-1 text-xl font-black leading-none text-white tabular-nums">{value}</p>
    </div>
  );
}

function MessagingAppPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const myId = currentEmployeeId(store.viewer);
  const threads = scope === "all" ? store.chatThreads : store.chatThreads.filter((thread) => thread.type === "channel" || thread.memberIds.includes(myId));
  const [selectedId, setSelectedId] = useState(threads[0]?.id);
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newChatType, setNewChatType] = useState<"dm" | "channel">("dm");
  const [newChatName, setNewChatName] = useState("");
  const [newChatMembers, setNewChatMembers] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [memberAdds, setMemberAdds] = useState<string[]>([]);
  const selected = threads.find((thread) => thread.id === selectedId) ?? threads[0];
  const members = selected?.memberIds.map((memberId) => store.employees.find((employee) => employee.id === memberId)).filter((employee): employee is NonNullable<typeof employee> => Boolean(employee)) ?? [];
  const chatName = (thread: typeof threads[number]) => {
    if (thread.type !== "dm") return thread.name;
    const otherMemberId = thread.memberIds.find((memberId) => memberId !== myId) ?? thread.memberIds[0];
    return store.employees.find((employee) => employee.id === otherMemberId)?.name ?? thread.name;
  };
  const employeeOptions = store.employees.filter((employee) => employee.id !== myId);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleThreads = normalizedSearch
    ? threads.filter((thread) => `${chatName(thread)} ${thread.messages.map((message) => `${employeeName(message.employeeId)} ${message.body}`).join(" ")}`.toLowerCase().includes(normalizedSearch))
    : threads;
  const messageResults = normalizedSearch
    ? threads.flatMap((thread) => thread.messages
        .filter((message) => `${chatName(thread)} ${employeeName(message.employeeId)} ${message.body}`.toLowerCase().includes(normalizedSearch))
        .map((message) => ({ thread, message })))
        .slice(0, 8)
    : [];
  const toggleNewChatMember = (employeeId: string) => {
    setNewChatMembers((current) => current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId]);
  };
  const addableMembers = selected ? employeeOptions.filter((employee) => !selected.memberIds.includes(employee.id)) : [];
  const toggleMemberAdd = (employeeId: string) => {
    setMemberAdds((current) => current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId]);
  };
  const startChat = () => {
    if (newChatMembers.length === 0) return;
    const threadId = store.createChatThread(newChatType, newChatMembers, newChatName, myId);
    setSelectedId(threadId);
    setCreating(false);
    setNewChatName("");
    setNewChatMembers([]);
    setSearchQuery("");
  };
  const addMembersToSelected = () => {
    if (!selected || memberAdds.length === 0) return;
    store.addChatMembers(selected.id, memberAdds);
    setMemberAdds([]);
    setAddingMembers(false);
  };
  return (
    <section className="grid h-[min(640px,calc(100vh-180px))] min-h-[500px] overflow-hidden rounded-md border border-border bg-white/70 dark:border-white/10 dark:bg-[#15231a] lg:grid-cols-[280px_1fr_280px]">
      <aside className="flex min-h-0 flex-col border-r border-border p-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-3 p-2">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Channels + DMs</p>
          <button onClick={() => setCreating((value) => !value)} className="rounded-sm border border-border px-2 py-1 text-xs font-bold text-primary hover:bg-cream dark:border-white/10 dark:text-secondary dark:hover:bg-white/8">{creating ? "Close" : "New"}</button>
        </div>
        <label className="mt-2 block">
          <span className="sr-only">Search previous messages</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink placeholder:text-muted-foreground dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream dark:placeholder:text-white/45" placeholder="Search messages" />
        </label>
        {creating ? (
          <div className="mt-3 rounded-md border border-border bg-white p-3 dark:border-white/10 dark:bg-[#0f1a14]">
            <div className="grid grid-cols-2 gap-2">
              {(["dm", "channel"] as const).map((type) => (
                <button key={type} onClick={() => setNewChatType(type)} className={`h-9 rounded-sm text-xs font-bold ${newChatType === type ? "bg-secondary text-primary" : "border border-border text-primary dark:border-white/10 dark:text-cream"}`}>{type === "dm" ? "DM" : "Channel"}</button>
              ))}
            </div>
            {newChatType === "channel" ? <input value={newChatName} onChange={(event) => setNewChatName(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream" placeholder="#channel-name" /> : null}
            <div className="mt-3 max-h-52 overflow-auto pr-1">
              {employeeOptions.map((employee) => (
                <label key={employee.id} className={`mt-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm font-semibold transition ${newChatMembers.includes(employee.id) ? "bg-secondary/20 text-cream" : "text-cream hover:bg-white/8"}`}>
                  <input type="checkbox" checked={newChatMembers.includes(employee.id)} onChange={() => toggleNewChatMember(employee.id)} className="h-4 w-4 accent-[#b4c292]" />
                  <span className="min-w-0 truncate">{employee.name}</span>
                </label>
              ))}
            </div>
            <button disabled={newChatMembers.length === 0} onClick={startChat} className="mt-3 h-10 w-full rounded-md bg-primary text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">Start chat</button>
          </div>
        ) : null}
        <div className="mt-3 grid flex-1 content-start gap-2 overflow-y-auto pr-1">
          {visibleThreads.map((thread) => <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`w-full rounded-md p-3 text-left transition ${thread.id === selected?.id ? "bg-secondary/25" : "hover:bg-white/8"}`}><p className="font-semibold text-cream">{chatName(thread)}</p><p className="text-sm text-white/62">{thread.messages.length} messages</p></button>)}
          {visibleThreads.length === 0 ? <p className="rounded-sm bg-cream/70 p-3 text-sm text-muted-foreground dark:bg-white/8 dark:text-white/62">No chats found.</p> : null}
        </div>
        {messageResults.length ? (
          <div className="mt-5 border-t border-border pt-4 dark:border-white/10">
            <p className="px-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground dark:text-white/45">Previous messages</p>
            <div className="mt-2 grid gap-2">
              {messageResults.map(({ thread, message }) => (
                <button key={`${thread.id}-${message.id}`} onClick={() => setSelectedId(thread.id)} className="rounded-sm bg-[#0f1a14] p-3 text-left">
                  <p className="truncate text-xs font-semibold text-secondary">{chatName(thread)} · {employeeName(message.employeeId)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/72">{message.body}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
      <main className="flex min-h-0 flex-col p-4">{selected ? <><div className="border-b border-border pb-4 dark:border-white/10"><h2 className="text-2xl font-semibold text-ink dark:text-cream">{chatName(selected)}</h2></div><div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1"><div className="grid gap-3">{selected.messages.map((message) => <div key={message.id} className={`max-w-[78%] rounded-md border p-3 shadow-sm ${message.employeeId === myId ? "ml-auto border-[#6d7d56] bg-[#46583a]" : "border-white/10 bg-[#17291d]"}`}><p className="text-sm font-semibold text-cream">{employeeName(message.employeeId)} <span className="font-normal text-white/58">{message.at}</span></p><p className="mt-1 text-sm leading-5 text-white/76">{message.body}</p></div>)}</div></div><ReplyBox value={body} onChange={setBody} onSend={() => { if (body.trim()) { store.sendChatMessage(selected.id, body.trim(), myId); setBody(""); } }} /></> : null}</main>
      <aside className="flex min-h-0 flex-col border-l border-border p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary dark:text-secondary">Team members</p>
          <button disabled={!selected || addableMembers.length === 0} onClick={() => setAddingMembers((value) => !value)} className="rounded-sm border border-border px-2 py-1 text-xs font-bold text-primary hover:bg-cream disabled:opacity-45 dark:border-white/10 dark:text-secondary dark:hover:bg-white/8">{addingMembers ? "Close" : "Add"}</button>
        </div>
        {addingMembers ? (
          <div className="mt-4 rounded-md border border-white/10 bg-[#0f1a14] p-3">
            <div className="max-h-44 overflow-y-auto pr-1">
              {addableMembers.map((employee) => (
                <label key={employee.id} className={`mt-1 flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm font-semibold transition ${memberAdds.includes(employee.id) ? "bg-secondary/20 text-cream" : "text-cream hover:bg-white/8"}`}>
                  <input type="checkbox" checked={memberAdds.includes(employee.id)} onChange={() => toggleMemberAdd(employee.id)} className="h-4 w-4 accent-[#b4c292]" />
                  <span className="min-w-0 truncate">{employee.name}</span>
                </label>
              ))}
              {addableMembers.length === 0 ? <p className="text-sm text-white/58">Everyone is already in this chat.</p> : null}
            </div>
            <button disabled={memberAdds.length === 0} onClick={addMembersToSelected} className="mt-3 h-10 w-full rounded-md bg-primary text-sm font-semibold text-white disabled:opacity-45 dark:bg-[#4f6a57]">Add to chat</button>
          </div>
        ) : null}
        <div className="mt-4 grid flex-1 content-start gap-2 overflow-y-auto pr-1">
          {members.map((member) => (
            <div key={member.id} className="grid grid-cols-[36px_1fr] items-center gap-3 rounded-sm bg-[#0f1a14] p-3">
              <span className="grid h-9 w-9 place-items-center rounded-sm bg-secondary text-xs font-black text-primary">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-cream">{member.name}</span>
                  {member.id === myId ? <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">You</span> : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/58">{member.title}</span>
              </span>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function LearningPortalPanel({ scope }: { scope: PermissionScope }) {
  const store = useOperationsPortalStore();
  const [tab, setTab] = useState<"mine" | "catalog" | "manage">("mine");
  const [selectedCourseId, setSelectedCourseId] = useState("");
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
  const activeEnrollment = selectedCourseId
    ? rows.find((item) => item.courseId === selectedCourseId)
    : rows.find((item) => item.id === selectedEnrollmentId) ?? rows.find((item) => item.status !== "complete") ?? rows[0];
  const activeCourse = store.courseCatalog.find((course) => course.id === (selectedCourseId || activeEnrollment?.courseId)) ?? store.courseCatalog[0];
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
          <LearningBucket title="Required & due" items={required} admin={admin} selectedId={activeEnrollment?.id} onSelect={(id) => { setSelectedCourseId(""); setSelectedEnrollmentId(id); }} onRemove={removeAssignment} />
          <LearningBucket title="In progress" items={inProgress} admin={admin} selectedId={activeEnrollment?.id} onSelect={(id) => { setSelectedCourseId(""); setSelectedEnrollmentId(id); }} onRemove={removeAssignment} />
          <LearningBucket title="Assigned, not started" items={assigned} admin={admin} selectedId={activeEnrollment?.id} onSelect={(id) => { setSelectedCourseId(""); setSelectedEnrollmentId(id); }} onRemove={removeAssignment} />
          <details className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#15231a]"><summary className="cursor-pointer font-semibold text-ink dark:text-cream">Completed + certificates</summary><div className="mt-3 grid gap-2">{completed.map((item) => <button key={item.id} onClick={() => { setSelectedCourseId(""); setSelectedEnrollmentId(item.id); }} className="rounded-sm bg-cream/70 p-3 text-left text-sm dark:bg-white/8"><span className="font-semibold">{item.course}</span><span className="ml-2 text-muted-foreground">{item.certificateIssued ?? "Certificate ready"}</span></button>)}</div></details>
        </div>
        <CoursePlayer course={activeCourse} assignment={activeEnrollment} onComplete={completeSelected} />
      </div> : null}

      {tab === "catalog" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{store.courseCatalog.map((course) => <button key={course.id} onClick={() => { setSelectedCourseId(course.id); setSelectedEnrollmentId(""); setTab("mine"); }} className="rounded-md border border-border bg-white/70 p-4 text-left transition hover:border-secondary/70 hover:bg-secondary/15 dark:border-white/10 dark:bg-[#15231a] dark:hover:bg-white/8"><span className="grid aspect-video w-full place-items-center rounded-sm bg-primary text-secondary dark:bg-secondary dark:text-primary"><BookOpenCheck className="h-8 w-8" /></span><span className="mt-3 block font-semibold text-ink dark:text-cream">{course.title}</span><span className="block text-sm text-muted-foreground dark:text-white/62">{course.category} · {course.duration}</span><span className="mt-2 block text-sm leading-6 text-muted-foreground dark:text-white/68">{course.description}</span><span className="mt-3 inline-flex" onClick={(event) => event.stopPropagation()}><SmallAction onClick={() => { setAssignMode("course"); setAssignCourseId(course.id); setAssignReason("manual"); if (admin) setTab("manage"); else void selfEnroll(course.id); }}>{admin ? "Assign" : "Self-enroll"}</SmallAction></span></button>)}</div> : null}

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
  const sections = ["Appearance", "Company & branding", "Module toggles", "Users & roles", "Integrations", "Billing"];
  const [section, setSection] = useState(sections[0]);
  const [themePreference, setThemePreference] = useState<ThemePreference>("light");
  const themeMode = resolveThemePreference(themePreference);

  useEffect(() => {
    const initial = getStoredThemePreference();
    setThemePreference(initial);
    applyEclipseTheme(initial);
    const sync = (event: Event) => {
      const next = (event as CustomEvent<{ preference: ThemePreference }>).detail?.preference;
      if (next === "light" || next === "dark" || next === "system") setThemePreference(next);
    };
    window.addEventListener("eclipse-theme-change", sync);
    return () => window.removeEventListener("eclipse-theme-change", sync);
  }, []);

  function setTheme(next: ThemePreference) {
    const nextMode = resolveThemePreference(next);
    setThemePreference(next);
    playEclipseTransition(nextMode);
    applyEclipseTheme(next);
    void saveAccountThemePreference(next).catch(() => undefined);
  }

  const themeOptions: Array<{ id: ThemePreference; label: string; detail: string; icon: typeof Sun }> = [
    { id: "light", label: "Light", detail: "Bright workspace for daytime review", icon: Sun },
    { id: "dark", label: "Dark", detail: "Low-glare operations mode", icon: Moon },
    { id: "system", label: "System", detail: "Follow this device setting", icon: Settings }
  ];

  return (
    <section className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-md border border-border bg-white/70 p-3 dark:border-white/10 dark:bg-[#15231a]">
        {sections.map((item) => <button key={item} onClick={() => setSection(item)} className={`mt-2 w-full rounded-md p-3 text-left text-sm font-semibold transition ${section === item ? "bg-secondary/25 text-cream dark:text-cream" : "text-cream hover:bg-white/8"}`}>{item}</button>)}
      </aside>
      <main className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <p className="text-sm font-semibold text-primary dark:text-secondary">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-cream">{section}</h2>
        {section === "Appearance" ? (
          <div className="mt-5 grid gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = themePreference === option.id;
                return (
                  <button key={option.id} onClick={() => setTheme(option.id)} className={`rounded-md border p-4 text-left transition ${active ? "border-secondary bg-secondary/30 text-ink dark:text-cream" : "border-border bg-white/80 text-ink hover:bg-secondary/15 dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream dark:hover:bg-white/8"}`}>
                    <Icon className="h-5 w-5 text-primary dark:text-secondary" />
                    <p className="mt-4 text-lg font-semibold">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{option.detail}</p>
                  </button>
                );
              })}
            </div>
            <div className="rounded-md border border-border bg-cream/70 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
              <p className="text-sm font-semibold text-ink dark:text-cream">Current appearance</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-white/62">{themePreference === "system" ? `System, currently ${themeMode}` : `${themeMode} mode`} is applied across the portal.</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <InfoRow label="Persisted demo state" value="Enabled" />
            <InfoRow label="Scope enforcement" value="Role-gated" />
            <InfoRow label="Module toggles" value="Visible nav updates through permissions helper" />
            <SmallAction onClick={() => window.alert(`${section} saved in demo settings.`)}>Save changes</SmallAction>
          </div>
        )}
      </main>
    </section>
  );
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

function DashboardQueuePanel({ title, summary, items, onOpen }: { title: string; summary: string; items: Array<{ label: string; value: string; detail: string; barValue: number; tone: string; page: PortalPage }>; onOpen: (page: PortalPage) => void }) {
  const max = Math.max(...items.map((item) => item.barValue), 1);
  return (
    <section className="rounded-md border border-border bg-white/70 p-5 dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary dark:text-secondary">{title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground dark:text-white/52">{summary}</p>
        </div>
        <span className="rounded-sm border border-border px-2 py-1 text-xs font-bold text-primary dark:border-white/10 dark:text-secondary">{items.length}</span>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <button key={item.label} onClick={() => onOpen(item.page)} className="rounded-sm border border-border bg-white p-3 text-left transition hover:border-secondary/55 hover:bg-secondary/20 dark:border-white/10 dark:bg-[#0f1a14] dark:hover:border-secondary/45 dark:hover:bg-[#15231a]">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold capitalize text-ink dark:text-cream">{item.label}</span>
                <span className="mt-1 block truncate text-xs font-medium text-muted-foreground dark:text-white/60">{item.detail}</span>
              </span>
              <span className="text-right text-lg font-black text-primary tabular-nums dark:text-white">{item.value}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8 dark:bg-white/16">
              <span className={`block h-full rounded-full ${item.tone} transition-all duration-700 ease-out`} style={{ width: `${Math.max(8, Math.round((item.barValue / max) * 100))}%` }} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
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
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const clientTickets = isClient ? tickets.filter((ticket) => ticket.clientId === store.selectedClientId) : tickets;
  const createClientTicket = async () => {
    if (!subject.trim()) return;
    store.openTicket(subject.trim());
    const response = await fetch("/api/operations-portal/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject.trim(), description: description.trim() || subject.trim(), clientId: store.selectedClientId, category: "Facilities", source: isClient ? "client" : "internal" }) });
    const data = await response.json();
    if (data.ticket) {
      store.upsertTicket(data.ticket);
      openTicketDetail(data.ticket);
    }
    setSubject("");
    setDescription("");
  };
  const openTicketDetail = (ticket: SupportTicket) => {
    store.setSelectedTicket(ticket.id);
    router.push(ticketDetailHref(isClient ? "client" : "operations", ticket));
  };
  return (
    <section className="grid gap-3 xl:grid-cols-[360px_1fr]">
      <div className="grid content-start gap-3">
        <div className="rounded-md border border-border bg-white/65 p-3 dark:border-white/10 dark:bg-[#15231a]">
          <label className="grid gap-2 text-sm font-semibold text-muted-foreground dark:text-white/62">{isClient ? "Create support request" : "Open ticket"}
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 rounded-md border border-border bg-white px-3 text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="New support request" />
          </label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-3 min-h-20 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-[#0f1a14] dark:text-cream" placeholder="Describe the issue, location, and urgency" />
          <button onClick={createClientTicket} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white dark:bg-[#4f6a57]">
            <Ticket className="h-4 w-4" /> Create
          </button>
        </div>
        {clientTickets.map((ticket) => <RowButton key={ticket.id} active={ticket.id === selectedTicket?.id} title={ticket.subject} meta={`${isClient ? ticketSlaLabel(ticket) : getClientName(store, ticket.clientId)} · ${ticket.priority}`} badge={ticket.status} onClick={() => openTicketDetail(ticket)} />)}
      </div>
      <div className="rounded-md border border-dashed border-border bg-white/45 p-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-[#15231a]/60 dark:text-white/58">
        Select a ticket to open its dedicated workspace.
      </div>
    </section>
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

function TicketRouteWorkspace({ ticket, surface }: { ticket?: SupportTicket; surface: Surface }) {
  const backHref = surface === "client" ? "/client-portal" : "/operations-hub";
  if (!ticket) {
    return (
      <section className="rounded-md border border-border bg-white/75 p-5 dark:border-white/10 dark:bg-[#15231a]">
        <Link href={backHref} className="text-sm font-semibold text-primary dark:text-secondary">Back to ticket queue</Link>
        <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-cream">Ticket not found</h2>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white/62">This ticket is unavailable or outside the current viewer's scope.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <Link href={backHref} className="w-fit text-sm font-semibold text-primary hover:underline dark:text-secondary">Back to ticket queue</Link>
      <TicketDetail ticket={ticket} />
    </section>
  );
}

function TicketDetail({ ticket }: { ticket: SupportTicket }) {
  const store = useOperationsPortalStore();
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"internal_note" | "public_reply">("public_reply");
  const [mentionId, setMentionId] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"conversation" | "timeline">("conversation");
  const [tagDraft, setTagDraft] = useState(ticket.tags.join(", "));
  useEffect(() => setTagDraft(ticket.tags.join(", ")), [ticket.id, ticket.tags]);
  const canManage = store.viewer.role === "owner" || store.viewer.role === "admin" || store.viewer.role === "manager";
  const isClient = store.viewer.role === "client";
  const visibleMessages = isClient ? ticket.messages.filter((message) => message.kind !== "internal_note") : ticket.messages;
  const patchTicket = async (changes: Partial<Pick<SupportTicket, "status" | "priority" | "assigneeId" | "category" | "dueDate" | "tags" | "projectId" | "invoiceId">>, comment?: string) => {
    store.updateTicket(ticket.id, changes, comment);
    const response = await fetch("/api/operations-portal/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: ticket.id, ...changes }) });
    const data = await response.json();
    if (data.ticket) store.upsertTicket(data.ticket);
  };
  const sendComment = async () => {
    if (!body.trim()) return;
    const kind = isClient ? "public_reply" : mode;
    const mentions = mentionId ? [mentionId] : [];
    const attachments = attachmentName.trim() ? [{ fileName: attachmentName.trim(), fileUrl: attachmentUrl.trim() || "#" }] : [];
    store.replyToTicket(ticket.id, body.trim(), undefined, kind, mentions);
    const response = await fetch("/api/operations-portal/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", ticketId: ticket.id, body: body.trim(), kind, mentions, attachments }) });
    const data = await response.json();
    if (data.ticket) store.upsertTicket(data.ticket);
    setBody("");
    setMentionId("");
    setAttachmentName("");
    setAttachmentUrl("");
  };
  const convertToProject = () => {
    const project = store.projects.find((item) => item.clientId === ticket.clientId);
    if (project) void patchTicket({ projectId: project.id, status: "waiting_on_staff" }, "Ticket linked to an active project/job.");
  };
  const convertToInvoice = () => {
    const invoice = store.invoices.find((item) => item.clientId === ticket.clientId);
    if (invoice) void patchTicket({ invoiceId: invoice.id }, "Ticket linked to an invoice for billable follow-up.");
  };
  const contact = store.contacts.find((item) => item.clientId === ticket.clientId);
  return (
    <div className="overflow-hidden rounded-md border border-border bg-white/80 shadow-sm dark:border-white/10 dark:bg-[#15231a]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-sm text-muted-foreground dark:text-white/58">#{ticket.id.replace(/\D/g, "").slice(-4) || "1"} · {ticket.lastUpdate}</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink dark:text-cream">{ticket.subject}</h3>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <SmallAction onClick={() => patchTicket({ status: "resolved" }, "Ticket resolved from workspace.")}>Resolve</SmallAction>
            <SmallAction variant="quiet" onClick={() => patchTicket({ status: "open" }, "Ticket reopened from workspace.")}>Reopen</SmallAction>
            <SmallAction variant="danger" onClick={() => patchTicket({ status: "closed" }, "Ticket closed from workspace.")}>Close</SmallAction>
          </div>
        ) : null}
      </div>
      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_360px]">
        <main className="grid content-start gap-5">
          {canManage ? (
            <section className="grid gap-4 rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#0f1a14] lg:grid-cols-5">
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground dark:text-white/62">Status
                <select value={ticket.status} onChange={(event) => patchTicket({ status: event.target.value as SupportTicket["status"] })} style={selectArrowStyle} className={`${selectWithInsetArrow} h-9 rounded-md border border-border bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream`}><option value="open">Open</option><option value="waiting_on_staff">In progress</option><option value="waiting_on_client">Waiting on client</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground dark:text-white/62">Technician
                <select value={ticket.assigneeId} onChange={(event) => patchTicket({ assigneeId: event.target.value })} style={selectArrowStyle} className={`${selectWithInsetArrow} h-9 rounded-md border border-border bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream`}>{store.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground dark:text-white/62">Category
                <select value={ticket.category} onChange={(event) => patchTicket({ category: event.target.value as TicketCategory })} style={selectArrowStyle} className={`${selectWithInsetArrow} h-9 rounded-md border border-border bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream`}><option>HVAC</option><option>Electrical</option><option>Facilities</option><option>Billing</option><option>Access</option><option>Other</option></select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground dark:text-white/62">Priority
                <select value={ticket.priority} onChange={(event) => patchTicket({ priority: event.target.value as SupportTicket["priority"] })} style={selectArrowStyle} className={`${selectWithInsetArrow} h-9 rounded-md border border-border bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream`}><option value="high">Critical</option><option value="normal">Normal</option><option value="low">Low</option></select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground dark:text-white/62">Due
                <input type="date" value={ticket.dueDate ?? ""} onChange={(event) => patchTicket({ dueDate: event.target.value || undefined })} className="h-9 rounded-md border border-border bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream" />
              </label>
            </section>
          ) : null}
          <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
            <p className="text-sm leading-6 text-muted-foreground dark:text-white/68">{ticket.description ?? "No description was provided."}</p>
            <div className="mt-3 flex flex-wrap gap-2">{ticket.tags.map((tag) => <span key={tag} className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary dark:bg-white/8 dark:text-secondary">{tag}</span>)}</div>
            {canManage ? <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onBlur={() => patchTicket({ tags: tagDraft.split(",").map((tag) => tag.trim()).filter(Boolean) })} className="mt-3 h-9 w-full rounded-md border border-border bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15231a]" placeholder="Edit tags, comma separated" /> : null}
          </section>
          <section className={`grid gap-3 rounded-md border p-4 ${!isClient && mode === "internal_note" ? "border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10" : "border-border bg-white/70 dark:border-white/10 dark:bg-[#0f1a14]"}`}>
            {!isClient ? <div className="flex w-fit rounded-md bg-cream p-1 dark:bg-white/8"><button onClick={() => setMode("public_reply")} className={`h-8 rounded-sm px-3 text-sm font-semibold ${mode === "public_reply" ? "bg-white text-ink shadow-sm dark:bg-[#15231a] dark:text-cream" : "text-muted-foreground"}`}>Public reply</button><button onClick={() => setMode("internal_note")} className={`h-8 rounded-sm px-3 text-sm font-semibold ${mode === "internal_note" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground"}`}>Internal note</button></div> : null}
            <textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-[#15231a] dark:text-cream" placeholder={isClient ? "Reply to support" : mode === "internal_note" ? "Private staff note" : "Type your message here"} />
            <div className="grid gap-2 md:grid-cols-3">
              {!isClient ? <select value={mentionId} onChange={(event) => setMentionId(event.target.value)} style={selectArrowStyle} className={`${selectWithInsetArrow} h-10 rounded-md border border-border bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15231a]`}><option value="">Mention teammate</option>{store.employees.map((employee) => <option key={employee.id} value={employee.id}>@{employee.name}</option>)}</select> : null}
              <input value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} placeholder="Attachment name" className="h-10 rounded-md border border-border bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15231a]" />
              <input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="Attachment URL" className="h-10 rounded-md border border-border bg-white px-2 text-sm dark:border-white/10 dark:bg-[#15231a]" />
            </div>
            <button onClick={sendComment} className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white dark:bg-[#4f6a57]">
              <Send className="h-4 w-4" /> {isClient ? "Send reply" : mode === "internal_note" ? "Save internal note" : "Send client reply"}
            </button>
          </section>
          <div className="flex flex-wrap gap-5 border-b border-border dark:border-white/10">
            <button onClick={() => setActiveTab("conversation")} className={`border-b-2 pb-3 text-sm font-semibold ${activeTab === "conversation" ? "border-primary text-ink dark:text-cream" : "border-transparent text-muted-foreground"}`}>Conversation {visibleMessages.length}</button>
            <button onClick={() => setActiveTab("timeline")} className={`border-b-2 pb-3 text-sm font-semibold ${activeTab === "timeline" ? "border-primary text-ink dark:text-cream" : "border-transparent text-muted-foreground"}`}>Ticket activity {ticket.events.length}</button>
          </div>
          {activeTab === "conversation" ? <MessageList messages={visibleMessages} /> : <TicketTimeline ticket={ticket} />}
        </main>
        <aside className="grid content-start gap-4">
          <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
            <p className="font-semibold text-ink dark:text-cream">Requester info</p>
            <div className="mt-4 grid gap-3">
              <InfoRow label="Client" value={getClientName(store, ticket.clientId)} />
              <InfoRow label="Contact" value={contact?.name ?? "Primary contact"} />
              <InfoRow label="Email" value={contact?.email ?? "support@example.com"} />
              <InfoRow label="Status" value={statusLabel(ticket.status)} />
              <InfoRow label="SLA" value={ticketSlaLabel(ticket)} />
            </div>
          </section>
          <section className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
            <p className="font-semibold text-ink dark:text-cream">Ticket tools</p>
            <div className="mt-4 grid gap-2">
              <SmallAction variant="quiet" onClick={convertToProject}>Link to job</SmallAction>
              <SmallAction variant="quiet" onClick={convertToInvoice}>Link invoice</SmallAction>
              {ticket.projectId ? <InfoRow label="Job" value={ticket.projectId} /> : null}
              {ticket.invoiceId ? <InfoRow label="Invoice" value={ticket.invoiceId} /> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MessageList({ messages }: { messages: PortalMessage[] }) {
  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <div key={message.id} className={`rounded-md border p-3 ${message.kind === "internal_note" ? "border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10" : message.authorRole === "client" ? "border-secondary/30 bg-secondary/30 dark:bg-[#243820]" : "border-transparent bg-cream/75 dark:bg-[#1b2d21]"}`}>
          <p className="text-sm font-semibold text-ink dark:text-cream">{message.authorName} <span className="font-normal text-muted-foreground dark:text-white/50">{message.at}</span>{message.kind === "internal_note" ? <span className="ml-2 rounded-sm bg-amber-200 px-1.5 py-0.5 text-[11px] text-amber-900">internal</span> : null}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/68">{message.body}</p>
          {message.mentions?.length ? <p className="mt-2 text-xs font-semibold text-primary dark:text-secondary">Mentions: {message.mentions.map(employeeName).join(", ")}</p> : null}
          {message.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map((attachment) => <a key={attachment.id} href={attachment.fileUrl} className="rounded-sm border border-border px-2 py-1 text-xs font-semibold text-primary hover:bg-white dark:border-white/10 dark:text-secondary">{attachment.fileName}</a>)}</div> : null}
        </div>
      ))}
    </div>
  );
}

function TicketTimeline({ ticket }: { ticket: SupportTicket }) {
  const commentEvents = ticket.messages.map((message) => ({ id: `comment-${message.id}`, at: message.at, actorName: message.authorName, type: message.kind === "internal_note" ? "internal note" : "reply", fromValue: null, toValue: message.body.slice(0, 90) }));
  const events = [...ticket.events, ...commentEvents].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return (
    <div className="grid gap-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-md border border-border bg-white/65 p-3 text-sm dark:border-white/10 dark:bg-white/8">
          <p className="font-semibold text-ink dark:text-cream">{event.actorName} <span className="font-normal text-muted-foreground dark:text-white/50">{event.at}</span></p>
          <p className="mt-1 text-muted-foreground dark:text-white/68">{event.type}{event.fromValue || event.toValue ? `: ${event.fromValue ?? ""}${event.fromValue && event.toValue ? " -> " : ""}${event.toValue ?? ""}` : ""}</p>
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
