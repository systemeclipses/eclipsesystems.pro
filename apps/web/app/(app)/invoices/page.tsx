import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId } from "@/lib/org";

export default async function InvoicesPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "invoicing");
  return <section><h1 className="text-2xl font-semibold">Invoices</h1><p className="mt-4 text-muted-foreground">Draft from approved time, edit line items, send PDFs, and track payments.</p></section>;
}
