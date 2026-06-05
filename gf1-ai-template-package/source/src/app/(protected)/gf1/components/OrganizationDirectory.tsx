"use client";

import { useMemo, useState, type ChangeEvent } from 'react';
import { supaClient } from '@/lib/supabase/client';
import Link from 'next/link';
import LogoUploader from './LogoUploader';
import NewOrganizationForm from './NewOrganizationForm';
import OrganizationContactForm from './OrganizationContactForm';
import type { Gf1Organization } from '@/lib/gf1/types';

type OrganizationDirectoryProps = {
  initialOrganizations: Array<
    Pick<
      Gf1Organization,
      | 'id'
      | 'name'
      | 'logo_url'
      | 'primary_contact_name'
      | 'primary_contact_email'
      | 'primary_contact_phone'
      | 'address_line1'
      | 'address_line2'
      | 'city'
      | 'state'
      | 'postal_code'
      | 'country'
      | 'website'
    >
  >;
};

export default function OrganizationDirectory({ initialOrganizations }: OrganizationDirectoryProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [selectedId, setSelectedId] = useState(initialOrganizations[0]?.id ?? null);
  const [query, setQuery] = useState('');

  const filteredOrgs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return organizations;
    return organizations.filter((org) =>
      [org.name, org.primary_contact_name, org.primary_contact_email, org.city, org.state]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [organizations, query]);

  const selected = organizations.find((org) => org.id === selectedId) ?? organizations[0] ?? null;

  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function handleCreated(org: Gf1Organization) {
    setOrganizations((prev) => [org, ...prev]);
    setSelectedId(org.id);
    setQuery('');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="text-sm font-medium text-neutral-800" htmlFor="org-search">
            Find an organization
          </label>
          <input
            id="org-search"
            type="search"
            value={query}
            onChange={handleQueryChange}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Search by name, contact, or city"
          />
        </div>

        <div className="h-[420px] overflow-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
          {filteredOrgs.length === 0 && (
            <p className="p-3 text-sm text-neutral-500">No organizations match that search.</p>
          )}
          {filteredOrgs.map((org) => {
            const isActive = org.id === selected?.id;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedId(org.id)}
                className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-indigo-50 ${
                  isActive ? 'border border-indigo-100 bg-indigo-50' : ''
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="font-semibold text-neutral-900">{org.name}</div>
                  {org.state && <span className="text-xs uppercase text-neutral-500">{org.state}</span>}
                </div>
                <p className="text-sm text-neutral-600">{org.primary_contact_name ?? 'No primary contact'}</p>
                <p className="text-xs text-neutral-500">{org.primary_contact_email ?? 'No email'}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-800">New organization</h3>
            <Link href="/gf1/pipeline" className="text-xs font-semibold text-indigo-600 hover:underline">
              Link to pipeline
            </Link>
          </div>
          <NewOrganizationForm onCreated={handleCreated} />
        </div>
      </aside>

      <section className="space-y-4">
        {!selected && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
            Select an organization to see contact and branding details.
          </div>
        )}

        {selected && (
          <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-400">Organization</p>
                <h2 className="text-2xl font-semibold text-neutral-900">{selected.name}</h2>
                <p className="text-sm text-neutral-500">
                  {[selected.city, selected.state].filter(Boolean).join(', ') || 'No location on file'}
                </p>
                {selected.website && (
                  <a
                    href={selected.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600"
                  >
                    {selected.website}
                  </a>
                )}
              </div>
              <div className="text-right text-sm text-neutral-500">
                <div className="font-semibold text-neutral-800">
                  {selected.primary_contact_name ?? 'No primary contact'}
                </div>
                <div>{selected.primary_contact_email ?? '-'}</div>
                {selected.primary_contact_phone && <div>{selected.primary_contact_phone}</div>}
              </div>
              <div className="ml-2 flex items-center gap-2">
                {/* Mark complete/incomplete button - updates `completed_at` on the organizations row */}
                <button
                  type="button"
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!selected) return;
                    setCompleteError(null);
                    setIsCompleting(true);
                    try {
                      const supabase = supaClient();
                      const willUncomplete = Boolean((selected as any).completed_at);
                      const payload = { completed_at: willUncomplete ? null : new Date().toISOString() } as any;
                      const { data, error } = await supabase
                        .from('organizations')
                        .update(payload)
                        .eq('id', selected.id)
                        .select('*')
                        .maybeSingle();

                      if (error) {
                        console.error('Failed to update organization completed state', error);
                        setCompleteError(error.message ?? 'Update failed');
                        return;
                      }

                      if (data) {
                        // update local state with returned row
                        setOrganizations((prev) => prev.map((o) => (o.id === data.id ? { ...o, ...(data as any) } : o)));
                      } else {
                        // optimistic local toggle if no data returned
                        setOrganizations((prev) =>
                          prev.map((o) => (o.id === selected.id ? { ...o, completed_at: willUncomplete ? null : new Date().toISOString() } : o))
                        );
                      }
                    } catch (err: any) {
                      console.error(err);
                      setCompleteError(err?.message ?? 'Unable to update');
                    } finally {
                      setIsCompleting(false);
                    }
                  }}
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Saving…' : (selected as any).completed_at ? 'Mark incomplete' : 'Mark complete'}
                </button>
                {completeError && <div className="text-xs text-rose-500">{completeError}</div>}
              </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
              <LogoUploader organizationId={selected.id} currentLogoUrl={selected.logo_url} />
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-800">Primary contact & address</h3>
                  <Link href="/gf1/proposals" className="text-xs font-semibold text-indigo-600 hover:underline">
                    Generate proposal
                  </Link>
                </div>
                <OrganizationContactForm
                  organizationId={selected.id}
                  canEdit
                  defaults={{
                    primary_contact_name: selected.primary_contact_name,
                    primary_contact_email: selected.primary_contact_email,
                    primary_contact_phone: selected.primary_contact_phone,
                    address_line1: selected.address_line1,
                    address_line2: selected.address_line2,
                    city: selected.city,
                    state: selected.state,
                    postal_code: selected.postal_code,
                    country: selected.country,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


