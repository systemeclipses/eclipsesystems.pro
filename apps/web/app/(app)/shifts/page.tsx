import { getActiveOrgId } from "@/lib/org";
import { requireFeature } from "@/lib/plan-features";
import { ShiftsClient } from "@/components/shifts/shifts-client";
import { getMissionCommandOverview } from "@/src/db/queries/mission-command";

export default async function ShiftsPage() {
  const orgId = await getActiveOrgId();
  await requireFeature(orgId, "shifts");
  const overview = await getMissionCommandOverview(orgId);
  return <ShiftsClient orgId={orgId} overview={overview} />;
}
