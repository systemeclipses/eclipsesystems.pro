import { notFound } from 'next/navigation';
import { supaServer } from '@/lib/supabase/server';
import { requireSalesManager } from '@/lib/gf1/auth';
import type { Gf1OrganizationProfile, Gf1ProposalRecord } from '@/lib/gf1/types';
import ApprovalActions from './ApprovalActions';

export default async function PendingApprovalsPage() {
  await requireSalesManager();
  const supabase = await supaServer();

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, organization_id, status, billing_model, percent_of_gross, flat_admin_fee_per_employee_per_period, modeled_employee_count')
    .eq('status', 'pending_approval');

  if (!proposals) {
    notFound();
  }

  const orgIds = Array.from(new Set(proposals.map((p) => p.organization_id)));
  const { data: orgs } = await supabase.from('organizations').select('*').in('id', orgIds);
  const orgById = new Map((orgs ?? []).map((org) => [org.id, org as Gf1OrganizationProfile]));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-400">Approvals</p>
        <h1 className="text-2xl font-semibold text-neutral-900">Proposals awaiting approval</h1>
        <p className="text-sm text-neutral-600">Review pricing guardrails, services, and approve or reject.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Admin fee</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {(proposals ?? []).map((proposal) => {
              const org = orgById.get(proposal.organization_id);
              return (
                <tr key={proposal.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900">{org?.legal_name ?? 'Unknown org'}</div>
                    <div className="text-xs text-neutral-500">Status: {proposal.status}</div>
                  </td>
                  <td className="px-4 py-3">{proposal.modeled_employee_count ?? org?.total_employees ?? 'n/a'}</td>
                  <td className="px-4 py-3">
                    {proposal.billing_model === 'percent_of_gross'
                      ? `${proposal.percent_of_gross ?? 0}% of gross`
                      : `$${proposal.flat_admin_fee_per_employee_per_period ?? 0} / EE / period`}
                  </td>
                  <td className="px-4 py-3">
                    <ApprovalActions proposalId={proposal.id} />
                  </td>
                </tr>
              );
            })}
            {proposals?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Nothing is waiting for review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
