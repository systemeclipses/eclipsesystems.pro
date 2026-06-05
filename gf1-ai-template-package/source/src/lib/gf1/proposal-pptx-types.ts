export type WizardPricingStateRow = {
  state?: string | null;
  employees?: number | null;
  annualPayroll?: number | null;
  sutaRate?: number | null;
  wcClassCode?: string | null;
  wcRate?: number | null;
};

export type WizardPricingOtherFee = {
  id?: string;
  label?: string | null;
  amount?: number | null;
};

export type WizardPricingPayload = {
  statePricings?: WizardPricingStateRow[] | null;
  adminFeeMode?: string | null;
  adminFeeValue?: number | null;
  setupFees?: number | null;
  otherFees?: WizardPricingOtherFee[] | null;
  services?: {
    health?: boolean;
    retirement401k?: boolean;
    supplemental?: boolean;
    otherCompanyPaid?: boolean;
    additionalServices?: Record<string, boolean | null | undefined>;
  } | null;
  additionalServices?: Record<string, boolean | null | undefined>;
  payFrequency?: string | null;
  notesForApprover?: string | null;
  employeeCount?: number | null;
  estimatedMonthlyAdminCost?: number | null;
  estimatedSUTA?: number | null;
  estimatedWCPremium?: number | null;
};

export interface ProposalPptxPayload {
  companyName: string;
  tradeName?: string | null;
  logoUrl?: string | null;
  prospectContactName?: string | null;
  employeeCount: number;
  adminFeePerEmployee: number;
  estimatedMonthlyAdminCost: number;
  estimatedSUTA: number;
  estimatedWCPremium: number;
  industry?: string | null;
  customTagline?: string | null;
  services?: Record<string, boolean | undefined>;
  wizardPricing?: WizardPricingPayload | null;
}
