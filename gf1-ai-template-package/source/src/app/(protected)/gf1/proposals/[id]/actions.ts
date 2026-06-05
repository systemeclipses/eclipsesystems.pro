"use server";

import { revalidatePath } from 'next/cache';
import {
  requireAdmin,
  requireSalesManager,
  requireSalesUser,
  resolveProfileName,
} from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { calculatePricing, normalizeBasePrice } from '@/lib/gf1/pricing';
import { sendProposalRejectionEmail } from '@/lib/brevo';
import type { ProposalPricingForm } from '@/components/gf1/ProposalPricingEditor';
import type { Gf1PayFrequency } from '@/lib/gf1/types';

const CHECKS_PER_MONTH: Record<Gf1PayFrequency, number> = {
  weekly: 4.333,
  biweekly: 2.167,
  semimonthly: 2,
  monthly: 1,
  other: 1,
};

const toCents = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round(value * 100);
};

const resolveChecksPerMonth = (payFrequency: Gf1PayFrequency) => CHECKS_PER_MONTH[payFrequency] ?? 1;

type ColumnRow = { column_name: string };
type WizardPricingPayload = Record<string, any>;

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sumOtherFees(otherFees: unknown): number | null {
  if (!Array.isArray(otherFees)) return null;
  const total = otherFees.reduce((sum, fee) => {
    if (!fee || typeof fee !== 'object') return sum;
    const amount = toFiniteNumber((fee as Record<string, unknown>).amount) ?? 0;
    return sum + amount;
  }, 0);
  return total > 0 ? total : null;
}

async function applyOptionalProposalUpdate(
  admin: ReturnType<typeof supaAdmin>,
  proposalId: string,
  payload: Record<string, unknown>,
) {
  const remaining = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  for (let attempt = 0; attempt < 5 && Object.keys(remaining).length > 0; attempt += 1) {
    const { error } = await admin.from('proposals').update(remaining).eq('id', proposalId);
    if (!error) return;

    if (error.code === 'PGRST204' && typeof error.message === 'string') {
      const match = error.message.match(/'([^']+)' column/);
      if (match?.[1]) {
        delete remaining[match[1]];
        continue;
      }
    }

    let recovered = false;
    for (const [key, value] of Object.entries(remaining)) {
      const { error: singleError } = await admin
        .from('proposals')
        .update({ [key]: value })
        .eq('id', proposalId);

      if (!singleError) {
        recovered = true;
        delete remaining[key];
        continue;
      }

      if (singleError.code === 'PGRST204' && typeof singleError.message === 'string') {
        const match = singleError.message.match(/'([^']+)' column/);
        if (match?.[1]) {
          delete remaining[match[1]];
          recovered = true;
          continue;
        }
      }
    }

    if (!recovered && Object.keys(remaining).length > 0) {
      throw new Error(error.message || 'Could not update proposal');
    }
  }
}

async function logApprovalAction(
  proposalId: string,
  reviewerId: string,
  action: 'approved' | 'rejected'
) {
  try {
    const admin = supaAdmin();
  const { data: columns } = await admin
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'proposal_approvals');

  const colSet = new Set((columns ?? []).map((col: ColumnRow) => col.column_name));
    if (colSet.has('action')) {
      await admin.from('proposal_approvals').insert({
        proposal_id: proposalId,
        reviewer_id: reviewerId,
        action,
      });
      return;
    }
    if (colSet.has('decision')) {
      await admin.from('proposal_approvals').insert({
        proposal_id: proposalId,
        reviewer_id: reviewerId,
        decision: action === 'approved' ? 'approved' : 'rejected',
        decision_at: new Date().toISOString(),
      });
    }
  } catch {
    // ignore log failures
  }
}

async function updateProposalStatus(
  proposalId: string,
  status: 'approved' | 'rejected',
  userId: string,
  comments?: string | null
) {
  const admin = supaAdmin();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('proposals')
    .update({
      status,
      approval_status: status,
      approval_decided_by: userId,
      approval_decided_at: now,
      approval_token: null,
    })
    .eq('id', proposalId);

  if (error) {
    throw new Error(error.message || `Failed to update proposal status to ${status}`);
  }

  await logApprovalAction(proposalId, userId, status);
  if (comments) {
    await admin
      .from('proposal_approvals')
      .insert({
        proposal_id: proposalId,
        reviewer_id: userId,
        decision: status,
        decision_at: now,
        comments,
      });
  }

  if (status === 'rejected') {
    try {
      const { data: proposal } = await admin
        .from('proposals')
        .select('created_by, organization_id')
        .eq('id', proposalId)
        .maybeSingle();
      if (proposal?.created_by) {
        // @ts-ignore
        const creator = await admin.auth.admin.getUserById(proposal.created_by);
        const creatorEmail = creator?.data?.user?.email ?? null;
        let organizationName = 'your prospect';
        if (proposal.organization_id) {
          const { data: org } = await admin
            .from('organizations')
            .select('legal_name, dba_name, trade_name')
            .eq('id', proposal.organization_id)
            .maybeSingle();
          organizationName = org?.trade_name || org?.dba_name || org?.legal_name || organizationName;
        }
        if (creatorEmail) {
          await sendProposalRejectionEmail({
            to: creatorEmail,
            proposalId,
            organizationName,
            rejectionNotes: comments ?? null,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send proposal rejection email', err);
    }
  }
  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath('/gf1/proposals');
}

async function assertSalesProposalAccess(
  supabase: Awaited<ReturnType<typeof requireSalesUser>>['supabase'],
  user: Awaited<ReturnType<typeof requireSalesUser>>['user'],
  role: string | null,
  proposalId: string
) {
  if (role !== 'sales') return;
  const { data: proposal } = await supabase
    .from('proposals')
    .select('organization_id')
    .eq('id', proposalId)
    .maybeSingle();
  if (!proposal?.organization_id) {
    throw new Error('Proposal not found.');
  }
  const { data: org } = await supabase
    .from('organizations')
    .select('sales_rep_name')
    .eq('id', proposal.organization_id)
    .maybeSingle();
  const salesRepName = await resolveProfileName(user as any);
  if ((org as any)?.sales_rep_name !== (salesRepName ?? '__no_access__')) {
    throw new Error('Forbidden');
  }
}

export async function approveProposalAction(proposalId: string, comments?: string | null) {
  const { user } = await requireAdmin();
  await updateProposalStatus(proposalId, 'approved', user.id, comments ?? null);
}

export async function rejectProposalAction(proposalId: string, comments?: string | null) {
  const { user } = await requireAdmin();
  await updateProposalStatus(proposalId, 'rejected', user.id, comments ?? null);
}

export async function saveProposalDraftAction(proposalId: string, payload: ProposalPricingForm) {
  const { supabase, user, role } = await requireSalesUser();
  await assertSalesProposalAccess(supabase, user, role ?? null, proposalId);
  const admin = supaAdmin();
  const { data: existing } = await supabase
    .from('proposals')
    .select('status, pricing_json, pricing_summary, wizard_payload')
    .eq('id', proposalId)
    .maybeSingle();
  const pricing = calculatePricing({
    headcount: payload.modeledEmployeeCount,
    payFrequency: payload.payFrequency,
    basePricePerEmployeePerYear: normalizeBasePrice(payload.basePricePerEmployeePerYear),
    billingModel: payload.billingModel,
  });

  const addonsPayload = (payload.addons ?? []).map((addon) => ({
    id: addon.id,
    label: addon.label,
    enabled: Boolean(addon.enabled),
    pricing_model: addon.pricingModel,
    amount_cents: toCents(addon.amount),
  }));
  const lmsAddon = addonsPayload.find((addon) => addon.id === 'learning_management_system') ?? null;
  const existingWizardPayload =
    (((existing?.wizard_payload as Record<string, unknown> | null) ?? {}) as Record<string, unknown>);
  const pricingBase =
    ((existing?.pricing_json as Record<string, unknown> | null) ??
      (existing?.pricing_summary as Record<string, unknown> | null) ??
      {}) as Record<string, unknown>;
  const nextWizardPayload = {
    ...existingWizardPayload,
    adminFeeEnabled: Boolean(payload.adminFeeEnabled),
    adminFeeRate: payload.adminFeeRate,
    adminFeeBasis: payload.adminFeeBasis,
    timekeepingFeeEnabled: Boolean(payload.timekeepingFeeEnabled),
    timekeepingFeeRate: payload.timekeepingFeeRate,
    timekeepingFeeBasis: payload.timekeepingFeeBasis,
    learningManagementSystemFeeEnabled: Boolean(lmsAddon?.enabled),
    learningManagementSystemFeeRate: typeof lmsAddon?.amount_cents === 'number' ? lmsAddon.amount_cents / 100 : null,
    learningManagementSystemFeeBasis:
      lmsAddon?.pricing_model === 'per_employee_per_check' ? 'PEPC' : 'PEPM',
    checksPerMonth: resolveChecksPerMonth(payload.payFrequency),
  };
  const setupFees = toFiniteNumber(existingWizardPayload.setupFees);
  const otherFeesTotal = sumOtherFees(existingWizardPayload.otherFees);
  const totalAnnualPayroll = toFiniteNumber(existingWizardPayload.totalAnnualPayroll);
  const nextPricing = {
    ...pricingBase,
    wizardPricing: nextWizardPayload,
  };
  const nextStatus = existing?.status === 'pending_approval' ? 'pending_approval' : 'draft';

  const updates = {
    status: nextStatus,
    base_price_per_employee_per_year: pricing.normalizedBase,
    minimum_price_per_employee_per_year: normalizeBasePrice(payload.minimumPricePerEmployeePerYear),
    annual_admin_target: pricing.annualAdminTarget,
    billing_model: payload.billingModel,
    percent_of_gross: payload.percentOfGross ?? pricing.percentOfGross,
    flat_admin_fee_per_employee_per_period: payload.flatAdminFeePerEmployeePerPeriod ?? pricing.flatPerEmployeePerPeriod,
    modeled_employee_count: payload.modeledEmployeeCount,
    notes_for_internal: payload.notesForInternal,
    notes_for_prospect: payload.notesForProspect,
    services_json: payload.services,
    wc_cost_cents: toCents(payload.wcCost),
    wc_selling_price_cents: toCents(payload.wcSellingPrice),
    admin_fee_enabled: Boolean(payload.adminFeeEnabled),
    admin_fee_rate_cents: payload.adminFeeEnabled ? toCents(payload.adminFeeRate) : null,
    admin_fee_basis: payload.adminFeeBasis,
    learning_management_system_fee_enabled: Boolean(lmsAddon?.enabled),
    learning_management_system_fee_rate_cents: lmsAddon?.enabled ? lmsAddon.amount_cents : null,
    learning_management_system_fee_basis:
      lmsAddon?.pricing_model === 'per_employee_per_check' ? 'PEPC' : 'PEPM',
    timekeeping_fee_enabled: Boolean(payload.timekeepingFeeEnabled),
    timekeeping_fee_rate_cents: payload.timekeepingFeeEnabled ? toCents(payload.timekeepingFeeRate) : null,
    timekeeping_fee_basis: payload.timekeepingFeeBasis,
    checks_per_month: resolveChecksPerMonth(payload.payFrequency),
    admin_fee_percent: payload.billingModel === 'percent_of_gross' ? payload.percentOfGross : null,
    payroll_volume: totalAnnualPayroll,
    setup_fee_total: setupFees,
    deposit_total: otherFeesTotal,
    wizard_payload: nextWizardPayload,
    pricing_json: nextPricing,
    pricing_summary: nextPricing,
    addons_json: addonsPayload,
    updated_at: new Date().toISOString(),
    created_by: user.id,
  };

  try {
    await applyOptionalProposalUpdate(admin, proposalId, updates);
  } catch (error) {
    console.error('proposal save failed', error);
    throw error;
  }
  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath('/gf1/proposals');
}

export async function submitProposalForApprovalAction(proposalId: string, payload: ProposalPricingForm) {
  const { supabase, user, role } = await requireSalesUser();
  await assertSalesProposalAccess(supabase, user, role ?? null, proposalId);
  await saveProposalDraftAction(proposalId, payload);

  const { data: proposal } = await supabase.from('proposals').select('id').eq('id', proposalId).maybeSingle();
  if (!proposal) throw new Error('Proposal not found after saving.');

  await supabase.from('proposals').update({ status: 'pending_approval' }).eq('id', proposalId);
  await supabase.from('proposal_approvals').insert({
    proposal_id: proposalId,
    reviewer_id: user.id,
    decision: 'pending',
  });

  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath('/gf1/proposals/pending');
}

export async function updateWizardPricingAction(proposalId: string, wizardPricing: WizardPricingPayload) {
  const { supabase, user, role } = await requireSalesUser();
  await assertSalesProposalAccess(supabase, user, role ?? null, proposalId);
  const admin = supaAdmin();

  // Preserve existing pricing_json and store wizardPricing in wizard_payload.
  const { data: existing } = await supabase
    .from('proposals')
    .select('pricing_json, pricing_summary, services_json, services_snapshot, checks_per_month')
    .eq('id', proposalId)
    .maybeSingle();

  const basePricing = (existing?.pricing_json ?? existing?.pricing_summary ?? {}) as Record<string, any>;
  const nextPricing = { ...basePricing, wizardPricing };
  const pricingDetails = (wizardPricing ?? {}) as Record<string, any>;
  const statePricings = Array.isArray(pricingDetails.statePricings) ? pricingDetails.statePricings : [];
  const wcTotals = statePricings.reduce(
    (acc: { cost: number; selling: number }, row: Record<string, unknown>) => {
      const payroll = toFiniteNumber(row.annualPayroll) ?? 0;
      const wcCostRate = toFiniteNumber(row.wcCostRate) ?? 0;
      const wcSellingRate = toFiniteNumber(row.wcSellingRate) ?? (toFiniteNumber(row.wcRate) ?? 0);
      return {
        cost: acc.cost + payroll * (wcCostRate / 100),
        selling: acc.selling + payroll * (wcSellingRate / 100),
      };
    },
    { cost: 0, selling: 0 },
  );
  const nextServices =
    pricingDetails.services && typeof pricingDetails.services === 'object'
      ? { ...((existing?.services_json as Record<string, unknown> | null) ?? {}), ...pricingDetails.services }
      : existing?.services_json ?? null;
  const nextServicesSnapshot =
    pricingDetails.services && typeof pricingDetails.services === 'object'
      ? { ...((existing?.services_snapshot as Record<string, unknown> | null) ?? {}), ...pricingDetails.services }
      : existing?.services_snapshot ?? null;
  const checksPerMonth =
    toFiniteNumber(pricingDetails.checksPerMonth) ?? toFiniteNumber(existing?.checks_per_month) ?? null;
  const setupFees = toFiniteNumber(pricingDetails.setupFees);
  const otherFeesTotal = sumOtherFees(pricingDetails.otherFees);
  const totalAnnualPayroll =
    toFiniteNumber(pricingDetails.totalAnnualPayroll) ??
    statePricings.reduce((sum: number, row: Record<string, unknown>) => sum + (toFiniteNumber(row.annualPayroll) ?? 0), 0);
  const lmsEnabled = Boolean(pricingDetails.learningManagementSystemFeeEnabled);
  const lmsRate = toFiniteNumber(pricingDetails.learningManagementSystemFeeRate);

  try {
    await applyOptionalProposalUpdate(admin, proposalId, {
      wizard_payload: wizardPricing,
      pricing_json: nextPricing,
      pricing_summary: nextPricing,
      services_json: nextServices,
      services_snapshot: nextServicesSnapshot,
      wc_cost_cents: toCents(wcTotals.cost),
      wc_selling_price_cents: toCents(wcTotals.selling),
      admin_fee_enabled: Boolean(pricingDetails.adminFeeEnabled),
      admin_fee_rate_cents: pricingDetails.adminFeeEnabled ? toCents(toFiniteNumber(pricingDetails.adminFeeRate)) : null,
      admin_fee_basis: pricingDetails.adminFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      admin_fee_percent:
        pricingDetails.adminFeeMode === 'percent_of_gross' ? toFiniteNumber(pricingDetails.adminFeeValue) : null,
      payroll_volume: totalAnnualPayroll > 0 ? totalAnnualPayroll : null,
      setup_fee_total: setupFees,
      deposit_total: otherFeesTotal,
      timekeeping_fee_enabled: Boolean(pricingDetails.timekeepingFeeEnabled),
      timekeeping_fee_rate_cents: pricingDetails.timekeepingFeeEnabled ? toCents(toFiniteNumber(pricingDetails.timekeepingFeeRate)) : null,
      timekeeping_fee_basis: pricingDetails.timekeepingFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      learning_management_system_fee_enabled: lmsEnabled,
      learning_management_system_fee_rate_cents: lmsEnabled ? toCents(lmsRate) : null,
      learning_management_system_fee_basis:
        pricingDetails.learningManagementSystemFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      checks_per_month: checksPerMonth,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to update wizard pricing', error);
    throw error;
  }

  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath('/gf1/proposals');
}

/**
 * Lean pricing save: writes the wizard payload straight into
 * `proposals.pricing_json.wizardPricing` (the path the slide deck reads from)
 * and nothing else. No denormalization across columns, no PGRST204
 * column-stripping retry loop — so the save can't silently succeed with the
 * data dropped on the floor. Used by the proposal-detail pricing UI in place
 * of `updateWizardPricingAction` while we sort out the column drift.
 */
export async function saveProposalPricingJsonAction(
  proposalId: string,
  wizardPricing: WizardPricingPayload,
): Promise<void> {
  const { supabase, user, role } = await requireSalesUser();
  await assertSalesProposalAccess(supabase, user, role ?? null, proposalId);
  const admin = supaAdmin();

  const { data: existing, error: readError } = await admin
    .from('proposals')
    .select('pricing_json, pricing_summary')
    .eq('id', proposalId)
    .maybeSingle();
  if (readError) {
    throw new Error(readError.message || 'Could not load proposal pricing');
  }

  const basePricing =
    (existing?.pricing_json as Record<string, unknown> | null | undefined) ??
    (existing?.pricing_summary as Record<string, unknown> | null | undefined) ??
    {};
  const nextPricing: Record<string, unknown> = { ...basePricing, wizardPricing };

  // Write to all three slots the read path checks (wizard_payload first,
  // then pricing_json.wizardPricing, then pricing_summary.wizardPricing).
  // Otherwise stale data in one slot can shadow the fresh save.
  const { error } = await admin
    .from('proposals')
    .update({
      wizard_payload: wizardPricing,
      pricing_json: nextPricing,
      pricing_summary: nextPricing,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);
  if (error) {
    throw new Error(error.message || 'Could not save proposal pricing');
  }

  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath(`/gf1/proposals/${proposalId}/slides`);
  revalidatePath('/gf1/proposals');
}

export async function updateProposalSlidesAction(
  proposalId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { supabase, user, role } = await requireSalesUser();
  await assertSalesProposalAccess(supabase, user, role ?? null, proposalId);
  const admin = supaAdmin();
  const { error } = await admin
    .from('proposals')
    .update({
      slides_json: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);
  if (error) {
    throw new Error(error.message || 'Could not save slides');
  }
  revalidatePath(`/gf1/proposals/${proposalId}`);
}

export async function decideProposalAction(
  proposalId: string,
  decision: 'approved' | 'rejected',
  comments?: string | null,
) {
  const { supabase, user } = await requireSalesManager();
  await supabase
    .from('proposals')
    .update({
      status: decision === 'approved' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  await supabase
    .from('proposal_approvals')
    .insert({
      proposal_id: proposalId,
      reviewer_id: user.id,
      decision,
      decision_at: new Date().toISOString(),
      comments: comments ?? null,
    });

  revalidatePath(`/gf1/proposals/${proposalId}`);
  revalidatePath('/gf1/proposals/pending');
}
