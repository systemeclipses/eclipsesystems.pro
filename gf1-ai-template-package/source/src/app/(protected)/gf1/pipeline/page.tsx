
import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { PipelineBoard } from './PipelineBoard';
import { cookies } from 'next/headers';
import { fetchLatestLogoPublicUrl, shouldRefreshLogoUrl } from '@/lib/gf1/logos';
import { supaAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type PipelineOrgRow = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  trade_name: string | null;
  status: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  total_employees: number | null;
  annual_commission: number | null;
  annual_revenue: number | null;
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

const OPTIONAL_COLUMNS = ['annual_commission', 'annual_revenue', 'sales_rep_name', 'logo_url'];
const PIPELINE_STATUSES = ['lead', 'prospect', 'client'];

export default async function PipelinePage() {
  const { supabase, user, role } = await requireSalesUser();
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const leadCreated = allCookies.find(c => c.name === 'lead_created')?.value === '1';
  // Note: cookies() in server components is read-only; deleting must be handled in a route/action if needed

  const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle();
  let salesRepName = role === 'sales' ? (profile?.name?.trim() || null) : null;
  if (role === 'sales' && !salesRepName) {
    salesRepName = await resolveProfileName(user);
  }
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  let orgQuery = supabase
    .from('org_financials_vw')
    .select(
      'id, legal_name, dba_name, trade_name, status, primary_contact_name, primary_contact_email, total_employees, annual_commission, annual_revenue, sales_rep_name, logo_url, created_at, updated_at',
    )
    .in('status', PIPELINE_STATUSES)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const orgResult = await orgQuery;

  let { data, error } = orgResult;

  if (error) {
    const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    const missing = errorMessage ? OPTIONAL_COLUMNS.filter((col) => errorMessage.includes(col)) : [];
    if (missing.length) {
      const selectedOptionals = OPTIONAL_COLUMNS.filter((col) => !missing.includes(col));
      let fallbackQuery = supabase
        .from('organizations')
        .select(
          `id, legal_name, dba_name, trade_name, status, primary_contact_name, primary_contact_email, total_employees, created_at, updated_at${
            selectedOptionals.length ? `, ${selectedOptionals.join(', ')}` : ''
          }`,
        )
        .in('status', PIPELINE_STATUSES)
        .order('updated_at', { ascending: false })
        .limit(500);
      if (role === 'sales') {
        fallbackQuery = fallbackQuery.eq('sales_rep_name', salesRepFilter as string);
      }
      const fallback = await fallbackQuery;

      data =
        fallback.data?.map((org) => ({
          ...org,
          annual_commission: selectedOptionals.includes('annual_commission') ? org.annual_commission ?? null : null,
          annual_revenue: selectedOptionals.includes('annual_revenue') ? org.annual_revenue ?? null : null,
          sales_rep_name: selectedOptionals.includes('sales_rep_name') ? org.sales_rep_name ?? null : null,
          logo_url: selectedOptionals.includes('logo_url') ? org.logo_url ?? null : null,
        })) ?? null;
      error = fallback.error;
    }
  }

  const organizations = (data ?? [])
    .map((org: PipelineOrgRow) => ({
      ...org,
      status: (org.status ?? 'lead').toLowerCase(),
    }))
    .filter((org: PipelineOrgRow & { status: string }): org is PipelineOrgRow & { status: string } => 
      org.status !== null && PIPELINE_STATUSES.includes(org.status)
    );

  const admin = supaAdmin();
  let repOptions: string[] = [];
  const salesRepByOrgId: Record<string, string> = {};
  if (organizations.length) {
    organizations.forEach((org) => {
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

  const organizationsWithLogos = await Promise.all(
    organizations.map(async (org) => {
      if (!shouldRefreshLogoUrl(org.logo_url)) return org;
      const resolvedLogo = await fetchLatestLogoPublicUrl(admin, org.id);
      if (!resolvedLogo) return org;
      return { ...org, logo_url: resolvedLogo };
    })
  );

  const defaultSalesRep = salesRepName ?? profile?.name ?? null;

  return (
    <DashboardShell role={role}>
      {leadCreated && (
        <div
          style={{
            padding: '20px',
            color: '#15803d',
            background: 'rgba(34,197,94,0.12)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: 600,
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '20px' }}></i>
          Suspect created successfully!
        </div>
      )}
      {error && (
        <div
          style={{
            padding: '20px',
            color: '#D65B4A',
            background: 'rgba(214, 91, 74, 0.1)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          Could not load pipeline data.
        </div>
      )}
      <PipelineBoard
        organizations={organizationsWithLogos}
        defaultSalesRep={defaultSalesRep}
        repOptions={repOptions}
        salesRepByOrgId={salesRepByOrgId}
      />
    </DashboardShell>
  );
}
