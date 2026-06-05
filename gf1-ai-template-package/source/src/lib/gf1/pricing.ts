import type { Gf1BillingModel, Gf1PayFrequency } from './types';

export const DEFAULT_BASE_PRICE_PER_EMPLOYEE = 1000; // Update to tune the standard annual target per employee.
export const MIN_BASE_PRICE_PER_EMPLOYEE = 750; // Hard floor per spec.

const PERIODS_PER_YEAR: Record<Gf1PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  other: 12,
};

export type PricingInput = {
  headcount: number;
  payFrequency: Gf1PayFrequency;
  basePricePerEmployeePerYear?: number;
  billingModel?: Gf1BillingModel;
  modeledAnnualPayroll?: number; // Optional, used to back into % of gross; defaults to a light heuristic.
};

export type PricingRecommendation = {
  normalizedBase: number;
  annualAdminTarget: number;
  billingModel: Gf1BillingModel;
  percentOfGross?: number;
  flatPerEmployeePerPeriod?: number;
};

export function calculatePricing(input: PricingInput): PricingRecommendation {
  const headcount = Math.max(0, input.headcount || 0);
  const normalizedBase = Math.max(input.basePricePerEmployeePerYear ?? DEFAULT_BASE_PRICE_PER_EMPLOYEE, MIN_BASE_PRICE_PER_EMPLOYEE);
  const annualAdminTarget = headcount * normalizedBase;
  const periodsPerYear = PERIODS_PER_YEAR[input.payFrequency] ?? 12;
  const modeledAnnualPayroll = input.modeledAnnualPayroll ?? headcount * 52000; // Default guess: $1k/week average wages.

  // Percent-of-gross that backs into annual target.
  const percentOfGross = modeledAnnualPayroll > 0 ? +(annualAdminTarget / modeledAnnualPayroll).toFixed(4) : 0;
  const flatPerEmployeePerPeriod =
    headcount > 0 && periodsPerYear > 0 ? +(annualAdminTarget / headcount / periodsPerYear).toFixed(2) : 0;

  const billingModel: Gf1BillingModel = input.billingModel ?? 'flat_per_employee';

  return {
    normalizedBase,
    annualAdminTarget,
    billingModel,
    percentOfGross,
    flatPerEmployeePerPeriod,
  };
}

/**
 * Utility to clamp and sanitize pricing inputs when editing proposals. Keeps the base price above the floor
 * without mutating the caller's state.
 */
export function normalizeBasePrice(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return MIN_BASE_PRICE_PER_EMPLOYEE;
  return Math.max(value, MIN_BASE_PRICE_PER_EMPLOYEE);
}
