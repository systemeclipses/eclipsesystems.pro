import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId } from "@/lib/org";

export default async function MattersPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "legal");
  return <section><h1 className="text-2xl font-semibold">Matters</h1><p className="mt-4 text-muted-foreground">Matter list, custom rates, conflict checks, trust ledger, and LEDES export.</p></section>;
}
