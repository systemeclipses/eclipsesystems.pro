import LeadForm from './LeadForm';
import { requireSalesUser } from '@/lib/gf1/auth';

export default async function NewLeadPage() {
  await requireSalesUser();

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <LeadForm />
    </div>
  );
}
