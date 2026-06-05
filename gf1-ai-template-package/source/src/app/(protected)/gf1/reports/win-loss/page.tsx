import { requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { supaServer } from '@/lib/supabase/server';
import type { Gf1Organization, Gf1WinLossRecord } from '@/lib/gf1/types';
import WinLossForm from '../../components/WinLossForm';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';

type ProspectOption = {
  id: string;
  label: string;
  organizationId: string;
};

type ReportRow = Gf1WinLossRecord & {
  organization_name: string;
};

export default async function WinLossReportPage() {
  const { supabase, role, user } = await requireStaffOrAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const [prospects, reports] = await Promise.all([
    fetchProspectOptions(supabase, role === 'sales' ? (salesRepName ?? '__no_access__') : null),
    fetchReports(supabase, role === 'sales' ? (salesRepName ?? '__no_access__') : null),
  ]);

  return (
    <DashboardShell role={role}>
      <div className="space-y-6">
        <header className="p-6">
          <p className="text-xs uppercase text-neutral-400">Reports</p>
          <h1 className="text-3xl font-semibold text-white">Win / Loss intelligence</h1>
          <p className="text-sm text-neutral-400">
            Help leadership understand market momentum and blockers. Staff can log entries, admins review trends.
          </p>
        </header>

        <WinLossForm viewerRole={role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : null} prospects={prospects} />

        {role === 'admin' && <WinLossTable rows={reports} />}
      </div>
    </DashboardShell>
  );
}

function WinLossTable({ rows }: { rows: ReportRow[] }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold">Admin list</h2>
        <p className="text-sm text-neutral-500">Sorted by most recent.</p>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-neutral-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Organization</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2">Primary reason</th>
              <th className="px-3 py-2">Detail</th>
              <th className="px-3 py-2">Competitor</th>
              <th className="px-3 py-2">Deal size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 text-neutral-500">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 font-semibold text-neutral-800">{row.organization_name}</td>
                <td className="px-3 py-2 capitalize">{row.result}</td>
                <td className="px-3 py-2">{row.primary_reason}</td>
                <td className="px-3 py-2 text-neutral-500">{row.detail_reason ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-500">{row.competitor ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-800">{formatCurrency(row.deal_size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-neutral-500">No entries yet.</p>}
      </div>
    </section>
  );
}

async function fetchProspectOptions(
  supabase: Awaited<ReturnType<typeof supaServer>>,
  salesRepName: string | null
): Promise<ProspectOption[]> {
  const { data: prospects } = await supabase.from('prospects').select('id, organization_id').order('created_at', {
    ascending: false,
  });
  const organizationIds = Array.from(new Set((prospects ?? []).map((p) => p.organization_id)));
  let orgQuery = organizationIds.length
    ? supabase.from('organizations').select('*').in('id', organizationIds)
    : null;
  if (orgQuery && salesRepName) {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName);
  }
  const { data: organizations } = orgQuery ? await orgQuery : { data: [] as Gf1Organization[] };
  const orgMap = new Map((organizations ?? []).map((org) => [org.id, org]));

  return (prospects ?? []).map((prospect) => ({
    id: prospect.id,
    label: orgMap.get(prospect.organization_id)?.name ?? `Prospect ${prospect.id.slice(0, 6)}`,
    organizationId: prospect.organization_id,
  }));
}

async function fetchReports(
  supabase: Awaited<ReturnType<typeof supaServer>>,
  salesRepName: string | null
): Promise<ReportRow[]> {
  const { data: reports } = await supabase
    .from('win_loss_reports')
    .select('*')
    .order('created_at', { ascending: false });

  const organizationIds = Array.from(new Set((reports ?? []).map((entry) => entry.organization_id).filter(Boolean) as string[]));
  let orgQuery = organizationIds.length
    ? supabase.from('organizations').select('id, name').in('id', organizationIds)
    : null;
  if (orgQuery && salesRepName) {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName);
  }
  const { data: organizations } = orgQuery ? await orgQuery : { data: [] as Gf1Organization[] };

  const orgMap = new Map((organizations ?? []).map((org) => [org.id, org.name]));

  return (reports ?? []).map((report) => ({
    ...(report as Gf1WinLossRecord),
    organization_name: orgMap.get(report.organization_id ?? '') ?? 'Unlinked',
  }));
}

function formatCurrency(value: number | null) {
  if (value === null || typeof value === 'undefined') return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value
  );
}
