import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { supaServer } from '@/lib/supabase/server';
import { hasGf1Access, resolveProfileName, resolveProfileRole } from '@/lib/gf1/auth';
import { persistProposalBundle } from '@/lib/gf1/proposals.server';
import type { Gf1Proposal } from '@/lib/gf1/types';
import { supaAdmin } from '@/lib/supabase/admin';

const adjustmentSchema = z.object({
  label: z.string().min(1),
  amount: z.number(),
  adjustment_type: z.enum(['setup', 'conversion', 'deposit', 'other']),
  calculation_method: z.enum(['flat', 'percent_of_payroll', 'percent_of_admin_fee']),
  percentage: z.number().nullable(),
});

const wcCodeSchema = z.object({
  code: z.string().min(1),
  description: z.string().nullable(),
  est_annual_payroll: z.number().nullable(),
  carrier_rate: z.number().nullable(),
  notes: z.string().nullable(),
});

const metricsSchema = z.object({
  adminFeePercent: z.number().nullable(),
  commissionPercent: z.number().nullable(),
  payrollVolume: z.number().nullable(),
  estimatedCommission: z.number().nullable(),
  setupFeeTotal: z.number().nullable(),
  depositTotal: z.number().nullable(),
});

const payloadSchema = z.object({
  servicesSnapshot: z.record(z.string(), z.any()),
  pricing: z.any(),
  status: z.enum(['draft', 'awaiting_approval', 'approved', 'sent_to_client', 'accepted', 'rejected']),
  approvalNotes: z.string().nullable().optional(),
  competitorPricing: z.record(z.string(), z.any()).nullable().optional(),
  adjustments: z.array(adjustmentSchema),
  wcCodes: z.array(wcCodeSchema),
  managerId: z.string().nullable().optional(),
  metrics: metricsSchema,
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await supaServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveProfileRole(user);
  if (!hasGf1Access(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (role === 'sales') {
    const salesRepName = await resolveProfileName(user);
    const salesRepFilter = salesRepName ?? '__no_access__';
    const { data: proposal } = await supabase
      .from('proposals')
      .select('organization_id')
      .eq('id', id)
      .maybeSingle();
    if (!proposal?.organization_id) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    const { data: organization } = await supabase
      .from('organizations')
      .select('sales_rep_name')
      .eq('id', proposal.organization_id)
      .maybeSingle();
    if (organization?.sales_rep_name !== salesRepFilter) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, approval_status, status, proposal_request_id')
    .eq('id', id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  const staffStatuses = new Set(['draft', 'awaiting_approval']);
  if (role !== 'admin' && !staffStatuses.has(nextStatus)) {
    return NextResponse.json({ error: 'Only admins can change this status.' }, { status: 403 });
  }

  if (nextStatus === 'sent_to_client' && proposal.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Proposal must be approved before sending to client.' }, { status: 400 });
  }

  try {
    const updated = await persistProposalBundle({
      proposalId: id,
      userId: user.id,
      servicesSnapshot: parsed.data.servicesSnapshot,
      pricing: parsed.data.pricing,
      nextStatus,
      approvalNotes: parsed.data.approvalNotes ?? null,
      competitorPricing: parsed.data.competitorPricing ?? null,
      managerId: parsed.data.managerId ?? null,
      adjustments: parsed.data.adjustments,
      wcCodes: parsed.data.wcCodes,
      metrics: {
        admin_fee_percent: parsed.data.metrics.adminFeePercent,
        commission_percent: parsed.data.metrics.commissionPercent,
        payroll_volume: parsed.data.metrics.payrollVolume,
        estimated_commission: parsed.data.metrics.estimatedCommission,
        setup_fee_total: parsed.data.metrics.setupFeeTotal,
        deposit_total: parsed.data.metrics.depositTotal,
      },
    });

    if (proposal.proposal_request_id) {
      await syncProposalRequestStatus(proposal.proposal_request_id, updated);
    }

    return NextResponse.json({ proposal: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save proposal.' }, { status: 500 });
  }
}

async function syncProposalRequestStatus(requestId: string, proposal: Gf1Proposal) {
  const admin = supaAdmin();
  const nextStatus = deriveRequestStatus(proposal.status);
  if (!nextStatus) return;
  await admin
    .from('proposal_requests')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId);
}

function deriveRequestStatus(status: Gf1Proposal['status']) {
  switch (status) {
    case 'draft':
      return 'ready_for_pricing';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'approved':
    case 'sent_to_client':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'accepted':
      return 'converted';
    default:
      return null;
  }
}
