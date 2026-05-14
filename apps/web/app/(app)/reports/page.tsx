import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId } from "@/lib/org";

export default async function ReportsPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "reporting");
  return <section><h1 className="text-2xl font-semibold">Reports</h1><p className="mt-4 text-muted-foreground">Time by member, project budgets, utilization, and subordinate team views.</p></section>;
}
