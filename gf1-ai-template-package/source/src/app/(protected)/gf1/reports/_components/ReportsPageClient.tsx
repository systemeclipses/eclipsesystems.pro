'use client';

import { useState, useEffect, useMemo } from 'react';
import type { TimeGranularity, DateRange } from '@/lib/gf1/reports-utils';
import { getPresetRange, filterByDateRange, formatDateRange } from '@/lib/gf1/reports-utils';
import type { CommissionRecord, ProspectRecord, LeadRecord } from '@/lib/gf1/reports-types';
import type { ProfileRole } from '@/lib/gf1/types';
import { TimeRangeFilter } from './TimeRangeFilter';
import { CommissionReportCard } from './CommissionReportCard';
import { ProposedClientsReportCard } from './ProposedClientsReportCard';
import { WorksiteEmployeesAddedCard } from './WorksiteEmployeesAddedCard';
import { LeadsCountReportCard } from './LeadsCountReportCard';

type ReportsPageClientProps = {
  commissions: CommissionRecord[];
  prospects: ProspectRecord[];
  leads: LeadRecord[];
  role: ProfileRole | null;
  currentUserName?: string | null;
  // Full rep roster from the profiles table (admin/sales-manager only). When
  // provided, the dropdown lists every rep — not just those who appear in the
  // currently loaded records — so admins can filter to reps with zero records.
  repOptions?: string[];
};

export function ReportsPageClient({ commissions, prospects, leads, role, currentUserName, repOptions: rosterRepOptions }: ReportsPageClientProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('quarterly');
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange('quarterly'));
  const [selectedRep, setSelectedRep] = useState('all');
  const [hasInitializedRep, setHasInitializedRep] = useState(false);

  const [allCommissions] = useState<CommissionRecord[]>(commissions);
  const [allProspects] = useState<ProspectRecord[]>(prospects);
  const [allLeads] = useState<LeadRecord[]>(leads);

  // Filtered data based on selected date range
  const [filteredCommissions, setFilteredCommissions] = useState<CommissionRecord[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<ProspectRecord[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadRecord[]>([]);

  const repDirectory = useMemo(() => {
    const map = new Map<string, { label: string; ids: Set<string>; names: Set<string> }>();
    let hasUnassigned = false;
    const normalizeName = (value: string) => value.trim().toLowerCase();

    // Seed from the server-provided roster so every rep is selectable even
    // when no records reference them in the current view.
    (rosterRepOptions ?? []).forEach((rawName) => {
      const trimmed = rawName.trim();
      if (!trimmed) return;
      const key = `rep:${normalizeName(trimmed)}`;
      if (!map.has(key)) {
        map.set(key, { label: trimmed, ids: new Set<string>(), names: new Set<string>([trimmed]) });
      }
    });

    const recordSources = [...allCommissions, ...allProspects, ...allLeads];
    recordSources.forEach((record) => {
      const id = record.salesRepId ?? null;
      const rawName = record.salesRepName?.trim() ?? null;
      if (!id && !rawName) {
        hasUnassigned = true;
        return;
      }
      if (rawName) {
        const key = `rep:${normalizeName(rawName)}`;
        const entry = map.get(key) ?? { label: rawName, ids: new Set<string>(), names: new Set<string>() };
        entry.names.add(rawName);
        if (id) entry.ids.add(id);
        map.set(key, entry);
        return;
      }
      if (id) {
        const key = `id:${id}`;
        const entry = map.get(key) ?? { label: 'Unknown rep', ids: new Set<string>(), names: new Set<string>() };
        entry.ids.add(id);
        map.set(key, entry);
      }
    });

    return { map, hasUnassigned };
  }, [allCommissions, allProspects, allLeads, rosterRepOptions]);

  const repOptions = useMemo(() => {
    const entries = Array.from(repDirectory.map.entries())
      .sort((a, b) => a[1].label.localeCompare(b[1].label, 'en-US'))
      .map(([value, entry]) => ({ value, label: entry.label }));
    if (repDirectory.hasUnassigned) {
      entries.push({ value: 'unassigned', label: 'Unassigned' });
    }
    return entries;
  }, [repDirectory]);

  useEffect(() => {
    if (hasInitializedRep) return;
    // Only the sales role auto-filters to themselves. Admins / sales managers
    // would otherwise see zero data, because they are not assigned as the
    // sales rep on any organization — so their default must remain "All reps".
    if (role !== 'sales' || !currentUserName) {
      setHasInitializedRep(true);
      return;
    }
    const normalizedUser = currentUserName.trim().toLowerCase();
    const match = repOptions.find((option) => option.label.trim().toLowerCase() === normalizedUser);
    if (match) {
      setSelectedRep(match.value);
    }
    setHasInitializedRep(true);
  }, [currentUserName, repOptions, hasInitializedRep, role]);

  const applyRepFilter = <T extends { salesRepId?: string | null; salesRepName?: string | null }>(records: T[]) => {
    if (selectedRep === 'all') return records;
    if (selectedRep === 'unassigned') {
      return records.filter((record) => !record.salesRepId && !record.salesRepName);
    }
    if (selectedRep.startsWith('rep:')) {
      const entry = repDirectory.map.get(selectedRep);
      const normalizedName = selectedRep.replace('rep:', '');
      const ids = entry?.ids ?? new Set<string>();
      return records.filter((record) => {
        if (record.salesRepId && ids.has(record.salesRepId)) return true;
        if (record.salesRepName) {
          return record.salesRepName.trim().toLowerCase() === normalizedName;
        }
        return false;
      });
    }
    if (selectedRep.startsWith('id:')) {
      const id = selectedRep.replace('id:', '');
      return records.filter((record) => record.salesRepId === id);
    }
    return records;
  };

  // Update filtered data when date range changes
  useEffect(() => {
    const nextCommissions = applyRepFilter(filterByDateRange(allCommissions, dateRange, 'closeDate'));
    const nextProspects = applyRepFilter(filterByDateRange(allProspects, dateRange, 'createdAt'));
    const nextLeads = applyRepFilter(filterByDateRange(allLeads, dateRange, 'createdAt'));
    setFilteredCommissions(nextCommissions);
    setFilteredProspects(nextProspects);
    setFilteredLeads(nextLeads);
  }, [dateRange, allCommissions, allProspects, allLeads, selectedRep]);

  const handleRangeChange = (newGranularity: TimeGranularity, newRange: DateRange) => {
    setGranularity(newGranularity);
    setDateRange(newRange);
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', marginLeft: '-13px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 600, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fa-solid fa-chart-pie" style={{ fontSize: '38px', color: '#1C93ED', marginTop: '-13px' }}></i>
          Reports Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#a8b5c7', marginTop: '8px' }}>
          View performance metrics and sales analytics. Currently showing: {formatDateRange(dateRange)}
        </p>
      </div>

      {/* Time Range Filter (with sales-rep dropdown docked to the right).
          Sales role is locked to their own data (server already filters server-
          side), so they see a static label instead of a dropdown. Admin / sales
          manager get the full dropdown including "All reps". */}
      <TimeRangeFilter
        onRangeChange={handleRangeChange}
        rightSlot={
          <>
            <label style={{ fontSize: '12px', color: '#a8b5c7', fontWeight: 600, textTransform: 'uppercase' }}>
              Sales Rep
            </label>
            {role === 'sales' ? (
              <div
                style={{
                  background: '#0b1220',
                  border: '1px solid #3d4b5e',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minWidth: '180px',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={currentUserName ?? undefined}
              >
                {currentUserName ?? 'You'}
              </div>
            ) : (
              <select
                value={selectedRep}
                onChange={(event) => setSelectedRep(event.target.value)}
                style={{
                  background: '#0b1220',
                  border: '1px solid #3d4b5e',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minWidth: '180px',
                  maxWidth: '180px',
                }}
              >
                <option value="all">All reps</option>
                {repOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </>
        }
      />

      {/* Report Cards Grid - 2 columns on desktop, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '24px',
      }}>
        <CommissionReportCard
          commissions={filteredCommissions}
          showWcMetrics={role === 'admin' || role === 'sales' || role === 'sales_manager'}
        />
        <ProposedClientsReportCard prospects={filteredProspects} />
        <WorksiteEmployeesAddedCard commissions={filteredCommissions} />
        <LeadsCountReportCard leads={filteredLeads} />
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: '#313D4E',
        border: '1px solid #3d4b5e',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#738297',
      }}>
        <i className="fa-solid fa-circle-info" style={{ marginRight: '8px', color: '#1C93ED' }}></i>
        <strong>Note:</strong> Totals reflect current organization data and the commission rules defined in the database.
      </div>
    </div>
  );
}
