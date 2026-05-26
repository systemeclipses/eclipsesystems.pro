import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { plans, subscriptions } from "@/src/db/schema";

const planCatalog = [
  {
    code: "timekeeping",
    name: "Eclipse Timekeeping",
    monthlyPriceCents: 1000,
    annualPriceCents: 9600,
    minSeats: 2,
    features: { projects: false, invoicing: false, shifts: false, chat: false, legal: false, reporting: true },
    sortOrder: 10
  },
  {
    code: "mission_command",
    name: "Mission Command by Eclipse",
    monthlyPriceCents: 1800,
    annualPriceCents: 17280,
    minSeats: 2,
    features: { projects: false, invoicing: false, shifts: true, chat: true, legal: false, reporting: true },
    sortOrder: 20
  },
  {
    code: "eclipse",
    name: "Eclipse",
    monthlyPriceCents: 2200,
    annualPriceCents: 21120,
    minSeats: 2,
    features: { projects: true, invoicing: true, shifts: false, chat: false, legal: false, reporting: true },
    sortOrder: 30
  },
  {
    code: "suite",
    name: "Eclipse Suite",
    monthlyPriceCents: 3800,
    annualPriceCents: 36480,
    minSeats: 2,
    features: { projects: true, invoicing: true, shifts: true, chat: true, legal: false, reporting: true },
    sortOrder: 40
  },
  {
    code: "legal_addon",
    name: "Eclipse Legal Add-on",
    monthlyPriceCents: 2000,
    annualPriceCents: 19200,
    minSeats: 2,
    features: { projects: false, invoicing: false, shifts: false, chat: false, legal: true, reporting: false },
    sortOrder: 50
  }
];

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

export async function ensureTrialSubscriptionForOrganization(organizationId: string, plan = "timekeeping") {
  await db.insert(plans).values(planCatalog).onConflictDoNothing();

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.organizationId, organizationId), isNull(subscriptions.deletedAt)))
    .limit(1);

  if (existing) return existing.id;

  const [subscription] = await db
    .insert(subscriptions)
    .values({
      organizationId,
      plan,
      seats: 2,
      status: "trialing",
      billingInterval: "month",
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
    .returning({ id: subscriptions.id });

  return subscription.id;
}

export async function hasUsableSubscription(organizationId: string) {
  const [subscription] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(and(eq(subscriptions.organizationId, organizationId), isNull(subscriptions.deletedAt)))
    .limit(1);

  return subscription?.status === "active" || subscription?.status === "trialing";
}
