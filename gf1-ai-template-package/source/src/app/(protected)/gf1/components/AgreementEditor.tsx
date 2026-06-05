"use client";

import { useMemo, useState } from 'react';
import { supaClient } from '@/lib/supabase/client';
import type {
  Gf1Agreement,
  Gf1Organization,
  Gf1PeoService,
  Gf1ProspectService,
  ProfileRole,
} from '@/lib/gf1/types';

type AgreementEditorProps = {
  agreement: Gf1Agreement;
  organization: Gf1Organization;
  services: Gf1ProspectService[];
  catalog: Gf1PeoService[];
  viewerRole: ProfileRole | null;
};

const DEFAULT_CSA = { sections: [{ title: 'Scope', body: 'Define deliverables here.' }] };
const DEFAULT_BILLING = { schedule: [{ label: 'Implementation', amount: 0 }] };

export default function AgreementEditor({
  agreement,
  organization,
  services,
  catalog,
  viewerRole,
}: AgreementEditorProps) {
  const [workersComp, setWorkersComp] = useState(Boolean(agreement.workers_comp_included));
  const [csaDraft, setCsaDraft] = useState(JSON.stringify(agreement.csa_json ?? DEFAULT_CSA, null, 2));
  const [billingDraft, setBillingDraft] = useState(JSON.stringify(agreement.billing_json ?? DEFAULT_BILLING, null, 2));
  const [status, setStatus] = useState(agreement.status);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = supaClient();

  const selectedServices = useMemo(() => {
    const selected = services.filter((service) => service.selected);
    return selected.map((row) => {
      const meta = catalog.find((item) => item.id === row.service_id);
      return {
        id: row.service_id,
        name: meta?.name ?? row.service_id,
        config: row.config_json,
      };
    });
  }, [services, catalog]);

  const parsedCsa = useMemo(() => safeParse(csaDraft), [csaDraft]);
  const parsedBilling = useMemo(() => safeParse(billingDraft), [billingDraft]);

  const canSubmitForReview = status === 'draft' || status === 'rejected' || viewerRole === 'admin';

  async function handleSave(nextStatus: Gf1Agreement['status']) {
    if (!parsedCsa.ok || !parsedBilling.ok) {
      setFeedback({ type: 'error', text: 'CSA or Billing JSON is invalid.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload: Partial<Gf1Agreement> = {
      workers_comp_included: workersComp,
      csa_json: parsedCsa.value,
      billing_json: parsedBilling.value,
      status: nextStatus,
    };

    if (nextStatus === 'in_review') {
      payload.submitted_by = user?.id ?? null;
    }

    if (nextStatus === 'approved') {
      payload.approved_by = user?.id ?? null;
      payload.approved_at = new Date().toISOString();
    }

    if (nextStatus === 'rejected') {
      payload.approved_by = null;
      payload.approved_at = null;
    }

    const { error } = await supabase.from('agreements').update(payload).eq('id', agreement.id);
    setIsSaving(false);

    if (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Failed to update agreement.' });
      return;
    }

    setStatus(nextStatus);
    setFeedback({ type: 'success', text: `Agreement marked as ${nextStatus}.` });
  }

  async function sendForEsign() {
    // Placeholder: Integrate with an e-sign provider (e.g., PandaDoc, DocuSign) in a future phase.
    setFeedback({ type: 'error', text: 'eSign integration coming soon.' });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input
              type="checkbox"
              checked={workersComp}
              onChange={(event) => setWorkersComp(event.target.checked)}
            />
            Workers comp included?
          </label>
        </div>
        <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
          <header>
            <h3 className="text-base font-semibold text-neutral-800">CSA builder</h3>
            <p className="text-sm text-neutral-500">Describe the scope, milestones, and delivery schedule.</p>
          </header>
          <textarea
            className="h-48 w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm"
            value={csaDraft}
            onChange={(event) => setCsaDraft(event.target.value)}
          />
        </section>
        <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
          <header>
            <h3 className="text-base font-semibold text-neutral-800">Billing agreement</h3>
            <p className="text-sm text-neutral-500">Capture payment milestones, terms, and deposit info.</p>
          </header>
          <textarea
            className="h-40 w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm"
            value={billingDraft}
            onChange={(event) => setBillingDraft(event.target.value)}
          />
        </section>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
            disabled={isSaving || !canSubmitForReview}
            onClick={() => handleSave('in_review')}
          >
            Submit for review
          </button>
          {viewerRole === 'admin' && (
            <>
              <button
                type="button"
                className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 disabled:opacity-60"
                disabled={isSaving}
                onClick={() => handleSave('approved')}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-full border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-500 disabled:opacity-60"
                disabled={isSaving}
                onClick={() => handleSave('rejected')}
              >
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500"
            onClick={sendForEsign}
          >
            Send for eSign
          </button>
        </div>
        {feedback && (
          <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>{feedback.text}</p>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
        <header>
          <p className="text-xs uppercase text-neutral-400">Printable preview</p>
          <h3 className="text-2xl font-semibold text-neutral-900">PEO Agreement</h3>
          <p className="text-sm text-neutral-500">{organization.name}</p>
        </header>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">Services</h4>
          <ul className="mt-2 space-y-2">
            {selectedServices.length === 0 && (
              <li className="text-sm text-neutral-500">No services selected.</li>
            )}
            {selectedServices.map((service) => (
              <li key={service.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="font-semibold text-neutral-800">{service.name}</div>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">
                  {JSON.stringify(service.config ?? {}, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">CSA</h4>
          <pre className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
            {parsedCsa.ok ? JSON.stringify(parsedCsa.value, null, 2) : 'Invalid JSON'}
          </pre>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">Billing</h4>
          <pre className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
            {parsedBilling.ok ? JSON.stringify(parsedBilling.value, null, 2) : 'Invalid JSON'}
          </pre>
        </section>
        <section className="text-sm text-neutral-600">
          <p>Workers comp: {workersComp ? 'Included' : 'Excluded'}</p>
          <p>Status: {status}</p>
        </section>
      </div>
    </div>
  );
}

function safeParse(value: string) {
  try {
    return { ok: true as const, value: JSON.parse(value) };
  } catch {
    return { ok: false as const, value: null };
  }
}
