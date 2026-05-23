import { getActiveOrgId } from "@/lib/org";
import { ShiftsClient } from "@/components/shifts/shifts-client";

export default async function ShiftsPage() {
  const orgId = await getActiveOrgId();
  return <ShiftsClient orgId={orgId} />;
}
