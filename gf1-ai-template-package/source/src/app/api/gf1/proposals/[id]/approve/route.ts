import { NextResponse, NextRequest } from 'next/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { sendProposalApprovedNotification } from '@/lib/brevo';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const token = request.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const admin = supaAdmin();
  const { data: proposal, error } = await admin
    .from('proposals')
    .select('*, organization:organizations(name, legal_name, dba_name)')
    .eq('id', id)
    .maybeSingle();
  if (error || !proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  if (proposal.approval_token !== token) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  if (proposal.approval_status === 'approved' || proposal.status === 'approved') {
    return NextResponse.json({ success: true, message: 'Already approved' });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('proposals')
    .update({ approval_status: 'approved', status: 'approved', approval_decided_by: proposal.manager_id, approval_decided_at: now, approval_token: null })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });

  // Log approval
  await admin.from('proposal_approvals').insert({ proposal_id: id, reviewer_id: proposal.manager_id, action: 'approved', created_at: now });

  try {
    await notifySalesRepOfApproval(admin, proposal);
  } catch (notifyError) {
    console.error('Failed to notify proposal owner about approval', notifyError);
  }

  return NextResponse.json({ success: true });
}

async function notifySalesRepOfApproval(
  admin: ReturnType<typeof supaAdmin>,
  proposal: {
    id: string;
    created_by?: string | null;
    services_snapshot?: Record<string, unknown> | null;
    organization?: { name?: string | null; legal_name?: string | null; dba_name?: string | null } | null;
  }
) {
  const repId = proposal.created_by;
  if (!repId) return;

  const { data: profile } = await admin
    .from('profiles')
    .select('email, name, full_name')
    .eq('user_id', repId)
    .maybeSingle();

  let repEmail = (profile as { email?: string | null } | null)?.email ?? null;
  let repName =
    (profile as { name?: string | null; full_name?: string | null } | null)?.name ??
    (profile as { name?: string | null; full_name?: string | null } | null)?.full_name ??
    null;

  if (!repEmail) {
    const { data: adminUser, error } = await admin.auth.admin.getUserById(repId);
    if (error) {
      console.error('Unable to load sales rep via admin API', error);
    }
    repEmail = adminUser?.user?.email ?? null;
    if (!repName) {
      repName = (adminUser?.user?.user_metadata as any)?.full_name ?? null;
    }
  }

  if (!repEmail) {
    console.warn('Skipping proposal approval notification because sales rep email is missing', { repId });
    return;
  }

  const servicesSnapshot = proposal.services_snapshot as Record<string, unknown> | null;
  const prospectName =
    proposal.organization?.name ??
    proposal.organization?.legal_name ??
    proposal.organization?.dba_name ??
    (servicesSnapshot?.client as string | undefined) ??
    null;

  const dashboardUrl = `${getAppBaseUrl()}/gf1/proposals/${proposal.id}`;

  await sendProposalApprovedNotification({
    to: repEmail,
    repName: repName ?? undefined,
    proposalId: proposal.id,
    organizationName: prospectName ?? undefined,
    dashboardUrl,
  });
}

function getAppBaseUrl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://galactic365.com';
  return base.replace(/\/$/, '');
}
