export type PackageIcon = "operations" | "portal" | "crm" | "storefront";

export type PackageTemplate = {
  id: string;
  name: string;
  oneLiner: string;
  for: string;
  features: string[];
  icon: PackageIcon;
};

export const packageTemplates = [
  {
    id: "operations-hub",
    name: "Operations Hub",
    oneLiner: "Run your business day-to-day.",
    for: "Internal teams / employees.",
    icon: "operations",
    features: [
      "Timekeeping & scheduling",
      "Invoicing & billing",
      "HR: employee directory, PTO requests, onboarding",
      "Document & SOP library",
      "Training/LMS with certificates",
      "KPI dashboard with PDF reports",
      "Role-based admin"
    ]
  },
  {
    id: "client-portal",
    name: "Client Portal",
    oneLiner: "Give your customers a branded self-serve space.",
    for: "A business's external clients.",
    icon: "portal",
    features: [
      "Branded client login",
      "Project/job status tracking",
      "Shared documents with e-signature",
      "Invoice viewing & online payment",
      "Messaging and requests",
      "File uploads/downloads",
      "Notifications"
    ]
  },
  {
    id: "crm-sales-pipeline",
    name: "CRM & Sales Pipeline",
    oneLiner: "Turn leads into closed, signed deals.",
    for: "Sales teams.",
    icon: "crm",
    features: [
      "Contact & company management",
      "Deal pipeline (kanban)",
      "Quote & proposal builder (PDF)",
      "E-signature to close",
      "Automatic hand-off to invoicing",
      "Tasks, reminders & activity log",
      "Pipeline and conversion reporting"
    ]
  },
  {
    id: "storefront",
    name: "Storefront",
    oneLiner: "Sell products or services online, under your brand.",
    for: "Customers / shoppers.",
    icon: "storefront",
    features: [
      "Product & service catalog",
      "Cart & checkout with payments",
      "Order management",
      "Customer accounts",
      "Inventory tracking",
      "PDF receipts/confirmations",
      "Product & order admin"
    ]
  }
] as const satisfies readonly PackageTemplate[];
