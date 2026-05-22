import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { subscriptions } from "@/src/db/schema";

export async function getActiveSubscriptionForUser(userId: string, organizationId: string) {
  const [subscription] = await db
    .select({
      plan: subscriptions.plan,
      seats: subscriptions.seats,
      status: subscriptions.status,
      billing_interval: subscriptions.billingInterval
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.organizationId, organizationId), isNull(subscriptions.deletedAt)))
    .limit(1);

  return subscription ?? null;
}
