import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PLAN_FEATURES, hasPlanFeature, type PlanCode, type PlanFeature } from "@eclipsesystems/shared/plans";
import { auth } from "@/src/auth";
import { getProductUiContext, productForFeature } from "@/src/billing/entitlements";
import { getActiveSubscriptionForUser } from "@/src/db/queries/billing";

export { PLAN_FEATURES };

export async function requireFeature(orgId: string, feature: PlanFeature) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const context = await getProductUiContext(userId, orgId);
  if (context.role === "superuser") return;

  const product = productForFeature(feature);
  if (product && !context.entitledProducts.includes(product)) {
    if (context.showUpgradePrompts) redirect(`/settings/billing?upgrade=${feature}`);
    notFound();
  }

  const subscription = await getActiveSubscriptionForUser(userId, orgId);
  const plan = subscription?.plan as PlanCode | undefined;

  if (!plan || !hasPlanFeature(plan, feature)) {
    if (product && context.entitledProducts.includes(product)) return;
    if (context.showUpgradePrompts) redirect(`/settings/billing?upgrade=${feature}`);
    notFound();
  }
}
