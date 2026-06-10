import type { EmployeeProfile, PortalViewer } from "@/lib/operations-portal-data";
import type { PortalPage } from "@/lib/operations-portal-store";

export type OperationsModule =
  | "dashboard"
  | "actionCenter"
  | "timekeeping"
  | "scheduling"
  | "billing"
  | "hr"
  | "documents"
  | "ticketing"
  | "chat"
  | "lms"
  | "knowledge"
  | "companyHome"
  | "clientBackOffice"
  | "settings"
  | "profile"
  | "timeOff";

export type PermissionAction =
  | "viewCompanyKpis"
  | "viewPersonalSnapshot"
  | "manageTeamTime"
  | "requestTimeCorrection"
  | "manageSchedules"
  | "requestScheduleSwap"
  | "manageBilling"
  | "manageHr"
  | "submitPto"
  | "manageDocuments"
  | "useDocuments"
  | "manageTicketQueue"
  | "workAssignedTickets"
  | "useChat"
  | "manageLms"
  | "takeTraining"
  | "editKnowledge"
  | "readKnowledge"
  | "manageCompanyHome"
  | "readCompanyHome"
  | "manageClientBackOffice"
  | "manageSettings";

export type OperationsNavItem = {
  module: OperationsModule;
  page: PortalPage;
  label: string;
  role: "admin" | "manager" | "staff" | "all";
};

export type PermissionScope = "none" | "self" | "team" | "all";
export type ScopedResource = "dashboard" | "timekeeping" | "scheduling" | "hr" | "documents" | "ticketing" | "chat" | "lms" | "knowledge" | "companyHome" | "billing" | "clientBackOffice" | "settings" | "profile" | "timeOff";

const moduleToggles: Record<OperationsModule, boolean> = {
  dashboard: true,
  actionCenter: true,
  timekeeping: true,
  scheduling: true,
  billing: true,
  hr: true,
  documents: true,
  ticketing: true,
  chat: true,
  lms: true,
  knowledge: true,
  companyHome: true,
  clientBackOffice: true,
  settings: true,
  profile: true,
  timeOff: true
};

const adminNav: OperationsNavItem[] = [
  { module: "dashboard", page: "dashboard", label: "Dashboard", role: "admin" },
  { module: "timekeeping", page: "timekeeping", label: "Timekeeping", role: "admin" },
  { module: "scheduling", page: "scheduling", label: "Scheduling", role: "admin" },
  { module: "billing", page: "billing", label: "Invoicing & Billing", role: "admin" },
  { module: "hr", page: "hr", label: "HR", role: "admin" },
  { module: "documents", page: "documents", label: "Documents", role: "admin" },
  { module: "ticketing", page: "ticketing", label: "Ticketing", role: "admin" },
  { module: "chat", page: "chat", label: "Chat", role: "admin" },
  { module: "lms", page: "lms", label: "LMS", role: "admin" },
  { module: "knowledge", page: "knowledge", label: "Knowledge Base", role: "admin" },
  { module: "companyHome", page: "company-home", label: "Company Home", role: "admin" },
  { module: "clientBackOffice", page: "client-back-office", label: "Client Back-Office", role: "admin" },
  { module: "settings", page: "settings", label: "Settings", role: "admin" }
];

const staffNav: OperationsNavItem[] = [
  { module: "dashboard", page: "dashboard", label: "My Day/Home", role: "staff" },
  { module: "timekeeping", page: "my-timekeeping", label: "My Timekeeping", role: "staff" },
  { module: "scheduling", page: "my-schedule", label: "My Schedule", role: "staff" },
  { module: "ticketing", page: "ticketing", label: "My Tasks/Tickets", role: "staff" },
  { module: "chat", page: "chat", label: "Chat", role: "staff" },
  { module: "lms", page: "lms", label: "My Training", role: "staff" },
  { module: "knowledge", page: "knowledge", label: "Knowledge Base", role: "staff" },
  { module: "companyHome", page: "company-home", label: "Company Home", role: "staff" },
  { module: "profile", page: "profile", label: "My Profile", role: "staff" },
  { module: "timeOff", page: "time-off", label: "My Time Off", role: "staff" }
];

const managerNav: OperationsNavItem[] = [
  { module: "dashboard", page: "dashboard", label: "Team Dashboard", role: "manager" },
  ...staffNav.slice(1, 9),
  { module: "timekeeping", page: "timekeeping", label: "Team Timekeeping", role: "manager" },
  { module: "scheduling", page: "scheduling", label: "Team Schedule", role: "manager" },
  { module: "hr", page: "hr", label: "Team PTO", role: "manager" },
  { module: "ticketing", page: "ticketing", label: "Team Tasks", role: "manager" },
  { module: "lms", page: "lms", label: "Team Training", role: "manager" }
];

export function isOperationsAdmin(viewer: PortalViewer) {
  return viewer.role === "owner" || viewer.role === "admin";
}

export function isOperationsStaff(viewer: PortalViewer) {
  return viewer.role === "employee";
}

export function isOperationsManager(viewer: PortalViewer) {
  return viewer.role === "manager";
}

export function resourceScope(viewer: PortalViewer, resource: ScopedResource): PermissionScope {
  if (isOperationsAdmin(viewer)) return "all";
  if (isOperationsManager(viewer)) {
    if (["dashboard", "timekeeping", "scheduling", "hr", "ticketing", "lms"].includes(resource)) return "team";
    if (["documents", "chat", "knowledge", "companyHome", "profile", "timeOff"].includes(resource)) return "self";
    return "none";
  }
  if (isOperationsStaff(viewer)) {
    if (["dashboard", "timekeeping", "scheduling", "hr", "ticketing", "chat", "lms", "documents", "knowledge", "companyHome", "profile", "timeOff"].includes(resource)) return "self";
    return "none";
  }
  return "none";
}

export function scopedEmployeeIds(viewer: PortalViewer, employees: EmployeeProfile[], fallbackEmployeeId = "employee-jamal") {
  const viewerEmployeeId = viewer.role === "manager" ? "employee-marcus" : viewer.role === "owner" ? "employee-dale" : viewer.role === "admin" ? "employee-carol" : fallbackEmployeeId;
  const scope = isOperationsAdmin(viewer) ? "all" : isOperationsManager(viewer) ? "team" : isOperationsStaff(viewer) ? "self" : "none";

  if (scope === "all") return employees.map((employee) => employee.id);
  if (scope === "team") {
    return employees.filter((employee) => employee.managerId === viewerEmployeeId).map((employee) => employee.id);
  }
  if (scope === "self") return [viewerEmployeeId];
  return [];
}

export function can(viewer: PortalViewer, action: PermissionAction) {
  const admin = isOperationsAdmin(viewer);
  if (admin) return true;

  if (isOperationsManager(viewer)) {
    return [
      "viewPersonalSnapshot",
      "manageTeamTime",
      "requestTimeCorrection",
      "manageSchedules",
      "requestScheduleSwap",
      "manageHr",
      "submitPto",
      "useDocuments",
      "manageTicketQueue",
      "workAssignedTickets",
      "useChat",
      "manageLms",
      "takeTraining",
      "readKnowledge",
      "readCompanyHome"
    ].includes(action);
  }

  if (!isOperationsStaff(viewer)) return false;

  return [
    "viewPersonalSnapshot",
    "requestTimeCorrection",
    "requestScheduleSwap",
    "submitPto",
    "useDocuments",
    "workAssignedTickets",
    "useChat",
    "takeTraining",
    "readKnowledge",
    "readCompanyHome"
  ].includes(action);
}

export function visibleOperationsNav(viewer: PortalViewer) {
  const nav = isOperationsAdmin(viewer) ? adminNav : isOperationsManager(viewer) ? managerNav : isOperationsStaff(viewer) ? staffNav : [];
  return nav.filter((item) => moduleToggles[item.module]);
}

export function defaultOperationsPage(viewer: PortalViewer): PortalPage {
  return visibleOperationsNav(viewer)[0]?.page ?? "dashboard";
}

export function pageAllowed(viewer: PortalViewer, page: PortalPage) {
  return visibleOperationsNav(viewer).some((item) => item.page === page);
}
