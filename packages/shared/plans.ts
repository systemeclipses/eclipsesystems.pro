export const PLAN_FEATURES = {
  starter: { projects: false, invoicing: false, shifts: false, chat: false, legal: false, reporting: false },
  pro: { projects: true, invoicing: true, shifts: false, chat: false, legal: false, reporting: false },
  business: { projects: true, invoicing: true, shifts: true, chat: true, legal: false, reporting: true },
  legal: { projects: true, invoicing: true, shifts: true, chat: true, legal: true, reporting: true }
} as const;

export const PLAN_PRICES = {
  starter: { monthlyCents: 1000, annualCents: 9600, minSeats: 2 },
  pro: { monthlyCents: 1800, annualCents: 17280, minSeats: 2 },
  business: { monthlyCents: 2800, annualCents: 26880, minSeats: 2 },
  legal: { monthlyCents: 5500, annualCents: 52800, minSeats: 2 }
} as const;

export type PlanCode = keyof typeof PLAN_FEATURES;
export type PlanFeature = keyof typeof PLAN_FEATURES.legal;

export function hasPlanFeature(plan: PlanCode, feature: PlanFeature) {
  return PLAN_FEATURES[plan][feature];
}
