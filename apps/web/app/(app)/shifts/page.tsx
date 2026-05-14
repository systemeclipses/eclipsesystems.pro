import { requireFeature } from "@/lib/plan-features";
import { getActiveOrgId } from "@/lib/org";
import { ShiftsClient } from "@/components/shifts/shifts-client";

export default async function ShiftsPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "shifts");
  return <ShiftsClient orgId={orgId} />;
}
