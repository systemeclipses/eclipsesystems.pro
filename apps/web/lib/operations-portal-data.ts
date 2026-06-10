import { lmsCourseCatalog } from "@/lib/operations-lms-content";

export type PortalRole = "owner" | "admin" | "manager" | "employee" | "client";

export type PortalViewer = {
  role: PortalRole;
  clientId?: string;
};

type RelativeUnit = "day" | "week" | "month";

function rel(value: number, unit: RelativeUnit = "day") {
  if (value === 0) return "Today";
  const abs = Math.abs(value);
  const label = `${abs} ${unit}${abs === 1 ? "" : "s"}`;
  return value < 0 ? `${label} ago` : value === 1 && unit === "day" ? "Tomorrow" : `${label} from now`;
}

function due(value: number) {
  return value < 0 ? `Overdue by ${Math.abs(value)} day${Math.abs(value) === 1 ? "" : "s"}` : rel(value);
}

export type ClientCompany = {
  id: string;
  name: string;
  industry: string;
  health: "green" | "amber" | "red";
  primaryContactId: string;
  status: "active" | "implementation" | "at_risk";
  since: string;
  phone: string;
};

export type Contact = {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
};

export type ProjectStatus = "Discovery" | "In progress" | "Client review" | "Blocked" | "Launched";

export type ClientProject = {
  id: string;
  clientId: string;
  name: string;
  status: ProjectStatus;
  manager: string;
  teamMemberIds: string[];
  nextMilestone: string;
  updatedAt: string;
  milestoneCount: number;
};

export type InvoiceStatus = "draft" | "sent" | "payable" | "paid" | "overdue";

export type ClientInvoice = {
  id: string;
  clientId: string;
  projectId: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  dueDate: string;
  issuedAt: string;
  lineItems: Array<{ label: string; amount: number }>;
};

export type DocumentStatus = "draft" | "shared" | "awaiting_signature" | "signed";

export type ClientDocument = {
  id: string;
  clientId: string;
  projectId: string;
  title: string;
  status: DocumentStatus;
  updatedAt: string;
  templateId?: string;
};

export type PortalMessage = {
  id: string;
  authorRole: PortalRole;
  authorName: string;
  body: string;
  at: string;
  kind?: "internal_note" | "public_reply";
  mentions?: string[];
  attachments?: TicketAttachment[];
};

export type MessageThread = {
  id: string;
  clientId: string;
  subject: string;
  messages: PortalMessage[];
};

export type ChatThread = {
  id: string;
  type: "channel" | "dm";
  name: string;
  memberIds: string[];
  messages: Array<{ id: string; employeeId: string; body: string; at: string }>;
};

export type TicketStatus = "open" | "waiting_on_staff" | "waiting_on_client" | "resolved" | "closed";
export type TicketCategory = "HVAC" | "Electrical" | "Facilities" | "Billing" | "Access" | "Other";

export type TicketAttachment = {
  id: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  createdAt: string;
  commentId?: string | null;
};

export type TicketEvent = {
  id: string;
  actorName: string;
  type: "created" | "status" | "assignee" | "priority" | "category" | "tags" | "due_date" | "comment" | "attachment" | "link" | "closed" | "reopened";
  fromValue?: string | null;
  toValue?: string | null;
  at: string;
};

export type SupportTicket = {
  id: string;
  clientId: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  category: TicketCategory;
  dueDate?: string;
  tags: string[];
  resolvedAt?: string | null;
  closedAt?: string | null;
  projectId?: string | null;
  invoiceId?: string | null;
  lastUpdate: string;
  assigneeId: string;
  source: "client" | "internal";
  messages: PortalMessage[];
  attachments: TicketAttachment[];
  events: TicketEvent[];
};

export type EmployeeProfile = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  location: string;
  status: "active" | "onboarding" | "leave";
  role: "owner" | "admin" | "manager" | "employee";
  managerId?: string;
  ptoBalance: number;
  ptoAccrued: number;
  ptoUsed: number;
  emergencyContact: string;
};

export type StaffTimeEntry = {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  status: "pending" | "approved" | "needs_correction";
  shift: string;
  note?: string;
  clockedIn?: boolean;
  correctedHours?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
};

export type StaffShift = {
  id: string;
  employeeId?: string;
  swapWithEmployeeId?: string;
  day: string;
  time: string;
  site: string;
  status: "published" | "swap_requested" | "open";
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
};

export type StaffTask = {
  id: string;
  employeeId: string;
  title: string;
  status: "open" | "in_progress" | "done";
  source: "internal" | "client";
};

export type CourseCatalogItem = {
  id: string;
  title: string;
  description: string;
  category: "safety" | "compliance" | "onboarding" | "software" | "soft skills";
  duration: string;
  lessons: Array<{ title: string; body: string }>;
  quiz: string;
  quizQuestions: Array<{ prompt: string; options: string[]; correctIndex: number; explanation: string }>;
};

export type TrainingAssignment = {
  id: string;
  employeeId: string;
  courseId: string;
  course: string;
  status: "assigned" | "in_progress" | "complete" | "overdue" | "removed";
  due: string;
  dueDate?: string;
  reason?: "new_hire" | "role_change" | "promotion" | "compliance" | "corrective" | "manual";
  progress: number;
  currentLesson?: number;
  certificateIssued?: string;
  assignedBy?: string;
  removedBy?: string;
  removedAt?: string;
};

export type PtoRequest = {
  id: string;
  employeeId: string;
  dates: string;
  status: "pending" | "approved" | "denied";
  type: "vacation" | "sick" | "personal";
  hours: number;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  notification?: string;
};

export type DocumentTemplate = {
  id: string;
  title: string;
  category: "proposal" | "sow" | "nda" | "welcome" | "invoice";
  updatedAt: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  authorId: string;
  updatedAt: string;
  body: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  at: string;
};

export type CompanyEvent = {
  id: string;
  title: string;
  at: string;
};

export type OnboardingTask = {
  id: string;
  employeeId: string;
  title: string;
  status: "todo" | "done";
};

export type OperationsPortalSeed = {
  clients: ClientCompany[];
  contacts: Contact[];
  projects: ClientProject[];
  invoices: ClientInvoice[];
  documents: ClientDocument[];
  documentTemplates: DocumentTemplate[];
  threads: MessageThread[];
  chatThreads: ChatThread[];
  tickets: SupportTicket[];
  employees: EmployeeProfile[];
  timeEntries: StaffTimeEntry[];
  shifts: StaffShift[];
  tasks: StaffTask[];
  courseCatalog: CourseCatalogItem[];
  training: TrainingAssignment[];
  ptoRequests: PtoRequest[];
  knowledgeArticles: KnowledgeArticle[];
  announcements: Announcement[];
  quickLinks: Array<{ label: string; href: string }>;
  events: CompanyEvent[];
  onboardingTasks: OnboardingTask[];
};

const employeeRows = [
  ["employee-dale", "Dale Ridgeway", "Owner / President", "Executive", "owner", undefined, 128, "Birmingham, AL"],
  ["employee-carol", "Carol Estrada", "Office Administrator", "Administration", "admin", "employee-dale", 96, "Birmingham, AL"],
  ["employee-marcus", "Marcus Whitfield", "Field Operations Manager", "Field Operations", "manager", "employee-dale", 84, "Birmingham, AL"],
  ["employee-priya", "Priya Nair", "Office Manager", "Administration", "manager", "employee-dale", 88, "Hoover, AL"],
  ["employee-tony", "Tony DeLuca", "Account Manager Lead", "Account Management", "manager", "employee-dale", 80, "Birmingham, AL"],
  ["employee-jamal", "Jamal Carter", "Senior HVAC Technician", "Field Operations", "employee", "employee-marcus", 72, "Bessemer, AL"],
  ["employee-brett", "Brett Hollis", "HVAC Technician", "Field Operations", "employee", "employee-marcus", 58, "Homewood, AL"],
  ["employee-sofia", "Sofia Reyes", "Electrical Technician", "Field Operations", "employee", "employee-marcus", 62, "Birmingham, AL"],
  ["employee-derrick", "Derrick Owens", "Facilities Technician", "Field Operations", "employee", "employee-marcus", 54, "Irondale, AL"],
  ["employee-luke", "Luke Bennett", "Apprentice Technician", "Field Operations", "employee", "employee-marcus", 46, "Pelham, AL"],
  ["employee-gabriel", "Gabriel Santos", "Facilities Technician", "Field Operations", "employee", "employee-marcus", 52, "Trussville, AL"],
  ["employee-denise", "Denise Holloway", "Warehouse / Inventory Lead", "Field Operations", "employee", "employee-marcus", 68, "Birmingham, AL"],
  ["employee-nina", "Nina Abboud", "Apprentice Technician (new hire)", "Field Operations", "employee", "employee-marcus", 24, "Birmingham, AL"],
  ["employee-hannah", "Hannah Vogel", "Dispatcher", "Administration", "employee", "employee-priya", 64, "Birmingham, AL"],
  ["employee-aaron", "Aaron Kim", "Dispatcher", "Administration", "employee", "employee-priya", 60, "Vestavia Hills, AL"],
  ["employee-tasha", "Tasha Coleman", "Billing Coordinator", "Administration", "employee", "employee-priya", 70, "Birmingham, AL"],
  ["employee-megan", "Megan Flores", "HR & Onboarding Coordinator", "Administration", "employee", "employee-priya", 76, "Hoover, AL"],
  ["employee-ryan", "Ryan Patel", "Account Manager", "Account Management", "employee", "employee-tony", 66, "Birmingham, AL"],
  ["employee-olivia", "Olivia Brennan", "Account Manager", "Account Management", "employee", "employee-tony", 58, "Mountain Brook, AL"],
  ["employee-chris", "Chris Nakamura", "Estimator", "Account Management", "employee", "employee-tony", 50, "Birmingham, AL"]
] as const;

const employees: EmployeeProfile[] = employeeRows.map(([id, name, title, department, role, managerId, ptoBalance, location], index) => ({
  id,
  name,
  avatar: name.split(" ").map((part) => part[0]).join(""),
  title,
  department,
  role,
  managerId,
  ptoBalance,
  ptoAccrued: 88 + (index % 5) * 8,
  ptoUsed: 12 + (index % 7) * 4,
  email: `${name.toLowerCase().replaceAll(" ", ".").replaceAll("/", "")}@ridgeway.example`,
  phone: `(205) 555-${String(1200 + index)}`,
  hireDate: id === "employee-nina" ? rel(-2, "week") : rel(-(18 + index), "month"),
  location,
  status: id === "employee-nina" ? "onboarding" : "active",
  emergencyContact: `${name.split(" ")[0]} emergency contact · (205) 555-${String(2200 + index)}`
}));

const clientRows = [
  ["client-avondale", "Avondale Elementary School District", "Education / facilities", "Donna Albright", "Maintenance Supervisor", "~4 yrs", "green"],
  ["client-bpl", "Birmingham Public Library System", "Government / facilities", "Wanda Pierce", "Facilities Director", "~3 yrs", "green"],
  ["client-vulcan", "Vulcan Park & Museum", "Attractions / HVAC", "Eli Thornton", "Operations Lead", "~2 yrs", "amber"],
  ["client-highland", "Highland Park Apartments", "Multi-family / facilities", "Teresa Maldonado", "Property Manager", "~2 yrs", "amber"],
  ["client-cahaba", "Cahaba Brewing Co.", "Food & bev / refrigeration", "Sam Whitlow", "Head Brewer & Facilities", "~18 mo", "red"],
  ["client-lakeview", "Lakeview Office Suites", "Commercial real estate", "Greg Tanaka", "Property Owner", "~1 yr", "green"],
  ["client-southside", "Southside Medical Plaza", "Healthcare / electrical", "Dr. Rachel Goldman", "Practice Administrator", "~1 yr", "amber"],
  ["client-redmountain", "Red Mountain Tech Park", "Commercial HVAC", "Kevin Brooks", "Building Manager", "~6 mo", "green"]
] as const;

const clients: ClientCompany[] = clientRows.map(([id, name, industry, , , since, health], index) => ({
  id,
  name,
  industry,
  health,
  primaryContactId: `contact-${id.replace("client-", "")}`,
  status: id === "client-cahaba" ? "at_risk" : index % 3 === 0 ? "implementation" : "active",
  since,
  phone: `(205) 555-${String(3100 + index)}`
}));

const contacts: Contact[] = clientRows.map(([clientId, , , name, title], index) => ({
  id: `contact-${clientId.replace("client-", "")}`,
  clientId,
  name,
  title,
  email: `${name.toLowerCase().replaceAll(" ", ".").replaceAll("dr.", "rachel")}@client.example`,
  phone: `(205) 555-${String(4100 + index)}`
}));

const teamFor = (managerId: string) => employees.filter((employee) => employee.id === managerId || employee.managerId === managerId).map((employee) => employee.id);

const projectTemplates = ["Preventive Maintenance Program", "Controls Retrofit", "Walk-in Cooler Replacement", "Electrical Panel Upgrade", "Facilities Response Plan", "HVAC Renewal"];
const statuses: ProjectStatus[] = ["In progress", "Client review", "Discovery", "Launched", "Blocked"];
const projects: ClientProject[] = clients.flatMap((client, clientIndex) =>
  [0, 1].map((_, offset) => {
    const managerId = client.id === "client-cahaba" ? "employee-marcus" : ["employee-marcus", "employee-priya", "employee-tony"][(clientIndex + offset) % 3];
    const manager = employees.find((employee) => employee.id === managerId)!;
    return {
      id: `project-${client.id.replace("client-", "")}-${offset + 1}`,
      clientId: client.id,
      name: `${client.name.split(" ")[0]} ${projectTemplates[(clientIndex + offset) % projectTemplates.length]}`,
      status: client.id === "client-cahaba" && offset === 0 ? "Blocked" : statuses[(clientIndex + offset) % statuses.length],
      manager: manager.name,
      teamMemberIds: teamFor(managerId).slice(0, 5),
      nextMilestone: client.id === "client-cahaba" && offset === 0 ? "Replacement compressor quote" : ["Site walk", "Parts approval", "PM completion report", "Client sign-off", "Dispatch schedule"][(clientIndex + offset) % 5],
      updatedAt: rel(-((clientIndex + offset) % 5)),
      milestoneCount: 3 + ((clientIndex + offset) % 5)
    };
  })
);

const invoiceStatuses: InvoiceStatus[] = ["paid", "paid", "sent", "payable", "overdue", "draft"];
const invoices: ClientInvoice[] = Array.from({ length: 42 }, (_, index) => {
  const client = clients[index % clients.length];
  const project = projects.find((item) => item.clientId === client.id) ?? projects[0];
  const base = 900 + (index % 8) * 425;
  return {
    id: `invoice-${1040 + index}`,
    clientId: client.id,
    projectId: project.id,
    number: `INV-${1040 + index}`,
    status: client.id === "client-cahaba" && index % clients.length === 4 ? "payable" : invoiceStatuses[index % invoiceStatuses.length],
    amount: base,
    dueDate: due((index % 8) - 3),
    issuedAt: rel(-(index * 3 + 2)),
    lineItems: [
      { label: ["Preventive maintenance visit", "Emergency service call", "After-hours labor", "Replacement parts", "Refrigeration diagnostics"][index % 5], amount: base },
      { label: "Dispatch, documentation, and closeout", amount: 175 + (index % 4) * 95 }
    ]
  };
});

const documentTemplates: DocumentTemplate[] = ["Service Proposal", "Statement of Work", "Mutual NDA", "Welcome Letter", "Invoice Packet", "Change Order", "Preventive Maintenance Plan"].map((title, index) => ({
  id: `template-${index + 1}`,
  title,
  category: ["proposal", "sow", "nda", "welcome", "invoice", "sow", "proposal"][index] as DocumentTemplate["category"],
  updatedAt: rel(-(index + 1))
}));

const documents: ClientDocument[] = projects.slice(0, 18).map((project, index) => ({
  id: `doc-${index + 1}`,
  clientId: project.clientId,
  projectId: project.id,
  title: `${documentTemplates[index % documentTemplates.length].title} · ${project.name}`,
  status: ["awaiting_signature", "signed", "shared", "draft"][index % 4] as DocumentStatus,
  templateId: documentTemplates[index % documentTemplates.length].id,
  updatedAt: rel(-(index % 8))
}));

const threads: MessageThread[] = clients.map((client, index) => {
  const contact = contacts.find((item) => item.clientId === client.id)!;
  if (client.id === "client-cahaba") {
    return {
      id: "thread-cahaba-cooler",
      clientId: client.id,
      subject: "Walk-in cooler compressor",
      messages: [
        { id: "cahaba-msg-1", authorRole: "client", authorName: "Sam Whitlow", body: "Walk-in cooler is climbing again — we're at 41°F. Same issue as last month?", at: rel(-1) },
        { id: "cahaba-msg-2", authorRole: "employee", authorName: "Ryan Patel", body: "Likely the compressor we flagged. Sending Jamal out today, and I'll have a replacement quote over by tomorrow.", at: rel(-1) },
        { id: "cahaba-msg-3", authorRole: "client", authorName: "Sam Whitlow", body: "Appreciate it. Can't afford to lose this batch.", at: "Today" }
      ]
    };
  }
  if (client.id === "client-vulcan") {
    return {
      id: "thread-vulcan-invoice",
      clientId: client.id,
      subject: "After-hours invoice question",
      messages: [
        { id: "vulcan-msg-1", authorRole: "client", authorName: "Eli Thornton", body: "Invoice #1042 — can you confirm that includes the after-hours rate we discussed?", at: rel(-2) },
        { id: "vulcan-msg-2", authorRole: "employee", authorName: "Tony DeLuca", body: "It does — line 3 reflects the agreed off-peak rate. Happy to itemize it differently if that's clearer.", at: rel(-1) }
      ]
    };
  }
  return {
    id: `thread-${client.id.replace("client-", "")}`,
    clientId: client.id,
    subject: `${client.name.split(" ")[0]} service coordination`,
    messages: [
      { id: `msg-${index}-1`, authorRole: "employee", authorName: employees[17 + (index % 3)].name, body: "Sharing the latest service notes and open follow-up items from the Ridgeway team.", at: rel(-3) },
      { id: `msg-${index}-2`, authorRole: "client", authorName: contact.name, body: "Thanks. Please keep the same window for the next visit if dispatch can make it work.", at: rel(-2) },
      { id: `msg-${index}-3`, authorRole: "employee", authorName: employees[13 + (index % 2)].name, body: "Confirmed. Dispatch has the window blocked and the technician notes attached.", at: rel(-1) }
    ]
  };
});

const chatThreads: ChatThread[] = [
  {
    id: "chat-dispatch",
    type: "channel",
    name: "#dispatch",
    memberIds: employees.map((employee) => employee.id),
    messages: [
      { id: "dispatch-1", employeeId: "employee-hannah", body: "Heads up — Southside Medical moved their PM window to Thursday AM. Anyone have capacity?", at: rel(-1) },
      { id: "dispatch-2", employeeId: "employee-marcus", body: "Jamal's wrapping Highland Park Wednesday, he can take it.", at: rel(-1) },
      { id: "dispatch-3", employeeId: "employee-jamal", body: "Works for me. Gonna need the gate code again, lost it 😅", at: rel(-1) },
      { id: "dispatch-4", employeeId: "employee-hannah", body: "Sending it over now.", at: "Today" }
    ]
  },
  {
    id: "chat-field-ops",
    type: "channel",
    name: "#field-ops",
    memberIds: teamFor("employee-marcus"),
    messages: [
      { id: "field-1", employeeId: "employee-marcus", body: "Reminder: EPA 608 recerts are due end of quarter. Knock it out before we get slammed in summer.", at: rel(-2) },
      { id: "field-2", employeeId: "employee-sofia", body: "Done with mine 🎉", at: rel(-1) },
      { id: "field-3", employeeId: "employee-derrick", body: "Halfway. Will finish this week.", at: "Today" }
    ]
  },
  {
    id: "chat-marcus-jamal",
    type: "dm",
    name: "Marcus Whitfield / Jamal Carter",
    memberIds: ["employee-marcus", "employee-jamal"],
    messages: [
      { id: "mj-1", employeeId: "employee-marcus", body: "Cahaba's walk-in is acting up again — same compressor. Can you swing by before EOD?", at: rel(-1) },
      { id: "mj-2", employeeId: "employee-jamal", body: "On my way back from Vulcan, I'll detour. Want me to quote the replacement this time?", at: rel(-1) },
      { id: "mj-3", employeeId: "employee-marcus", body: "Yeah, Sam's expecting it. Loop Ryan in on pricing.", at: rel(-1) },
      { id: "mj-4", employeeId: "employee-jamal", body: "👍", at: "Today" }
    ]
  },
  {
    id: "chat-priya-tasha",
    type: "dm",
    name: "Priya Nair / Tasha Coleman",
    memberIds: ["employee-priya", "employee-tasha"],
    messages: [
      { id: "pt-1", employeeId: "employee-priya", body: "Did the Avondale invoice go out? They asked about it.", at: rel(-1) },
      { id: "pt-2", employeeId: "employee-tasha", body: "Sent this morning, #1051. I'll forward Donna the copy.", at: "Today" }
    ]
  },
  {
    id: "chat-general",
    type: "channel",
    name: "#general",
    memberIds: employees.map((employee) => employee.id),
    messages: [
      { id: "general-1", employeeId: "employee-megan", body: "Please welcome Nina Abboud to the Field Operations team! 🎉", at: rel(-2) },
      { id: "general-2", employeeId: "employee-dale", body: "Glad to have you here, Nina. First lunch is on me.", at: rel(-2) },
      { id: "general-3", employeeId: "employee-nina", body: "Thank you! Excited to learn from everyone.", at: rel(-1) }
    ]
  },
  {
    id: "chat-tony-ryan",
    type: "dm",
    name: "Tony DeLuca / Ryan Patel",
    memberIds: ["employee-tony", "employee-ryan"],
    messages: [
      { id: "tr-1", employeeId: "employee-tony", body: "Cahaba quote needs clear compressor and downtime options.", at: rel(-1) },
      { id: "tr-2", employeeId: "employee-ryan", body: "I will send good/better/best pricing after Jamal confirms measurements.", at: "Today" }
    ]
  },
  {
    id: "chat-carol-megan",
    type: "dm",
    name: "Carol Estrada / Megan Flores",
    memberIds: ["employee-carol", "employee-megan"],
    messages: [
      { id: "cm-1", employeeId: "employee-carol", body: "Can you check Nina's onboarding tasks before Friday?", at: rel(-1) },
      { id: "cm-2", employeeId: "employee-megan", body: "Yep. Orientation is 60% complete and the safety courses are queued.", at: "Today" }
    ]
  }
];

const tickets: SupportTicket[] = Array.from({ length: 32 }, (_, index) => {
  const client = clients[index % clients.length];
  const assignees = ["employee-jamal", "employee-brett", "employee-sofia", "employee-derrick", "employee-hannah", "employee-aaron", "employee-ryan", "employee-olivia"];
  const assigneeId = client.id === "client-cahaba" && index % clients.length === 4 ? "employee-jamal" : assignees[index % assignees.length];
  const source = index % 3 === 0 ? "internal" : "client";
  const status = ["open", "waiting_on_staff", "waiting_on_client", "resolved"][index % 4] as TicketStatus;
  const priority = client.id === "client-cahaba" && index % clients.length === 4 ? "high" : ["normal", "high", "low"][index % 3] as SupportTicket["priority"];
  const category = ["HVAC", "Electrical", "Facilities", "Billing", "Access", "Other"][index % 6] as TicketCategory;
  const dueOffset = priority === "high" ? index % 5 - 1 : index % 9 + 1;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueOffset);
  const createdBody = "Opened with site notes, asset history, and the requested service window.";
  const staffBody = "Reviewing the last work order and coordinating the next step.";
  const publicKind = source === "client" ? "public_reply" : "internal_note";
  return {
    id: `ticket-${index + 1}`,
    clientId: client.id,
    subject: client.id === "client-cahaba" && index % clients.length === 4 ? "Walk-in cooler climbing above set point" : ["PM window change", "Invoice question", "Parts approval", "Gate code needed", "Electrical panel follow-up", "Training completion check"][index % 6],
    description: client.id === "client-cahaba" && index % clients.length === 4 ? "Client reports cooler temperature climbing above set point during lunch prep. Need dispatch review, photos, and client-safe updates." : "Ticket created from the shared operations/client workflow with enough context for dispatch, office, and client follow-up.",
    status,
    priority,
    category,
    dueDate: dueDate.toISOString().slice(0, 10),
    tags: [category.toLowerCase(), priority === "high" ? "sla" : "routine", source],
    resolvedAt: status === "resolved" ? rel(-1) : null,
    closedAt: null,
    projectId: index % 5 === 0 ? projects[index % projects.length]?.id ?? null : null,
    invoiceId: index % 7 === 0 ? invoices[index % invoices.length]?.id ?? null : null,
    source,
    assigneeId,
    lastUpdate: rel(-(index % 10)),
    messages: [
      { id: `ticket-msg-${index}-1`, authorRole: source === "client" ? "client" : "employee", authorName: source === "client" ? contacts[index % contacts.length].name : employees.find((employee) => employee.id === assigneeId)!.name, body: createdBody, at: rel(-2), kind: publicKind },
      { id: `ticket-msg-${index}-2`, authorRole: "employee", authorName: employees.find((employee) => employee.id === assigneeId)!.name, body: staffBody, at: rel(-1), kind: source === "client" ? "public_reply" : "internal_note", mentions: index % 4 === 0 ? ["employee-marcus"] : [] }
    ],
    attachments: index % 4 === 0 ? [{ id: `ticket-attachment-${index}`, fileName: "site-photo.jpg", fileUrl: "https://example.com/site-photo.jpg", uploadedBy: assigneeId, createdAt: rel(-1), commentId: `ticket-msg-${index}-2` }] : [],
    events: [
      { id: `ticket-event-${index}-created`, actorName: source === "client" ? contacts[index % contacts.length].name : employees.find((employee) => employee.id === assigneeId)!.name, type: "created", toValue: status, at: rel(-2) },
      { id: `ticket-event-${index}-status`, actorName: employees.find((employee) => employee.id === assigneeId)!.name, type: "status", fromValue: "open", toValue: status, at: rel(-1) }
    ]
  };
});

const timeEntries: StaffTimeEntry[] = employees.flatMap((employee, employeeIndex) =>
  Array.from({ length: employee.id === "employee-nina" ? 4 : 18 }, (_, index) => ({
    id: `time-${employee.id}-${index}`,
    employeeId: employee.id,
    date: index === 0 ? "Today" : rel(-index),
    shift: employee.department === "Field Operations" ? "7:30 AM - 4:00 PM" : "8:30 AM - 5:00 PM",
    hours: index % 9 === 0 ? 9.5 : index % 11 === 0 ? 5.75 : 8,
      status: employee.id === "employee-brett" && index === 0 ? "needs_correction" : index % 13 === 0 ? "needs_correction" : index % 5 === 0 ? "pending" : "approved",
      note: index % 13 === 0 ? "Missed punch needs manager review" : undefined,
      correctedHours: index % 13 === 0 ? 8 : undefined,
      clockedIn: index === 0 && ["employee-jamal", "employee-sofia", "employee-hannah", "employee-ryan"].includes(employee.id)
  }))
);

const shifts: StaffShift[] = [
  ...employees.flatMap((employee, employeeIndex) =>
    ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, dayIndex) => ({
      id: `shift-${employee.id}-${day}`,
      employeeId: employee.id,
      day: dayIndex < 3 ? `${day} this week` : `${day} next week`,
      time: employee.department === "Field Operations" ? "7:30 AM - 4:00 PM" : "8:30 AM - 5:00 PM",
      site: employee.department === "Field Operations" ? ["Cahaba Brewing Co.", "Vulcan Park & Museum", "Highland Park Apartments", "Southside Medical Plaza"][employeeIndex % 4] : "Ridgeway office",
      status: dayIndex === 1 && ["employee-jamal", "employee-hannah"].includes(employee.id) ? "swap_requested" : "published",
      swapWithEmployeeId: employee.id === "employee-jamal" ? "employee-brett" : employee.id === "employee-hannah" ? "employee-aaron" : undefined
    } satisfies StaffShift))
  ),
  { id: "shift-open-1", day: "Thu next week", time: "12:00 PM - 6:00 PM", site: "Southside Medical Plaza", status: "open" },
  { id: "shift-open-2", day: "Fri next week", time: "7:30 AM - 2:00 PM", site: "Cahaba Brewing Co.", status: "open" }
];

const tasks: StaffTask[] = tickets.slice(0, 28).map((ticket, index) => ({
  id: `task-${index + 1}`,
  employeeId: ticket.assigneeId,
  title: ticket.subject,
  status: ["open", "in_progress", "done"][index % 3] as StaffTask["status"],
  source: ticket.source
}));

const courseCatalog: CourseCatalogItem[] = lmsCourseCatalog;

const newHireCourses = ["course-new-hire", "course-time", "course-hub", "course-osha", "course-first-aid"];
const technicianCourses = ["course-ladder", "course-loto", "course-electrical", "course-epa", "course-driving"];
const supervisorCourses = ["course-customer", "course-difficult"];
const complianceCourses = ["course-epa", "course-osha", "course-first-aid"];

function seededTrainingFor(employeeId: string, courseId: string, status: TrainingAssignment["status"], reason: NonNullable<TrainingAssignment["reason"]>, offset: number, progress = status === "complete" ? 100 : 0): TrainingAssignment {
  const course = courseCatalog.find((item) => item.id === courseId)!;
  return {
    id: `training-${employeeId}-${courseId}-${reason}`,
    employeeId,
    courseId,
    course: course.title,
    status,
    reason,
    due: status === "overdue" ? due(-3) : due(offset),
    dueDate: status === "overdue" ? new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) : new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10),
    progress,
    currentLesson: Math.max(0, Math.floor((progress / 100) * course.lessons.length) - 1),
    certificateIssued: status === "complete" ? rel(-(Math.abs(offset) + 4)) : undefined,
    assignedBy: "Assigned by Carol · demo"
  };
}

const training: TrainingAssignment[] = [
  ...newHireCourses.map((courseId, index) => seededTrainingFor("employee-nina", courseId, courseId === "course-new-hire" ? "in_progress" : "assigned", "new_hire", index + 4, courseId === "course-new-hire" ? 60 : 0)),
  seededTrainingFor("employee-brett", "course-ladder", "overdue", "compliance", -3),
  seededTrainingFor("employee-brett", "course-driving", "assigned", "corrective", 5),
  ...technicianCourses.map((courseId, index) => seededTrainingFor("employee-jamal", courseId, index < 3 ? "complete" : "assigned", "compliance", index + 10, index < 3 ? 100 : 0)),
  ...supervisorCourses.map((courseId, index) => seededTrainingFor("employee-hannah", courseId, index === 0 ? "in_progress" : "assigned", "promotion", index + 7, index === 0 ? 45 : 0)),
  ...employees
    .filter((employee) => employee.department === "Field Operations" && !["employee-nina", "employee-brett", "employee-jamal"].includes(employee.id))
    .flatMap((employee, index) => complianceCourses.slice(0, 2).map((courseId, courseIndex) => seededTrainingFor(employee.id, courseId, courseIndex === 0 && index % 2 === 0 ? "complete" : "assigned", "compliance", courseIndex + 8, courseIndex === 0 && index % 2 === 0 ? 100 : 0)))
];

const ptoRequests: PtoRequest[] = employees.slice(5).map((employee, index) => ({
  id: `pto-${index + 1}`,
  employeeId: employee.id,
  dates: `${rel(index + 2)} - ${rel(index + 3)}`,
  status: ["pending", "approved", "denied", "approved"][index % 4] as PtoRequest["status"],
  type: ["vacation", "sick", "personal"][index % 3] as PtoRequest["type"],
  hours: index % 2 === 0 ? 8 : 16
}));

const knowledgeArticles: KnowledgeArticle[] = Array.from({ length: 22 }, (_, index) => ({
  id: `kb-${index + 1}`,
  title: ["Compressor replacement quoting", "PM closeout checklist", "EPA 608 documentation SOP", "Dispatch escalation rules", "Invoice after-hours line items", "Customer de-escalation script"][index % 6],
  category: ["Field Ops", "Safety", "Billing", "Dispatch", "Account Management"][index % 5],
  authorId: ["employee-marcus", "employee-carol", "employee-priya", "employee-tony", "employee-megan"][index % 5],
  updatedAt: rel(-(index + 1)),
  body: "Use this article to confirm ownership, timing, client-facing language, and the Ridgeway handoff before closing a job or client request."
}));

const announcements: Announcement[] = [
  ["announcement-1", "Q3 all-hands", "Q3 all-hands is on the calendar for next month — details to follow. Great quarter, everyone.", "employee-dale", rel(-4)],
  ["announcement-2", "Clock-in reminders", "New: clock-in reminders now push 10 minutes before your shift starts.", "employee-carol", rel(-3)],
  ["announcement-3", "Welcome Nina Abboud", "Please welcome Nina Abboud to the Field Operations team! 🎉", "employee-megan", rel(-2)],
  ["announcement-4", "EPA 608 recerts", "Reminder: EPA 608 recerts are due by end of quarter.", "employee-priya", rel(-1)],
  ["announcement-5", "Holiday schedule", "Holiday schedule is posted — submit PTO requests by Friday.", "employee-carol", "Today"]
].map(([id, title, body, authorId, at]) => ({ id, title, body, authorId, at }));

export const portalSeedData: OperationsPortalSeed = {
  clients,
  contacts,
  projects,
  invoices,
  documents,
  documentTemplates,
  threads,
  chatThreads,
  tickets,
  employees,
  timeEntries,
  shifts,
  tasks,
  courseCatalog,
  training,
  ptoRequests,
  knowledgeArticles,
  announcements,
  quickLinks: [
    { label: "Technician dispatch board", href: "#" },
    { label: "Time correction form", href: "#" },
    { label: "EPA 608 recert tracker", href: "#" },
    { label: "Cahaba compressor quote", href: "#" }
  ],
  events: [
    { id: "event-1", title: "Cahaba cooler follow-up", at: rel(1) },
    { id: "event-2", title: "Nina onboarding ride-along", at: rel(2) },
    { id: "event-3", title: "Q3 all-hands", at: rel(4, "week") }
  ],
  onboardingTasks: ["Finish New Hire Orientation", "Complete Time & Attendance Policy", "Assign PPE kit", "Ride along with Jamal", "Submit fleet paperwork"].map((title, index) => ({
    id: `onboarding-${index + 1}`,
    employeeId: "employee-nina",
    title,
    status: index < 2 ? "done" : "todo"
  }))
};
