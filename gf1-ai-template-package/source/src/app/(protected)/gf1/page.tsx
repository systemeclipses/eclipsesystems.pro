import { supaServer } from '@/lib/supabase/server';
import { fetchSalesOrgIds, requireGf1Access, resolveProfileName } from '@/lib/gf1/auth';
import { deriveFollowUpType } from '@/lib/gf1/opportunity-follow-ups';
import type { FollowUpType } from '@/lib/gf1/opportunity-follow-ups';
import { DashboardShell } from './components/DashboardShell';
import { DashboardOverview } from './components/DashboardOverview';

type SupabaseServerClient = Awaited<ReturnType<typeof supaServer>>;

const STAGE_PROGRESS_DEFAULT: Record<string, number> = {
  lead: 25,
  prospect: 65,
  client: 100,
};

const ORG_OPTIONAL_COLUMNS = ['trade_name'];

type ProspectJourneyItem = {
  id: string;
  name: string;
  stage: string;
  progress: number;
  updatedAt: string | null;
};

type RecentActivityItem = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  icon: string;
  accent: string;
};

type MonthlyStats = {
  newLeads: number;
  activeDeals: number;
  wonDeals: number;
  winRate: number;
};

type RevenueForecast = {
  openVolume: number;
  targetVolume: number;
  closeRate: number;
};

type DashboardFollowUpItem = {
  id: string;
  opportunityId: string;
  followUpAt: string;
  followUpType: FollowUpType | null;
  channel: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

type DashboardFollowUpRow = {
  id: string;
  opportunity_id: string;
  contacted_at: string;
  channel: string | null;
  follow_up_type?: string | null;
  notes: string | null;
  follow_up_at: string | null;
  follow_up_completed_at: string | null;
  opportunity: {
    id: string;
    organization_name: string | null;
    primary_contact_name: string | null;
    primary_contact_phone: string | null;
    primary_contact_email: string | null;
  } | null;
};

const startOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday start
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value: Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

async function fetchPipelineCounts(
  supabase: SupabaseServerClient,
  salesRepName: string | null,
  enforceSalesFilter = false
) {
  if (enforceSalesFilter && !salesRepName) {
    return { leads: 0, prospects: 0, clients: 0, winRate: 0 };
  }
  const makeQuery = () => {
    let query = supabase.from('organizations').select('id', { count: 'exact', head: true });
    if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
    return query;
  };
  const [leads, prospects, clients, totalOrgs] = await Promise.all([
    makeQuery().eq('status', 'lead'),
    makeQuery().eq('status', 'prospect'),
    makeQuery().eq('status', 'client'),
    makeQuery(),
  ]);

  const totalLeadAdds = totalOrgs.count ?? 0;
  const totalClients = clients.count ?? 0;
  const winRate = totalLeadAdds === 0 ? 0 : Math.round((totalClients / totalLeadAdds) * 100);
  return {
    leads: leads.count ?? 0,
    prospects: prospects.count ?? 0,
    clients: clients.count ?? 0,
    winRate,
  };
}

async function fetchProspectJourney(
  supabase: SupabaseServerClient,
  salesRepName: string | null,
  enforceSalesFilter = false
): Promise<ProspectJourneyItem[]> {
  if (enforceSalesFilter && !salesRepName) return [];
  try {
    let query = supabase
      .from('organizations')
      .select('id, legal_name, dba_name, trade_name, status, updated_at')
      .in('status', ['lead', 'prospect', 'client'])
      .order('updated_at', { ascending: false });
    if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
    let { data: organizations, error } = await query;

    if (error) {
      const errorMessage = typeof error.message === 'string' ? error.message.toLowerCase() : '';
      if (errorMessage && ORG_OPTIONAL_COLUMNS.some((column) => errorMessage.includes(column))) {
        let fallbackQuery = supabase
          .from('organizations')
          .select('id, legal_name, dba_name, status, updated_at')
          .in('status', ['lead', 'prospect', 'client'])
          .order('updated_at', { ascending: false });
        if (salesRepName) fallbackQuery = fallbackQuery.eq('sales_rep_name', salesRepName);
        const fallback = await fallbackQuery;
        organizations = (fallback.data ?? []).map((org) => ({ ...org, trade_name: null }));
        error = fallback.error;
      }
      if (error) {
        console.error('Failed to load organizations for pipeline overview', error);
        return [];
      }
    }

    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

    return (organizations ?? [])
      .map((org) => {
        const stage = typeof org.status === 'string' ? org.status.toLowerCase() : 'prospect';
        if (stage === 'lead') return null;
        if (stage === 'client') {
          const updatedAt = org.updated_at ? new Date(org.updated_at).getTime() : null;
          if (!updatedAt || updatedAt < cutoff) return null;
        }

        const name = org.dba_name || org.trade_name || org.legal_name || 'Unnamed Prospect';
        const progressValue = STAGE_PROGRESS_DEFAULT[stage] ?? 50;

        return {
          id: org.id,
          name,
          stage,
          progress: progressValue,
          updatedAt: org.updated_at ?? null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  } catch (err) {
    console.error('Failed to compute prospect journey progress', err);
    return [];
  }
}

async function fetchRecentActivity(
  supabase: SupabaseServerClient,
  salesRepName: string | null,
  enforceSalesFilter = false
): Promise<RecentActivityItem[]> {
  if (enforceSalesFilter && !salesRepName) return [];
  try {
    const salesOrgIds =
      enforceSalesFilter && salesRepName ? await fetchSalesOrgIds(supabase, salesRepName) : [];
    const [orgResult, proposalResult] = await Promise.all([
      (() => {
        let query = supabase
          .from('organizations')
          .select('id, legal_name, dba_name, trade_name, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6);
        if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
        return query;
      })(),
      (() => {
        let query = supabase
          .from('proposals')
          .select('id, organization_id, status, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(6);
        if (enforceSalesFilter) {
          query = query.in(
            'organization_id',
            salesOrgIds.length ? salesOrgIds : ['00000000-0000-0000-0000-000000000000']
          );
        }
        return query;
      })(),
    ]);

    const events: RecentActivityItem[] = [];

    let orgRows = orgResult.data ?? [];
    const orgErrorMessage =
      typeof orgResult.error?.message === 'string' ? orgResult.error.message.toLowerCase() : '';
    if (orgErrorMessage && ORG_OPTIONAL_COLUMNS.some((column) => orgErrorMessage.includes(column))) {
      let fallbackQuery = supabase
        .from('organizations')
        .select('id, legal_name, dba_name, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (salesRepName) fallbackQuery = fallbackQuery.eq('sales_rep_name', salesRepName);
      const fallback = await fallbackQuery;
      orgRows = (fallback.data ?? []).map((org) => ({ ...org, trade_name: null }));
      if (fallback.error) {
        console.error('Failed to load organization activity', fallback.error);
      }
    } else if (orgResult.error) {
      console.error('Failed to load organization activity', orgResult.error);
    }

    if (orgRows.length) {
      orgRows.forEach((org) => {
        const name = org.dba_name || org.trade_name || org.legal_name || 'Unnamed organization';
        const stage = typeof org.status === 'string' ? org.status.toLowerCase() : 'lead';
        let label = 'Organization created';
        let icon = 'fas fa-building';
        let accent = 'var(--brand-blue-light)';
        if (stage === 'client') {
          label = 'Client activated';
          icon = 'fas fa-trophy';
          accent = '#4ade80';
        } else if (stage === 'prospect') {
          label = 'Prospect added';
          icon = 'fas fa-handshake';
          accent = 'var(--brand-blue-light)';
        } else {
          label = 'Suspect added';
          icon = 'fas fa-user-plus';
          accent = 'var(--brand-gold)';
        }

        events.push({
          id: `org-${org.id}`,
          label,
          detail: name,
          timestamp: org.updated_at ?? org.created_at ?? new Date().toISOString(),
          icon,
          accent,
        });
      });
    }

    let proposalOrgMap = new Map<string, { legal_name: string | null; dba_name: string | null; trade_name: string | null }>();
    const proposalRows = proposalResult.data ?? [];
    const proposalOrgIds = Array.from(
      new Set(proposalRows.map((proposal) => proposal.organization_id).filter((id): id is string => Boolean(id))),
    );
    if (proposalOrgIds.length > 0) {
      let { data: proposalOrgs, error: proposalOrgError } = await supabase
        .from('organizations')
        .select('id, legal_name, dba_name, trade_name')
        .in('id', proposalOrgIds);
      const proposalOrgErrorMessage =
        typeof proposalOrgError?.message === 'string' ? proposalOrgError.message.toLowerCase() : '';
      if (proposalOrgErrorMessage && ORG_OPTIONAL_COLUMNS.some((column) => proposalOrgErrorMessage.includes(column))) {
        const fallback = await supabase
          .from('organizations')
          .select('id, legal_name, dba_name')
          .in('id', proposalOrgIds);
        proposalOrgs = (fallback.data ?? []).map((org) => ({ ...org, trade_name: null }));
        proposalOrgError = fallback.error;
      }
      if (proposalOrgError) {
        console.error('Failed to load organizations for proposals activity', proposalOrgError);
      } else {
        proposalOrgMap = new Map(
          (proposalOrgs ?? []).map((org) => [
            org.id as string,
            { legal_name: org.legal_name, dba_name: org.dba_name, trade_name: org.trade_name },
          ]),
        );
      }
    }

    if (proposalResult.error) {
      console.error('Failed to load proposal activity', proposalResult.error);
    } else {
      proposalRows.forEach((proposal) => {
        const org = proposal.organization_id ? proposalOrgMap.get(proposal.organization_id) : null;
        const name = org?.dba_name || org?.trade_name || org?.legal_name || 'Proposal';
        events.push({
          id: `proposal-${proposal.id}`,
          label: 'Proposal created',
          detail: name,
          timestamp: proposal.created_at ?? proposal.updated_at ?? new Date().toISOString(),
          icon: 'fas fa-file-lines',
          accent: '#005791',
        });
      });
    }

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  } catch (err) {
    console.error('Failed to build recent activity', err);
    return [];
  }
}

async function fetchWeeklyFollowUps(
  supabase: SupabaseServerClient,
  role: string | null,
  userId: string | null
): Promise<DashboardFollowUpItem[]> {
  if (role === 'sales' && !userId) return [];

  try {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = addDays(weekStart, 7);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = addDays(todayStart, 1);

    const baseSelect = `id, opportunity_id, contacted_at, channel, notes, follow_up_at, follow_up_completed_at,
      opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email)`;
    const selectWithType = `id, opportunity_id, contacted_at, channel, follow_up_type, notes, follow_up_at, follow_up_completed_at,
      opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email)`;

    let { data, error } = await supabase
      .from('opportunity_contact_logs')
      .select(selectWithType)
      .not('follow_up_at', 'is', null)
      .gte('follow_up_at', weekStart.toISOString())
      .lt('follow_up_at', weekEnd.toISOString())
      .is('follow_up_completed_at', null)
      .order('follow_up_at', { ascending: true })
      .limit(500);

    const followUpTypeError = error?.message?.toLowerCase() ?? '';
    if (followUpTypeError.includes('follow_up_type')) {
      ({ data, error } = await supabase
        .from('opportunity_contact_logs')
        .select(baseSelect)
        .not('follow_up_at', 'is', null)
        .gte('follow_up_at', weekStart.toISOString())
        .lt('follow_up_at', weekEnd.toISOString())
        .is('follow_up_completed_at', null)
        .order('follow_up_at', { ascending: true })
        .limit(500));
    }

    if (error) {
      console.error('Failed to load weekly follow-ups for dashboard', error);
      return [];
    }

    const rows = (data ?? []) as DashboardFollowUpRow[];
    const opportunityIds = Array.from(
      new Set(rows.map((row) => row.opportunity_id).filter((id): id is string => Boolean(id)))
    );

    let claimMap = new Map<string, string | null>();
    if (opportunityIds.length > 0) {
      const { data: claimRows, error: claimError } = await supabase
        .from('opportunity_leads_vw')
        .select('id, claimed_by')
        .in('id', opportunityIds);
      if (claimError) {
        console.error('Failed to load claimed owners for dashboard follow-ups', claimError);
      } else {
        claimMap = new Map((claimRows ?? []).map((row) => [row.id as string, (row.claimed_by as string | null) ?? null]));
      }
    }

    const visibleRows =
      role === 'sales' && userId
        ? rows.filter((row) => {
            const claimedBy = claimMap.get(row.opportunity_id) ?? null;
            return !claimedBy || claimedBy === userId;
          })
        : rows;

    const followUps: DashboardFollowUpItem[] = visibleRows
      .filter((row): row is DashboardFollowUpRow & { follow_up_at: string } => Boolean(row.follow_up_at))
      .map((row) => ({
        id: row.id,
        opportunityId: row.opportunity_id,
        followUpAt: row.follow_up_at,
        followUpType: deriveFollowUpType({
          followUpType: row.follow_up_type ?? null,
          channel: row.channel,
          hasFollowUpAt: true,
        }),
        channel: row.channel,
        organizationName: row.opportunity?.organization_name ?? null,
        contactName: row.opportunity?.primary_contact_name ?? null,
        contactPhone: row.opportunity?.primary_contact_phone ?? null,
        contactEmail: row.opportunity?.primary_contact_email ?? null,
      }))
      .filter((item) => item.organizationName || item.contactName || item.contactPhone || item.contactEmail);

    const dueToday = followUps.filter((item) => {
      const dueDate = new Date(item.followUpAt);
      if (Number.isNaN(dueDate.getTime())) return false;
      return dueDate >= todayStart && dueDate < tomorrowStart;
    });
    const dueLaterThisWeek = followUps.filter((item) => {
      const dueDate = new Date(item.followUpAt);
      if (Number.isNaN(dueDate.getTime())) return false;
      return !(dueDate >= todayStart && dueDate < tomorrowStart);
    });

    const prioritizedToday = dueToday.slice(0, 4);
    const remainingSlots = Math.max(0, 4 - prioritizedToday.length);
    if (remainingSlots === 0) return prioritizedToday;
    return [...prioritizedToday, ...dueLaterThisWeek.slice(0, remainingSlots)];
  } catch (err) {
    console.error('Failed to build weekly follow-up widget', err);
    return [];
  }
}

async function fetchMonthlyStats(
  supabase: SupabaseServerClient,
  salesRepName: string | null,
  enforceSalesFilter = false
): Promise<MonthlyStats> {
  if (enforceSalesFilter && !salesRepName) {
    return { newLeads: 0, activeDeals: 0, wonDeals: 0, winRate: 0 };
  }
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startIso = startOfMonth.toISOString();

  try {
    const [leadsResult, prospectResult, clientsResult] = await Promise.all([
      (() => {
        let query = supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'lead')
          .gte('created_at', startIso);
        if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
        return query;
      })(),
      (() => {
        let query = supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'prospect')
          .gte('updated_at', startIso);
        if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
        return query;
      })(),
      (() => {
        let query = supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'client')
          .gte('updated_at', startIso);
        if (salesRepName) query = query.eq('sales_rep_name', salesRepName);
        return query;
      })(),
    ]);

    const newLeads = leadsResult.count ?? 0;
    const activeDeals = prospectResult.count ?? 0;
    const wonDeals = clientsResult.count ?? 0;
    const winRate = newLeads === 0 ? 0 : Math.round((wonDeals / newLeads) * 100);

    return {
      newLeads,
      activeDeals,
      wonDeals,
      winRate,
    };
  } catch (err) {
    console.error('Failed to compute monthly stats', err);
    return {
      newLeads: 0,
      activeDeals: 0,
      wonDeals: 0,
      winRate: 0,
    };
  }
}

async function fetchRevenueForecast(
  supabase: SupabaseServerClient,
  salesRepName: string | null,
  enforceSalesFilter = false
): Promise<RevenueForecast> {
  if (enforceSalesFilter && !salesRepName) {
    return { openVolume: 0, targetVolume: 0, closeRate: 0 };
  }
  try {
    let organizations: Array<{ status: string | null; annual_commission?: number | null }> = [];
    let financeQuery = supabase
      .from('org_financials_vw')
      .select('status, annual_commission')
      .in('status', ['prospect', 'client']);
    if (salesRepName) financeQuery = financeQuery.eq('sales_rep_name', salesRepName);
    const { data, error } = await financeQuery;

    if (error) {
      const missingAnnualColumn =
        typeof error.message === 'string' && error.message.toLowerCase().includes('annual_commission');

      if (!missingAnnualColumn) {
        console.error('Failed to load revenue forecast data', error);
        return { openVolume: 0, targetVolume: 0, closeRate: 0 };
      }

      console.warn('annual_commission column missing; revenue forecast will assume zero dollar values');
      let fallbackQuery = supabase
        .from('organizations')
        .select('status')
        .in('status', ['prospect', 'client']);
      if (salesRepName) fallbackQuery = fallbackQuery.eq('sales_rep_name', salesRepName);
      const { data: fallback, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        console.error('Failed to load revenue forecast data (fallback)', fallbackError);
        return { openVolume: 0, targetVolume: 0, closeRate: 0 };
      }

      organizations = fallback ?? [];
    } else {
      organizations = data ?? [];
    }

    let openVolume = 0;
    let closedVolume = 0;

    (organizations ?? []).forEach((org) => {
      const value = Number(org.annual_commission) || 0;
      const stage = typeof org.status === 'string' ? org.status.toLowerCase() : 'prospect';
      if (stage === 'client') {
        closedVolume += value;
      } else if (stage === 'prospect') {
        openVolume += value;
      }
    });

    const targetVolume = openVolume + closedVolume;
    const closeRate = targetVolume === 0 ? 0 : Math.round((closedVolume / targetVolume) * 100);

    return { openVolume, targetVolume, closeRate };
  } catch (err) {
    console.error('Failed to compute revenue forecast', err);
    return { openVolume: 0, targetVolume: 0, closeRate: 0 };
  }
}

export default async function Gf1DashboardPage() {
  const { supabase, role, user } = await requireGf1Access();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const [counts, prospects, activity, monthly, revenue, followUps] = await Promise.all([
    fetchPipelineCounts(supabase, salesRepName, role === 'sales'),
    fetchProspectJourney(supabase, salesRepName, role === 'sales'),
    fetchRecentActivity(supabase, salesRepName, role === 'sales'),
    fetchMonthlyStats(supabase, salesRepName, role === 'sales'),
    fetchRevenueForecast(supabase, salesRepName, role === 'sales'),
    fetchWeeklyFollowUps(supabase, role, user?.id ?? null),
  ]);

  const primaryActions = [
    { title: 'Generate proposal', href: '/gf1/proposals', detail: 'Jump into pricing from one spot.' },
    { title: 'Create a lead', href: '/gf1/leads/new', detail: 'Start a new GF1 record with minimal info.' },
    { title: 'View pipeline', href: '/gf1/pipeline', detail: 'Track handoffs from lead to client.' },
    { title: 'Organizations', href: '/gf1/organizations', detail: 'Create orgs and edit contacts/logos.' },
    { title: 'Submit win/loss', href: '/gf1/reports/win-loss', detail: 'Share outcomes for trends.' },
  ];

  return (
    <DashboardShell role={role}>
      <DashboardOverview
        counts={counts}
        actions={primaryActions}
        prospects={prospects}
        activity={activity}
        monthly={monthly}
        revenue={revenue}
        followUps={followUps}
      />
    </DashboardShell>
  );
}

