import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { DashboardShell } from '../../components/DashboardShell';
import { OrganizationDetailClient } from '../_components/OrganizationDetailClient';
import { fetchLatestLogoPublicUrl } from '@/lib/gf1/logos';
import { supaAdmin } from '@/lib/supabase/admin';
import type { AssignableUser } from '@/lib/gf1/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type OpportunityLeadMatchRow = {
  id: string;
  organization_name: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
};

type OpportunityActivityRow = {
  id: string;
  opportunity_id: string;
  contacted_at: string;
  channel: string | null;
  follow_up_type?: string | null;
  notes: string | null;
  follow_up_at: string | null;
  got_response: boolean | null;
  response_notes: string | null;
  contacted_by: string | null;
  opportunity: OpportunityLeadMatchRow | null;
};

type ProfileLookupRow = {
  user_id: string | null;
  name: string | null;
  email: string | null;
};

type IntakeTokenActivityRow = {
  id: string;
  created_at: string;
  created_by: string | null;
  token: string;
  used_at: string | null;
};

type OrganizationActivityItem = {
  id: string;
  opportunityId: string;
  eventType: 'contact' | 'intake_generated' | 'intake_sent';
  contactedAt: string;
  channel: string | null;
  followUpType: string | null;
  notes: string | null;
  followUpAt: string | null;
  gotResponse: boolean;
  responseNotes: string | null;
  contactedBy: string | null;
  contactedByName: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, role, user } = await requireSalesUser();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const [{ data: organization }, { data: contacts }, { data: worksites }, { data: financials }] = await Promise.all([
    supabase.from('organizations').select('*, sales_rep_name').eq('id', id).maybeSingle(),
    supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase.from('worksites').select('*').eq('organization_id', id).order('created_at', { ascending: true }),
    supabase
      .from('org_financials_vw')
      .select('annual_admin_fees, annual_other_fees, annual_revenue, annual_commission, commission_percent')
      .eq('id', id)
      .maybeSingle(),
  ]);

  if (!organization) {
    notFound();
  }
  if (role === 'sales' && organization.sales_rep_name !== (salesRepName ?? '__no_access__')) {
    notFound();
  }

  const admin = supaAdmin();
  let resolvedLogoUrl = await fetchLatestLogoPublicUrl(admin, id);
  if (!resolvedLogoUrl) {
    resolvedLogoUrl = organization.logo_url ?? null;
  }
  const [{ data: proposals }, { data: salesReps, error: salesRepsError }] = await Promise.all([
    admin
      .from('proposals')
      .select('*')
      .eq('organization_id', id)
      .order('updated_at', { ascending: false }),
    admin.from('profiles').select('*').in('role', ['admin', 'sales']),
  ]);
  const safeProposals = JSON.parse(JSON.stringify(proposals ?? []));
  if (salesRepsError) {
    console.error('Failed to load assignees for organizations', salesRepsError);
  }
  const assignees = (salesReps ?? [])
    .map((rep: any) => ({
      id: rep.id ?? rep.user_id ?? null,
      full_name: rep.name ?? null,
      email: rep.email ?? null,
      role: rep.role ?? null,
    }))
    .filter((rep: AssignableUser & { id: string | null }) => Boolean(rep.id && rep.full_name))
    .sort((a, b) => {
      const aLabel = (a.full_name || a.email || '').toLowerCase();
      const bLabel = (b.full_name || b.email || '').toLowerCase();
      return aLabel.localeCompare(bLabel);
    }) as AssignableUser[];

  const organizationWithExtras = organization as {
    trade_name?: string | null;
    primary_contact_phone?: string | null;
  };
  const fallbackPrimaryContact = (contacts ?? []).find((contact) => contact.is_primary) ?? (contacts ?? [])[0] ?? null;
  const orgNameCandidates = Array.from(
    new Set(
      [
        organization.legal_name,
        organization.dba_name,
        organization.name,
        organizationWithExtras.trade_name ?? null,
      ]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )
  );
  const emailCandidates = Array.from(
    new Set(
      [organization.primary_contact_email, ...(contacts ?? []).map((contact) => contact.email)]
        .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  );

  const opportunityById = new Map<string, OpportunityLeadMatchRow>();
  const mergeOpportunityRows = (rows: OpportunityLeadMatchRow[] | null | undefined) => {
    (rows ?? []).forEach((row) => {
      if (!row?.id) return;
      opportunityById.set(row.id, row);
    });
  };

  if (emailCandidates.length > 0) {
    const { data: byEmailRows, error: byEmailError } = await admin
      .from('opportunity_leads_vw')
      .select('id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email')
      .in('primary_contact_email', emailCandidates)
      .limit(200);
    if (byEmailError) {
      console.error('Failed to load opportunity leads by email for organization activity', byEmailError);
    }
    mergeOpportunityRows((byEmailRows ?? []) as OpportunityLeadMatchRow[]);
  }

  if (orgNameCandidates.length > 0) {
    const { data: byOrgRows, error: byOrgError } = await admin
      .from('opportunity_leads_vw')
      .select('id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email')
      .in('organization_name', orgNameCandidates)
      .limit(200);
    if (byOrgError) {
      console.error('Failed to load opportunity leads by organization name for organization activity', byOrgError);
    }
    mergeOpportunityRows((byOrgRows ?? []) as OpportunityLeadMatchRow[]);
  }

  if (opportunityById.size === 0 && orgNameCandidates.length > 0) {
    const broadSearch = orgNameCandidates[0].replace(/[%_]/g, '');
    if (broadSearch) {
      const { data: fallbackRows, error: fallbackError } = await admin
        .from('opportunity_leads_vw')
        .select('id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email')
        .ilike('organization_name', `%${broadSearch}%`)
        .limit(200);
      if (fallbackError) {
        console.error('Failed to load fallback opportunity leads for organization activity', fallbackError);
      }
      mergeOpportunityRows((fallbackRows ?? []) as OpportunityLeadMatchRow[]);
    }
  }

  const opportunityIds = Array.from(opportunityById.keys());
  let activityRows: OpportunityActivityRow[] = [];

  if (opportunityIds.length > 0) {
    const selectWithType = `id, opportunity_id, contacted_at, channel, follow_up_type, notes, follow_up_at, got_response, response_notes, contacted_by,
      opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email)`;
    const baseSelect = `id, opportunity_id, contacted_at, channel, notes, follow_up_at, got_response, response_notes, contacted_by,
      opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email)`;

    let { data: activityData, error: activityError } = await admin
      .from('opportunity_contact_logs')
      .select(selectWithType)
      .in('opportunity_id', opportunityIds)
      .order('contacted_at', { ascending: false })
      .limit(250);

    const activityErrorMessage = activityError?.message?.toLowerCase() ?? '';
    if (activityErrorMessage.includes('follow_up_type')) {
      ({ data: activityData, error: activityError } = await admin
        .from('opportunity_contact_logs')
        .select(baseSelect)
        .in('opportunity_id', opportunityIds)
        .order('contacted_at', { ascending: false })
        .limit(250));
    }

    if (activityError) {
      console.error('Failed to load organization activity logs', activityError);
    } else {
      activityRows = (activityData ?? []) as OpportunityActivityRow[];
    }
  }

  let intakeTokenRows: IntakeTokenActivityRow[] = [];
  const { data: intakeTokenData, error: intakeTokenError } = await admin
    .from('gf1_intake_tokens')
    .select('id, created_at, created_by, token, used_at')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
    .limit(250);
  if (intakeTokenError) {
    console.error('Failed to load intake token activity for organization detail', intakeTokenError);
  } else {
    intakeTokenRows = (intakeTokenData ?? []) as IntakeTokenActivityRow[];
  }

  const contactedByIds = Array.from(
    new Set([
      ...activityRows.map((row) => row.contacted_by),
      ...intakeTokenRows.map((row) => row.created_by),
    ].filter((entry): entry is string => Boolean(entry)))
  );
  const profileLabelByUserId = new Map<string, string>();
  if (contactedByIds.length > 0) {
    const { data: profileRows, error: profileError } = await admin
      .from('profiles')
      .select('user_id, name, email')
      .in('user_id', contactedByIds);
    if (profileError) {
      console.error('Failed to load activity user profiles for organization detail', profileError?.message ?? profileError);
    } else {
      ((profileRows ?? []) as ProfileLookupRow[]).forEach((profile) => {
        const label = profile.name ?? profile.email ?? null;
        if (!label) return;
        if (profile.user_id) profileLabelByUserId.set(profile.user_id, label);
      });
    }
  }

  const opportunityActivityItems: OrganizationActivityItem[] = activityRows.map((row) => {
    const opportunity = row.opportunity ?? opportunityById.get(row.opportunity_id) ?? null;
    return {
      id: row.id,
      opportunityId: row.opportunity_id,
      eventType: 'contact',
      contactedAt: row.contacted_at,
      channel: row.channel,
      followUpType: row.follow_up_type ?? null,
      notes: row.notes,
      followUpAt: row.follow_up_at,
      gotResponse: Boolean(row.got_response),
      responseNotes: row.response_notes,
      contactedBy: row.contacted_by ?? null,
      contactedByName: row.contacted_by ? profileLabelByUserId.get(row.contacted_by) ?? null : null,
      organizationName: opportunity?.organization_name ?? organization.legal_name ?? organization.name ?? null,
      contactName:
        opportunity?.primary_contact_name ?? fallbackPrimaryContact?.full_name ?? organization.primary_contact_name ?? null,
      contactPhone:
        opportunity?.primary_contact_phone ??
        fallbackPrimaryContact?.phone ??
        organizationWithExtras.primary_contact_phone ??
        null,
      contactEmail: opportunity?.primary_contact_email ?? fallbackPrimaryContact?.email ?? organization.primary_contact_email ?? null,
    };
  });
  const intakeActivityItems: OrganizationActivityItem[] = intakeTokenRows.map((row) => {
    const isSent = row.token?.startsWith('sent_');
    return {
      id: `intake-${row.id}`,
      opportunityId: '',
      eventType: isSent ? 'intake_sent' : 'intake_generated',
      contactedAt: row.created_at,
      channel: isSent ? 'email' : 'other',
      followUpType: null,
      notes: isSent
        ? `Prospect information form link sent${organization.primary_contact_email ? ` to ${organization.primary_contact_email}` : ''}.`
        : 'Prospect information form intake link generated.',
      followUpAt: null,
      gotResponse: false,
      responseNotes: row.used_at ? 'Intake form has been submitted.' : null,
      contactedBy: row.created_by ?? null,
      contactedByName: row.created_by ? profileLabelByUserId.get(row.created_by) ?? null : null,
      organizationName: organization.legal_name ?? organization.name ?? null,
      contactName: fallbackPrimaryContact?.full_name ?? organization.primary_contact_name ?? null,
      contactPhone: fallbackPrimaryContact?.phone ?? organizationWithExtras.primary_contact_phone ?? null,
      contactEmail: fallbackPrimaryContact?.email ?? organization.primary_contact_email ?? null,
    };
  });
  const activityItems: OrganizationActivityItem[] = [...opportunityActivityItems, ...intakeActivityItems].sort((a, b) => {
    const aTime = new Date(a.contactedAt).getTime();
    const bTime = new Date(b.contactedAt).getTime();
    if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return 0;
    return bTime - aTime;
  });
  const safeActivityItems = JSON.parse(JSON.stringify(activityItems));

  const { data: dealLossRows } = await admin
    .from('deal_loss_reports')
    .select('id, created_at, previous_status, primary_reason, competitor_name, return_probability, what_could_improve, additional_notes, pdf_url')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
    .limit(1);
  const dealLossReport = (dealLossRows ?? [])[0] ?? null;
  const { data: implementationChecklistRows, error: implementationChecklistError } = await admin
    .from('gf1_client_implementation_steps')
    .select('step_key, completed_at, completed_by')
    .eq('organization_id', id);
  if (implementationChecklistError) {
    console.error('Failed to load implementation checklist rows', implementationChecklistError);
  }

  const cookieStore = await cookies();
  const msConnected = cookieStore.has('ms_graph_token');

  let retirementQuestionnairePdfUrl: string | null = null;
  const markerPath = `retirement-questionnaires/${id}/.submitted`;
  let pdfPathFromMarker: string | null = null;
  try {
    const dl = await admin.storage.from('agreement-documents').download(markerPath);
    console.log('[org-detail] marker check', {
      orgId: id,
      markerPath,
      hasError: Boolean(dl.error),
      errorMessage: dl.error ? String((dl.error as { message?: string }).message ?? dl.error) : null,
      hasData: Boolean(dl.data),
      dataSize: dl.data?.size ?? null,
    });
    if (!dl.error && dl.data && dl.data.size > 0) {
      const text = await dl.data.text();
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.pdfPath === 'string') pdfPathFromMarker = parsed.pdfPath;
      } catch {
        // Old marker format (plain timestamp). Treat marker presence as submitted but
        // we don't have a path to sign — fall through; pdf url stays null.
      }
    }
  } catch (err) {
    console.warn('[org-detail] marker download threw', err);
  }

  if (pdfPathFromMarker) {
    const { data: signed, error: signedError } = await admin.storage
      .from('agreement-documents')
      .createSignedUrl(pdfPathFromMarker, 60 * 60 * 24 * 7);
    if (signedError) {
      console.error('[org-detail] signed url for marker pdf failed', signedError);
      retirementQuestionnairePdfUrl = '#missing-pdf';
    } else {
      retirementQuestionnairePdfUrl = signed?.signedUrl ?? '#missing-pdf';
    }
  }

  return (
    <DashboardShell role={role}>
      <OrganizationDetailClient
        organization={{ ...organization, ...(financials ?? {}), logo_url: resolvedLogoUrl }}
        contacts={contacts ?? []}
        worksites={worksites ?? []}
        proposals={safeProposals}
        activityItems={safeActivityItems}
        implementationChecklist={JSON.parse(JSON.stringify(implementationChecklistRows ?? []))}
        assignees={assignees}
        role={role}
        msConnected={msConnected}
        dealLossReport={dealLossReport}
        retirementQuestionnairePdfUrl={retirementQuestionnairePdfUrl}
      />
    </DashboardShell>
  );
}
