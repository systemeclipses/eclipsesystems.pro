'use client';

import { useState, useTransition } from 'react';
import styles from './DealLostModal.module.css';
import { dealLostAction } from '../[id]/dealLostAction';

const REASONS = [
  'Price / Cost too high',
  'Chose a competitor',
  'Poor timing - not ready',
  'Not the right fit',
  'Went in-house / stayed self-managed',
  'Unresponsive / went dark',
  'Contract fell through',
  'Other',
];

const RETURN_PROBS = [
  'Very unlikely (<10%)',
  'Unlikely (10-25%)',
  'Possible (25-50%)',
  'Likely (50-75%)',
  'Very likely (>75%)',
];

type Props = {
  organizationId: string;
  organizationName: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function DealLostModal({ organizationId, organizationName, currentStatus, onClose, onSuccess }: Props) {
  const [primaryReason, setPrimaryReason] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [returnProbability, setReturnProbability] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!primaryReason) { setError('Please select a primary reason.'); return; }
    if (!returnProbability) { setError('Please select a return probability.'); return; }
    setError(null);
    startTransition(async () => {
      try {
        await dealLostAction(organizationId, {
          previousStatus: currentStatus,
          primaryReason,
          competitorName: competitorName.trim() || null,
          returnProbability,
          whatCouldImprove: whatCouldImprove.trim() || null,
          additionalNotes: additionalNotes.trim() || null,
        });
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIcon}>
              <i className="fas fa-flag" />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Deal Lost</h2>
              <p className={styles.modalSubtitle}>{organizationName}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button" disabled={isPending}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalDescription}>
            This will revert the organization to <strong>Suspect</strong> status and generate a branded deal loss report saved to the overview page.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Primary reason for loss <span className={styles.required}>*</span></label>
            <select
              className={styles.select}
              value={primaryReason}
              onChange={(e) => setPrimaryReason(e.target.value)}
              disabled={isPending}
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {primaryReason === 'Chose a competitor' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Competitor name (optional)</label>
              <input
                className={styles.input}
                type="text"
                value={competitorName}
                onChange={(e) => setCompetitorName(e.target.value)}
                placeholder="e.g. ADP TotalSource, TriNet, Insperity..."
                disabled={isPending}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Probability they come back <span className={styles.required}>*</span></label>
            <select
              className={styles.select}
              value={returnProbability}
              onChange={(e) => setReturnProbability(e.target.value)}
              disabled={isPending}
            >
              <option value="">Select probability...</option>
              {RETURN_PROBS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>What could Galactic have done differently?</label>
            <textarea
              className={styles.textarea}
              value={whatCouldImprove}
              onChange={(e) => setWhatCouldImprove(e.target.value)}
              rows={3}
              placeholder="Pricing, timing, communication, service scope..."
              disabled={isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Additional notes</label>
            <textarea
              className={styles.textarea}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              placeholder="Any other context about this loss..."
              disabled={isPending}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose} type="button" disabled={isPending}>
            Cancel
          </button>
          <button className={styles.submitButton} onClick={handleSubmit} type="button" disabled={isPending}>
            {isPending ? (
              <><i className="fas fa-spinner fa-spin" /><span>Processing...</span></>
            ) : (
              <><i className="fas fa-flag" /><span>Mark as Deal Lost</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
