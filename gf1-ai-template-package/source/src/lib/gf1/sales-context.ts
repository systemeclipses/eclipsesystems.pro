import type { SalesContext } from './slide-types';
import type { Gf1PayFrequency, Gf1ProposalRecord } from './types';

// Shared builder for the slide SalesContext. Used by the on-screen editor
// (ProposalSlidesClient) and the server-side PDF renderer so both produce
// byte-identical slide content from the same proposal/organization data.

export type SalesContextProposal = Gf1ProposalRecord & {
  pricing_json?: Record<string, unknown> | null;
  pricing_summary?: Record<string, unknown> | null;
  wizard_payload?: Record<string, unknown> | null;
};

export type SalesContextOrganization = {
  legal_name?: string | null;
  dba_name?: string | null;
  trade_name?: string | null;
  logo_url?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  industry?: string | null;
  total_employees?: number | null;
  pay_frequency?: Gf1PayFrequency | null;
  sales_rep_name?: string | null;
} | null;

function centsToDollars(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value / 100;
}

function getNestedRecord(
  source: Record<string, unknown> | null | undefined,
  key: string,
): Record<string, unknown> | null {
  const value = source?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const PAY_FREQUENCY_LABEL: Record<Gf1PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  semimonthly: 'Semi-Monthly',
  monthly: 'Monthly',
  other: 'Other',
};

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildSalesContext(
  proposal: SalesContextProposal,
  organization: SalesContextOrganization,
): SalesContext {
  const orgName =
    organization?.trade_name ||
    organization?.dba_name ||
    organization?.legal_name ||
    'Your Organization';

  const pricingRoot =
    (getNestedRecord(proposal.pricing_json ?? null, 'wizardPricing') ??
      getNestedRecord(proposal.pricing_summary ?? null, 'wizardPricing') ??
      proposal.wizard_payload ??
      proposal.pricing_json ??
      proposal.pricing_summary ??
      {}) as Record<string, unknown>;

  const employeeCount =
    typeof pricingRoot.employeeCount === 'number'
      ? pricingRoot.employeeCount
      : (proposal.modeled_employee_count ?? organization?.total_employees ?? null);

  const adminRate =
    typeof pricingRoot.adminFeeRate === 'number'
      ? pricingRoot.adminFeeRate
      : centsToDollars(proposal.admin_fee_rate_cents);
  const adminBasis =
    pricingRoot.adminFeeBasis === 'PEPC' || proposal.admin_fee_basis === 'PEPC' ? 'PEPC' : 'PEPM';
  const adminMode =
    pricingRoot.adminFeeMode === 'percent_of_gross' ||
    proposal.billing_model === 'percent_of_gross'
      ? 'percent_of_gross'
      : adminBasis;

  let adminFeeFormatted = '—';
  let adminFeeBasisLabel = '';
  if (adminMode === 'percent_of_gross') {
    const pct =
      typeof pricingRoot.adminFeeValue === 'number'
        ? pricingRoot.adminFeeValue
        : (proposal.admin_fee_percent ?? proposal.percent_of_gross ?? null);
    adminFeeFormatted = pct != null ? `${pct.toFixed(2)}%` : '—';
    adminFeeBasisLabel = 'of gross payroll';
  } else if (adminRate != null) {
    adminFeeFormatted = fmtMoney(adminRate);
    adminFeeBasisLabel = adminBasis === 'PEPC' ? 'per employee per payroll' : 'per employee per month';
  }

  const timekeepingEnabled =
    typeof pricingRoot.timekeepingFeeEnabled === 'boolean'
      ? pricingRoot.timekeepingFeeEnabled
      : Boolean(proposal.timekeeping_fee_enabled);
  const timekeepingRate =
    typeof pricingRoot.timekeepingFeeRate === 'number'
      ? pricingRoot.timekeepingFeeRate
      : centsToDollars(proposal.timekeeping_fee_rate_cents);
  const timekeepingBasis =
    pricingRoot.timekeepingFeeBasis === 'PEPC' || proposal.timekeeping_fee_basis === 'PEPC'
      ? 'PEPC'
      : 'PEPM';

  const lmsEnabled =
    typeof pricingRoot.learningManagementSystemFeeEnabled === 'boolean'
      ? pricingRoot.learningManagementSystemFeeEnabled
      : Boolean(proposal.learning_management_system_fee_enabled);
  const lmsRate =
    typeof pricingRoot.learningManagementSystemFeeRate === 'number'
      ? pricingRoot.learningManagementSystemFeeRate
      : centsToDollars(proposal.learning_management_system_fee_rate_cents ?? null);
  const lmsBasis =
    pricingRoot.learningManagementSystemFeeBasis === 'PEPC' ||
    proposal.learning_management_system_fee_basis === 'PEPC'
      ? 'PEPC'
      : 'PEPM';

  const setupTotal =
    typeof pricingRoot.setupFees === 'number'
      ? pricingRoot.setupFees
      : proposal.setup_fee_total ?? null;
  const payrollVolume =
    typeof pricingRoot.totalAnnualPayroll === 'number'
      ? pricingRoot.totalAnnualPayroll
      : proposal.payroll_volume ?? null;

  const statePricings = Array.isArray(pricingRoot.statePricings)
    ? pricingRoot.statePricings
        .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
        .map((row) => ({
          state: typeof row.state === 'string' ? row.state : 'N/A',
          sutaRate: typeof row.sutaRate === 'number' ? row.sutaRate : null,
          wcClassCode: typeof row.wcClassCode === 'string' ? row.wcClassCode : '',
          wcSellingRate: typeof row.wcSellingRate === 'number' ? row.wcSellingRate : null,
          wcCostRate: typeof row.wcCostRate === 'number' ? row.wcCostRate : null,
        }))
    : [];

  const oneTimeFees = [
    ...(typeof setupTotal === 'number' && setupTotal > 0
      ? [{ label: 'Setup Fee', amount: setupTotal }]
      : []),
    ...(Array.isArray(pricingRoot.otherFees)
      ? pricingRoot.otherFees
          .filter(
            (fee): fee is { label?: unknown; amount?: unknown } =>
              typeof fee === 'object' && fee !== null,
          )
          .map((fee) => ({
            label: typeof fee.label === 'string' && fee.label.trim() ? fee.label : 'One-Time Fee',
            amount: typeof fee.amount === 'number' ? fee.amount : 0,
          }))
          .filter((fee) => fee.amount > 0)
      : []),
  ];

  const now = new Date();
  const dateFull = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const monthYear = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const iso = now.toISOString().slice(0, 10);

  return {
    org: {
      name: orgName,
      legalName: organization?.legal_name ?? null,
      industry: organization?.industry ?? null,
      employees: employeeCount,
      payFrequencyLabel: organization?.pay_frequency
        ? PAY_FREQUENCY_LABEL[organization.pay_frequency]
        : null,
      contactName: organization?.primary_contact_name ?? null,
      contactEmail: organization?.primary_contact_email ?? null,
      addressLine: null,
      city: null,
      state: null,
      location: null,
      logoUrl: organization?.logo_url ?? null,
      salesRep: organization?.sales_rep_name ?? null,
    },
    pricing: {
      employeeCount,
      adminFeeFormatted,
      adminFeeBasisLabel,
      timekeepingFeeFormatted:
        timekeepingEnabled && timekeepingRate != null
          ? `${fmtMoney(timekeepingRate)} ${timekeepingBasis === 'PEPC' ? 'per employee per payroll' : 'per employee per month'}`
          : null,
      lmsFeeFormatted:
        lmsEnabled && lmsRate != null
          ? `${fmtMoney(lmsRate)} ${lmsBasis === 'PEPC' ? 'per employee per payroll' : 'per employee per month'}`
          : null,
      setupFeeFormatted: setupTotal != null && setupTotal > 0 ? fmtMoney(setupTotal) : null,
      payrollVolumeFormatted: payrollVolume != null ? fmtMoney(payrollVolume) : null,
      statePricings,
      oneTimeFees,
      ficaRate: 0.0765,
      futaRate: 0.006,
    },
    date: {
      full: dateFull,
      monthYear,
      iso,
    },
  };
}
