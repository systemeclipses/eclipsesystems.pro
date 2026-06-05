"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../organizations/OrganizationsTable.module.css';
import { moveOrgStageAction } from './actions';

type PipelineOrg = {
  id: string;
  legal_name: string | null;
  dba_name: string | null;
  trade_name: string | null;
  status: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  total_employees: number | null;
  annual_commission: number | null;
  annual_revenue: number | null;
  sales_rep_name: string | null;
  logo_url: string | null;
};

type Props = {
  organizations: PipelineOrg[];
  defaultSalesRep: string | null;
  repOptions?: string[];
  salesRepByOrgId?: Record<string, string>;
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Suspects',
  prospect: 'Prospects',
  client: 'Clients',
};

const STAGE_COLORS: Record<string, string> = {
  lead: '#f59e0b',
  prospect: '#1C93ED',
  client: '#22c55e',
};

const stageOrder: Array<keyof typeof STAGE_LABELS> = ['lead', 'prospect', 'client'];

const STAGE_WEIGHTS: Record<string, number> = {
  lead: 0.1,
  prospect: 0.5,
  client: 1,
};

const FUNNEL_POLYGONS = [
  '0,0 1000,0 900,200 100,200',
  '100,200 900,200 780,400 220,400',
  '220,400 780,400 660,600 340,600',
];

const FUNNEL_CENTERS = [
  { x: 500, y: 100 },
  { x: 500, y: 300 },
  { x: 500, y: 500 },
];

function formatCurrency(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCompactCurrency(amount: number) {
  if (!amount) return '$0';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

function getStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'lead':
      return 'status-amber';
    case 'prospect':
      return 'status-blue';
    case 'client':
      return 'status-green';
    default:
      return 'status-orange';
  }
}

export function PipelineBoard({ organizations, defaultSalesRep, repOptions, salesRepByOrgId }: Props) {
  const router = useRouter();

  const computedRepOptions = useMemo(() => {
    const reps = new Set<string>();
    if (repOptions?.length) {
      repOptions.forEach((rep) => {
        const trimmed = rep.trim();
        if (trimmed) reps.add(trimmed);
      });
    } else {
      organizations.forEach((org) => {
        const label = salesRepByOrgId?.[org.id] ?? org.sales_rep_name ?? '';
        const trimmed = label.trim();
        if (trimmed) reps.add(trimmed);
      });
    }
    return Array.from(reps).sort();
  }, [organizations, repOptions, salesRepByOrgId]);

  const initialRep = defaultSalesRep ?? 'all';

  const [selectedRep, setSelectedRep] = useState<string>(initialRep);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Local status overrides for optimistic updates
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  // Drag state
  const [draggedOrg, setDraggedOrg] = useState<PipelineOrg | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Confirmation modal
  const [pendingMove, setPendingMove] = useState<{ org: PipelineOrg; toStage: string } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const orgsWithLocalStatus = useMemo(
    () => organizations.map((org) => ({ ...org, status: localStatuses[org.id] ?? org.status })),
    [organizations, localStatuses],
  );

  const filteredOrgs = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return orgsWithLocalStatus.filter((org) => {
      const label = salesRepByOrgId?.[org.id] ?? org.sales_rep_name ?? '';
      const matchesRep = selectedRep === 'all' || label.trim() === selectedRep;
      const matchesSearch =
        !searchTerm ||
        [org.legal_name, org.dba_name, org.trade_name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(searchTerm));
      return matchesRep && matchesSearch;
    });
  }, [orgsWithLocalStatus, search, selectedRep, salesRepByOrgId]);

  const grouped = useMemo(
    () =>
      stageOrder.map((stage) => {
        const rows = filteredOrgs.filter((org) => org.status === stage);
        const revenue = rows.reduce((sum, org) => sum + (org.annual_revenue ?? 0), 0);
        return {
          stage,
          title: STAGE_LABELS[stage],
          rows,
          revenue,
        };
      }),
    [filteredOrgs],
  );

  const totalCount = filteredOrgs.length;

  const weightedPipeline = useMemo(
    () => grouped.reduce((sum, column) => sum + column.revenue * (STAGE_WEIGHTS[column.stage] ?? 0), 0),
    [grouped],
  );

  const totalPipeline = useMemo(
    () => grouped.reduce((sum, column) => sum + column.revenue, 0),
    [grouped],
  );

  // Drag handlers
  function handleDragStart(org: PipelineOrg) {
    setDraggedOrg(org);
  }

  function handleDragEnd() {
    setDraggedOrg(null);
    setDragOverStage(null);
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedOrg && stage !== (localStatuses[draggedOrg.id] ?? draggedOrg.status)) {
      setDragOverStage(stage);
    }
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(e: React.DragEvent, toStage: string) {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedOrg) return;
    const currentStage = localStatuses[draggedOrg.id] ?? draggedOrg.status;
    if (toStage === currentStage) return;
    setPendingMove({ org: draggedOrg, toStage });
    setMoveError(null);
    setDraggedOrg(null);
  }

  async function confirmMove() {
    if (!pendingMove) return;
    setIsMoving(true);
    setMoveError(null);
    const { org, toStage } = pendingMove;
    // Optimistic update
    setLocalStatuses((prev) => ({ ...prev, [org.id]: toStage }));
    const result = await moveOrgStageAction(org.id, toStage);
    setIsMoving(false);
    if (result.error) {
      // Revert on error
      setLocalStatuses((prev) => {
        const next = { ...prev };
        delete next[org.id];
        return next;
      });
      setMoveError(result.error);
      return;
    }
    setPendingMove(null);
    router.refresh();
  }

  function cancelMove() {
    setPendingMove(null);
    setMoveError(null);
  }

  const orgDisplayName = (org: PipelineOrg) =>
    org.legal_name || org.trade_name || org.dba_name || 'Untitled';

  return (
    <div className={styles.projects}>
      <div className={styles['projects-inner']}>
        <header className={styles['projects-header']}>
          <div>
            <div className={styles.title}>Pipeline</div>
            <div className={styles.count}>| {totalCount} organizations</div>
          </div>

          <div className={styles.filters}>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Sales Reps</option>
              {computedRepOptions.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or DBA"
              className={styles.filterSelect}
              style={{ minWidth: '220px' }}
            />
            <Link
              href="/gf1/leads/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #3d4b5e',
                background: '#313D4E',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '38px',
                minWidth: '170px',
              }}
            >
              <i className="fas fa-plus-circle" style={{ fontSize: '13px' }}></i>
              <span>Add suspect</span>
            </Link>
          </div>
        </header>

        <div style={{ padding: '0 22px 22px 22px' }}>
          {/* Funnel visualization */}
          <div
            style={{
              background: '#273142',
              border: '1px solid #313D4E',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            <svg
              viewBox="0 0 1000 600"
              style={{ width: '560px', maxWidth: '100%', height: 'auto', display: 'block', flexShrink: 0 }}
            >
              {grouped.map((column, index) => {
                const fill = STAGE_COLORS[column.stage] ?? '#738297';
                const isSelected = selectedStage === column.stage;
                const isDimmed = selectedStage !== null && !isSelected;
                return (
                  <g
                    key={column.stage}
                    onClick={() => setSelectedStage(isSelected ? null : column.stage)}
                    style={{ cursor: 'pointer', opacity: isDimmed ? 0.4 : 1, transition: 'opacity 0.15s ease' }}
                  >
                    <polygon
                      points={FUNNEL_POLYGONS[index]}
                      fill={fill}
                      fillOpacity={isSelected ? 0.6 : 0.35}
                      stroke={fill}
                      strokeOpacity={0.9}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    <text
                      x={FUNNEL_CENTERS[index].x}
                      y={FUNNEL_CENTERS[index].y - 8}
                      textAnchor="middle"
                      fill="white"
                      fontSize="22"
                      fontWeight={700}
                      letterSpacing="3"
                    >
                      {column.title.toUpperCase()}
                    </text>
                    <text
                      x={FUNNEL_CENTERS[index].x}
                      y={FUNNEL_CENTERS[index].y + 30}
                      textAnchor="middle"
                      fill="white"
                      fontSize="38"
                      fontWeight={700}
                    >
                      {column.rows.length}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '360px', maxWidth: '100%' }}>
              <div
                style={{
                  fontSize: '17px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'white',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Sales funnel
              </div>

              {grouped.map((column) => {
                const color = STAGE_COLORS[column.stage] ?? '#738297';
                const isSelected = selectedStage === column.stage;
                const isDimmed = selectedStage !== null && !isSelected;
                return (
                  <div
                    key={column.stage}
                    onClick={() => setSelectedStage(isSelected ? null : column.stage)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: `${color}${isSelected ? '33' : '14'}`,
                      border: `1px solid ${color}${isSelected ? '99' : '44'}`,
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.5 : 1,
                      transition: 'opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '999px',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, color: 'white', fontSize: '14px', fontWeight: 600 }}>
                      {column.title}
                    </div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>
                      {formatCompactCurrency(column.revenue)}
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  fontSize: '11px',
                  color: 'white',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  marginTop: '-4px',
                }}
              >
                Total annual revenue per stage
              </div>

              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid #313D4E',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  Stage conversion
                </div>
                {grouped.slice(1).map((column, i) => {
                  const prev = grouped[i];
                  const conversion =
                    prev.rows.length > 0
                      ? Math.round((column.rows.length / prev.rows.length) * 100)
                      : null;
                  return (
                    <div
                      key={column.stage}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: 'white' }}>
                        {prev.title} → {column.title}
                      </span>
                      <span style={{ color: 'white', fontWeight: 600 }}>
                        {conversion != null ? `${conversion}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stacked stage lists with drag-and-drop */}
          {grouped.filter((column) => selectedStage === null || column.stage === selectedStage).map((column) => {
            const isOver = dragOverStage === column.stage;
            return (
              <section
                key={column.stage}
                onDragOver={(e) => handleDragOver(e, column.stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.stage)}
                style={{
                  border: isOver ? '1px solid rgba(61, 130, 255, 0.6)' : '1px solid #313D4E',
                  borderRadius: '8px',
                  backgroundColor: isOver ? 'rgba(61, 130, 255, 0.06)' : '#273142',
                  overflow: 'hidden',
                  marginBottom: '30px',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#313D4E',
                  }}
                >
                  <div style={{ color: 'white', fontWeight: 600 }}>{column.title}</div>
                  <div style={{ color: '#738297', fontSize: '12px' }}>
                    {column.rows.length} records
                  </div>
                </div>

                <table className={styles['projects-table']} style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '19%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '14px 18px' }}>Organization</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px' }}>Employees</th>
                      <th style={{ padding: '14px 18px' }}>Annual Revenue</th>
                      <th style={{ padding: '14px 18px' }}>Sales Rep</th>
                      <th style={{ textAlign: 'left', padding: '14px 18px' }}>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {column.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: 'center',
                            padding: '28px',
                            color: '#738297',
                            backgroundColor: 'transparent',
                          }}
                        >
                          {draggedOrg ? 'Drop here' : 'Nothing here yet.'}
                        </td>
                      </tr>
                    ) : (
                      column.rows.map((org) => (
                        <tr
                          key={org.id}
                          draggable
                          onDragStart={() => handleDragStart(org)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: 'grab',
                            opacity: draggedOrg?.id === org.id ? 0.4 : 1,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <Link
                              href={`/gf1/organizations/${org.id}`}
                              className={styles['org-name-link']}
                              draggable={false}
                            >
                              <div className={styles['org-logo']}>
                                {org.logo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={org.logo_url}
                                    alt={org.legal_name ?? org.trade_name ?? 'Logo'}
                                    draggable={false}
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src="https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/3867f941-7be8-4abf-96b4-32ea0d318b15/Logomark.png?format=750w"
                                    alt="Default logo"
                                    draggable={false}
                                  />
                                )}
                              </div>
                              <div className={styles['org-name-text']}>
                                {(() => {
                                  const primary = org.legal_name || org.trade_name || org.dba_name || 'Untitled';
                                  const showDba = org.dba_name && org.dba_name !== primary;
                                  return (
                                    <>
                                      <p style={{ fontWeight: 600 }}>{primary}</p>
                                      {showDba && <p>DBA {org.dba_name}</p>}
                                    </>
                                  );
                                })()}
                              </div>
                            </Link>
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 18px' }}>
                            <div
                              className={`${styles['status-text']} ${styles[getStatusClass(org.status)]}`}
                            >
                              {org.status?.toLowerCase() === 'lead' ? 'suspect' : org.status}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 18px' }}>
                            <p style={{ fontWeight: 600 }}>
                              {org.total_employees != null ? org.total_employees.toLocaleString() : '—'}
                            </p>
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 18px' }}>
                            <p style={{ fontWeight: 700, color: 'var(--gf1-green)' }}>
                              {formatCurrency(org.annual_revenue)}
                            </p>
                            <p>per year</p>
                          </td>

                          <td style={{ textAlign: 'center', padding: '14px 18px' }}>
                            <p>{salesRepByOrgId?.[org.id] ?? org.sales_rep_name ?? 'Unassigned'}</p>
                          </td>

                          <td style={{ textAlign: 'left', padding: '14px 18px' }}>
                            <p>{org.primary_contact_name ?? '—'}</p>
                            {org.primary_contact_email && <p>{org.primary_contact_email}</p>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingMove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelMove}
        >
          <div
            style={{
              background: '#1e2a3a',
              border: '1px solid #313D4E',
              borderRadius: '12px',
              padding: '28px 32px',
              minWidth: '360px',
              maxWidth: '480px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(61, 130, 255, 0.15)',
                  border: '1px solid rgba(61, 130, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="fas fa-arrows-alt" style={{ color: '#99c6ff', fontSize: '14px' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>Move Organization</div>
                <div style={{ color: '#738297', fontSize: '13px', marginTop: '2px' }}>Confirm stage change</div>
              </div>
            </div>

            <p style={{ color: '#cbd5f5', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              Move{' '}
              <span style={{ color: 'white', fontWeight: 600 }}>{orgDisplayName(pendingMove.org)}</span>{' '}
              from{' '}
              <span style={{ color: '#738297' }}>{STAGE_LABELS[pendingMove.org.status]}</span>{' '}
              to{' '}
              <span style={{ color: '#99c6ff', fontWeight: 600 }}>{STAGE_LABELS[pendingMove.toStage]}</span>?
            </p>

            {moveError && (
              <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>{moveError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelMove}
                disabled={isMoving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #3d4b5e',
                  background: 'transparent',
                  color: '#738297',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                disabled={isMoving}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(153, 198, 255, 0.35)',
                  background: 'linear-gradient(135deg, rgba(61, 130, 255, 0.24), rgba(61, 130, 255, 0.12))',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isMoving ? 'wait' : 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                {isMoving ? 'Moving...' : 'Confirm Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
