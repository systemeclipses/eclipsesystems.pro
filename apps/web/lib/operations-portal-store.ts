"use client";

import { create } from "zustand";
import { portalSeedData, type Announcement, type ClientDocument, type ClientInvoice, type ClientProject, type Contact, type CourseCatalogItem, type MessageThread, type OperationsPortalSeed, type PortalMessage, type PortalViewer, type StaffShift, type SupportTicket, type TicketStatus, type TrainingAssignment } from "@/lib/operations-portal-data";
import { defaultOperationsPage, pageAllowed, scopedEmployeeIds } from "@/lib/operations-permissions";

export type PortalPage =
  | "dashboard"
  | "action-center"
  | "my-timekeeping"
  | "timekeeping"
  | "my-schedule"
  | "scheduling"
  | "billing"
  | "hr"
  | "documents"
  | "ticketing"
  | "chat"
  | "lms"
  | "knowledge"
  | "company-home"
  | "client-back-office"
  | "settings"
  | "profile"
  | "time-off"
  | "projects"
  | "invoices"
  | "messages"
  | "tickets"
  | "clients";
export type DemoHighlight = "invoice" | "document" | "message" | "ticket" | "project" | "pto" | null;

export type ActionCounts = {
  actionCenter: number;
  hr: number;
  timekeeping: number;
  scheduling: number;
  ticketing: number;
  lms: number;
  billing: number;
  clientBackOffice: number;
};

export type PortalState = OperationsPortalSeed & {
  viewer: PortalViewer;
  demoMode: boolean;
  demoClientId: string;
  demoStepIndex: number;
  demoAutoplay: boolean;
  demoHighlight: DemoHighlight;
  activePage: PortalPage;
  selectedClientId: string;
  selectedProjectId: string;
  selectedInvoiceId: string;
  selectedDocumentId: string;
  selectedThreadId: string;
  selectedTicketId: string;
  setViewer: (viewer: PortalViewer) => void;
  setDemoMode: (demoMode: boolean) => void;
  setDemoClient: (clientId: string) => void;
  setDemoStep: (stepIndex: number) => void;
  setDemoAutoplay: (demoAutoplay: boolean) => void;
  setDemoHighlight: (highlight: DemoHighlight) => void;
  setActivePage: (page: PortalPage) => void;
  setSelectedClient: (clientId: string) => void;
  setSelectedProject: (projectId: string) => void;
  setSelectedInvoice: (invoiceId: string) => void;
  setSelectedDocument: (documentId: string) => void;
  setSelectedThread: (threadId: string) => void;
  setSelectedTicket: (ticketId: string) => void;
  setSchedulingCache: (shifts: StaffShift[]) => void;
  upsertSchedulingShift: (shift: StaffShift) => void;
  setLearningCache: (courses: CourseCatalogItem[], training: TrainingAssignment[]) => void;
  upsertTrainingAssignment: (assignment: TrainingAssignment) => void;
  toggleClock: (employeeId?: string) => void;
  claimShift: (shiftId: string, employeeId?: string) => void;
  submitPtoRequest: (employeeId: string, dates: string, hours: number) => void;
  approvePtoRequest: (requestId: string, actor?: PortalViewer) => void;
  denyPtoRequest: (requestId: string, reason: string, actor?: PortalViewer) => void;
  approveTimeEntry: (entryId: string, actor?: PortalViewer) => void;
  denyTimeCorrection: (entryId: string, reason: string, actor?: PortalViewer) => void;
  approveShiftSwap: (shiftId: string, actor?: PortalViewer) => void;
  denyShiftSwap: (shiftId: string, reason: string, actor?: PortalViewer) => void;
  updateTicket: (ticketId: string, changes: Partial<Pick<SupportTicket, "assigneeId" | "priority" | "status">>, comment?: string, actor?: PortalViewer) => void;
  assignCourse: (employeeIds: string[], courseId: string, actor?: PortalViewer, reason?: TrainingAssignment["reason"], dueDate?: string) => void;
  removeTrainingAssignment: (assignmentId: string, actor?: PortalViewer) => void;
  completeTrainingAssignment: (assignmentId: string) => void;
  completeOnboardingTask: (taskId: string, actor?: PortalViewer) => void;
  postAnnouncement: (title: string, body: string, actor?: PortalViewer) => void;
  editAnnouncement: (announcementId: string, body: string, actor?: PortalViewer) => void;
  removeAnnouncement: (announcementId: string, actor?: PortalViewer) => void;
  markInvoiceSent: (invoiceId: string) => void;
  updateInvoiceLineItem: (invoiceId: string, lineItemIndex: number, amount: number) => void;
  issueInvoice: (invoiceId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;
  pushDocumentForSignature: (documentId: string) => void;
  signDocument: (documentId: string) => void;
  updateProjectStatus: (projectId: string, status: ClientProject["status"]) => void;
  sendMessage: (threadId: string, body: string, actor?: PortalViewer) => void;
  sendChatMessage: (threadId: string, body: string, employeeId?: string) => void;
  openTicket: (subject: string, actor?: PortalViewer) => void;
  replyToTicket: (ticketId: string, body: string, actor?: PortalViewer) => void;
  resetDemo: () => void;
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneSeed(): OperationsPortalSeed {
  return {
    clients: [...portalSeedData.clients],
    contacts: [...portalSeedData.contacts],
    projects: [...portalSeedData.projects],
    invoices: portalSeedData.invoices.map((invoice) => ({ ...invoice, lineItems: [...invoice.lineItems] })),
    documents: [...portalSeedData.documents],
    documentTemplates: [...portalSeedData.documentTemplates],
    threads: portalSeedData.threads.map((thread) => ({ ...thread, messages: [...thread.messages] })),
    chatThreads: portalSeedData.chatThreads.map((thread) => ({ ...thread, memberIds: [...thread.memberIds], messages: [...thread.messages] })),
    tickets: portalSeedData.tickets.map((ticket) => ({ ...ticket, messages: [...ticket.messages] })),
    employees: [...portalSeedData.employees],
    timeEntries: [...portalSeedData.timeEntries],
    shifts: [...portalSeedData.shifts],
    tasks: [...portalSeedData.tasks],
    courseCatalog: portalSeedData.courseCatalog.map((course) => ({ ...course, lessons: [...course.lessons] })),
    training: [...portalSeedData.training],
    ptoRequests: [...portalSeedData.ptoRequests],
    knowledgeArticles: [...portalSeedData.knowledgeArticles],
    announcements: [...portalSeedData.announcements],
    quickLinks: [...portalSeedData.quickLinks],
    events: [...portalSeedData.events],
    onboardingTasks: [...portalSeedData.onboardingTasks]
  };
}

function defaultClientId(viewer: PortalViewer, clients: OperationsPortalSeed["clients"]) {
  return viewer.role === "client" && viewer.clientId ? viewer.clientId : clients[0].id;
}

function authorFor(viewer: PortalViewer, contacts: Contact[]) {
  if (viewer.role === "client") {
    const contact = contacts.find((item) => item.clientId === viewer.clientId);
    return { authorRole: "client" as const, authorName: contact?.name ?? "Client contact" };
  }
  if (viewer.role === "employee") return { authorRole: "employee" as const, authorName: "Jamal Carter" };
  if (viewer.role === "owner") return { authorRole: "owner" as const, authorName: "Dale Ridgeway" };
  if (viewer.role === "manager") return { authorRole: "employee" as const, authorName: "Marcus Whitfield" };
  return { authorRole: "admin" as const, authorName: "Carol Estrada" };
}

function actorLabel(viewer: PortalViewer, contacts: Contact[]) {
  return authorFor(viewer, contacts).authorName;
}

function stamp(action: "Approved" | "Denied" | "Updated" | "Assigned" | "Removed" | "Posted", viewer: PortalViewer, contacts: Contact[]) {
  return `${action} by ${actorLabel(viewer, contacts)}, Just now`;
}

function actorCanAccessEmployee(state: OperationsPortalSeed, viewer: PortalViewer, employeeId: string) {
  return scopedEmployeeIds(viewer, state.employees).includes(employeeId);
}

function deniedReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Deny requires a reason.");
  return trimmed;
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function messageFrom(viewer: PortalViewer, contacts: Contact[], body: string): PortalMessage {
  return {
    id: makeId("message"),
    ...authorFor(viewer, contacts),
    body,
    at: "Just now"
  };
}

const seed = cloneSeed();
const featuredClientId = seed.clients.find((client) => client.id === "client-cahaba")?.id ?? seed.clients[0].id;

export function invoiceTotal(invoice: Pick<ClientInvoice, "lineItems">) {
  return invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
}

export function visibleForViewer<T extends { clientId: string }>(items: T[], viewer: PortalViewer) {
  return viewer.role === "client" && viewer.clientId ? items.filter((item) => item.clientId === viewer.clientId) : items;
}

export function getClientName(state: Pick<PortalState, "clients">, clientId: string) {
  return state.clients.find((client) => client.id === clientId)?.name ?? "Client";
}

export function getActionCounts(state: Pick<PortalState, "employees" | "ptoRequests" | "timeEntries" | "shifts" | "tickets" | "training" | "invoices" | "threads">, viewer: PortalViewer): ActionCounts {
  const scopedIds = scopedEmployeeIds(viewer, state.employees);
  const isAdmin = viewer.role === "owner" || viewer.role === "admin";
  const hr = state.ptoRequests.filter((request) => request.status === "pending" && scopedIds.includes(request.employeeId)).length;
  const timekeeping = state.timeEntries.filter((entry) => (entry.status === "pending" || entry.status === "needs_correction") && scopedIds.includes(entry.employeeId)).length;
  const scheduling = state.shifts.filter((shift) => shift.status === "swap_requested" && shift.employeeId && scopedIds.includes(shift.employeeId)).length;
  const ticketing = state.tickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed" && scopedIds.includes(ticket.assigneeId)).length;
  const lms = state.training.filter((item) => item.status === "overdue" && scopedIds.includes(item.employeeId)).length;
  const billing = isAdmin ? state.invoices.filter((invoice) => invoice.status === "overdue").length : 0;
  const clientBackOffice = isAdmin ? state.threads.filter((thread) => thread.messages.at(-1)?.authorRole === "client").length : 0;
  return { actionCenter: hr + timekeeping + scheduling + ticketing + lms + billing + clientBackOffice, hr, timekeeping, scheduling, ticketing, lms, billing, clientBackOffice };
}

export const useOperationsPortalStore = create<PortalState>((set) => ({
  ...seed,
  viewer: { role: "admin" },
  demoMode: false,
  demoClientId: featuredClientId,
  demoStepIndex: 0,
  demoAutoplay: false,
  demoHighlight: null,
  activePage: "dashboard",
  selectedClientId: featuredClientId,
  selectedProjectId: seed.projects.find((project) => project.clientId === featuredClientId)?.id ?? seed.projects[0].id,
  selectedInvoiceId: seed.invoices.find((invoice) => invoice.clientId === featuredClientId)?.id ?? seed.invoices[0].id,
  selectedDocumentId: seed.documents.find((document) => document.clientId === featuredClientId)?.id ?? seed.documents[0].id,
  selectedThreadId: seed.threads.find((thread) => thread.clientId === featuredClientId)?.id ?? seed.threads[0].id,
  selectedTicketId: seed.tickets.find((ticket) => ticket.clientId === featuredClientId)?.id ?? seed.tickets[0].id,
  setViewer: (viewer) =>
    set((state) => {
      const selectedClientId = defaultClientId(viewer, state.clients);
      const firstProject = state.projects.find((item) => item.clientId === selectedClientId) ?? state.projects[0];
      const firstInvoice = state.invoices.find((item) => item.clientId === selectedClientId) ?? state.invoices[0];
      const firstDocument = state.documents.find((item) => item.clientId === selectedClientId) ?? state.documents[0];
      const firstThread = state.threads.find((item) => item.clientId === selectedClientId) ?? state.threads[0];
      const firstTicket = state.tickets.find((item) => item.clientId === selectedClientId) ?? state.tickets[0];

      return {
        viewer,
        selectedClientId,
        selectedProjectId: firstProject.id,
        selectedInvoiceId: firstInvoice.id,
        selectedDocumentId: firstDocument.id,
        selectedThreadId: firstThread.id,
        selectedTicketId: firstTicket.id,
        activePage: viewer.role === "client" ? "dashboard" : pageAllowed(viewer, state.activePage) ? state.activePage : defaultOperationsPage(viewer)
      };
    }),
  setDemoMode: (demoMode) => set({ demoMode, demoHighlight: null }),
  setDemoClient: (demoClientId) => set({ demoClientId, demoHighlight: null }),
  setDemoStep: (demoStepIndex) => set({ demoStepIndex }),
  setDemoAutoplay: (demoAutoplay) => set({ demoAutoplay }),
  setDemoHighlight: (demoHighlight) => set({ demoHighlight }),
  setActivePage: (activePage) => set({ activePage }),
  setSelectedClient: (selectedClientId) => set((state) => ({ selectedClientId, viewer: state.viewer.role === "client" ? { role: "client", clientId: selectedClientId } : state.viewer })),
  setSelectedProject: (selectedProjectId) => set({ selectedProjectId, activePage: "projects" }),
  setSelectedInvoice: (selectedInvoiceId) => set({ selectedInvoiceId, activePage: "invoices" }),
  setSelectedDocument: (selectedDocumentId) => set({ selectedDocumentId, activePage: "documents" }),
  setSelectedThread: (selectedThreadId) => set({ selectedThreadId, activePage: "messages" }),
  setSelectedTicket: (selectedTicketId) => set({ selectedTicketId, activePage: "tickets" }),
  setSchedulingCache: (shifts) => set({ shifts }),
  upsertSchedulingShift: (shift) =>
    set((state) => ({
      shifts: state.shifts.some((item) => item.id === shift.id)
        ? state.shifts.map((item) => (item.id === shift.id ? shift : item))
        : [shift, ...state.shifts]
    })),
  setLearningCache: (courses, training) => set({ courseCatalog: courses.map((course) => ({ ...course, lessons: [...course.lessons] })), training }),
  upsertTrainingAssignment: (assignment) =>
    set((state) => ({
      training: state.training.some((item) => item.id === assignment.id)
        ? state.training.map((item) => (item.id === assignment.id ? assignment : item))
        : [assignment, ...state.training]
    })),
  toggleClock: (employeeId) =>
    set((state) => {
      const effectiveEmployeeId = employeeId ?? (state.viewer.role === "manager" ? "employee-marcus" : state.viewer.role === "owner" ? "employee-dale" : state.viewer.role === "admin" ? "employee-carol" : "employee-jamal");
      const activeEntry = state.timeEntries.find((entry) => entry.employeeId === effectiveEmployeeId && entry.clockedIn);
      if (activeEntry) {
        return {
          timeEntries: state.timeEntries.map((entry) => (entry.id === activeEntry.id ? { ...entry, clockedIn: false, hours: Math.max(entry.hours, 8), status: "pending" } : entry))
        };
      }
      return {
        timeEntries: [{
          id: makeId("time"),
          employeeId: effectiveEmployeeId,
          date: "Today",
          shift: "Live clock session",
          hours: 0,
          status: "pending" as const,
          clockedIn: true,
          note: "Started from Time Clock."
        }, ...state.timeEntries]
      };
    }),
  claimShift: (shiftId, employeeId) =>
    set((state) => {
      const effectiveEmployeeId = employeeId ?? (state.viewer.role === "manager" ? "employee-marcus" : state.viewer.role === "owner" ? "employee-dale" : state.viewer.role === "admin" ? "employee-carol" : "employee-jamal");
      if (!actorCanAccessEmployee(state, state.viewer, effectiveEmployeeId)) return {};
      return {
        shifts: state.shifts.map((shift) => (shift.id === shiftId && shift.status === "open" ? { ...shift, employeeId: effectiveEmployeeId, status: "published" as const, resolvedBy: actorLabel(state.viewer, state.contacts), resolvedAt: stamp("Assigned", state.viewer, state.contacts) } : shift))
      };
    }),
  submitPtoRequest: (employeeId, dates, hours) =>
    set((state) => {
      if (!actorCanAccessEmployee(state, state.viewer, employeeId)) return {};
      return {
        ptoRequests: [{
          id: makeId("pto"),
          employeeId,
          dates,
          hours: safeNumber(hours),
          status: "pending" as const,
          type: "personal" as const,
          notification: "Submitted just now."
        }, ...state.ptoRequests]
      };
    }),
  approvePtoRequest: (requestId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const request = state.ptoRequests.find((item) => item.id === requestId);
      if (!request || request.status !== "pending" || !actorCanAccessEmployee(state, effectiveViewer, request.employeeId)) return {};
      const resolvedAt = stamp("Approved", effectiveViewer, state.contacts);
      return {
        ptoRequests: state.ptoRequests.map((item) => (item.id === requestId ? { ...item, status: "approved", resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt, notification: `${resolvedAt}: PTO approved for ${item.dates}.` } : item)),
        employees: state.employees.map((employee) => (employee.id === request.employeeId ? { ...employee, ptoBalance: Math.max(0, employee.ptoBalance - request.hours), ptoUsed: employee.ptoUsed + request.hours } : employee)),
        demoHighlight: "pto"
      };
    }),
  denyPtoRequest: (requestId, reason, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const request = state.ptoRequests.find((item) => item.id === requestId);
      const note = deniedReason(reason);
      if (!request || request.status !== "pending" || !actorCanAccessEmployee(state, effectiveViewer, request.employeeId)) return {};
      const resolvedAt = stamp("Denied", effectiveViewer, state.contacts);
      return {
        ptoRequests: state.ptoRequests.map((item) => (item.id === requestId ? { ...item, status: "denied", resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt, resolutionNote: note, notification: `${resolvedAt}: PTO denied. ${note}` } : item)),
        demoHighlight: "pto"
      };
    }),
  approveTimeEntry: (entryId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const entry = state.timeEntries.find((item) => item.id === entryId);
      if (!entry || entry.status === "approved" || !actorCanAccessEmployee(state, effectiveViewer, entry.employeeId)) return {};
      return {
        timeEntries: state.timeEntries.map((item) => (item.id === entryId ? { ...item, status: "approved", hours: item.correctedHours ?? item.hours, resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt: stamp("Approved", effectiveViewer, state.contacts), resolutionNote: item.status === "needs_correction" ? "Corrected punch applied." : "Timesheet period approved and locked." } : item))
      };
    }),
  denyTimeCorrection: (entryId, reason, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const entry = state.timeEntries.find((item) => item.id === entryId);
      const note = deniedReason(reason);
      if (!entry || entry.status !== "needs_correction" || !actorCanAccessEmployee(state, effectiveViewer, entry.employeeId)) return {};
      return {
        timeEntries: state.timeEntries.map((item) => (item.id === entryId ? { ...item, status: "approved", correctedHours: undefined, resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt: stamp("Denied", effectiveViewer, state.contacts), resolutionNote: note } : item))
      };
    }),
  approveShiftSwap: (shiftId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const shift = state.shifts.find((item) => item.id === shiftId);
      if (!shift || shift.status !== "swap_requested" || !shift.employeeId || !shift.swapWithEmployeeId || !actorCanAccessEmployee(state, effectiveViewer, shift.employeeId) || !actorCanAccessEmployee(state, effectiveViewer, shift.swapWithEmployeeId)) return {};
      return {
        shifts: state.shifts.map((item) => (item.id === shiftId ? { ...item, employeeId: shift.swapWithEmployeeId, swapWithEmployeeId: shift.employeeId, status: "published", resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt: stamp("Approved", effectiveViewer, state.contacts), resolutionNote: `Reassigned from ${shift.employeeId} to ${shift.swapWithEmployeeId}.` } : item))
      };
    }),
  denyShiftSwap: (shiftId, reason, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const shift = state.shifts.find((item) => item.id === shiftId);
      const note = deniedReason(reason);
      if (!shift || shift.status !== "swap_requested" || !shift.employeeId || !actorCanAccessEmployee(state, effectiveViewer, shift.employeeId)) return {};
      return {
        shifts: state.shifts.map((item) => (item.id === shiftId ? { ...item, status: "published", resolvedBy: actorLabel(effectiveViewer, state.contacts), resolvedAt: stamp("Denied", effectiveViewer, state.contacts), resolutionNote: note } : item))
      };
    }),
  updateTicket: (ticketId, changes, comment, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const ticket = state.tickets.find((item) => item.id === ticketId);
      const nextAssignee = changes.assigneeId ?? ticket?.assigneeId;
      if (!ticket || !nextAssignee || !actorCanAccessEmployee(state, effectiveViewer, ticket.assigneeId) || !actorCanAccessEmployee(state, effectiveViewer, nextAssignee)) return {};
      return {
        tickets: state.tickets.map((item) => {
          if (item.id !== ticketId) return item;
          const messages = comment?.trim() ? [...item.messages, messageFrom(effectiveViewer, state.contacts, comment.trim())] : item.messages;
          return { ...item, ...changes, messages, lastUpdate: "Just now" };
        })
      };
    }),
  assignCourse: (employeeIds, courseId, actor, reason = "manual", dueDate) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const course = state.courseCatalog.find((item) => item.id === courseId);
      if (!course) return {};
      const allowedIds = employeeIds.filter((employeeId) => actorCanAccessEmployee(state, effectiveViewer, employeeId));
      const existing = new Set(state.training.map((item) => `${item.employeeId}:${item.courseId}:${item.status}`));
      const additions = allowedIds
        .filter((employeeId) => !existing.has(`${employeeId}:${courseId}:assigned`) && !existing.has(`${employeeId}:${courseId}:in_progress`) && !existing.has(`${employeeId}:${courseId}:complete`))
        .map((employeeId) => ({
          id: makeId("training"),
          employeeId,
          courseId,
          course: course.title,
          status: "assigned" as const,
          reason,
          due: dueDate ? `Due ${dueDate}` : "2 weeks from now",
          dueDate,
          progress: 0,
          currentLesson: 0,
          assignedBy: stamp("Assigned", effectiveViewer, state.contacts)
        }));
      return { training: [...additions, ...state.training] };
    }),
  removeTrainingAssignment: (assignmentId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const assignment = state.training.find((item) => item.id === assignmentId);
      if (!assignment || !actorCanAccessEmployee(state, effectiveViewer, assignment.employeeId)) return {};
      return {
        training: state.training.map((item) => (item.id === assignmentId ? { ...item, status: "removed", removedBy: actorLabel(effectiveViewer, state.contacts), removedAt: stamp("Removed", effectiveViewer, state.contacts) } : item))
      };
    }),
  completeTrainingAssignment: (assignmentId) =>
    set((state) => ({
      training: state.training.map((item) => (item.id === assignmentId ? { ...item, status: "complete", progress: 100, certificateIssued: "Just now" } : item))
    })),
  completeOnboardingTask: (taskId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const task = state.onboardingTasks.find((item) => item.id === taskId);
      if (!task || !actorCanAccessEmployee(state, effectiveViewer, task.employeeId)) return {};
      const nextTasks = state.onboardingTasks.map((item) => (item.id === taskId ? { ...item, status: "done" as const } : item));
      const remaining = nextTasks.some((item) => item.employeeId === task.employeeId && item.status !== "done");
      return {
        onboardingTasks: nextTasks,
        employees: remaining ? state.employees : state.employees.map((employee) => (employee.id === task.employeeId ? { ...employee, status: "active" as const } : employee))
      };
    }),
  postAnnouncement: (title, body, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      if (!(effectiveViewer.role === "owner" || effectiveViewer.role === "admin")) return {};
      const announcement: Announcement = { id: makeId("announcement"), title, body, authorId: effectiveViewer.role === "owner" ? "employee-dale" : "employee-carol", at: "Just now" };
      return { announcements: [announcement, ...state.announcements] };
    }),
  editAnnouncement: (announcementId, body, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      if (!(effectiveViewer.role === "owner" || effectiveViewer.role === "admin")) return {};
      return { announcements: state.announcements.map((announcement) => (announcement.id === announcementId ? { ...announcement, body, at: "Just now" } : announcement)) };
    }),
  removeAnnouncement: (announcementId, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      if (!(effectiveViewer.role === "owner" || effectiveViewer.role === "admin")) return {};
      return { announcements: state.announcements.filter((announcement) => announcement.id !== announcementId) };
    }),
  markInvoiceSent: (invoiceId) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: "sent", issuedAt: "Just now" } : invoice))
    })),
  updateInvoiceLineItem: (invoiceId, lineItemIndex, amount) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, lineItems: invoice.lineItems.map((item, index) => (index === lineItemIndex ? { ...item, amount: safeNumber(amount) } : item)) } : invoice))
    })),
  issueInvoice: (invoiceId) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: "payable" } : invoice))
    })),
  markInvoicePaid: (invoiceId) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: "paid" } : invoice))
    })),
  pushDocumentForSignature: (documentId) =>
    set((state) => ({
      documents: state.documents.map((document) => (document.id === documentId ? { ...document, status: "awaiting_signature", updatedAt: "Just now" } : document))
    })),
  signDocument: (documentId) =>
    set((state) => ({
      documents: state.documents.map((document) => (document.id === documentId ? { ...document, status: "signed", updatedAt: "Just now" } : document))
    })),
  updateProjectStatus: (projectId, status) =>
    set((state) => ({
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, status, updatedAt: "Just now" } : project))
    })),
  sendMessage: (threadId, body, actor) =>
    set((state) => ({
      threads: state.threads.map((thread) => (thread.id === threadId ? { ...thread, messages: [...thread.messages, messageFrom(actor ?? state.viewer, state.contacts, body)] } : thread))
    })),
  sendChatMessage: (threadId, body, employeeId) =>
    set((state) => {
      const fallbackEmployeeId = state.viewer.role === "manager" ? "employee-marcus" : state.viewer.role === "owner" ? "employee-dale" : state.viewer.role === "admin" ? "employee-carol" : "employee-jamal";
      return {
        chatThreads: state.chatThreads.map((thread) => (
          thread.id === threadId
            ? { ...thread, messages: [...thread.messages, { id: makeId("chat-message"), employeeId: employeeId ?? fallbackEmployeeId, body, at: "Just now" }] }
            : thread
        ))
      };
    }),
  openTicket: (subject, actor) =>
    set((state) => {
      const effectiveViewer = actor ?? state.viewer;
      const clientId = defaultClientId(effectiveViewer, state.clients);
      const ticket: SupportTicket = {
        id: makeId("ticket"),
        clientId,
        subject,
        priority: "normal",
        status: effectiveViewer.role === "client" ? "waiting_on_staff" : "open",
        assigneeId: "employee-jamal",
        source: effectiveViewer.role === "client" ? "client" : "internal",
        lastUpdate: "Just now",
        messages: [messageFrom(effectiveViewer, state.contacts, `Opened ticket: ${subject}`)]
      };
      return { tickets: [ticket, ...state.tickets], selectedTicketId: ticket.id, activePage: "tickets" };
    }),
  replyToTicket: (ticketId, body, actor) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;
        const effectiveViewer = actor ?? state.viewer;
        const nextStatus = effectiveViewer.role === "client" ? "waiting_on_staff" : "waiting_on_client";
        return { ...ticket, status: nextStatus, lastUpdate: "Just now", messages: [...ticket.messages, messageFrom(effectiveViewer, state.contacts, body)] };
      })
    })),
  resetDemo: () =>
    set((state) => {
    const next = cloneSeed();
    return {
      ...next,
      viewer: { role: "admin" },
      demoMode: state.demoMode,
      demoClientId: state.demoClientId,
      demoStepIndex: 0,
      demoAutoplay: false,
      demoHighlight: null,
      activePage: "dashboard",
      selectedClientId: featuredClientId,
      selectedProjectId: next.projects.find((project) => project.clientId === featuredClientId)?.id ?? next.projects[0].id,
      selectedInvoiceId: next.invoices.find((invoice) => invoice.clientId === featuredClientId)?.id ?? next.invoices[0].id,
      selectedDocumentId: next.documents.find((document) => document.clientId === featuredClientId)?.id ?? next.documents[0].id,
      selectedThreadId: next.threads.find((thread) => thread.clientId === featuredClientId)?.id ?? next.threads[0].id,
      selectedTicketId: next.tickets.find((ticket) => ticket.clientId === featuredClientId)?.id ?? next.tickets[0].id
    };
  })
}));

export type { ClientDocument, ClientInvoice, ClientProject, MessageThread, SupportTicket };
