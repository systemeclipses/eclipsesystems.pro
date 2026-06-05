import Link from 'next/link';
import OrganizationContactForm from './OrganizationContactForm';
import ServicesSelector from './ServicesSelector';
import type { AssignableUser, Gf1Agreement, Gf1Organization, ProfileRole } from '@/lib/gf1/types';
import type { ProfileBundle } from '@/lib/gf1/queries';

export function ContactsTab({
  profile,
  canEdit,
}: {
  profile: ProfileBundle;
  canEdit: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-neutral-800">Contacts</h3>
        {profile.contacts.length === 0 && (
          <p className="text-sm text-neutral-500">No contacts added yet for this organization.</p>
        )}
        {profile.contacts.map((contact) => (
          <div key={contact.id} className="rounded-xl p-4">
            <div className="text-lg font-semibold text-neutral-800">{contact.name}</div>
            <p className="text-sm text-neutral-500">{contact.title ?? '—'}</p>
            <div className="text-sm text-neutral-600">{contact.email ?? 'No email'}</div>
            <div className="text-sm text-neutral-600">{contact.phone ?? 'No phone'}</div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-800">Primary contact</h3>
        <OrganizationContactForm
          organizationId={profile.organization.id}
          canEdit={canEdit}
          defaults={{
            primary_contact_name: profile.organization.primary_contact_name,
            primary_contact_email: profile.organization.primary_contact_email,
            primary_contact_phone: profile.organization.primary_contact_phone,
            address_line1: profile.organization.address_line1,
            address_line2: profile.organization.address_line2,
            city: profile.organization.city,
            state: profile.organization.state,
            postal_code: profile.organization.postal_code,
            country: profile.organization.country,
          }}
        />
      </div>
    </div>
  );
}

export function ServicesTab({
  profile,
  role,
  canEdit,
  emptyMessage,
}: {
  profile: ProfileBundle;
  role: ProfileRole | null;
  canEdit: boolean;
  emptyMessage?: string;
}) {
  if (!profile.prospect) {
    return (
      <div className="rounded-xl p-6 text-sm text-neutral-500">
        {emptyMessage ?? 'Convert to a prospect to configure services.'}
      </div>
    );
  }

  return (
    <ServicesSelector
      prospectId={profile.prospect.id}
      canEdit={canEdit}
      viewerRole={role}
      initialCatalog={profile.peoServices}
      initialSelections={profile.services}
    />
  );
}

export function AgreementsList({ agreements }: { agreements: Gf1Agreement[] }) {
  if (agreements.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">No agreements generated yet.</p>
        <p className="text-sm text-neutral-500">Use the generator once discovery is complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {agreements.map((agreement) => (
        <div key={agreement.id} className="flex items-center justify-between rounded-xl p-4">
          <div>
            <div className="text-base font-semibold text-neutral-800">Agreement {agreement.id.slice(0, 8)}</div>
            <p className="text-sm text-neutral-500">
              Status: <span className="font-semibold capitalize">{agreement.status}</span> · Updated{' '}
              {formatDate(agreement.updated_at)}
            </p>
          </div>
          <Link href={`/gf1/pricing/${agreement.id}`} className="secondary-button">
            Open
          </Link>
        </div>
      ))}
    </div>
  );
}

export function ProposalsList({ proposals }: { proposals: ProfileBundle['proposals'] }) {
  if (proposals.length === 0) {
    return <p className="text-sm text-neutral-500">No proposals yet.</p>;
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="flex items-center justify-between rounded-xl p-4">
          <div>
            <div className="text-base font-semibold text-neutral-800">Proposal {proposal.id.slice(0, 8)}</div>
            <p className="text-sm text-neutral-500">
              Status: <span className="font-semibold capitalize">{proposal.status}</span> · Updated{' '}
              {formatDate(proposal.updated_at)}
            </p>
          </div>
          <Link href={`/gf1/proposals/${proposal.id}`} className="secondary-button">
            Open
          </Link>
        </div>
      ))}
    </div>
  );
}

export function lookupUserName(id: string | null, assignees: AssignableUser[]) {
  if (!id) return 'Unassigned';
  const match = assignees.find((user) => user.id === id);
  return match?.full_name ?? match?.email ?? 'Unassigned';
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'n/a';
  return new Date(value).toLocaleDateString();
}

export function formatAddress(org: Gf1Organization) {
  const parts = [
    org.address_line1,
    org.address_line2,
    [org.city, org.state].filter(Boolean).join(', '),
    org.postal_code,
    org.country,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No address on file';
}
