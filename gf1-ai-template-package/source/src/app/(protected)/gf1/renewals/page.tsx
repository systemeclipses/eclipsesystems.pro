import { requireSalesUser } from '@/lib/gf1/auth';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { RenewalsTable } from './RenewalsTable';

export const dynamic = 'force-dynamic';

export default async function RenewalsPage() {
  const { role } = await requireSalesUser();

  return (
    <DashboardShell role={role}>
      <RenewalsTable />
    </DashboardShell>
  );
}
