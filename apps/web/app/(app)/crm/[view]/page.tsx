import { notFound } from "next/navigation";
import { TemplateCrmDemo } from "@/components/app/template-crm-demo";
import type { ViewKey } from "@/lib/crm-demo-store";

const viewAliases: Record<string, ViewKey> = {
  dashboard: "dashboard",
  pipeline: "pipeline",
  deals: "deals",
  contacts: "contacts",
  companies: "companies",
  reports: "reports",
  opportunities: "pipeline",
  activity: "deals",
  organizations: "companies",
  proposals: "deals",
  pricing: "deals",
  renewals: "reports",
  support: "dashboard",
  admin: "dashboard"
};

export function generateStaticParams() {
  return Object.keys(viewAliases).map((view) => ({ view }));
}

export default function CrmViewPage({ params }: { params: { view: string } }) {
  const view = viewAliases[params.view];
  if (!view) notFound();
  return <TemplateCrmDemo initialView={view} />;
}
