"use client";

import { useState, useTransition } from 'react';
import { decideProposalAction } from '../[id]/actions';

type Props = {
  proposalId: string;
};

export default function ApprovalActions({ proposalId }: Props) {
  const [comment, setComment] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      try {
        await decideProposalAction(proposalId, 'approved', null);
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : 'Could not approve';
        setError(text);
      }
    });
  }

  function reject() {
    if (!comment.trim()) {
      setError('Please add a rejection comment.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await decideProposalAction(proposalId, 'rejected', comment.trim());
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : 'Could not reject';
        setError(text);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={pending}
          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note for rejection or context"
        className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        rows={2}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
