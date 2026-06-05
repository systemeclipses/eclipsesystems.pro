"use server";

import { revalidatePath } from 'next/cache';
import { requireSalesManager, requireSalesUser } from '@/lib/gf1/auth';
import { calculatePricing, normalizeBasePrice } from '@/lib/gf1/pricing';
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

export async function saveProposalDraft(proposalId: string, payload: ProposalPricingForm) {
  const { supabase, user } = await requireSalesUser();
  const pricing = calculatePricing({
    headcount: payload.modeledEmployeeCount,
    payFrequency: payload.payFrequency,
    basePricePerEmployeePerYear: normalizeBasePrice(payload.basePricePerEmployeePerYear),
    billingModel: payload.billingModel,
  });

  const updates = {
    status: 'draft',
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
    admin_fee_percent: payload.billingModel === 'percent_of_gross' ? payload.percentOfGross : null,
    timekeeping_fee_enabled: Boolean(payload.timekeepingFeeEnabled),
    timekeeping_fee_rate_cents: payload.timekeepingFeeEnabled ? toCents(payload.timekeepingFeeRate) : null,
    timekeeping_fee_basis: payload.timekeepingFeeBasis,
    checks_per_month: resolveChecksPerMonth(payload.payFrequency),
    updated_at: new Date().toISOString(),
    created_by: user.id,
  };

  const { error } = await supabase.from('proposals').update(updates).eq('id', proposalId);
  if (error) {
    console.error('proposal save failed', error);
    throw error;
  }
  revalidatePath(`/gf1/proposals/${proposalId}`);
}

export async function submitProposalForApproval(proposalId: string, payload: ProposalPricingForm) {
  const { supabase, user } = await requireSalesUser();
  await saveProposalDraft(proposalId, payload);

  const { data: proposal } = await supabase.from('proposals').select('id').eq('id', proposalId).maybeSingle();
  if (!proposal) throw new Error('Proposal not found after saving.');

  await supabase.from('proposals').update({ status: 'pending_approval' }).eq('id', proposalId);
  await supabase.from('proposal_approvals').insert({
    proposal_id: proposalId,
    reviewer_id: user.id,
    decision: 'pending',
  });

  revalidatePath(`/gf1/proposals/${proposalId}`);
}

export async function decideProposal(proposalId: string, decision: 'approved' | 'rejected', comments?: string | null) {
  const { supabase, user } = await requireSalesManager();
  await supabase
    .from('proposals')
    .update({ status: decision === 'approved' ? 'approved' : 'rejected', updated_at: new Date().toISOString() })
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
