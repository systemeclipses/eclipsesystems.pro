import { notFound } from 'next/navigation';
import { requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { supaServer } from '@/lib/supabase/server';
import type {
  Gf1Agreement,
  Gf1Organization,
  Gf1PeoService,
  Gf1Prospect,
  Gf1ProspectService,
} from '@/lib/gf1/types';
import AgreementEditor from '../../components/AgreementEditor';

type AgreementPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgreementGeneratorPage({ params: paramPromise }: AgreementPageProps) {
  const params = await paramPromise;
  const { supabase, role, user } = await requireStaffOrAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  const data = await fetchAgreementDetails(params.id, supabase, salesRepFilter);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-400">
              Agreement · {data.agreement.status}
            </p>
            <h1 className="text-3xl font-semibold">{data.organization.name}</h1>
            <p className="text-sm text-neutral-500">
              Prospect #{data.prospect?.id ?? 'n/a'}
            </p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p>Workers comp: {data.agreement.workers_comp_included ? 'Included' : 'Excluded'}</p>
            <p>Last updated: {new Date(data.agreement.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      <AgreementEditor
        agreement={data.agreement}
        organization={data.organization}
        services={data.services}
        catalog={data.catalog}
        viewerRole={role}
      />
    </div>
  );
}

async function fetchAgreementDetails(
  agreementId: string,
  supabase: Awaited<ReturnType<typeof supaServer>>,
  salesRepName: string | null
) {
  const { data: agreement } = await supabase.from('agreements').select('*').eq('id', agreementId).maybeSingle();
  if (!agreement) return null;

  const [{ data: organization }, servicesResult, catalogResult, { data: prospect }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', agreement.organization_id).maybeSingle(),
    agreement.prospect_id
      ? supabase.from('prospect_services').select('*').eq('prospect_id', agreement.prospect_id)
      : Promise.resolve({ data: [] as Gf1ProspectService[] }),
    supabase.from('peo_services').select('*').order('sort_order', { ascending: true }),
    agreement.prospect_id
      ? supabase.from('prospects').select('*').eq('id', agreement.prospect_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!organization) {
    return null;
  }
  if (salesRepName && (organization as any).sales_rep_name !== salesRepName) {
    return null;
  }

  return {
    agreement: agreement as Gf1Agreement,
    organization: organization as Gf1Organization,
    services: (servicesResult.data ?? []) as Gf1ProspectService[],
    catalog: (catalogResult.data ?? []) as Gf1PeoService[],
    prospect: (prospect as Gf1Prospect) ?? null,
  };
}
