import { notFound } from 'next/navigation';
import { fetchLatestLogoPublicUrl } from '@/lib/gf1/logos';
import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import type { Gf1PayFrequency, Gf1ProposalRecord } from '@/lib/gf1/types';

export type ProposalDetailRow = Gf1ProposalRecord & {
  pricing_json?: Record<string, unknown> | null;
  pricing_summary?: Record<string, unknown> | null;
  wizard_payload?: Record<string, unknown> | null;
  approval_status?: string | null;
  approval_decided_at?: string | null;
  approval_decided_by?: string | null;
  manager_email?: string | null;
  services_json?: Record<string, boolean | undefined> | null;
  services_snapshot?: Record<string, unknown> | null;
  slides_json?: Record<string, unknown> | null;
  prospect_id?: string | null;
};

export type OrgSummary = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  trade_name: string | null;
  logo_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  total_employees: number | null;
  pay_frequency: Gf1PayFrequency | null;
  industry: string | null;
  sales_rep_name?: string | null;
};

function getNestedRecord(
  source: Record<string, unknown> | null | undefined,
  key: string,
): Record<string, unknown> | null {
  const value = source?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function centsToDollars(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value / 100;
}

function mergeScalarPricingIntoWizard(proposal: ProposalDetailRow, wizard: Record<string, unknown>) {
  const nextWizard = { ...wizard };

  nextWizard.adminFeeEnabled = proposal.admin_fee_enabled ?? nextWizard.adminFeeEnabled ?? false;
  nextWizard.adminFeeRate = centsToDollars(proposal.admin_fee_rate_cents) ?? nextWizard.adminFeeRate ?? null;
  nextWizard.adminFeeBasis = proposal.admin_fee_basis ?? nextWizard.adminFeeBasis ?? 'PEPM';

  if (proposal.billing_model === 'percent_of_gross') {
    nextWizard.adminFeeMode = 'percent_of_gross';
    nextWizard.adminFeeValue = proposal.admin_fee_percent ?? proposal.percent_of_gross ?? nextWizard.adminFeeValue ?? null;
  } else if (proposal.admin_fee_enabled) {
    nextWizard.adminFeeMode = proposal.admin_fee_basis === 'PEPC' ? 'per_check' : 'per_month';
    nextWizard.adminFeeValue = centsToDollars(proposal.admin_fee_rate_cents) ?? nextWizard.adminFeeValue ?? null;
  }

  nextWizard.timekeepingFeeEnabled =
    proposal.timekeeping_fee_enabled ?? nextWizard.timekeepingFeeEnabled ?? false;
  nextWizard.timekeepingFeeRate =
    centsToDollars(proposal.timekeeping_fee_rate_cents) ?? nextWizard.timekeepingFeeRate ?? null;
  nextWizard.timekeepingFeeBasis =
    proposal.timekeeping_fee_basis ?? nextWizard.timekeepingFeeBasis ?? 'PEPM';

  nextWizard.learningManagementSystemFeeEnabled =
    proposal.learning_management_system_fee_enabled ??
    nextWizard.learningManagementSystemFeeEnabled ??
    false;
  nextWizard.learningManagementSystemFeeRate =
    centsToDollars(proposal.learning_management_system_fee_rate_cents) ??
    nextWizard.learningManagementSystemFeeRate ??
    null;
  nextWizard.learningManagementSystemFeeBasis =
    proposal.learning_management_system_fee_basis ??
    nextWizard.learningManagementSystemFeeBasis ??
    'PEPM';

  nextWizard.checksPerMonth = proposal.checks_per_month ?? nextWizard.checksPerMonth ?? null;
  nextWizard.totalAnnualPayroll = proposal.payroll_volume ?? nextWizard.totalAnnualPayroll ?? null;
  nextWizard.setupFees = proposal.setup_fee_total ?? nextWizard.setupFees ?? null;

  return nextWizard;
}

export async function loadProposalWorkspace(id: string) {
  const { role, user } = await requireSalesUser();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  const admin = supaAdmin();

  const { data: proposal } = await admin
    .from('proposals')
    .select('*')
    .eq('id', id)
    .maybeSingle<ProposalDetailRow>();
  if (!proposal) notFound();

  const { data: organization } = await admin
    .from('organizations')
    .select(
      'id, legal_name, dba_name, trade_name, logo_url, primary_contact_name, primary_contact_email, total_employees, pay_frequency, industry, sales_rep_name',
    )
    .eq('id', proposal.organization_id)
    .maybeSingle<OrgSummary>();
  if (!organization) notFound();
  if (role === 'sales' && organization.sales_rep_name !== salesRepFilter) notFound();

  let resolvedLogoUrl = await fetchLatestLogoPublicUrl(admin, organization.id);
  if (!resolvedLogoUrl) resolvedLogoUrl = organization.logo_url ?? null;

  const safeProposal = JSON.parse(
    JSON.stringify({
      ...proposal,
      services_json: (proposal.services_json ?? null) as Record<string, boolean> | null,
      pricing_json: proposal.pricing_json ?? null,
      pricing_summary: proposal.pricing_summary ?? null,
    }),
  ) as ProposalDetailRow;

  const safeOrganization = JSON.parse(
    JSON.stringify({
      ...organization,
      logo_url: resolvedLogoUrl,
      industry: organization.industry ?? null,
    }),
  ) as OrgSummary;

  const safeServices = JSON.parse(
    JSON.stringify((safeProposal.services_json ?? safeProposal.services_snapshot ?? {}) as Record<string, unknown>),
  ) as {
    health?: boolean;
    retirement401k?: boolean;
    supplemental?: boolean;
    otherCompanyPaid?: boolean;
    additionalServices?: Record<string, boolean | undefined>;
    wizardPricing?: Record<string, unknown> | null;
  };

  const defaultHeadcount = safeProposal.modeled_employee_count ?? safeOrganization.total_employees ?? 0;
  const defaultPayFrequency = safeOrganization.pay_frequency ?? 'biweekly';
  const isAdmin = role === 'admin';

  const wizardPricingBase =
    (getNestedRecord(safeProposal.pricing_json ?? null, 'wizardPricing') ??
      getNestedRecord(safeProposal.pricing_summary ?? null, 'wizardPricing') ??
      safeProposal.wizard_payload ??
      safeProposal.pricing_json ??
      safeProposal.pricing_summary ??
      {}) as Record<string, unknown>;
  const wizardPricing = mergeScalarPricingIntoWizard(safeProposal, wizardPricingBase);

  return {
    id,
    role,
    isAdmin,
    canEdit: true,
    safeProposal,
    safeOrganization,
    safeServices,
    wizardPricing,
    defaultHeadcount,
    defaultPayFrequency,
  };
}
