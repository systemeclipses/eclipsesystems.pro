import { and, eq, isNull } from "drizzle-orm";
import { PLAN_NAMES, PLAN_PRICES, type PlanCode } from "@eclipsesystems/shared/plans";
import { db } from "@/src/db";
import { billingPermissionGrants, membershipProductRoles, memberships, organizations, productEntitlements, subscriptions } from "@/src/db/schema";

export type ProductCode = "timekeeping" | "eclipse" | "mission_command" | "legal_addon";
export type ProductAccessCode = ProductCode | "suite";
export type ProductAccessRole = "employee" | "admin";
export type RoleLevel = "employee" | "team_lead" | "manager" | "admin" | "owner" | "superuser";

export type ProductUiContext = {
  organizationId: string;
  organizationName: string;
  role: RoleLevel;
  plan: PlanCode | null;
  planName: string | null;
  entitledProducts: ProductCode[];
  productRoles: Partial<Record<ProductCode, ProductAccessRole>>;
  productAccess: Array<{ product: ProductAccessCode; accessRole: ProductAccessRole }>;
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
const roleRank: Record<ProductAccessRole, number> = { employee: 0, admin: 1 };

function normalizeRole(role: string | null | undefined): RoleLevel {
  if (role === "superuser" || role === "owner" || role === "admin" || role === "manager" || role === "team_lead" || role === "employee") return role;
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

function productsForAccessProduct(product: ProductAccessCode): ProductCode[] {
  if (product === "suite") return coreProducts;
  return [product];
}

function highestProductRole(current: ProductAccessRole | undefined, next: ProductAccessRole) {
  return !current || roleRank[next] > roleRank[current] ? next : current;
}

export function hasProduct(context: ProductUiContext, product: ProductCode) {
  return context.entitledProducts.includes(product);
}

export function productRoleFor(context: ProductUiContext, product: ProductCode): ProductAccessRole {
  return context.productRoles[product] ?? (context.role === "superuser" || context.role === "owner" || context.role === "admin" ? "admin" : "employee");
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

  const [billingPermissionRows, productAccessRows] = row?.membershipId
    ? await Promise.all([
        db
          .select({ permission: billingPermissionGrants.permission })
          .from(billingPermissionGrants)
          .where(
            and(
              eq(billingPermissionGrants.organizationId, organizationId),
              eq(billingPermissionGrants.membershipId, row.membershipId),
              isNull(billingPermissionGrants.revokedAt)
            )
          ),
        db
          .select({ product: membershipProductRoles.product, accessRole: membershipProductRoles.accessRole })
          .from(membershipProductRoles)
          .where(
            and(
              eq(membershipProductRoles.organizationId, organizationId),
              eq(membershipProductRoles.membershipId, row.membershipId),
              isNull(membershipProductRoles.revokedAt)
            )
          )
      ])
    : [[], []];

  const plan = isPlanCode(row?.plan) ? row.plan : null;
  const activeEntitlementProducts = entitlementRows
    .filter((entitlement) => entitlement.status === "active" || entitlement.status === "trial")
    .map((entitlement) => entitlement.product);
  const baseRole = row?.role === "superuser" ? "superuser" : row?.ownerId === userId ? "owner" : normalizeRole(row?.role);
  const availableProducts = Array.from(new Set(activeEntitlementProducts.length ? activeEntitlementProducts : productsForPlan(plan)));
  const assignedProductRoles = productAccessRows.reduce<Partial<Record<ProductCode, ProductAccessRole>>>((acc, assignment) => {
    for (const product of productsForAccessProduct(assignment.product)) {
      if (availableProducts.includes(product)) acc[product] = highestProductRole(acc[product], assignment.accessRole);
    }
    return acc;
  }, {});
  const productRoles = baseRole === "superuser"
    ? Object.fromEntries(allProducts.map((product) => [product, "admin" as ProductAccessRole])) as Record<ProductCode, ProductAccessRole>
    : productAccessRows.length
      ? assignedProductRoles
      : Object.fromEntries(availableProducts.map((product) => [product, baseRole === "owner" || baseRole === "admin" ? "admin" as ProductAccessRole : "employee" as ProductAccessRole])) as Partial<Record<ProductCode, ProductAccessRole>>;
  const isProductAdmin = Object.values(productRoles).includes("admin");
  const role: RoleLevel = baseRole === "superuser" || baseRole === "owner" || baseRole === "admin" ? baseRole : isProductAdmin ? "admin" : baseRole;
  const entitledProducts = baseRole === "superuser" ? allProducts : productAccessRows.length ? allProducts.filter((product) => productRoles[product]) : availableProducts;
  const isSuite = baseRole === "superuser" || plan === "suite" || coreProducts.every((product) => entitlementRows.some((entitlement) => entitlement.product === product && entitlement.acquiredVia === "suite" && (entitlement.status === "active" || entitlement.status === "trial")));
  const hasLegal = entitledProducts.includes("legal_addon");
  const isPurchasingRole = role === "admin" || role === "owner" || role === "superuser" || isProductAdmin;
  const canDiscover = isPurchasingRole || role === "manager" || role === "team_lead";
  const billingPermissions =
    role === "owner" || role === "superuser"
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
    productRoles,
    productAccess: productAccessRows,
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
