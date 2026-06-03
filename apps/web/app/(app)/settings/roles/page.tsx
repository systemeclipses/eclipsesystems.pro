import { notFound } from "next/navigation";
import { RolesPermissionsClient } from "@/components/settings/roles-permissions-client";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getProductUiContext } from "@/src/billing/entitlements";
import { getRolesOverview } from "@/src/db/queries/roles";

export default async function RolesSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const context = await getProductUiContext(userId, orgId);
  if (!["superuser", "owner", "admin"].includes(context.role)) notFound();
  const overview = await getRolesOverview(orgId);

  return (
    <RolesPermissionsClient
      members={overview.members}
      roleCounts={overview.roleCounts}
      productAccess={overview.productAccess}
      customRoles={overview.customRoles}
      customGroups={overview.customGroups}
      canManage={context.role === "superuser" || context.role === "owner" || context.role === "admin"}
      canTransferOwnership={context.role === "owner"}
      currentPlan={context.plan ?? "timekeeping"}
    />
  );
}
