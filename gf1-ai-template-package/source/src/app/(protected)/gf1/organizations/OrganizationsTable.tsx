"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './OrganizationsTable.module.css';
import type { OrgRow } from './page';

interface Props {
  organizations: OrgRow[];
  repOptions?: string[];
  salesRepByOrgId?: Record<string, string>;
  isSalesUser?: boolean;
  lockedSalesRepName?: string | null;
}

type SortOption = 'alphabetical' | 'newest' | 'oldest' | 'commission-high' | 'commission-low';
type StatusFilter = 'all' | 'lead' | 'prospect' | 'client' | 'inactive';

export function OrganizationsTable({
  organizations,
  repOptions,
  salesRepByOrgId,
  isSalesUser = false,
  lockedSalesRepName = null,
}: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('all');

  // Get unique sales reps for filter dropdown
  const uniqueSalesReps = useMemo(() => {
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

  const lockedSalesRepFilterValue = useMemo(() => {
    if (!isSalesUser) return null;
    const explicit = (lockedSalesRepName ?? '').trim();
    if (explicit) return explicit;
    if (uniqueSalesReps.length > 0) return uniqueSalesReps[0];
    return 'Assigned to me';
  }, [isSalesUser, lockedSalesRepName, uniqueSalesReps]);
  const effectiveSalesRepFilter = isSalesUser
    ? lockedSalesRepFilterValue
    : salesRepFilter;

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'lead':
        return 'status-amber';
      case 'prospect':
        return 'status-blue';
      case 'client':
      case 'active':
        return 'status-green';
      case 'inactive':
      case 'lost':
        return 'status-red';
      default:
        return 'status-orange';
    }
  };

  const filteredAndSortedOrgs = useMemo(() => {
    let result = [...organizations];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(org => org.status?.toLowerCase() === statusFilter);
    }

    // Apply sales rep filter
    if (effectiveSalesRepFilter && effectiveSalesRepFilter !== 'all') {
      result = result.filter((org) => {
        const label = salesRepByOrgId?.[org.id] ?? org.sales_rep_name ?? '';
        return label.trim() === effectiveSalesRepFilter;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical': {
          const nameA = (a.legal_name ?? a.trade_name ?? '').toLowerCase();
          const nameB = (b.legal_name ?? b.trade_name ?? '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'commission-high':
          return (b.annual_commission ?? 0) - (a.annual_commission ?? 0);
        case 'commission-low':
          return (a.annual_commission ?? 0) - (b.annual_commission ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [organizations, sortBy, statusFilter, effectiveSalesRepFilter, salesRepByOrgId]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={styles.projects}>
      <div className={styles['projects-inner']}>
        <header className={styles['projects-header']}>
          <div>
            <div className={styles.title}>Organizations</div>
            <div className={styles.count}>| {filteredAndSortedOrgs.length} Organizations</div>
          </div>
          
          <div className={styles.filters}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="lead">Suspect</option>
              <option value="prospect">Prospect</option>
              <option value="client">Client</option>
              <option value="inactive">Inactive</option>
            </select>

            <select 
              value={effectiveSalesRepFilter ?? 'all'}
              onChange={(e) => setSalesRepFilter(e.target.value)}
              className={styles.filterSelect}
              disabled={isSalesUser}
            >
              {isSalesUser ? (
                <option value={lockedSalesRepFilterValue ?? 'all'}>
                  {lockedSalesRepFilterValue ?? 'Assigned to me'}
                </option>
              ) : (
                <>
                  <option value="all">All Sales Reps</option>
                  {uniqueSalesReps.map(rep => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </>
              )}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={styles.filterSelect}
            >
              <option value="alphabetical">A-Z</option>
              <option value="newest">Date Added: Newest to Oldest</option>
              <option value="oldest">Date Added: Oldest to Newest</option>
              <option value="commission-high">Commission: High to Low</option>
              <option value="commission-low">Commission: Low to High</option>
            </select>
          </div>
        </header>
        <table className={styles['projects-table']}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Sales Rep</th>
              <th>Primary Contact</th>
              <th>Employees</th>
              <th>Date Added</th>
              <th>Annual Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedOrgs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#738297' }}>
                  No organizations found.
                </td>
              </tr>
            ) : (
              filteredAndSortedOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link href={`/gf1/organizations/${org.id}`} className={styles['org-name-link']}>
                      <div className={styles['org-logo']}>
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.legal_name ?? org.trade_name ?? 'Logo'} />
                        ) : (
                          <img src="https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/3867f941-7be8-4abf-96b4-32ea0d318b15/Logomark.png?format=750w" alt="Default logo" />
                        )}
                      </div>
                      <div className={styles['org-name-text']}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', margin: 0 }}>
                          {org.dba_name || org.trade_name || org.legal_name || 'Untitled'}
                        </p>
                        <p style={{ color: '#738297', fontSize: '13px', margin: 0, marginTop: '2px' }}>
                          {org.legal_name}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <p>{salesRepByOrgId?.[org.id] ?? org.sales_rep_name ?? '-'}</p>
                  </td>
                  <td>
                    <p>{org.primary_contact_name ?? '-'}</p>
                    {org.primary_contact_email && <p>{org.primary_contact_email}</p>}
                  </td>
                  <td>
                    <p>{org.total_employees ?? 'n/a'}</p>
                  </td>
                  <td>
                    <p>{org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}</p>
                  </td>
                  <td>
                    <p style={{ fontWeight: 600, color: 'var(--gf1-green)' }}>{formatCurrency(org.annual_commission)}</p>
                    <p>per year</p>
                  </td>
                  <td>
                    <span className={`${styles['status-text']} ${styles[getStatusClass(org.status ?? 'lead')]}`}>
                      {(org.status ?? 'lead') === 'lead' ? 'suspect' : (org.status ?? 'lead')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
