import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { BillingPanel } from "@/components/billing/billing-panel";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";

export default async function BillingSettingsPage() {
  const userId = await getAuthenticatedUserId();
  const orgId = await getActiveOrgId();
  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  return <BillingPanel orgId={orgId} subscription={subscription} />;
}
