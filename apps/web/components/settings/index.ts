export type MemberRole = "owner" | "admin" | "manager" | "member";

const roleRank: Record<MemberRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  member: 1
};

export function hasRoleAtLeast(actual: MemberRole, required: MemberRole) {
  return roleRank[actual] >= roleRank[required];
}

export type PlanTier = "starter" | "pro" | "business" | "legal";

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  starter: ["Time & Attendance", "PTO & Leave", "Org Settings", "Billing"],
  pro: ["Time & Attendance", "PTO & Leave", "Org Settings", "Billing", "Employee Management", "Reports & Analytics"],
  business: ["Time & Attendance", "PTO & Leave", "Org Settings", "Billing", "Employee Management", "Reports & Analytics", "Scheduling", "Mission Command"],
  legal: ["Time & Attendance", "PTO & Leave", "Org Settings", "Billing", "Employee Management", "Reports & Analytics", "Scheduling", "Mission Command", "Legal Matters", "Trust Accounting"]
};

export const PLAN_ROLES: Record<PlanTier, string[]> = {
  starter: ["owner", "employee"],
  pro: ["owner", "admin", "employee"],
  business: ["owner", "admin", "manager", "team_lead", "employee"],
  legal: ["owner", "admin", "manager", "team_lead", "employee"]
};

export const isFeatureLocked = (plan: PlanTier, category: string) => !PLAN_FEATURES[plan].includes(category);
export const isRoleLocked = (plan: PlanTier, roleKey: string) => !PLAN_ROLES[plan].includes(roleKey);