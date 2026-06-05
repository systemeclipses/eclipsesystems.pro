'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Gf1RenewalItem } from '@/lib/gf1/types';
import styles from './RenewalsTable.module.css';

function formatDueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function RenewalsTable() {
  const [rows, setRows] = useState<Gf1RenewalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(getCurrentMonthValue);
  const [companyName, setCompanyName] = useState('');
  const [renewalDueDate, setRenewalDueDate] = useState('');
  const [salespersonName, setSalespersonName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/gf1/renewals', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load renewals right now.');
      }
      setRows(Array.isArray(payload?.renewals) ? payload.renewals : []);
    } catch (err) {
      console.error('Failed to load renewals', err);
      setError(err instanceof Error ? err.message : 'Failed to load renewals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleToggleCompleted = useCallback(async (row: Gf1RenewalItem) => {
    try {
      setSavingId(row.id);
      setError(null);
      const response = await fetch('/api/gf1/renewals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: row.id,
          is_completed: !row.is_completed,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to update renewal.');
      }
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                is_completed: !row.is_completed,
                completed_at: !row.is_completed ? new Date().toISOString() : null,
              }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to update renewal', err);
      setError(err instanceof Error ? err.message : 'Failed to update renewal.');
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleCreate = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyName.trim() || !renewalDueDate || !salespersonName.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const response = await fetch('/api/gf1/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          renewal_due_date: renewalDueDate,
          salesperson_name: salespersonName.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to create renewal.');
      }
      setCompanyName('');
      setRenewalDueDate('');
      setSalespersonName('');
      setShowCreateModal(false);
      await fetchRows();
    } catch (err) {
      console.error('Failed to create renewal', err);
      setError(err instanceof Error ? err.message : 'Failed to create renewal.');
    } finally {
      setCreating(false);
    }
  }, [companyName, fetchRows, renewalDueDate, salespersonName]);

  const salespersonOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.salesperson_name || 'Unknown')))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aTime = new Date(a.renewal_due_date).getTime();
        const bTime = new Date(b.renewal_due_date).getTime();
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
          return a.company_name.localeCompare(b.company_name);
        }
        return aTime - bTime;
      }),
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      sortedRows.filter((row) => {
        const salesperson = row.salesperson_name || 'Unknown';
        const salespersonMatch = salespersonFilter === 'all' || salesperson === salespersonFilter;
        const monthMatch = !monthFilter || row.renewal_due_date.startsWith(monthFilter);
        return salespersonMatch && monthMatch;
      }),
    [monthFilter, salespersonFilter, sortedRows]
  );

  return (
    <div className={styles.projects}>
      <div className={styles['projects-inner']}>
        <header className={styles['projects-header']}>
          <div>
            <div className={styles.title}>Renewals</div>
            <div className={styles.count}>| {filteredRows.length} Renewals</div>
          </div>
          <div className={styles.headerControls}>
            <select
              className={styles.filterSelect}
              value={salespersonFilter}
              onChange={(event) => setSalespersonFilter(event.target.value)}
            >
              <option value="all">All salespeople</option>
              {salespersonOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              className={styles.filterInput}
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              aria-label="Filter by due month"
            />
            <button
              className={styles.headerAddButton}
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus-circle" style={{ fontSize: '13px' }}></i>
              Add Renewal
            </button>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <table className={styles['projects-table']}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Renewal Due Date</th>
              <th>Salesperson</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  Loading renewals...
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  No renewals added yet.
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  No renewals match the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.company_name}</td>
                  <td>{formatDueDate(row.renewal_due_date)}</td>
                  <td>{row.salesperson_name || 'Unknown'}</td>
                  <td>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(row.is_completed)}
                        disabled={savingId === row.id}
                        onChange={() => {
                          void handleToggleCompleted(row);
                        }}
                      />
                      <span>{row.is_completed ? 'Yes' : 'No'}</span>
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div
            className={styles.modal}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <h3 className={styles.modalTitle}>Create Renewal</h3>
            <form className={styles.modalForm} onSubmit={handleCreate}>
              <input
                className={styles.filterInput}
                type="text"
                placeholder="Company name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                required
              />
              <input
                className={styles.filterInput}
                type="date"
                value={renewalDueDate}
                onChange={(event) => setRenewalDueDate(event.target.value)}
                required
              />
              <input
                className={styles.filterInput}
                type="text"
                placeholder="Salesperson"
                value={salespersonName}
                onChange={(event) => setSalespersonName(event.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button className={styles.addButton} type="submit" disabled={creating}>
                  {creating ? 'Adding...' : 'Create Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
