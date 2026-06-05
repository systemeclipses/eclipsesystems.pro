import { supaAdmin } from '@/lib/supabase/admin';
import { sendApprovalEmail } from '@/lib/brevo';
import { getProposalPricingSecret } from '@/lib/env';
import { decryptJson, encryptJson } from '@/lib/security/encryption';
import type {
  Gf1Proposal,
  Gf1ProposalAdjustment,
  Gf1ProposalWcCode,
  ProposalAdjustmentCalc,
  ProposalAdjustmentType,
  ProposalApprovalStatus,
} from './types';

export type PricingDraft = Record<string, unknown>;

export type ProposalAdjustmentInput = {
  id?: string;
  label: string;
  amount: number;
  adjustment_type: ProposalAdjustmentType;
  calculation_method: ProposalAdjustmentCalc;
  percentage: number | null;
};

export type ProposalWcCodeInput = {
  id?: string;
  code: string;
  description: string | null;
  est_annual_payroll: number | null;
  carrier_rate: number | null;
  notes: string | null;
};

export type ProposalMetricsPayload = {
  admin_fee_percent: number | null;
  commission_percent: number | null;
  payroll_volume: number | null;
  estimated_commission: number | null;
  setup_fee_total: number | null;
  deposit_total: number | null;
};

export type SaveProposalPayload = {
  proposalId: string;
  userId: string;
  servicesSnapshot: Record<string, unknown>;
  pricing: PricingDraft;
  nextStatus: Gf1Proposal['status'];
  managerId?: string | null;
  managerEmail?: string | null;
  approvalNotes?: string | null;
  competitorPricing?: Record<string, unknown> | null;
  adjustments: ProposalAdjustmentInput[];
  wcCodes: ProposalWcCodeInput[];
  metrics: ProposalMetricsPayload;
};

export type SecureProposalState = {
  pricingDraft: PricingDraft;
  adjustments: Gf1ProposalAdjustment[];
  wcCodes: Gf1ProposalWcCode[];
};

const EMPTY_PRICING: PricingDraft = { tiers: [{ name: 'Base', amount: 0 }] };

export async function loadSecureProposalState(proposalId: string): Promise<SecureProposalState> {
  const admin = supaAdmin();
  const [pricingResult, adjustmentsResult, wcResult] = await Promise.all([
    admin.from('proposal_pricing_secure').select('*').eq('proposal_id', proposalId).maybeSingle(),
    admin.from('proposal_adjustments').select('*').eq('proposal_id', proposalId).order('sort_order', { ascending: true }),
    admin.from('proposal_wc_codes').select('*').eq('proposal_id', proposalId).order('sort_order', { ascending: true }),
  ]);

  const secret = getProposalPricingSecret();
  const pricingDraft =
    pricingResult.data && pricingResult.data.ciphertext
      ? decryptJson<PricingDraft>(
          {
            ciphertext: pricingResult.data.ciphertext,
            iv: pricingResult.data.iv,
            authTag: pricingResult.data.auth_tag,
            version: pricingResult.data.version ?? 1,
          },
          secret
        )
      : EMPTY_PRICING;

  return {
    pricingDraft,
    adjustments: (adjustmentsResult.data ?? []) as Gf1ProposalAdjustment[],
    wcCodes: (wcResult.data ?? []) as Gf1ProposalWcCode[],
  };
}

export async function persistProposalBundle(payload: SaveProposalPayload): Promise<Gf1Proposal> {
  const admin = supaAdmin();
  const secret = getProposalPricingSecret();
  const encrypted = encryptJson(payload.pricing, secret);
  const now = new Date().toISOString();

  const approvalStatus = deriveApprovalStatus(payload.nextStatus);
  const updates: Record<string, unknown> = {
    services_snapshot: payload.servicesSnapshot,
    status: payload.nextStatus,
    approval_status: approvalStatus,
    approval_notes: payload.approvalNotes ?? null,
    competitor_pricing: payload.competitorPricing ?? null,
    admin_fee_percent: payload.metrics.admin_fee_percent,
    commission_percent: payload.metrics.commission_percent,
    payroll_volume: payload.metrics.payroll_volume,
    estimated_commission: payload.metrics.estimated_commission,
    setup_fee_total: payload.metrics.setup_fee_total,
    deposit_total: payload.metrics.deposit_total,
    pricing_summary: buildPricingSummary(payload),
  };

  if (payload.nextStatus === 'awaiting_approval') {
    updates.approval_requested_by = payload.userId;
    updates.approval_requested_at = now;
    updates.approval_decided_by = null;
    updates.approval_decided_at = null;
    // If manager specified, attach manager info and create approval token
    if (payload.managerId) {
      updates.manager_id = payload.managerId;
    }
    if (payload.managerEmail) {
      updates.manager_email = payload.managerEmail;
    }
    // generate token
    const token = require('crypto').randomUUID();
    updates.approval_token = token;
  }

  if (payload.nextStatus === 'approved' || payload.nextStatus === 'rejected') {
    updates.approval_decided_by = payload.userId;
    updates.approval_decided_at = now;
  }

  if (payload.nextStatus === 'sent_to_client') {
    updates.sent_to_client_at = now;
  }
  if (payload.nextStatus === 'accepted') {
    updates.accepted_at = now;
  }
  if (payload.nextStatus === 'rejected') {
    updates.rejected_at = now;
  }

  const [{ data: proposal, error: updateError }, pricingMutation, adjustmentsMutation, wcMutation, approvalLogMutation] =
    await Promise.all([
      admin.from('proposals').update(updates).eq('id', payload.proposalId).select('*').maybeSingle(),
      admin
        .from('proposal_pricing_secure')
        .upsert({
          proposal_id: payload.proposalId,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          auth_tag: encrypted.authTag,
          version: encrypted.version,
          updated_by: payload.userId,
        }),
      upsertAdjustments(admin, payload),
      upsertWcCodes(admin, payload),
      logApprovalAction(admin, payload, approvalStatus, now),
    ]);

  if (updateError) {
    throw updateError;
  }
  if (pricingMutation.error) {
    throw pricingMutation.error;
  }
  if (adjustmentsMutation?.error) {
    throw adjustmentsMutation.error;
  }
  if (wcMutation?.error) {
    throw wcMutation.error;
  }
  if (approvalLogMutation?.error) {
    throw approvalLogMutation.error;
  }

  if (!proposal) {
    throw new Error('Proposal not found after update.');
  }

  // If we just requested approval, send the approval email to manager
  if (payload.nextStatus === 'awaiting_approval') {
    try {
      const managerEmail = payload.managerEmail ?? (proposal as any).manager_email;
      const managerId = payload.managerId ?? (proposal as any).manager_id;
      const approvalToken = (proposal as any).approval_token;
      if (managerEmail && approvalToken) {
        const approvalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gf1/proposals/${proposal.id}/approve?token=${approvalToken}`;
        await sendApprovalEmail({
          to: managerEmail,
          proposalId: proposal.id,
          proposalData: {
            client: (proposal as any).client_name || (proposal as any).services_snapshot?.client || '',
            amount: (proposal as any).estimated_commission?.toString?.() ?? '',
            terms: (proposal as any).proposal_terms ?? '',
          },
          approvalUrl,
        });
      }
    } catch (err) {
      console.error('Failed to send approval email', err);
    }
  }

  return proposal as Gf1Proposal;
}

function deriveApprovalStatus(nextStatus: Gf1Proposal['status']): ProposalApprovalStatus {
  switch (nextStatus) {
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'approved':
    case 'sent_to_client':
    case 'accepted':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return 'draft';
  }
}

function buildPricingSummary(payload: SaveProposalPayload) {
  return {
    total_adjustments: payload.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0),
    wc_code_count: payload.wcCodes.length,
    metrics: payload.metrics,
  };
}

async function upsertAdjustments(admin: ReturnType<typeof supaAdmin>, payload: SaveProposalPayload) {
  await admin.from('proposal_adjustments').delete().eq('proposal_id', payload.proposalId);
  if (payload.adjustments.length === 0) {
    return { error: null };
  }
  return admin.from('proposal_adjustments').insert(
    payload.adjustments.map((entry, index) => ({
      proposal_id: payload.proposalId,
      label: entry.label,
      amount: entry.amount,
      adjustment_type: entry.adjustment_type,
      calculation_method: entry.calculation_method,
      percentage: entry.percentage,
      sort_order: index,
    }))
  );
}

async function upsertWcCodes(admin: ReturnType<typeof supaAdmin>, payload: SaveProposalPayload) {
  await admin.from('proposal_wc_codes').delete().eq('proposal_id', payload.proposalId);
  if (payload.wcCodes.length === 0) {
    return { error: null };
  }
  return admin.from('proposal_wc_codes').insert(
    payload.wcCodes.map((entry, index) => ({
      proposal_id: payload.proposalId,
      code: entry.code,
      description: entry.description,
      est_annual_payroll: entry.est_annual_payroll,
      carrier_rate: entry.carrier_rate,
      notes: entry.notes,
      sort_order: index,
    }))
  );
}

async function logApprovalAction(
  admin: ReturnType<typeof supaAdmin>,
  payload: SaveProposalPayload,
  approvalStatus: ProposalApprovalStatus,
  now: string
) {
  let action: 'requested' | 'approved' | 'rejected' | null = null;

  if (approvalStatus === 'awaiting_approval') {
    action = 'requested';
  } else if (approvalStatus === 'approved' && payload.nextStatus === 'approved') {
    action = 'approved';
  } else if (approvalStatus === 'rejected' && payload.nextStatus === 'rejected') {
    action = 'rejected';
  }

  if (!action) {
    return { error: null };
  }

  return admin.from('proposal_approvals').insert({
    proposal_id: payload.proposalId,
    reviewer_id: payload.userId,
    action,
    notes: payload.approvalNotes ?? null,
    created_at: now,
  });
}
