import { requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { ReportsPageClient } from './_components/ReportsPageClient';
import { supaAdmin } from '@/lib/supabase/admin';
import type { CommissionRecord, ProspectRecord, LeadRecord } from '@/lib/gf1/reports-types';

// Pull straight from the organizations table — the same fields the org detail
// page surfaces (annual_admin_fees / annual_commission / total_employees /
// client_won_at / status / sales_rep_name / source). The previous
// org_financials_vw approach silently returned nothing on any DB whose view
// was missing a column (e.g. annual_addon_fees), which is what was killing
// the reports. This source mirrors what users see on the org pages.
export default async function ReportsPage() {
  const { role, supabase, user } = await requireStaffOrAdmin();
  const currentUserName = await resolveProfileName(user);
  const salesRepName = role === 'sales' ? currentUserName : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;

  // Org row fields come from the organizations table — these are the real
  // columns and admin/sales_manager have read-all RLS here. The financial
  // numbers (admin fees / revenue / commission) are aggregates that live on
  // org_financials_vw, so we pull them in a second query keyed by id and
  // merge — mirroring how the org detail page loads them.
  const ORG_SELECT =
    'id, legal_name, trade_name, dba_name, status, created_at, updated_at, ' +
    'total_employees, assigned_sales_rep_id, sales_rep_name, client_won_at';

  let orgQuery = supabase
    .from('organizations')
    .select(ORG_SELECT)
    .in('status', ['lead', 'prospect', 'client'])
    .order('updated_at', { ascending: false });
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const { data: orgs, error: orgsError } = await orgQuery;

  // Pull financials only for the orgs we loaded. The view's `id` column maps
  // 1:1 to organizations.id (the view does SELECT o.id, o.*, ...). We only
  // ask for columns the view is known to expose; `annual_addon_fees` is
  // intentionally omitted because it errored on this DB.
  const orgIds = ((orgs ?? []) as any[]).map((row) => row.id as string);
  const financialsById = new Map<string, { annual_admin_fees: number | null; annual_revenue: number | null; annual_commission: number | null }>();
  if (orgIds.length) {
    const { data: financials, error: financialsError } = await supabase
      .from('org_financials_vw')
      .select('id, annual_admin_fees, annual_revenue, annual_commission')
      .in('id', orgIds);
    if (financialsError) {
      console.error('[reports] financials view error', financialsError);
    }
    for (const row of (financials ?? []) as any[]) {
      financialsById.set(row.id as string, {
        annual_admin_fees: row.annual_admin_fees ?? null,
        annual_revenue: row.annual_revenue ?? null,
        annual_commission: row.annual_commission ?? null,
      });
    }
  }

  // Normalize status case defensively — most writes are lowercase but older
  // rows or external imports may have mixed case.
  const normalizedOrgs = ((orgs ?? []) as any[]).map((org: any) => ({
    ...org,
    status: typeof org.status === 'string' ? org.status.toLowerCase() : org.status,
  }));

  // A prospect only counts toward estimated revenue if a proposal has actually
  // been built for it (mirrors the existing report behavior).
  const prospectOrgIds = Array.from(
    new Set(normalizedOrgs.filter((org) => org.status === 'prospect').map((org) => org.id as string))
  );
  const { data: prospectProposals } = prospectOrgIds.length
    ? await supabase.from('proposals').select('organization_id').in('organization_id', prospectOrgIds)
    : { data: [] as Array<{ organization_id: string }> };
  const prospectOrgIdsWithProposals = new Set(
    (prospectProposals ?? []).map((proposal) => proposal.organization_id as string)
  );

  const commissions: CommissionRecord[] = normalizedOrgs
    .filter((org) => org.status === 'client')
    .map((org) => {
      const fin = financialsById.get(org.id as string);
      return {
        id: org.id as string,
        clientName: (org.legal_name ?? org.trade_name ?? 'Untitled') as string,
        // Close date = the day the deal was won, with sensible fallbacks for
        // older client rows that predate the client_won_at field.
        closeDate: (org.client_won_at ?? org.updated_at ?? org.created_at) as string,
        annualAdminFees: Number(fin?.annual_admin_fees ?? 0),
        annualRevenue: Number(fin?.annual_revenue ?? 0),
        annualCommission: Number(fin?.annual_commission ?? 0),
        totalEmployees: org.total_employees != null ? Number(org.total_employees) : null,
        // WC metrics + add-on fees lived only on the org_financials_vw view (and
        // their underlying CTE was unreliable). Dropping them here so the
        // numbers always match what the org page shows.
        wcProfit: null,
        wcMarginPct: null,
        annualAddons: null,
        salesRepId: org.assigned_sales_rep_id ?? null,
        salesRepName: org.sales_rep_name ?? null,
      };
    });

  const prospects: ProspectRecord[] = normalizedOrgs
    .filter((org) => org.status === 'prospect')
    .map((org) => {
      const fin = financialsById.get(org.id as string);
      return {
        id: org.id as string,
        name: (org.legal_name ?? org.trade_name ?? 'Untitled') as string,
        status: 'prospect',
        estimatedRevenue: prospectOrgIdsWithProposals.has(org.id as string)
          ? Number(fin?.annual_revenue ?? 0)
          : 0,
        createdAt: (org.created_at ?? org.updated_at) as string,
        salesRepId: org.assigned_sales_rep_id ?? null,
        salesRepName: org.sales_rep_name ?? null,
      };
    });

  const leads: LeadRecord[] = normalizedOrgs
    .filter((org) => org.status === 'lead')
    .map((org) => ({
      id: org.id as string,
      name: (org.legal_name ?? org.trade_name ?? 'Untitled') as string,
      // organizations doesn't carry a source field — the "Suspects by Source"
      // chart will bucket everything under "Unspecified" until that data has
      // a home on this table.
      source: 'Unspecified',
      createdAt: (org.created_at ?? org.updated_at) as string,
      salesRepId: org.assigned_sales_rep_id ?? null,
      salesRepName: org.sales_rep_name ?? null,
    }));

  // Admin / sales-manager get the full rep roster so they can filter to anyone,
  // even reps with no records in the current view. Sales role is locked to
  // themselves (the client renders a static label), so we don't need a list.
  let repOptions: string[] = [];
  if (role !== 'sales') {
    const admin = supaAdmin();
    const { data: profiles } = await admin
      .from('profiles')
      .select('name, role')
      .in('role', ['admin', 'sales', 'sales_manager']);
    const seen = new Set<string>();
    repOptions = (profiles ?? [])
      .map((row) => (typeof row.name === 'string' ? row.name.trim() : ''))
      .filter((name) => {
        if (!name) return false;
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'en-US'));
  }

  console.log('[reports] loaded', {
    role,
    user: currentUserName,
    orgsCount: (orgs ?? []).length,
    statusBreakdown: normalizedOrgs.reduce((acc: Record<string, number>, o) => {
      const key = String(o.status ?? 'null');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    commissionsCount: commissions.length,
    prospectsCount: prospects.length,
    leadsCount: leads.length,
    orgsError: orgsError ? { message: orgsError.message } : null,
  });

  return (
    <DashboardShell role={role}>
      {orgsError ? (
        <div
          style={{
            margin: '16px 24px',
            padding: '12px 16px',
            background: 'rgba(214,91,74,0.12)',
            color: '#fda4af',
            border: '1px solid rgba(214,91,74,0.4)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <strong>Reports data error:</strong> {orgsError.message ?? 'Unknown error'}
        </div>
      ) : null}
      <ReportsPageClient
        commissions={commissions}
        prospects={prospects}
        leads={leads}
        role={role}
        currentUserName={currentUserName}
        repOptions={repOptions}
      />
    </DashboardShell>
  );
}
