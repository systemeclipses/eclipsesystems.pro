export const PLAN_FEATURES = {
  timekeeping: { projects: false, invoicing: false, shifts: false, chat: false, legal: false, reporting: true },
  mission_command: { projects: false, invoicing: false, shifts: true, chat: true, legal: false, reporting: true },
  eclipse: { projects: true, invoicing: true, shifts: false, chat: false, legal: false, reporting: true },
  suite: { projects: true, invoicing: true, shifts: true, chat: true, legal: false, reporting: true },
  legal_addon: { projects: false, invoicing: false, shifts: false, chat: false, legal: true, reporting: false }
} as const;

export const PLAN_PRICES = {
  timekeeping: { monthlyCents: 1000, annualCents: 9600, minSeats: 2 },
  mission_command: { monthlyCents: 18_00, annualCents: 172_80, minSeats: 2 },
  eclipse: { monthlyCents: 22_00, annualCents: 211_20, minSeats: 2 },
  suite: { monthlyCents: 38_00, annualCents: 364_80, minSeats: 2 },
  legal_addon: { monthlyCents: 20_00, annualCents: 192_00, minSeats: 2 }
} as const;

export const PLAN_NAMES = {
  timekeeping: "Eclipse Timekeeping",
  mission_command: "Mission Command by Eclipse",
  eclipse: "Eclipse",
  suite: "Eclipse Suite",
  legal_addon: "Eclipse Legal Add-on"
} as const;

export const PLAN_KINDS = {
  timekeeping: "product",
  mission_command: "product",
  eclipse: "product",
  suite: "bundle",
  legal_addon: "add_on"
} as const;

export type PlanCode = keyof typeof PLAN_FEATURES;
export type PlanFeature = keyof typeof PLAN_FEATURES.suite;

export function hasPlanFeature(plan: PlanCode, feature: PlanFeature) {
  return PLAN_FEATURES[plan][feature];
}
