import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";
import { BillingPanel } from "@/components/billing/billing-panel";

export default async function BillingSettingsPage() {
  const orgId = await getActiveOrgId();
  const supabase = createServerClient();
  const { data: subscription } = await supabase.from("subscriptions").select("plan,seats,status,billing_interval").eq("organization_id", orgId).maybeSingle();
  return <BillingPanel orgId={orgId} subscription={subscription} />;
}
