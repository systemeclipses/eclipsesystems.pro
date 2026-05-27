import { and, eq, isNull } from "drizzle-orm";
import { PLAN_NAMES, PLAN_PRICES, type PlanCode } from "@eclipsesystems/shared/plans";
import { db } from "@/src/db";
import { billingPermissionGrants, memberships, organizations, productEntitlements, subscriptions } from "@/src/db/schema";

export type ProductCode = "timekeeping" | "eclipse" | "mission_command" | "legal_addon";
export type RoleLevel = "employee" | "team_lead" | "manager" | "admin" | "owner";

export type ProductUiContext = {
  organizationId: string;
  organizationName: string;
  role: RoleLevel;
  plan: PlanCode | null;
  planName: string | null;
  entitledProducts: ProductCode[];
  lockedProducts: ProductCode[];
  isSuite: boolean;
  hasLegal: boolean;
  showLockedProducts: boolean;
  showUpgradePrompts: boolean;
  showMarketplace: boolean;
  showBilling: boolean;
  billingPermissions: string[];
  suiteSavingsMonthlyCents: number;
};

export const PRODUCT_DETAILS: Record<ProductCode, {
  name: string;
  shortName: string;
  navSection: string;
  description: string;
  priceMonthlyCents: number;
  accentClass: string;
}> = {
  timekeeping: {
    name: PLAN_NAMES.timekeeping,
    shortName: "Timekeeping",
    navSection: "Workforce",
    description: "Clock in/out, timesheets, PTO, reports, and pay rules.",
    priceMonthlyCents: PLAN_PRICES.timekeeping.monthlyCents,
    accentClass: "text-blue-700"
  },
  eclipse: {
    name: PLAN_NAMES.eclipse,
    shortName: "Invoicing",
    navSection: "Billing",
    description: "Projects, clients, invoices, and billing from approved work.",
    priceMonthlyCents: PLAN_PRICES.eclipse.monthlyCents,
    accentClass: "text-emerald-700"
  },
  mission_command: {
    name: PLAN_NAMES.mission_command,
    shortName: "Mission Command",
    navSection: "Operations",
    description: "Schedules, team chat, tasks, open shifts, and coverage.",
    priceMonthlyCents: PLAN_PRICES.mission_command.monthlyCents,
    accentClass: "text-orange-700"
  },
  legal_addon: {
    name: PLAN_NAMES.legal_addon,
    shortName: "Eclipse Legal",
    navSection: "Legal",
    description: "Matter-aware billing, UTBMS, LEDES, and legal controls.",
    priceMonthlyCents: PLAN_PRICES.legal_addon.monthlyCents,
    accentClass: "text-violet-700"
  }
};

const coreProducts: ProductCode[] = ["timekeeping", "eclipse", "mission_command"];
const allProducts: ProductCode[] = [...coreProducts, "legal_addon"];

function normalizeRole(role: string | null | undefined): RoleLevel {
  if (role === "owner" || role === "admin" || role === "manager" || role === "team_lead" || role === "employee") return role;
  if (role === "member") return "employee";
  return "employee";
}

export function productsForPlan(plan: PlanCode | string | null | undefined): ProductCode[] {
  if (plan === "suite") return ["timekeeping", "eclipse", "mission_command"];
  if (plan === "timekeeping") return ["timekeeping"];
  if (plan === "eclipse") return ["eclipse"];
  if (plan === "mission_command") return ["mission_command"];
  if (plan === "legal_addon") return ["legal_addon"];
  return [];
}

export function isPlanCode(plan: string | null | undefined): plan is PlanCode {
  return plan === "timekeeping" || plan === "mission_command" || plan === "eclipse" || plan === "suite" || plan === "legal_addon";
}

export function productForFeature(feature: string | null | undefined): ProductCode | null {
  if (feature === "projects" || feature === "invoicing") return "eclipse";
  if (feature === "shifts" || feature === "chat") return "mission_command";
  if (feature === "legal") return "legal_addon";
  if (feature === "reporting") return "timekeeping";
  return null;
}

export function hasProduct(context: ProductUiContext, product: ProductCode) {
  return context.entitledProducts.includes(product);
}

export async function getProductUiContext(userId: string, organizationId: string): Promise<ProductUiContext> {
  const [[row], entitlementRows] = await Promise.all([
    db
      .select({
        organizationName: organizations.name,
        ownerId: organizations.ownerId,
        membershipId: memberships.id,
        role: memberships.role,
        plan: subscriptions.plan,
        status: subscriptions.status
      })
      .from(organizations)
      .innerJoin(memberships, eq(memberships.organizationId, organizations.id))
      .leftJoin(subscriptions, and(eq(subscriptions.organizationId, organizations.id), isNull(subscriptions.deletedAt)))
      .where(and(eq(organizations.id, organizationId), eq(memberships.userId, userId), isNull(organizations.deletedAt), isNull(memberships.deletedAt)))
      .limit(1),
    db
      .select({
        product: productEntitlements.product,
        status: productEntitlements.status,
        acquiredVia: productEntitlements.acquiredVia
      })
      .from(productEntitlements)
      .where(eq(productEntitlements.organizationId, organizationId))
  ]);

  const billingPermissionRows = row?.membershipId
    ? await db
        .select({ permission: billingPermissionGrants.permission })
        .from(billingPermissionGrants)
        .where(
          and(
            eq(billingPermissionGrants.organizationId, organizationId),
            eq(billingPermissionGrants.membershipId, row.membershipId),
            isNull(billingPermissionGrants.revokedAt)
          )
        )
    : [];

  const role = row?.ownerId === userId ? "owner" : normalizeRole(row?.role);
  const plan = isPlanCode(row?.plan) ? row.plan : null;
  const activeEntitlementProducts = entitlementRows
    .filter((entitlement) => entitlement.status === "active" || entitlement.status === "trial")
    .map((entitlement) => entitlement.product);
  const entitledProducts = Array.from(new Set(activeEntitlementProducts.length ? activeEntitlementProducts : productsForPlan(plan)));
  const isSuite = plan === "suite" || coreProducts.every((product) => entitlementRows.some((entitlement) => entitlement.product === product && entitlement.acquiredVia === "suite" && (entitlement.status === "active" || entitlement.status === "trial")));
  const hasLegal = entitledProducts.includes("legal_addon");
  const isPurchasingRole = role === "admin" || role === "owner";
  const canDiscover = isPurchasingRole || role === "manager" || role === "team_lead";
  const billingPermissions =
    role === "owner"
      ? ["billing.view", "billing.usage.view", "billing.payment.update", "billing.plan.modify", "billing.cancel", "billing.owner"]
      : Array.from(new Set(billingPermissionRows.map((grant) => grant.permission)));
  const hasBillingAccess = billingPermissions.includes("billing.view") || billingPermissions.includes("billing.owner");
  const lockedProducts = canDiscover ? allProducts.filter((product) => !entitledProducts.includes(product)) : [];
  const individualCoreTotal = PLAN_PRICES.timekeeping.monthlyCents + PLAN_PRICES.eclipse.monthlyCents + PLAN_PRICES.mission_command.monthlyCents;

  return {
    organizationId,
    organizationName: row?.organizationName ?? "Workspace",
    role,
    plan,
    planName: plan ? PLAN_NAMES[plan] : null,
    entitledProducts,
    lockedProducts,
    isSuite,
    hasLegal,
    showLockedProducts: canDiscover,
    showUpgradePrompts: isPurchasingRole,
    showMarketplace: isPurchasingRole,
    showBilling: hasBillingAccess,
    billingPermissions,
    suiteSavingsMonthlyCents: Math.max(0, individualCoreTotal - PLAN_PRICES.suite.monthlyCents)
  };
}
