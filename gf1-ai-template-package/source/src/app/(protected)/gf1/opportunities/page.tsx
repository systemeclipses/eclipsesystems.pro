import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { DashboardShell } from '../components/DashboardShell';
import { OpportunitiesTable } from './OpportunitiesTable';

export const dynamic = 'force-dynamic';

export type OpportunityRow = {
  id: string;
  organization_name: string | null;
  industry: string | null;
  estimated_employees: number | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  last_contacted_at: string | null;
  last_contacted_by_name: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type OpportunityClaimRow = {
  opportunity_id: string;
  contacted_by: string | null;
  contacted_at: string;
};

type OpportunityLeadClaimRow = {
  id: string;
  claimed_by: string | null;
};

export default async function OpportunitiesPage() {
  const { role, user } = await requireSalesUser();
  const supabase = await supaServer();
  const admin = supaAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  void salesRepName;

  const { data, error } = await supabase
    .from('opportunity_leads_vw')
    .select(
      'id, organization_name, industry, estimated_employees, primary_contact_name, primary_contact_phone, primary_contact_email, last_contacted_at, last_contacted_by_name, source, notes, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(400);
  const rawRows = (data ?? []) as OpportunityRow[];
  const opportunityIds = rawRows.map((row) => row.id);

  const explicitClaimedByMap = new Map<string, string | null>();
  if (opportunityIds.length > 0) {
    const { data: explicitClaimRows } = await admin
      .from('opportunity_leads')
      .select('id, claimed_by')
      .in('id', opportunityIds);

    ((explicitClaimRows ?? []) as OpportunityLeadClaimRow[]).forEach((row) => {
      explicitClaimedByMap.set(row.id, row.claimed_by ?? null);
    });
  }

  const claimedByMap = new Map<string, string | null>();
  if (opportunityIds.length > 0) {
    const { data: claimRows } = await admin
      .from('opportunity_contact_logs')
      .select('opportunity_id, contacted_by, contacted_at')
      .in('opportunity_id', opportunityIds)
      .eq('got_response', true)
      .order('contacted_at', { ascending: false });

    ((claimRows ?? []) as OpportunityClaimRow[]).forEach((row) => {
      // Keep only the latest responder for each opportunity.
      if (!claimedByMap.has(row.opportunity_id)) {
        claimedByMap.set(row.opportunity_id, row.contacted_by ?? null);
      }
    });
  }

  const filteredData = user?.id
    ? rawRows.filter((row: OpportunityRow) => {
        const claimedBy = explicitClaimedByMap.get(row.id) ?? claimedByMap.get(row.id) ?? null;
        return !claimedBy || claimedBy === user.id;
      })
    : rawRows;
  const rows = (filteredData ?? []) as OpportunityRow[];

  return (
    <DashboardShell role={role}>
      {error && (
        <div style={{ padding: '20px', color: '#D65B4A', background: 'rgba(214, 91, 74, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          Could not load opportunities: {error.message || 'Unknown error.'}
        </div>
      )}
      <OpportunitiesTable opportunities={rows} />
    </DashboardShell>
  );
}
