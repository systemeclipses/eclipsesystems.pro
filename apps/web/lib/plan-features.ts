import { redirect } from "next/navigation";
import { PLAN_FEATURES, hasPlanFeature, type PlanCode, type PlanFeature } from "@eclipsesystems/shared/plans";
import { auth } from "@/src/auth";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";

export { PLAN_FEATURES };

export async function requireFeature(orgId: string, feature: PlanFeature) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  const plan = subscription?.plan as PlanCode | undefined;

  if (!plan || !hasPlanFeature(plan, feature)) redirect(`/settings/billing?upgrade=${feature}`);
}
