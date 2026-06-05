"use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { supaClient } from '@/lib/supabase/client';

type OrganizationContactFormProps = {
  organizationId: string;
  canEdit: boolean;
  defaults: {
    primary_contact_name: string | null;
    primary_contact_email: string | null;
    primary_contact_phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  };
};

export default function OrganizationContactForm({
  organizationId,
  canEdit,
  defaults,
}: OrganizationContactFormProps) {
  const [formValues, setFormValues] = useState(defaults);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setStatus('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    setStatus('saving');

    const supabase = supaClient();
    const { error } = await supabase
      .from('organizations')
      .update({
        primary_contact_name: formValues.primary_contact_name?.trim() ?? null,
        primary_contact_email: formValues.primary_contact_email?.trim() ?? null,
        primary_contact_phone: formValues.primary_contact_phone?.trim() ?? null,
        address_line1: formValues.address_line1?.trim() ?? null,
        address_line2: formValues.address_line2?.trim() ?? null,
        city: formValues.city?.trim() ?? null,
        state: formValues.state?.trim() ?? null,
        postal_code: formValues.postal_code?.trim() ?? null,
        country: formValues.country?.trim() ?? null,
      })
      .eq('id', organizationId);

    if (error) {
      console.error(error);
      setStatus('error');
      return;
    }

    setStatus('success');
  }

  const inputClass =
    'w-full rounded-lg  px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-neutral-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="primary_contact_name">
            Primary contact name
          </label>
          <input
            id="primary_contact_name"
            name="primary_contact_name"
            type="text"
            className={inputClass}
            value={formValues.primary_contact_name ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="primary_contact_email">
            Primary contact email
          </label>
          <input
            id="primary_contact_email"
            name="primary_contact_email"
            type="email"
            className={inputClass}
            value={formValues.primary_contact_email ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="primary_contact_phone">
            Primary contact phone
          </label>
          <input
            id="primary_contact_phone"
            name="primary_contact_phone"
            type="tel"
            className={inputClass}
            value={formValues.primary_contact_phone ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="address_line1">
            Address line 1
          </label>
          <input
            id="address_line1"
            name="address_line1"
            type="text"
            className={inputClass}
            value={formValues.address_line1 ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="address_line2">
            Address line 2
          </label>
          <input
            id="address_line2"
            name="address_line2"
            type="text"
            className={inputClass}
            value={formValues.address_line2 ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            className={inputClass}
            value={formValues.city ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="state">
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            className={inputClass}
            value={formValues.state ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="postal_code">
            Postal code
          </label>
          <input
            id="postal_code"
            name="postal_code"
            type="text"
            className={inputClass}
            value={formValues.postal_code ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            className={inputClass}
            value={formValues.country ?? ''}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canEdit || status === 'saving'}
      >
        {status === 'saving' ? 'Saving...' : 'Save contact info'}
      </button>
      {status === 'success' && <p className="text-sm text-emerald-600">Saved.</p>}
      {status === 'error' && <p className="text-sm text-rose-500">Update failed.</p>}
    </form>
  );
}
