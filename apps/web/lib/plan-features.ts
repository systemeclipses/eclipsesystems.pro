import { redirect } from "next/navigation";
import { PLAN_FEATURES, type PlanFeature } from "@eclipsesystems/shared/plans";
import { createServerClient } from "@/lib/supabase/server";

export { PLAN_FEATURES };

export async function requireFeature(orgId: string, feature: PlanFeature) {
  const supabase = createServerClient();
  const { data } = await supabase.rpc("org_has_feature", { org_id: orgId, feature });
  if (!data) redirect(`/settings/billing?upgrade=${feature}`);
}
