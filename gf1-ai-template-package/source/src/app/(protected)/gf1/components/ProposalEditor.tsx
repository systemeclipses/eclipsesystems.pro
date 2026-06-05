"use client";

import { useMemo, useState } from 'react';
import { supaClient } from '@/lib/supabase/client';
import type {
  Gf1Organization,
  Gf1PeoService,
  Gf1Proposal,
  Gf1ProspectService,
  ProfileRole,
} from '@/lib/gf1/types';

type ProposalEditorProps = {
  proposal: Gf1Proposal;
  organization: Gf1Organization;
  catalog: Gf1PeoService[];
  selections: Gf1ProspectService[];
  viewerRole: ProfileRole | null;
};

const DEFAULT_SNAPSHOT = { services: [] as Array<Record<string, unknown>> };
const DEFAULT_PRICING = { tiers: [{ name: 'Base', amount: 0 }] };

export default function ProposalEditor({
  proposal,
  organization,
  catalog,
  selections,
  viewerRole,
}: ProposalEditorProps) {
  const [snapshotDraft, setSnapshotDraft] = useState(
    JSON.stringify(proposal.services_snapshot ?? DEFAULT_SNAPSHOT, null, 2)
  );
  const [pricingDraft, setPricingDraft] = useState(JSON.stringify(proposal.pricing_json ?? DEFAULT_PRICING, null, 2));
  const [status, setStatus] = useState(proposal.status);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = supaClient();
  const parsedSnapshot = useMemo(() => safeParse(snapshotDraft), [snapshotDraft]);
  const parsedPricing = useMemo(() => safeParse(pricingDraft), [pricingDraft]);

  const selectableServices = useMemo(() => {
    return selections
      .filter((row) => row.selected)
      .map((row) => {
        const meta = catalog.find((service) => service.id === row.service_id);
        return {
          id: row.service_id,
          name: meta?.name ?? row.service_id,
          config: row.config_json,
        };
      });
  }, [catalog, selections]);

  const canSubmit = viewerRole !== 'admin' ? status === 'draft' : true;

  function syncFromSelections() {
    if (selectableServices.length === 0) {
      setFeedback({ type: 'error', text: 'No services selected to sync.' });
      return;
    }
    const snapshot = {
      services: selectableServices.map((service) => ({
        id: service.id,
        name: service.name,
        config: service.config ?? {},
      })),
    };
    setSnapshotDraft(JSON.stringify(snapshot, null, 2));
    setFeedback({ type: 'success', text: 'Snapshot synced from current selections.' });
  }

  async function handleSave(nextStatus: Gf1Proposal['status']) {
    if (!parsedSnapshot.ok || !parsedPricing.ok) {
      setFeedback({ type: 'error', text: 'Snapshot or pricing JSON is invalid.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload: Partial<Gf1Proposal> = {
      services_snapshot: parsedSnapshot.value,
      pricing_json: parsedPricing.value,
      status: nextStatus,
    };

    if (nextStatus === 'sent_to_client') {
      payload.sent_to_client_at = new Date().toISOString();
    }
    if (nextStatus === 'accepted') {
      payload.accepted_at = new Date().toISOString();
    }
    if (nextStatus === 'rejected') {
      payload.rejected_at = new Date().toISOString();
    }

    const { error } = await supabase.from('proposals').update(payload).eq('id', proposal.id);
    setIsSaving(false);

    if (error) {
      console.error(error);
      setFeedback({ type: 'error', text: 'Failed to update proposal.' });
      return;
    }

    setStatus(nextStatus);
    setFeedback({ type: 'success', text: `Proposal marked as ${nextStatus}.` });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-800">Services snapshot</h3>
              <p className="text-sm text-neutral-500">Captures the scope when the proposal is generated.</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700"
              onClick={syncFromSelections}
            >
              Sync from pipeline
            </button>
          </header>
          <textarea
            className="h-48 w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm"
            value={snapshotDraft}
            onChange={(event) => setSnapshotDraft(event.target.value)}
          />
        </section>
        <section className="space-y-2 rounded-xl border border-neutral-200 p-4">
          <header>
            <h3 className="text-base font-semibold text-neutral-800">Pricing JSON</h3>
            <p className="text-sm text-neutral-500">Document tiers, per-employee pricing, or add-ons.</p>
          </header>
          <textarea
            className="h-40 w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-sm"
            value={pricingDraft}
            onChange={(event) => setPricingDraft(event.target.value)}
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
            disabled={isSaving || !canSubmit}
            onClick={() => handleSave('submitted')}
          >
            Submit
          </button>
          {viewerRole === 'admin' && (
            <>
              <button
                type="button"
                className="rounded-full border border-blue-400 px-4 py-2 text-sm font-semibold text-blue-500 disabled:opacity-60"
                disabled={isSaving}
                onClick={() => handleSave('sent_to_client')}
              >
                Send to client
              </button>
              <button
                type="button"
                className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 disabled:opacity-60"
                disabled={isSaving}
                onClick={() => handleSave('accepted')}
              >
                Mark accepted
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
        </div>
        {feedback && (
          <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>{feedback.text}</p>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
        <header>
          <p className="text-xs uppercase text-neutral-400">Proposal preview</p>
          <h3 className="text-2xl font-semibold text-neutral-900">{organization.name}</h3>
          <p className="text-sm text-neutral-500">Status: {status}</p>
        </header>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">Snapshot</h4>
          <pre className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
            {parsedSnapshot.ok ? JSON.stringify(parsedSnapshot.value, null, 2) : 'Invalid JSON'}
          </pre>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">Pricing</h4>
          <pre className="mt-2 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
            {parsedPricing.ok ? JSON.stringify(parsedPricing.value, null, 2) : 'Invalid JSON'}
          </pre>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase text-neutral-500">Live selections</h4>
          <ul className="mt-2 space-y-2">
            {selectableServices.length === 0 && <li className="text-sm text-neutral-500">No services selected.</li>}
            {selectableServices.map((service) => (
              <li key={service.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="font-semibold text-neutral-800">{service.name}</div>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">
                  {JSON.stringify(service.config ?? {}, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
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
