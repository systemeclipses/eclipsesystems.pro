import { notFound } from "next/navigation";
import { SecurityObservabilityClient } from "@/components/settings/security-observability-client";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getProductUiContext } from "@/src/billing/entitlements";
import { getSecurityObservabilityOverview } from "@/src/db/queries/security-observability";

export default async function SecuritySettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const context = await getProductUiContext(userId, orgId);
  if (!["superuser", "owner", "admin"].includes(context.role)) notFound();
  const overview = await getSecurityObservabilityOverview(orgId);

  return (
    <SecurityObservabilityClient
      settings={overview.settings}
      auditCount={overview.auditCount}
      securityEvents={overview.securityEvents}
      services={overview.services}
      monitors={overview.monitors}
      incidents={overview.incidents}
      canManage={context.role === "superuser" || context.role === "owner" || context.role === "admin"}
    />
  );
}
