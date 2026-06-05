export type PackageSlug = "operations-hub" | "client-portal" | "crm-sales-pipeline" | "storefront";

export type PackageDefinition = {
  slug: PackageSlug;
  name: string;
  tagline: string;
  audience: string;
  href: string;
  navItems: Array<{
    label: string;
    href: string;
    icon: "dashboard" | "clock" | "calendar" | "invoice" | "people" | "documents" | "training" | "reports" | "settings" | "messages" | "uploads" | "pipeline" | "signature" | "tasks" | "catalog" | "cart" | "orders" | "inventory";
  }>;
  description: string;
  features: string[];
  seoKeywords: string[];
  moduleNote?: string;
  worksWith?: {
    packageName: string;
    copy: string;
  };
  metrics: Array<{ label: string; value: string }>;
};

export const packageDefinitions: PackageDefinition[] = [
  {
    slug: "operations-hub",
    name: "Operations Hub",
    tagline: "Your company intranet — plus timekeeping, billing, and the controls behind your client portal.",
    audience: "internal teams / employees",
    href: "/operations",
    navItems: [
      { label: "Dashboard", href: "/operations#dashboard", icon: "dashboard" },
      { label: "Timekeeping", href: "/operations#features", icon: "clock" },
      { label: "Scheduling", href: "/operations#features", icon: "calendar" },
      { label: "Billing", href: "/operations#features", icon: "invoice" },
      { label: "HR", href: "/operations#features", icon: "people" },
      { label: "Documents", href: "/operations#features", icon: "documents" },
      { label: "Training", href: "/operations#features", icon: "training" },
      { label: "Reports", href: "/operations#features", icon: "reports" },
      { label: "Admin", href: "/operations#features", icon: "settings" }
    ],
    description:
      "Operations Hub is the internal intranet and back office for running the company day-to-day: employee workflows, knowledge, documents, tickets, training, billing, reporting, and client-facing controls in one place.",
    features: [
      "Timekeeping & scheduling",
      "Invoicing & billing",
      "HR — PTO/leave, onboarding, employee directory",
      "Branded document creation (templates → PDF)",
      "Ticketing / helpdesk",
      "LMS / training with completion certificates",
      "Knowledge base / SOP library",
      "Company home — announcements, quick links",
      "Client Portal admin / back-office (manage clients, push documents for e-sign, issue invoices, answer messages)",
      "KPI dashboard & reports"
    ],
    seoKeywords: [
      "operations hub",
      "company intranet",
      "business intranet",
      "employee intranet",
      "client portal back office",
      "timekeeping billing HR software"
    ],
    moduleNote: "Modules can be turned on or off per client, so buyers only run what they need.",
    worksWith: {
      packageName: "Client Portal",
      copy: "Designed to work with Client Portal on the same data: Operations Hub is the internal back office, Client Portal is the external client-facing front office."
    },
    metrics: [
      { label: "On clock", value: "12" },
      { label: "PTO requests", value: "4" },
      { label: "Reports", value: "9" }
    ]
  },
  {
    slug: "client-portal",
    name: "Client Portal",
    tagline: "Give your customers a branded self-serve space.",
    audience: "a business's external clients",
    href: "/client-portal",
    navItems: [
      { label: "Dashboard", href: "/client-portal#dashboard", icon: "dashboard" },
      { label: "Projects", href: "/client-portal#features", icon: "tasks" },
      { label: "Documents", href: "/client-portal#features", icon: "documents" },
      { label: "Invoices", href: "/client-portal#features", icon: "invoice" },
      { label: "Messages", href: "/client-portal#features", icon: "messages" },
      { label: "Files", href: "/client-portal#features", icon: "uploads" },
      { label: "Notifications", href: "/client-portal#features", icon: "settings" }
    ],
    description:
      "A branded customer-facing portal where external clients can sign in, track work, exchange documents, pay invoices, message your team, and receive notifications.",
    features: [
      "branded client login",
      "project/job status tracking",
      "shared documents with e-signature",
      "invoice viewing & online payment",
      "messaging and requests",
      "file uploads/downloads",
      "notifications"
    ],
    seoKeywords: ["client portal", "customer portal", "branded client login", "client document portal"],
    worksWith: {
      packageName: "Operations Hub",
      copy: "Designed to work with Operations Hub on the same data: Operations Hub is the internal back office, Client Portal is the external client-facing front office."
    },
    metrics: [
      { label: "Active clients", value: "26" },
      { label: "Open requests", value: "11" },
      { label: "Files shared", value: "84" }
    ]
  },
  {
    slug: "crm-sales-pipeline",
    name: "CRM & Sales Pipeline",
    tagline: "Turn leads into closed, signed deals.",
    audience: "sales teams",
    href: "/crm",
    navItems: [
      { label: "Dashboard", href: "/crm", icon: "dashboard" },
      { label: "Pipeline", href: "/crm/pipeline", icon: "pipeline" },
      { label: "Deals", href: "/crm/deals", icon: "invoice" },
      { label: "Contacts", href: "/crm/contacts", icon: "people" },
      { label: "Companies", href: "/crm/companies", icon: "people" },
      { label: "Reports", href: "/crm/reports", icon: "reports" }
    ],
    description:
      "A standalone sales workspace for managing contacts, companies, deals, proposals, signatures, tasks, reminders, and conversion reporting.",
    features: [
      "contact & company management",
      "deal pipeline (kanban)",
      "quote & proposal builder (PDF)",
      "e-signature to close",
      "automatic hand-off to invoicing",
      "tasks, reminders & activity log",
      "pipeline and conversion reporting"
    ],
    seoKeywords: ["crm", "sales pipeline", "proposal builder", "deal pipeline"],
    metrics: [
      { label: "Open deals", value: "18" },
      { label: "Proposals", value: "7" },
      { label: "Close rate", value: "42%" }
    ]
  },
  {
    slug: "storefront",
    name: "Storefront",
    tagline: "Sell products or services online, under your brand.",
    audience: "customers / shoppers",
    href: "/storefront",
    navItems: [
      { label: "Dashboard", href: "/storefront#dashboard", icon: "dashboard" },
      { label: "Catalog", href: "/storefront#features", icon: "catalog" },
      { label: "Checkout", href: "/storefront#features", icon: "cart" },
      { label: "Orders", href: "/storefront#features", icon: "orders" },
      { label: "Customers", href: "/storefront#features", icon: "people" },
      { label: "Inventory", href: "/storefront#features", icon: "inventory" },
      { label: "Receipts", href: "/storefront#features", icon: "documents" },
      { label: "Admin", href: "/storefront#features", icon: "settings" }
    ],
    description:
      "A standalone commerce workspace for catalog management, checkout, customer accounts, inventory, receipts, orders, and product administration.",
    features: [
      "product & service catalog",
      "cart & checkout with payments",
      "order management",
      "customer accounts",
      "inventory tracking",
      "PDF receipts/confirmations",
      "product & order admin"
    ],
    seoKeywords: ["storefront", "online store", "product catalog", "checkout software"],
    metrics: [
      { label: "Products", value: "48" },
      { label: "Orders", value: "132" },
      { label: "Inventory alerts", value: "6" }
    ]
  }
];

export function getPackageDefinition(slug: PackageSlug) {
  return packageDefinitions.find((pkg) => pkg.slug === slug);
}
