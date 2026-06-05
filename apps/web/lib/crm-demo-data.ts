export type User = {
  id: string;
  name: string;
  avatarColor: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  website: string;
};

export type Contact = {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
};

export type Product = {
  id: string;
  name: string;
  type: "one_time" | "recurring" | "hourly";
  price: number;
};

export type LineItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export const pipelineStages = ["New Lead", "Qualified", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"] as const;

export type DealStage = (typeof pipelineStages)[number];

export type Deal = {
  id: string;
  name: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  stage: DealStage;
  lineItems: LineItem[];
  expectedCloseDate: string;
  createdAt: string;
  notes: string;
};

export type Activity = {
  id: string;
  dealId?: string;
  contactId?: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  body: string;
  dueDate?: string;
  done?: boolean;
  createdAt: string;
};

export type ThemeConfig = {
  primary: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
};

export const demoConfig = {
  demoCompanyName: "Eclipse Systems",
  productName: "Eclipse CRM",
  packageName: "CRM & Sales Pipeline",
  quoteTitle: "Sales Quote",
  theme: {
    primary: "134 16% 33%",
    accent: "74 25% 67%",
    success: "148 63% 34%",
    danger: "355 70% 48%",
    warning: "35 90% 50%"
  } satisfies ThemeConfig
};

export const users: User[] = [
  { id: "alex", name: "Alex", avatarColor: "#2563eb" },
  { id: "sam", name: "Sam", avatarColor: "#0f766e" },
  { id: "jordan", name: "Jordan", avatarColor: "#7c3aed" },
  { id: "taylor", name: "Taylor", avatarColor: "#d97706" }
];

export const companies: Company[] = [
  { id: "riverside-dental", name: "Riverside Dental", industry: "Healthcare", website: "riversidedental.example" },
  { id: "apex-construction", name: "Apex Construction", industry: "Construction", website: "apexbuilds.example" },
  { id: "bloom-marketing", name: "Bloom Marketing", industry: "Agency", website: "bloommarketing.example" },
  { id: "summit-law", name: "Summit Law Group", industry: "Legal", website: "summitlaw.example" },
  { id: "greenleaf", name: "GreenLeaf Landscaping", industry: "Home Services", website: "greenleafyards.example" },
  { id: "technova", name: "TechNova Software", industry: "Technology", website: "technova.example" },
  { id: "harbor-logistics", name: "Harbor Logistics", industry: "Logistics", website: "harborfreightflow.example" },
  { id: "midtown-fitness", name: "Midtown Fitness", industry: "Fitness", website: "midtownfitness.example" },
  { id: "pioneer-manufacturing", name: "Pioneer Manufacturing", industry: "Manufacturing", website: "pioneermfg.example" },
  { id: "crafted-coffee", name: "Crafted Coffee Roasters", industry: "Food & Beverage", website: "craftedcoffee.example" }
];

export const contacts: Contact[] = [
  { id: "c-001", companyId: "riverside-dental", name: "Maya Chen", role: "Office Manager", email: "maya@riversidedental.example", phone: "(205) 555-0101" },
  { id: "c-002", companyId: "riverside-dental", name: "Dr. Luis Romero", role: "Owner", email: "luis@riversidedental.example", phone: "(205) 555-0102" },
  { id: "c-003", companyId: "apex-construction", name: "Nora Fields", role: "Operations Director", email: "nora@apexbuilds.example", phone: "(205) 555-0103" },
  { id: "c-004", companyId: "apex-construction", name: "Grant Ellis", role: "Procurement", email: "grant@apexbuilds.example", phone: "(205) 555-0104" },
  { id: "c-005", companyId: "bloom-marketing", name: "Priya Shah", role: "Founder", email: "priya@bloommarketing.example", phone: "(205) 555-0105" },
  { id: "c-006", companyId: "summit-law", name: "Evelyn Brooks", role: "Managing Partner", email: "evelyn@summitlaw.example", phone: "(205) 555-0106" },
  { id: "c-007", companyId: "summit-law", name: "Miles Carter", role: "Firm Administrator", email: "miles@summitlaw.example", phone: "(205) 555-0107" },
  { id: "c-008", companyId: "greenleaf", name: "Hannah Reed", role: "Owner", email: "hannah@greenleafyards.example", phone: "(205) 555-0108" },
  { id: "c-009", companyId: "technova", name: "Owen Pierce", role: "VP of Revenue", email: "owen@technova.example", phone: "(205) 555-0109" },
  { id: "c-010", companyId: "technova", name: "Sofia Alvarez", role: "Finance Lead", email: "sofia@technova.example", phone: "(205) 555-0110" },
  { id: "c-011", companyId: "harbor-logistics", name: "Marcus Bell", role: "General Manager", email: "marcus@harborfreightflow.example", phone: "(205) 555-0111" },
  { id: "c-012", companyId: "midtown-fitness", name: "Tessa Moore", role: "Owner", email: "tessa@midtownfitness.example", phone: "(205) 555-0112" },
  { id: "c-013", companyId: "pioneer-manufacturing", name: "Victor Hale", role: "Plant Manager", email: "victor@pioneermfg.example", phone: "(205) 555-0113" },
  { id: "c-014", companyId: "pioneer-manufacturing", name: "Anne Wilson", role: "Controller", email: "anne@pioneermfg.example", phone: "(205) 555-0114" },
  { id: "c-015", companyId: "crafted-coffee", name: "Leo Bennett", role: "Founder", email: "leo@craftedcoffee.example", phone: "(205) 555-0115" }
];

export const products: Product[] = [
  { id: "starter", name: "Starter Package", type: "recurring", price: 450 },
  { id: "professional", name: "Professional Package", type: "recurring", price: 1200 },
  { id: "enterprise", name: "Enterprise Package", type: "recurring", price: 4200 },
  { id: "onboarding", name: "Onboarding & Setup", type: "one_time", price: 2500 },
  { id: "support", name: "Support Plan", type: "recurring", price: 650 },
  { id: "consulting", name: "Consulting", type: "hourly", price: 185 }
];

const li = (productId: string, quantity: number, unitPrice?: number): LineItem => {
  const product = products.find((item) => item.id === productId);
  return { productId, quantity, unitPrice: unitPrice ?? product?.price ?? 0 };
};

export const deals: Deal[] = [
  { id: "d-001", name: "New patient operations rollout", companyId: "riverside-dental", contactId: "c-001", ownerId: "alex", stage: "New Lead", lineItems: [li("starter", 8), li("onboarding", 1)], expectedCloseDate: "2026-06-12", createdAt: "2026-05-20", notes: "Needs simple scheduling and payment follow-up visibility." },
  { id: "d-002", name: "Clinic growth package", companyId: "riverside-dental", contactId: "c-002", ownerId: "sam", stage: "Proposal Sent", lineItems: [li("professional", 10), li("support", 1)], expectedCloseDate: "2026-06-21", createdAt: "2026-05-03", notes: "Proposal sent to owner. Waiting on insurance workflow questions." },
  { id: "d-003", name: "Field crew CRM rollout", companyId: "apex-construction", contactId: "c-003", ownerId: "jordan", stage: "Qualified", lineItems: [li("professional", 12), li("consulting", 18)], expectedCloseDate: "2026-07-02", createdAt: "2026-05-09", notes: "Interested in mobile-friendly deal and quote tracking." },
  { id: "d-004", name: "Vendor quote tracking", companyId: "apex-construction", contactId: "c-004", ownerId: "taylor", stage: "Negotiation", lineItems: [li("enterprise", 6), li("onboarding", 2), li("support", 2)], expectedCloseDate: "2026-06-28", createdAt: "2026-04-21", notes: "Procurement requested annual payment option." },
  { id: "d-005", name: "Agency retainer pipeline", companyId: "bloom-marketing", contactId: "c-005", ownerId: "alex", stage: "Closed Won", lineItems: [li("professional", 9), li("onboarding", 1)], expectedCloseDate: "2026-06-03", createdAt: "2026-04-28", notes: "Won with quarterly business review add-on." },
  { id: "d-006", name: "Partner intake workflow", companyId: "summit-law", contactId: "c-006", ownerId: "sam", stage: "Qualified", lineItems: [li("starter", 14), li("consulting", 10)], expectedCloseDate: "2026-06-18", createdAt: "2026-05-17", notes: "Legal team wants contact history and document-ready quotes." },
  { id: "d-007", name: "Firm expansion quote", companyId: "summit-law", contactId: "c-007", ownerId: "jordan", stage: "Proposal Sent", lineItems: [li("professional", 18), li("support", 1), li("onboarding", 1)], expectedCloseDate: "2026-07-11", createdAt: "2026-05-15", notes: "Administrator asked for comparison against current spreadsheet process." },
  { id: "d-008", name: "Seasonal sales tracking", companyId: "greenleaf", contactId: "c-008", ownerId: "taylor", stage: "New Lead", lineItems: [li("starter", 5), li("consulting", 8)], expectedCloseDate: "2026-06-30", createdAt: "2026-06-01", notes: "Owner wants a quick setup before summer demand spikes." },
  { id: "d-009", name: "Expansion sales operations", companyId: "technova", contactId: "c-009", ownerId: "alex", stage: "Negotiation", lineItems: [li("enterprise", 11), li("support", 3), li("consulting", 40)], expectedCloseDate: "2026-06-25", createdAt: "2026-04-10", notes: "Revenue leader asked for custom forecast fields." },
  { id: "d-010", name: "Finance approval package", companyId: "technova", contactId: "c-010", ownerId: "sam", stage: "Closed Lost", lineItems: [li("professional", 20), li("onboarding", 1)], expectedCloseDate: "2026-05-15", createdAt: "2026-03-25", notes: "Lost to budget freeze. Revisit in Q4." },
  { id: "d-011", name: "Warehouse opportunity board", companyId: "harbor-logistics", contactId: "c-011", ownerId: "jordan", stage: "Proposal Sent", lineItems: [li("enterprise", 8), li("onboarding", 2), li("support", 2)], expectedCloseDate: "2026-06-17", createdAt: "2026-05-11", notes: "Quote should show recurring and one-time lines clearly." },
  { id: "d-012", name: "Member sales pipeline", companyId: "midtown-fitness", contactId: "c-012", ownerId: "taylor", stage: "Closed Won", lineItems: [li("starter", 6), li("support", 1)], expectedCloseDate: "2026-06-01", createdAt: "2026-05-05", notes: "Small but fast win. Needs onboarding next week." },
  { id: "d-013", name: "Distributor account process", companyId: "pioneer-manufacturing", contactId: "c-013", ownerId: "alex", stage: "Negotiation", lineItems: [li("enterprise", 9), li("consulting", 22)], expectedCloseDate: "2026-07-19", createdAt: "2026-05-14", notes: "Plant manager wants operations and sales leadership aligned." },
  { id: "d-014", name: "Controller reporting pilot", companyId: "pioneer-manufacturing", contactId: "c-014", ownerId: "sam", stage: "Closed Lost", lineItems: [li("starter", 12), li("consulting", 6)], expectedCloseDate: "2026-04-30", createdAt: "2026-04-01", notes: "Lost to internal build. Keep nurture task active." },
  { id: "d-015", name: "Wholesale customer CRM", companyId: "crafted-coffee", contactId: "c-015", ownerId: "jordan", stage: "Qualified", lineItems: [li("professional", 7), li("onboarding", 1)], expectedCloseDate: "2026-06-22", createdAt: "2026-05-25", notes: "Founder wants one place for cafes, distributors, and quote follow-ups." },
  { id: "d-016", name: "Multi-location coffee expansion", companyId: "crafted-coffee", contactId: "c-015", ownerId: "taylor", stage: "New Lead", lineItems: [li("starter", 4), li("consulting", 5)], expectedCloseDate: "2026-07-07", createdAt: "2026-06-02", notes: "Early discovery. Ask about wholesale volumes." },
  { id: "d-017", name: "Practice management add-on", companyId: "riverside-dental", contactId: "c-001", ownerId: "jordan", stage: "Negotiation", lineItems: [li("support", 4), li("consulting", 12)], expectedCloseDate: "2026-06-09", createdAt: "2026-05-27", notes: "Small expansion deal with short close window." },
  { id: "d-018", name: "Construction leadership visibility", companyId: "apex-construction", contactId: "c-003", ownerId: "alex", stage: "Closed Won", lineItems: [li("enterprise", 5), li("onboarding", 2)], expectedCloseDate: "2026-05-22", createdAt: "2026-04-03", notes: "Won last month. Useful for monthly comparison." },
  { id: "d-019", name: "Creative sales ops cleanup", companyId: "bloom-marketing", contactId: "c-005", ownerId: "sam", stage: "Proposal Sent", lineItems: [li("professional", 6), li("consulting", 15)], expectedCloseDate: "2026-06-26", createdAt: "2026-05-24", notes: "Client wants clearer quote approvals." },
  { id: "d-020", name: "Matter intake expansion", companyId: "summit-law", contactId: "c-006", ownerId: "taylor", stage: "Closed Won", lineItems: [li("enterprise", 4), li("support", 2)], expectedCloseDate: "2026-05-14", createdAt: "2026-04-19", notes: "Won last month. Contract already signed." },
  { id: "d-021", name: "Residential services upsell", companyId: "greenleaf", contactId: "c-008", ownerId: "jordan", stage: "Closed Won", lineItems: [li("professional", 5), li("onboarding", 1)], expectedCloseDate: "2026-06-05", createdAt: "2026-05-10", notes: "Won this week. Customer wants fast training." },
  { id: "d-022", name: "Revenue operations standardization", companyId: "technova", contactId: "c-009", ownerId: "alex", stage: "Proposal Sent", lineItems: [li("enterprise", 10), li("support", 4), li("consulting", 35)], expectedCloseDate: "2026-08-02", createdAt: "2026-05-30", notes: "Large future-dated forecast opportunity." },
  { id: "d-023", name: "Fleet customer sales tracking", companyId: "harbor-logistics", contactId: "c-011", ownerId: "sam", stage: "Qualified", lineItems: [li("professional", 11), li("onboarding", 1)], expectedCloseDate: "2026-06-20", createdAt: "2026-05-29", notes: "Needs demo focused on tasks and follow-ups." },
  { id: "d-024", name: "Fitness franchise pipeline", companyId: "midtown-fitness", contactId: "c-012", ownerId: "taylor", stage: "Negotiation", lineItems: [li("professional", 8), li("support", 2), li("consulting", 20)], expectedCloseDate: "2026-07-15", createdAt: "2026-05-06", notes: "Negotiating rollout pace across locations." },
  { id: "d-025", name: "Manufacturing quote automation", companyId: "pioneer-manufacturing", contactId: "c-014", ownerId: "jordan", stage: "New Lead", lineItems: [li("starter", 9), li("onboarding", 1)], expectedCloseDate: "2026-06-15", createdAt: "2026-06-03", notes: "Controller asked for quote generation example." }
];

export const activities: Activity[] = [
  { id: "a-001", dealId: "d-001", contactId: "c-001", type: "call", body: "Discovery call completed. Maya wants a short quote by Friday.", createdAt: "2026-06-01T09:15:00", dueDate: "2026-06-07", done: false },
  { id: "a-002", dealId: "d-002", contactId: "c-002", type: "email", body: "Sent proposal and product comparison.", createdAt: "2026-06-02T10:30:00" },
  { id: "a-003", dealId: "d-003", contactId: "c-003", type: "task", body: "Send field crew demo recording.", createdAt: "2026-06-03T11:05:00", dueDate: "2026-06-06", done: false },
  { id: "a-004", dealId: "d-004", contactId: "c-004", type: "meeting", body: "Procurement review with Grant and finance team.", createdAt: "2026-06-02T14:00:00", dueDate: "2026-06-10", done: false },
  { id: "a-005", dealId: "d-005", contactId: "c-005", type: "note", body: "Closed won. Create onboarding plan.", createdAt: "2026-06-03T15:15:00" },
  { id: "a-006", dealId: "d-006", contactId: "c-006", type: "task", body: "Confirm document requirements for partner intake.", createdAt: "2026-06-01T16:40:00", dueDate: "2026-06-08", done: false },
  { id: "a-007", dealId: "d-007", contactId: "c-007", type: "email", body: "Miles asked for a one-page ROI summary.", createdAt: "2026-05-31T12:20:00", dueDate: "2026-06-06", done: false },
  { id: "a-008", dealId: "d-008", contactId: "c-008", type: "call", body: "Left voicemail about seasonal setup timeline.", createdAt: "2026-06-04T08:50:00" },
  { id: "a-009", dealId: "d-009", contactId: "c-009", type: "meeting", body: "Negotiation meeting. Custom forecast field approved.", createdAt: "2026-06-04T10:00:00", dueDate: "2026-06-11", done: false },
  { id: "a-010", dealId: "d-010", contactId: "c-010", type: "note", body: "Budget freeze. Set nurture reminder for October.", createdAt: "2026-05-15T10:30:00" },
  { id: "a-011", dealId: "d-011", contactId: "c-011", type: "task", body: "Revise quote to split implementation fees.", createdAt: "2026-06-04T13:10:00", dueDate: "2026-06-06", done: false },
  { id: "a-012", dealId: "d-012", contactId: "c-012", type: "note", body: "Closed won. Schedule kickoff.", createdAt: "2026-06-01T14:45:00" },
  { id: "a-013", dealId: "d-013", contactId: "c-013", type: "meeting", body: "Plant manager wants leadership dashboard preview.", createdAt: "2026-06-03T09:30:00", dueDate: "2026-06-12", done: false },
  { id: "a-014", dealId: "d-014", contactId: "c-014", type: "task", body: "Follow up after internal build review.", createdAt: "2026-05-02T09:00:00", dueDate: "2026-06-20", done: false },
  { id: "a-015", dealId: "d-015", contactId: "c-015", type: "call", body: "Founder wants examples from food and beverage customers.", createdAt: "2026-06-03T16:15:00" },
  { id: "a-016", dealId: "d-016", contactId: "c-015", type: "task", body: "Ask about wholesale volumes and multi-location rollout.", createdAt: "2026-06-04T09:45:00", dueDate: "2026-06-09", done: false },
  { id: "a-017", dealId: "d-017", contactId: "c-001", type: "email", body: "Sent expansion pricing.", createdAt: "2026-06-04T11:20:00", dueDate: "2026-06-07", done: false },
  { id: "a-018", dealId: "d-018", contactId: "c-003", type: "note", body: "Won last month. Mention as construction proof point.", createdAt: "2026-05-22T12:00:00" },
  { id: "a-019", dealId: "d-019", contactId: "c-005", type: "task", body: "Add approval workflow language to quote.", createdAt: "2026-06-03T10:35:00", dueDate: "2026-06-06", done: false },
  { id: "a-020", dealId: "d-020", contactId: "c-006", type: "note", body: "Closed last month. Referral opportunity possible.", createdAt: "2026-05-14T13:30:00" },
  { id: "a-021", dealId: "d-021", contactId: "c-008", type: "note", body: "Won this month. Training requested.", createdAt: "2026-06-05T09:00:00" },
  { id: "a-022", dealId: "d-022", contactId: "c-009", type: "meeting", body: "Executive review scheduled.", createdAt: "2026-06-04T15:20:00", dueDate: "2026-06-13", done: false },
  { id: "a-023", dealId: "d-023", contactId: "c-011", type: "task", body: "Send task automation demo clip.", createdAt: "2026-06-04T16:10:00", dueDate: "2026-06-07", done: false },
  { id: "a-024", dealId: "d-024", contactId: "c-012", type: "email", body: "Negotiation notes sent to Tessa.", createdAt: "2026-06-02T16:00:00" },
  { id: "a-025", dealId: "d-025", contactId: "c-014", type: "task", body: "Show quote generation flow.", createdAt: "2026-06-04T17:30:00", dueDate: "2026-06-06", done: false },
  { id: "a-026", contactId: "c-009", type: "note", body: "TechNova prefers annual terms if implementation is discounted.", createdAt: "2026-06-01T08:30:00" },
  { id: "a-027", contactId: "c-004", type: "call", body: "Grant asked about procurement permissions.", createdAt: "2026-06-01T13:30:00" },
  { id: "a-028", contactId: "c-012", type: "task", body: "Confirm kickoff date for Midtown Fitness.", createdAt: "2026-06-05T10:15:00", dueDate: "2026-06-10", done: false }
];

export const seedData = {
  users,
  companies,
  contacts,
  products,
  deals,
  activities
};
