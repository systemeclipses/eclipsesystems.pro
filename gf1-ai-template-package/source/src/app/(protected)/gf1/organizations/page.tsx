import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { supaServer } from '@/lib/supabase/server';
import { DashboardShell } from '../components/DashboardShell';
import { OrganizationsTable } from './OrganizationsTable';
import { fetchLatestLogoPublicUrl, shouldRefreshLogoUrl } from '@/lib/gf1/logos';
import { supaAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export type OrgRow = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  trade_name: string | null;
  status: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  total_employees: number | null;
  annual_commission: number | null;
  annual_revenue?: number | null;
  sales_rep_name: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileNameRow = {
  id?: string | null;
  user_id?: string | null;
  name?: string | null;
};

export default async function OrganizationsPage() {
  const { role, user } = await requireSalesUser();
  const supabase = await supaServer();
  const admin = supaAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  
  const baseSelect =
    'id, legal_name, dba_name, trade_name, status, primary_contact_name, primary_contact_email, total_employees, created_at, updated_at';
  const optionalColumns = ['annual_commission', 'sales_rep_name', 'logo_url'];
  let selectedOptionals = [...optionalColumns];

  let initialQuery = supabase
    .from('org_financials_vw')
    .select(`${baseSelect}, ${selectedOptionals.join(', ')}`)
    .limit(400);
  if (role === 'sales') {
    initialQuery = initialQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const initial = await initialQuery;
  let data = initial.data as OrgRow[] | null;
  let error = initial.error;

  if (error && typeof error.message === 'string') {
    const errorMessage = error.message.toLowerCase();
    const missing = optionalColumns.filter((column) => errorMessage.includes(column));
    if (missing.length) {
      selectedOptionals = selectedOptionals.filter((column) => !missing.includes(column));
      let retryQuery = supabase
        .from('organizations')
        .select(`${baseSelect}${selectedOptionals.length ? `, ${selectedOptionals.join(', ')}` : ''}`)
        .limit(400);
      if (role === 'sales') {
        retryQuery = retryQuery.eq('sales_rep_name', salesRepFilter as string);
      }
      const retry = await retryQuery;
      data = (retry.data ?? null) as OrgRow[] | null;
      error = retry.error;
    }
  }

  if (data) {
    data = data.map((org) => ({
      ...org,
      annual_commission: selectedOptionals.includes('annual_commission') ? (org as any).annual_commission ?? null : null,
      sales_rep_name: selectedOptionals.includes('sales_rep_name') ? (org as any).sales_rep_name ?? null : null,
      logo_url: selectedOptionals.includes('logo_url') ? (org as any).logo_url ?? null : null,
    }));
  }

  let orgs: OrgRow[] = (data ?? []) as OrgRow[];
  let repOptions: string[] = [];
  const salesRepByOrgId: Record<string, string> = {};

  if (orgs.length) {
    orgs.forEach((org) => {
      if (org.sales_rep_name) {
        salesRepByOrgId[org.id] = org.sales_rep_name;
      }
    });
  }

  if (role === 'sales') {
    repOptions = salesRepName ? [salesRepName] : [];
  } else {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'sales']);
    if (profilesError) {
      console.error('Failed to load assignee profiles', profilesError);
    } else {
      const profileRows = (profiles ?? []) as ProfileNameRow[];
      repOptions = profileRows
        .map((row) => row.name ?? null)
        .filter((name): name is string => Boolean(name))
        .sort((a, b) => a.localeCompare(b));
    }
  }

  if (orgs.length) {
    orgs = await Promise.all(
      orgs.map(async (org) => {
        if (!shouldRefreshLogoUrl(org.logo_url)) return org;
        const resolvedLogo = await fetchLatestLogoPublicUrl(admin, org.id);
        if (!resolvedLogo) return org;
        return { ...org, logo_url: resolvedLogo };
      })
    );
  }

  return (
    <DashboardShell role={role}>
      {error && (
        <div style={{ padding: '20px', color: '#D65B4A', background: 'rgba(214, 91, 74, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
          Could not load organizations.
        </div>
      )}
      <OrganizationsTable
        organizations={orgs}
        repOptions={repOptions}
        salesRepByOrgId={salesRepByOrgId}
        isSalesUser={role === 'sales'}
        lockedSalesRepName={salesRepName}
      />
    </DashboardShell>
  );
}
