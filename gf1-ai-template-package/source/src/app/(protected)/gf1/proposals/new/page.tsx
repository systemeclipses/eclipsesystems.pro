import { requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { ProposalGeneratorClient } from '../_components/ProposalGeneratorClient';

export default async function NewProposalPage() {
  const { role, user } = await requireStaffOrAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  
  // Use admin client for organizations query to bypass RLS
  const admin = supaAdmin();
  
  // Fetch organizations marked as "prospect" status using admin client
  let prospectQuery = admin
    .from('organizations')
    .select('id, legal_name, dba_name, trade_name, primary_contact_name, primary_contact_email, status, total_employees, pay_frequency')
    .eq('status', 'prospect')
    .order('legal_name', { ascending: true })
    .limit(500);
  if (role === 'sales') {
    prospectQuery = prospectQuery.eq('sales_rep_name', salesRepFilter as string);
  }
  const { data: prospectOrgs } = await prospectQuery;

  const prospectList = (prospectOrgs ?? []).map((org) => ({
    id: org.id,
    name: org.dba_name || org.trade_name || org.legal_name,
    organization_id: org.id,
    email: org.primary_contact_email || null,
    organization_name: org.dba_name || org.trade_name || org.legal_name,
    legal_name: org.legal_name || null,
    total_employees: org.total_employees ?? null,
    pay_frequency: org.pay_frequency ?? null,
  }));

  return (
    <DashboardShell role={role}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingRight: '16px' }}>
        <section
          className="gf1-proposal-generator"
          style={{
            background: '#1b2438',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            overflow: 'visible',
            maxWidth: '100%',
            minWidth: 0,
            width: '100%',
            margin: '24px auto 0',
            boxShadow: '0 30px 60px rgba(5, 15, 39, 0.35)',
          }}
        >
          <div style={{ padding: '24px 32px' }}>
            <ProposalGeneratorClient prospects={prospectList} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
