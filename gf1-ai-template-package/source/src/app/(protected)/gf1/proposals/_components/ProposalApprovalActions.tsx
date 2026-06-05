"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  approveProposalAction,
  rejectProposalAction,
} from '../[id]/actions';

type Props = {
  proposalId: string;
  canApprove: boolean;
  status: string | null | undefined;
};

const buttonStyle = {
  padding: '6px 12px',
  fontSize: '12px',
  lineHeight: 1,
  borderRadius: '8px',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
} as const;

export function ProposalApprovalActions({ proposalId, canApprove, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modal, setModal] = useState<null | { decision: 'approved' | 'rejected'; comment: string }>(null);

  const allowDecision = canApprove && (status === 'pending_approval' || status === 'draft');

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) setModal(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, pending]);

  if (!allowDecision) return null;

  function open(decision: 'approved' | 'rejected') {
    setMessage(null);
    setModal({ decision, comment: '' });
  }

  function confirm() {
    if (!modal) return;
    const { decision, comment } = modal;
    startTransition(async () => {
      try {
        if (decision === 'approved') {
          await approveProposalAction(proposalId, comment.trim() || null);
        } else {
          await rejectProposalAction(proposalId, comment.trim() || null);
        }
        setModal(null);
        setMessage({
          type: 'success',
          text: decision === 'approved' ? 'Proposal approved.' : 'Proposal denied.',
        });
        router.refresh();
      } catch (err) {
        const text =
          err instanceof Error ? err.message : 'Unable to record your decision. Please try again.';
        setMessage({ type: 'error', text });
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => open('approved')}
          disabled={pending}
          style={{
            ...buttonStyle,
            background: '#005c99',
            color: '#ffffff',
            opacity: pending ? 0.6 : 1,
          }}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => open('rejected')}
          disabled={pending}
          style={{
            ...buttonStyle,
            background: '#f9c512',
            color: '#3a2a00',
            opacity: pending ? 0.6 : 1,
          }}
        >
          Deny
        </button>
      </div>
      {message ? (
        <div
          style={{
            fontSize: '11px',
            color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {message.text}
        </div>
      ) : null}

      {modal ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setModal(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1f2a3d',
              borderRadius: '14px',
              padding: '24px',
              width: 'min(100%, 460px)',
              boxShadow: '0 30px 60px rgba(2,6,23,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: modal.decision === 'approved' ? '#86efac' : '#fca5a5',
                  fontWeight: 700,
                }}
              >
                {modal.decision === 'approved' ? 'Approve proposal' : 'Deny proposal'}
              </div>
              <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '13px' }}>
                Optional note to the sales rep — they'll see this in the proposal history.
              </p>
            </div>

            <textarea
              autoFocus
              value={modal.comment}
              onChange={(e) => setModal((m) => (m ? { ...m, comment: e.target.value } : m))}
              placeholder={
                modal.decision === 'approved'
                  ? 'Anything to flag before this goes out?'
                  : 'Why is this being denied?'
              }
              rows={4}
              style={{
                width: '100%',
                background: '#0b1322',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                lineHeight: 1.4,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={pending}
                style={{
                  ...buttonStyle,
                  padding: '5px 12px',
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                style={{
                  ...buttonStyle,
                  padding: '5px 12px',
                  background: modal.decision === 'approved' ? '#22c55e' : '#ef4444',
                  color: modal.decision === 'approved' ? '#0b1320' : '#fff',
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending
                  ? 'Saving…'
                  : modal.decision === 'approved'
                    ? 'Confirm approve'
                    : 'Confirm deny'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
