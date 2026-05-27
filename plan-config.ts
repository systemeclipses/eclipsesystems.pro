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

export function isFeatureLocked(plan: PlanTier, category: string): boolean {
  return !PLAN_FEATURES[plan].includes(category);
}

export function isRoleLocked(plan: PlanTier, roleKey: string): boolean {
  return !PLAN_ROLES[plan].includes(roleKey);
}