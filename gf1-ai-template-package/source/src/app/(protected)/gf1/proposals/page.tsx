import { fetchSalesOrgIds, requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import type { Gf1OrganizationProfile, Gf1Proposal } from '@/lib/gf1/types';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { ProposalPageClient } from './_components/ProposalPageClient';
import { fetchLatestLogoPublicUrl, shouldRefreshLogoUrl } from '@/lib/gf1/logos';

type ProposalRow = Pick<Gf1Proposal, 'id' | 'status' | 'updated_at' | 'organization_id' | 'prospect_id'>;

export default async function ProposalsIndexPage() {
  const { supabase, role, user } = await requireStaffOrAdmin();
  const admin = supaAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  const salesOrgIds =
    role === 'sales' ? await fetchSalesOrgIds(supabase, salesRepFilter as string) : [];

  let proposalsQuery = supabase
    .from('proposals')
    .select('id, status, updated_at, organization_id, prospect_id')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (role === 'sales') {
    proposalsQuery = proposalsQuery.in(
      'organization_id',
      salesOrgIds.length ? salesOrgIds : ['00000000-0000-0000-0000-000000000000']
    );
  }
  const { data: proposals } = await proposalsQuery;

  const orgIds = Array.from(new Set((proposals ?? []).map((proposal) => proposal.organization_id).filter(Boolean) as string[]));
  let { data: organizations } = orgIds.length
    ? await admin
        .from('organizations')
        .select('id, legal_name, dba_name, logo_url, primary_contact_id')
        .in('id', orgIds)
    : { data: [] as Partial<Gf1OrganizationProfile>[] };

  if (organizations?.length) {
    organizations = await Promise.all(
      organizations.map(async (org) => {
        if (!shouldRefreshLogoUrl(org.logo_url ?? null)) return org;
        const resolvedLogo = await fetchLatestLogoPublicUrl(admin, org.id);
        if (!resolvedLogo) return org;
        return { ...org, logo_url: resolvedLogo };
      }),
    );
  }

  const orgMap = new Map((organizations ?? []).map((org) => [org.id, org]));

  let prospectQuery = admin
    .from('organizations')
    .select('id, legal_name, status')
    .eq('status', 'prospect')
    .order('legal_name', { ascending: true })
    .limit(500);
  if (role === 'sales') {
    prospectQuery = prospectQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const { data: prospectOrgs } = await prospectQuery;

  const prospectList = (prospectOrgs ?? []).map((org) => ({
    id: org.id,
    name: org.legal_name,
    organization_id: org.id,
    email: null,
    organization_name: org.legal_name,
  }));

  return (
    <DashboardShell role={role}>
      <ProposalPageClient proposals={proposals ?? []} orgMap={orgMap} prospects={prospectList} />
    </DashboardShell>
  );
}
