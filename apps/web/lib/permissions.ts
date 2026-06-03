import { hasPlanFeature, type PlanCode, type PlanFeature } from "@eclipsesystems/shared/plans";

export type PlanTier = PlanCode;
export type RoleKey = "superuser" | "owner" | "admin" | "manager" | "team_lead" | "employee" | "member";

const roleRanks: Record<RoleKey, number> = {
  member: 0,
  employee: 0,
  team_lead: 1,
  manager: 2,
  admin: 3,
  owner: 4,
  superuser: 5
};

const categoryFeatures: Record<string, PlanFeature | null> = {
  "Employee Management": null,
  "Time & Attendance": "reporting",
  "PTO & Leave": "reporting",
  Scheduling: "shifts",
  "Mission Command": "chat",
  "Reports & Analytics": "reporting",
  "Org Settings": null,
  Billing: null,
  "Legal Matters": "legal"
};

export function hasRoleAtLeast(role: RoleKey | string | null | undefined, minimumRole: RoleKey) {
  const normalizedRole = role === "member" ? "employee" : role;
  const rank = normalizedRole && normalizedRole in roleRanks ? roleRanks[normalizedRole as RoleKey] : roleRanks.employee;
  return rank >= roleRanks[minimumRole];
}

export function isRoleLocked(plan: PlanTier, role: RoleKey | string) {
  if (role === "team_lead") return !hasPlanFeature(plan, "shifts") && !hasPlanFeature(plan, "chat");
  return false;
}

export function isFeatureLocked(plan: PlanTier, categoryName: string) {
  const feature = categoryFeatures[categoryName];
  return feature ? !hasPlanFeature(plan, feature) : false;
}
