import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaffOrAdmin, resolveProfileName } from '@/lib/gf1/auth';
import { fetchAssignableUsers, fetchClientProfile } from '@/lib/gf1/queries';
import type { AssignableUser, ProfileRole } from '@/lib/gf1/types';
import LogoUploader from '../../components/LogoUploader';
import ReassignOwnerForm from '../../components/ReassignOwnerForm';
import {
  AgreementsList,
  ContactsTab,
  ProposalsList,
  ServicesTab,
  formatAddress,
  lookupUserName,
} from '../../components/profileSections';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'services', label: 'Services' },
  { id: 'agreements', label: 'Pricing' },
  { id: 'proposals', label: 'Proposals' },
];

type ClientProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: { tab?: string };
};

export default async function ClientProfilePage({ params: paramPromise, searchParams }: ClientProfilePageProps) {
  const params = await paramPromise;
  const { supabase, role, user } = await requireStaffOrAdmin();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  const salesRepFilter = role === 'sales' ? (salesRepName ?? '__no_access__') : null;
  const [profile, assignees] = await Promise.all([
    fetchClientProfile(params.id, supabase),
    fetchAssignableUsers(supabase),
  ]);

  if (!profile || !profile.client) {
    notFound();
  }
  if (role === 'sales' && profile.organization.sales_rep_name !== salesRepFilter) {
    notFound();
  }

  const basePath = `/gf1/clients/${params.id}`;
  const activeTabParam = searchParams?.tab ?? 'overview';
  const activeTab = TABS.some((tab) => tab.id === activeTabParam) ? activeTabParam : 'overview';
  const canEdit = role === 'admin' || role === 'staff';
  const assignedName = lookupUserName(profile.client.assigned_rep_id, assignees);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-400">Client · {profile.client.status}</p>
            <h1 className="text-3xl font-semibold">{profile.organization.name}</h1>
            <p className="text-sm text-neutral-500">{formatAddress(profile.organization)}</p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <div className="font-semibold text-neutral-800">
              {profile.organization.primary_contact_name ?? 'No primary contact'}
            </div>
            <div>{profile.organization.primary_contact_email ?? '—'}</div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl bg-white">
        <nav className="flex flex-wrap gap-2 px-6 pb-3 pt-4 text-sm font-medium">
          {TABS.map((tab) => {
            const href = tab.id === 'overview' ? basePath : `${basePath}?tab=${tab.id}`;
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={href}
                className={`rounded-full px-4 py-1 ${isActive ? 'bg-indigo-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-6">{renderTabContent(activeTab, profile, role, assignees, canEdit, assignedName)}</div>
      </div>
    </div>
  );
}

function renderTabContent(
  tab: string,
  profile: NonNullable<Awaited<ReturnType<typeof fetchClientProfile>>>,
  role: ProfileRole | null,
  assignees: AssignableUser[],
  canEdit: boolean,
  assignedName: string
) {
  switch (tab) {
    case 'contacts':
      return <ContactsTab profile={profile} canEdit={canEdit} />;
    case 'services':
      return (
        <ServicesTab
          profile={profile}
          role={role}
          canEdit={canEdit}
          emptyMessage="Services are locked until a linked prospect is added."
        />
      );
    case 'agreements':
      return <AgreementsList agreements={profile.agreements} />;
    case 'proposals':
      return <ProposalsList proposals={profile.proposals} />;
    default:
      return renderOverview(profile, role, assignees, assignedName);
  }
}

function renderOverview(
  profile: NonNullable<Awaited<ReturnType<typeof fetchClientProfile>>>,
  role: ProfileRole | null,
  assignees: AssignableUser[],
  assignedName: string
) {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <article className="rounded-xl  p-4">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-neutral-400">ARR</dt>
              <dd className="text-lg font-semibold text-neutral-800">
                {profile.client?.arr ? `$${profile.client.arr.toLocaleString()}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-400">Go-live</dt>
              <dd className="text-lg font-semibold text-neutral-800">
                {profile.client?.go_live_date ? new Date(profile.client.go_live_date).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-400">Assigned rep</dt>
              <dd className="text-lg font-semibold text-neutral-800">{assignedName}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-xl p-4">
          <h3 className="text-base font-semibold text-neutral-800">Linked records</h3>
          <ul className="text-sm text-neutral-600">
            <li>
              Prospect:{' '}
              {profile.prospect ? (
                <Link href={`/gf1/prospects/${profile.prospect.id}`} className="text-indigo-600 underline">
                  {profile.prospect.id}
                </Link>
              ) : (
                'No prospect linked'
              )}
            </li>
            <li>
              Organization:{' '}
              <Link href={`/gf1/organizations/${profile.organization.id}`} className="text-indigo-600 underline">
                {profile.organization.id}
              </Link>
            </li>
          </ul>
        </article>
      </div>
      <div className="space-y-4">
        <LogoUploader organizationId={profile.organization.id} currentLogoUrl={profile.organization.logo_url} />
        <ReassignOwnerForm
          entityType='client'
          entityId={profile.client?.id ?? ''}
          currentAssigneeId={profile.client?.assigned_rep_id ?? null}
          users={assignees}
          viewerRole={role}
        />
      </div>
    </div>
  );
}
