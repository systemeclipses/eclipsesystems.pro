'use client';

import { useMemo, useState } from 'react';
import { US_STATES } from '@/lib/gf1/rates';
import type { SutaRateRow } from '@/lib/gf1/suta-rates-db';
import { saveSutaRatesAction } from '../actions';

const STATE_LABEL = new Map(US_STATES.map((s) => [s.value, s.label]));

type Draft = Record<string, string>;

export function SutaRatesEditor({ rows }: { rows: SutaRateRow[] }) {
  const initialDraft = useMemo<Draft>(() => {
    const map: Draft = {};
    for (const row of rows) {
      map[row.state] = row.rate.toString();
    }
    return map;
  }, [rows]);

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState('');

  const dirtyStates = useMemo(() => {
    const dirty = new Set<string>();
    for (const row of rows) {
      const next = (draft[row.state] ?? '').trim();
      const orig = row.rate.toString();
      if (next !== orig) dirty.add(row.state);
    }
    return dirty;
  }, [draft, rows]);

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updates = Array.from(dirtyStates)
        .map((state) => ({ state, raw: (draft[state] ?? '').trim() }))
        .filter(({ raw }) => raw.length > 0)
        .map(({ state, raw }) => ({ state, rate: Number(raw) }))
        .filter(({ rate }) => Number.isFinite(rate) && rate >= 0 && rate < 100);

      if (updates.length === 0) {
        setNotice({ type: 'error', text: 'No valid changes to save.' });
        return;
      }

      await saveSutaRatesAction(updates);
      setNotice({ type: 'success', text: `Saved ${updates.length} rate${updates.length === 1 ? '' : 's'}.` });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed. Check your connection.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.trim().toLowerCase();
    return rows.filter((r) => {
      const label = STATE_LABEL.get(r.state) ?? r.state;
      return r.state.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    });
  }, [rows, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by state name or code…"
          style={{
            flex: 1,
            minWidth: '240px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '13px',
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || dirtyStates.size === 0}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: 'none',
            background: dirtyStates.size === 0 ? '#334155' : '#10b981',
            color: '#fff',
            fontWeight: 600,
            cursor: saving || dirtyStates.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          {saving ? 'Saving…' : `Save ${dirtyStates.size > 0 ? `(${dirtyStates.size})` : ''}`}
        </button>
      </div>

      {notice ? (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: notice.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: notice.type === 'success' ? '#6ee7b7' : '#fca5a5',
            border: `1px solid ${notice.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            fontSize: '13px',
          }}
        >
          {notice.text}
        </div>
      ) : null}

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 140px 160px',
            gap: '12px',
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.04)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#94a3b8',
          }}
        >
          <div>Code</div>
          <div>State</div>
          <div>Rate (%)</div>
          <div>Last Updated</div>
        </div>
        {filteredRows.map((row) => {
          const isDirty = dirtyStates.has(row.state);
          const lastUpdated = row.updatedAt
            ? new Date(row.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '—';
          return (
            <div
              key={row.state}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 140px 160px',
                gap: '12px',
                padding: '8px 16px',
                alignItems: 'center',
                borderTop: '1px solid #1e293b',
                background: isDirty ? 'rgba(245,158,11,0.08)' : 'transparent',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>{row.state}</div>
              <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
                {STATE_LABEL.get(row.state) ?? row.state}
              </div>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="99"
                value={draft[row.state] ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [row.state]: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isDirty ? 'rgba(245,158,11,0.5)' : '#334155'}`,
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ color: '#64748b', fontSize: '11px' }}>{lastUpdated}</div>
            </div>
          );
        })}
      </div>

      <p style={{ color: '#64748b', fontSize: '11px', lineHeight: 1.5 }}>
        Rates are stored as percentage values (e.g. 1.70 means 1.70%). The unlisted-state default
        of 1.70 still applies elsewhere in the app for any state without a row here.
      </p>
    </div>
  );
}
