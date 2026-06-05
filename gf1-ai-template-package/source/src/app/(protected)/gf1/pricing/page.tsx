import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import AgreementsPageClient, { type PricingOrganizationOption } from './_components/AgreementsPageClient';
import { supaAdmin } from '@/lib/supabase/admin';

export default async function PricingPage() {
  const { role, user } = await requireSalesUser();
  const admin = supaAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;

  let orgQuery = admin
    .from('organizations')
    .select('*')
    .eq('status', 'prospect')
    .order('legal_name', { ascending: true })
    .limit(500);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const { data: organizations } = await orgQuery;

  return (
    <DashboardShell role={role}>
      <AgreementsPageClient organizations={(organizations ?? []) as PricingOrganizationOption[]} />
    </DashboardShell>
  );
}
