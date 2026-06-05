"use client";

import { useState, type FormEvent } from 'react';
import { supaClient } from '@/lib/supabase/client';

type ProspectOption = {
  id: string;
  label: string;
  organizationId: string;
};

type WinLossFormProps = {
  viewerRole: 'staff' | 'admin' | null;
  prospects: ProspectOption[];
};

export default function WinLossForm({ viewerRole, prospects }: WinLossFormProps) {
  const [result, setResult] = useState<'won' | 'lost'>('won');
  const [prospectId, setProspectId] = useState(prospects[0]?.id ?? '');
  const [primaryReason, setPrimaryReason] = useState('');
  const [detailReason, setDetailReason] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [dealSize, setDealSize] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('pending');
    const supabase = supaClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const selectedProspect = prospects.find((option) => option.id === prospectId);
    const numericDeal = dealSize ? Number(dealSize) : null;
    const { error } = await supabase.from('win_loss_reports').insert({
      prospect_id: prospectId || null,
      organization_id: selectedProspect?.organizationId ?? null,
      result,
      primary_reason: primaryReason,
      detail_reason: detailReason,
      competitor: competitor || null,
      deal_size: numericDeal,
      created_by: user?.id ?? null,
    });

    if (error) {
      console.error(error);
      setStatus('error');
      return;
    }

    setPrimaryReason('');
    setDetailReason('');
    setCompetitor('');
    setDealSize('');
    setStatus('success');
  }

  if (viewerRole !== 'staff' && viewerRole !== 'admin') {
    return (
      <div className="rounded-xl p-4 text-sm text-neutral-500">
        You do not have access to submit win/loss data.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl p-6 shadow-sm">
      <header>
        <p className="text-xs uppercase text-neutral-400">Win / Loss</p>
        <h2 className="text-2xl font-semibold">Report an outcome</h2>
        <p className="text-sm text-neutral-500">
          Capture why we won or lost. Insights feed weekly revenue reviews.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-700">
          Prospect
          <select
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            value={prospectId}
            onChange={(event) => setProspectId(event.target.value)}
          >
            <option value="">Unlinked</option>
            {prospects.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-neutral-700">
          Result
          <select
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            value={result}
            onChange={(event) => setResult(event.target.value as 'won' | 'lost')}
          >
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </label>
      </div>

      <label className="text-sm font-semibold text-neutral-700">
        Primary reason
        <input
          type="text"
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          value={primaryReason}
          onChange={(event) => setPrimaryReason(event.target.value)}
          required
        />
      </label>

      <label className="text-sm font-semibold text-neutral-700">
        Detail
        <textarea
          className="mt-1 h-24 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          value={detailReason}
          onChange={(event) => setDetailReason(event.target.value)}
          placeholder="Add context we can action."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-neutral-700">
          Competitor
          <input
            type="text"
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            value={competitor}
            onChange={(event) => setCompetitor(event.target.value)}
          />
        </label>
        <label className="text-sm font-semibold text-neutral-700">
          Deal size (USD)
          <input
            type="number"
            min="0"
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            value={dealSize}
            onChange={(event) => setDealSize(event.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        disabled={status === 'pending'}
      >
        {status === 'pending' ? 'Submitting...' : 'Submit entry'}
      </button>

      {status === 'success' && <p className="text-sm text-emerald-600">Logged!</p>}
      {status === 'error' && <p className="text-sm text-rose-500">Submission failed.</p>}
    </form>
  );
}
