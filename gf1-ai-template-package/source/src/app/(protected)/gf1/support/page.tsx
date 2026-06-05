import { requireSalesUser } from '@/lib/gf1/auth';
import { supaServer } from '@/lib/supabase/server';
import { DashboardShell } from '../components/DashboardShell';
import SupportPortalClient from '../../support/_components/SupportPortalClient';

type TicketListItem = {
  id: string;
  created_at: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  requester_name: string;
  requester_email: string | null;
};

export default async function Gf1SupportPage() {
  // Gate access to GF1 users only (sales, sales_manager, admin)
  const { user, role } = await requireSalesUser();

  const supabase = await supaServer();

  let query = supabase
    .from('support_tickets')
    .select('id, created_at, subject, category, priority, status, requester_name, requester_email')
    .order('created_at', { ascending: false });

  if (user.email) {
    query = query.or(`created_by.eq.${user.id},requester_email.eq.${user.email}`);
  } else {
    query = query.eq('created_by', user.id);
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error('[support] list fetch failed', error);
  }

  const safeTickets: TicketListItem[] = tickets ?? [];

  return (
    <DashboardShell role={role}>
      <div className="gf1-support-section">
        <SupportPortalClient tickets={safeTickets} />
      </div>
    </DashboardShell>
  );
}
