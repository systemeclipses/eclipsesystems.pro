import { notFound } from "next/navigation";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { BillingPanel } from "@/components/billing/billing-panel";
import { getProductUiContext } from "@/src/billing/entitlements";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";

export default async function BillingSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const context = await getProductUiContext(userId, orgId);
  if (!context.showBilling) notFound();
  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  return <BillingPanel orgId={orgId} subscription={subscription} context={context} />;
}
