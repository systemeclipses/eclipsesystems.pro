import { supaServer } from '@/lib/supabase/server';
import type {
  Gf1Agreement,
  Gf1Client,
  Gf1Contact,
  Gf1Logo,
  Gf1Lead,
  AssignableUser,
  Gf1Organization,
  Gf1PeoService,
  Gf1Prospect,
  Gf1ProspectService,
  Gf1Proposal,
} from './types';

type SupabaseServerClient = Awaited<ReturnType<typeof supaServer>>;

export type ProfileBundle = {
  organization: Gf1Organization;
  contacts: Gf1Contact[];
  logos: Gf1Logo[];
  agreements: Gf1Agreement[];
  proposals: Gf1Proposal[];
  lead: Gf1Lead | null;
  prospect: Gf1Prospect | null;
  client: Gf1Client | null;
  services: Gf1ProspectService[];
  peoServices: Gf1PeoService[];
};

async function ensureSupabase(existingClient?: SupabaseServerClient) {
  if (existingClient) return existingClient;
  return supaServer();
}

async function fetchOrganizationBundle(organizationId: string, supabase: SupabaseServerClient) {
  const [{ data: organization }, { data: contacts }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organizationId).maybeSingle(),
    supabase.from('organization_contacts').select('*').eq('organization_id', organizationId),
  ]);

  if (!organization) {
    throw new Error(`Organization ${organizationId} not found`);
  }

  return {
    organization: organization as Gf1Organization,
    contacts: (contacts ?? []) as Gf1Contact[],
    logos: [] as Gf1Logo[],
  };
}

async function fetchEngagementArtifacts(organizationId: string, supabase: SupabaseServerClient) {
  const [agreementsResult, proposalsResult] = await Promise.all([
    supabase.from('agreements').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false }),
    supabase.from('proposals').select('*').eq('organization_id', organizationId).order('updated_at', { ascending: false }),
  ]);

  return {
    agreements: (agreementsResult.data ?? []) as Gf1Agreement[],
    proposals: (proposalsResult.data ?? []) as Gf1Proposal[],
  };
}

async function fetchServicesBundle(prospectId: string | null, supabase: SupabaseServerClient) {
  const servicesPromise = prospectId
    ? supabase.from('prospect_services').select('*').eq('prospect_id', prospectId)
    : Promise.resolve({ data: [] as Gf1ProspectService[] });

  const [selectedResult, peoResult] = await Promise.all([
    servicesPromise,
    supabase.from('peo_services').select('*').order('sort_order', { ascending: true }),
  ]);

  return {
    services: (selectedResult.data ?? []) as Gf1ProspectService[],
    peoServices: (peoResult.data ?? []) as Gf1PeoService[],
  };
}

export async function fetchLeadProfile(
  leadId: string,
  existingClient?: SupabaseServerClient
): Promise<ProfileBundle | null> {
  return null;
}

export async function fetchProspectProfile(
  prospectId: string,
  existingClient?: SupabaseServerClient
): Promise<ProfileBundle | null> {
  const supabase = await ensureSupabase(existingClient);
  const { data: prospect } = await supabase.from('prospects').select('*').eq('id', prospectId).maybeSingle();
  if (!prospect) {
    return null;
  }

  const [orgBundle, artifacts, clientResult] = await Promise.all([
    fetchOrganizationBundle(prospect.organization_id, supabase),
    fetchEngagementArtifacts(prospect.organization_id, supabase),
    supabase.from('clients').select('*').eq('prospect_id', prospect.id).maybeSingle(),
  ]);

  const { services, peoServices } = await fetchServicesBundle(prospect.id, supabase);

  return {
    ...orgBundle,
    ...artifacts,
    lead: null,
    prospect: prospect as Gf1Prospect,
    client: (clientResult.data as Gf1Client) ?? null,
    services,
    peoServices,
  };
}

export async function fetchClientProfile(
  clientId: string,
  existingClient?: SupabaseServerClient
): Promise<ProfileBundle | null> {
  const supabase = await ensureSupabase(existingClient);
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).maybeSingle();
  if (!client) {
    return null;
  }

  const [orgBundle, artifacts, prospectResult] = await Promise.all([
    fetchOrganizationBundle(client.organization_id, supabase),
    fetchEngagementArtifacts(client.organization_id, supabase),
    client.prospect_id
      ? supabase.from('prospects').select('*').eq('id', client.prospect_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { services, peoServices } = await fetchServicesBundle(client.prospect_id ?? null, supabase);

  return {
    ...orgBundle,
    ...artifacts,
    lead: null,
    prospect: (prospectResult.data as Gf1Prospect) ?? null,
    client: client as Gf1Client,
    services,
    peoServices,
  };
}

export async function fetchAssignableUsers(existingClient?: SupabaseServerClient): Promise<AssignableUser[]> {
  const supabase = await ensureSupabase(existingClient);
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'sales'])
    .limit(1000);
  return (data ?? [])
    .map((row: any) => ({
      id: row.id ?? row.user_id ?? null,
      full_name: row.name ?? null,
      email: row.email ?? null,
      role: row.role ?? null,
    }))
    .filter((row: AssignableUser & { id: string | null }) => Boolean(row.id && row.full_name))
    .sort((a, b) => {
      const aLabel = (a.full_name || a.email || '').toLowerCase();
      const bLabel = (b.full_name || b.email || '').toLowerCase();
      return aLabel.localeCompare(bLabel);
    }) as AssignableUser[];
}
