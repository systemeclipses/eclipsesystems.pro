import { requireSalesUser } from '@/lib/gf1/auth';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { deriveFollowUpType } from '@/lib/gf1/opportunity-follow-ups';
import type { FollowUpType } from '@/lib/gf1/opportunity-follow-ups';
import ActivityChecklistClient from './ActivityChecklistClient';

export const dynamic = 'force-dynamic';

type OpportunityInfo = {
  id: string;
  organization_name: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  notes: string | null;
};

type ActivityLogRow = {
  id: string;
  opportunity_id: string;
  contacted_at: string;
  channel: string | null;
  follow_up_type?: string | null;
  notes: string | null;
  follow_up_at: string | null;
  got_response: boolean | null;
  response_notes: string | null;
  follow_up_completed_at: string | null;
  follow_up_completed_by: string | null;
  opportunity: OpportunityInfo | null;
};

type ClaimRow = {
  id: string;
  claimed_by: string | null;
};

type ActivityItem = {
  id: string;
  opportunityId: string;
  followUpAt: string;
  contactedAt: string;
  channel: string | null;
  followUpType: FollowUpType | null;
  opportunityNotes: string | null;
  notes: string | null;
  gotResponse: boolean;
  responseNotes: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  claimedBy: string | null;
  completedAt: string | null;
  completedBy: string | null;
};

type ActivityOpportunityRow = {
  id: string;
  organization_name: string | null;
  primary_contact_name: string | null;
  claimed_by: string | null;
};

type ActivityOpportunityOption = {
  id: string;
  organizationName: string;
  contactName: string | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

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

const parseWeekParam = (value?: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toWeekParam = (value: Date) => value.toISOString().slice(0, 10);

type ActivityPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const { supabase, role, user } = await requireSalesUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const now = new Date();
  const selectedWeek = parseWeekParam(resolvedSearchParams?.week) ?? now;
  const weekStart = startOfWeek(selectedWeek);
  const rangeEnd = addDays(weekStart, 7);

  const baseSelect =
    `id, opportunity_id, contacted_at, channel, notes, follow_up_at, got_response, response_notes,
     follow_up_completed_at, follow_up_completed_by,
     opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email, notes)`;
  const selectWithType = `id, opportunity_id, contacted_at, channel, follow_up_type, notes, follow_up_at, got_response, response_notes,
     follow_up_completed_at, follow_up_completed_by,
     opportunity:opportunity_leads (id, organization_name, primary_contact_name, primary_contact_phone, primary_contact_email, notes)`;

  let { data, error } = await supabase
    .from('opportunity_contact_logs')
    .select(selectWithType)
    .eq('contacted_by', user.id)
    .not('follow_up_at', 'is', null)
    .gte('follow_up_at', weekStart.toISOString())
    .lt('follow_up_at', rangeEnd.toISOString())
    .order('follow_up_at', { ascending: true })
    .limit(500);

  const activityErrorMessage = error?.message?.toLowerCase() ?? '';
  if (activityErrorMessage.includes('follow_up_type')) {
    ({ data, error } = await supabase
      .from('opportunity_contact_logs')
      .select(baseSelect)
      .eq('contacted_by', user.id)
      .not('follow_up_at', 'is', null)
      .gte('follow_up_at', weekStart.toISOString())
      .lt('follow_up_at', rangeEnd.toISOString())
      .order('follow_up_at', { ascending: true })
      .limit(500));
  }

  const opportunityIds = Array.from(
    new Set((data ?? []).map((row) => row?.opportunity_id).filter((id): id is string => Boolean(id)))
  );
  let claimMap = new Map<string, string | null>();
  if (opportunityIds.length > 0) {
    const { data: claimRows } = await supabase
      .from('opportunity_leads_vw')
      .select('id, claimed_by')
      .in('id', opportunityIds);
    const claimData = (claimRows ?? []) as ClaimRow[];
    claimMap = new Map(claimData.map((row) => [row.id, row.claimed_by ?? null]));
  }

  const items: ActivityItem[] = (data ?? [])
    .filter((row): row is ActivityLogRow => Boolean(row?.follow_up_at))
    .map((row) => ({
      id: row.id,
      opportunityId: row.opportunity_id,
      followUpAt: row.follow_up_at as string,
      contactedAt: row.contacted_at,
      channel: row.channel,
      followUpType: deriveFollowUpType({
        followUpType: row.follow_up_type ?? null,
        channel: row.channel,
        hasFollowUpAt: true,
      }),
      opportunityNotes: row.opportunity?.notes ?? null,
      notes: row.notes,
      gotResponse: Boolean(row.got_response),
      responseNotes: row.response_notes,
      organizationName: row.opportunity?.organization_name ?? null,
      contactName: row.opportunity?.primary_contact_name ?? null,
      contactPhone: row.opportunity?.primary_contact_phone ?? null,
      contactEmail: row.opportunity?.primary_contact_email ?? null,
      claimedBy: claimMap.get(row.opportunity_id) ?? null,
      completedAt: row.follow_up_completed_at ?? null,
      completedBy: row.follow_up_completed_by ?? null,
    }))
    .filter((item) => item.organizationName || item.contactName || item.contactPhone || item.contactEmail);

  const visibleItems = items;

  const { data: opportunityRows, error: opportunitiesError } = await supabase
    .from('opportunity_leads_vw')
    .select('id, organization_name, primary_contact_name, claimed_by')
    .order('organization_name', { ascending: true })
    .limit(500);

  const visibleOpportunityRows = (
    role === 'sales' && user?.id
      ? (opportunityRows ?? []).filter((row: ActivityOpportunityRow) => !row.claimed_by || row.claimed_by === user.id)
      : opportunityRows ?? []
  ) as ActivityOpportunityRow[];

  const opportunityOptions: ActivityOpportunityOption[] = visibleOpportunityRows
    .map((row) => ({
      id: row.id,
      organizationName: row.organization_name ?? 'Untitled opportunity',
      contactName: row.primary_contact_name ?? null,
    }))
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName, 'en-US'));

  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const basePath = '/gf1/activity';
  return (
    <DashboardShell role={role}>
      <ActivityChecklistClient
        items={visibleItems}
        weekStart={weekStart.toISOString()}
        prevWeekHref={`${basePath}?week=${toWeekParam(prevWeek)}`}
        nextWeekHref={`${basePath}?week=${toWeekParam(nextWeek)}`}
        errorMessage={error?.message ?? opportunitiesError?.message ?? null}
        opportunityOptions={opportunityOptions}
      />
    </DashboardShell>
  );
}
