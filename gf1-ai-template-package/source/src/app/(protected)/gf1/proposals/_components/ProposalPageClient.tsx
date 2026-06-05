'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProposalAction } from '../deleteProposalAction';
import Link from 'next/link';
import type { Gf1OrganizationProfile, Gf1Proposal } from '@/lib/gf1/types';
import ProposalPageStyles from './ProposalPage.module.css';

type ProposalRow = Pick<Gf1Proposal, 'id' | 'status' | 'updated_at' | 'organization_id' | 'prospect_id'>;

export type Prospect = {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  email: string | null;
};

export interface ProposalPageClientProps {
  proposals: ProposalRow[];
  orgMap: Map<string, Partial<Gf1OrganizationProfile>>;
  prospects: Prospect[];
}

export function ProposalPageClient({ proposals, orgMap }: ProposalPageClientProps) {
  type FilterMode = 'active' | 'all' | 'old';
  const [filterMode, setFilterMode] = useState<FilterMode>('active');
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const visibleProposals = useMemo(() => {
    const list = proposals ?? [];
    const isClientOrg = (proposal: ProposalRow) =>
      orgMap.get(proposal.organization_id ?? '')?.status === 'client';

    if (filterMode === 'all') return list;
    if (filterMode === 'old') {
      return list.filter(p => p.status === 'rejected' || (p.status === 'approved' && isClientOrg(p)));
    }
    return list.filter((p) => {
      if (p.status === 'rejected') return false;
      if (p.status === 'approved') return !isClientOrg(p);
      return true;
    });
  }, [proposals, filterMode, orgMap]);

  return (
    <div className="space-y-6">
      <section style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: '0 0 12px 0' }}>
        <div className={`${ProposalPageStyles.headerRow} flex items-center justify-between gap-4`}>
          <div style={{ marginLeft: '-36px' }}>
            <h1 style={{ fontSize: '34px', color: 'white', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-file-lines" aria-hidden="true" style={{ fontSize: '30px', marginTop: '-8px' }} />
              Proposals
            </h1>
          </div>
          <div className={`${ProposalPageStyles.headerActions} flex items-center gap-3`}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#273142', border: 'none', borderRadius: '4px', padding: '6px 8px' }}>
              <label htmlFor="filterMode" style={{ color: 'white', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-filter" aria-hidden="true" style={{ fontSize: '12px' }} />
                Filter
              </label>
              <select
                id="filterMode"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                style={{ background: '#313D4E', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="active">Active only</option>
                <option value="old">Archived (approved/rejected)</option>
                <option value="all">All statuses</option>
              </select>
            </div>
            <Link
              href="/gf1/proposals/new"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', background: 'white', color: '#273142', border: '1px solid white', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 0 0 3px rgba(28,147,237,0.1)', marginLeft: '12px', textDecoration: 'none' }}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: '6px', fontSize: '12px' }} />
              Generate New Proposal
            </Link>
          </div>
        </div>
      </section>

      {/* Proposals List */}
      {true && (
        <section style={{ background: 'transparent', border: 'none', borderRadius: '0px', overflow: 'visible' }}>
          <div className={ProposalPageStyles.cardsRow}>
            {visibleProposals.length === 0 ? (
              <p style={{ padding: '12px', fontSize: '13px', color: '#738297', margin: 0 }}>No proposals yet. Open a prospect to start pricing.</p>
            ) : (
              visibleProposals.map((proposal) => {
                const orgRecord = orgMap.get(proposal.organization_id ?? '') as Partial<Gf1OrganizationProfile> | null;
                const isActive = activeProposalId === proposal.id;
                const createdDate = new Date(proposal.updated_at).toLocaleDateString('en-US', { timeZone: 'UTC' });
                const statusValue = proposal.status as string;
                const statusLabel =
                  statusValue === 'pending_approval' ? 'Pending approval' : statusValue.replace('_', ' ');
                let logoUrl = orgRecord?.logo_url ?? null;
                if (!logoUrl && proposal.status === 'draft') {
                  logoUrl = 'https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/3867f941-7be8-4abf-96b4-32ea0d318b15/Logomark.png?format=750w';
                }
                const dbaName = orgRecord?.dba_name || '';
                const legalName = orgRecord?.legal_name || '';
                const displayName = dbaName || legalName || 'Unknown org';
                return (
                  <div key={proposal.id} className={`${ProposalPageStyles.card} ${isActive ? ProposalPageStyles.cardActive : ''}`} onClick={() => setActiveProposalId(isActive ? null : proposal.id)} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '8px', left: '12px', zIndex: 2 }}>
                      <span className={ProposalPageStyles.badge} style={{ textTransform: 'capitalize' }}>{statusLabel}</span>
                    </div>
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        if (!isActive || deletingId) return;
                        if (!confirm('Are you sure you want to delete this proposal? This cannot be undone.')) return;
                        setDeletingId(proposal.id);
                        startTransition(async () => {
                          try {
                            await deleteProposalAction(proposal.id);
                            setActiveProposalId(null);
                            router.refresh();
                          } catch (error) {
                            console.error('Failed to delete proposal', error);
                            alert('Failed to delete proposal.');
                          } finally {
                            setDeletingId(null);
                          }
                        });
                      }}
                      disabled={deletingId === proposal.id}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '12px',
                        zIndex: 3,
                        background: '#D65B4A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 600,
                        cursor: isActive && !deletingId ? 'pointer' : 'default',
                        fontSize: '13px',
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0)' : 'translateY(-10px)',
                        pointerEvents: isActive && !deletingId ? 'auto' : 'none',
                        transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1)',
                        minWidth: '70px',
                        ...(deletingId === proposal.id ? { background: '#b91c1c', opacity: 0.7 } : {})
                      }}
                      title="Delete Proposal"
                    >
                      {deletingId === proposal.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <div className={ProposalPageStyles.cardImage} style={{ paddingTop: '0px', marginTop: '-25px' }}>
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt={`${displayName} logo`} />
                      ) : (
                        <div style={{ width: '60%', height: '60%', borderRadius: '8px', background: '#313D4E' }} />
                      )}
                    </div>
                    <div className={ProposalPageStyles.cardOverlay} />
                      <div className={ProposalPageStyles.cardDesc}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3
                          className={ProposalPageStyles.cardTitle}
                          style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            margin: 0,
                            marginTop: '-14px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {displayName}
                        </h3>
                      </div>
                      <p style={{ fontSize: '12px', color: '#a8b5c7', marginTop: '6px', marginBottom: '20px' }}>Created {createdDate}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                        {proposal.organization_id && (
                          <Link href={`/gf1/organizations/${proposal.organization_id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', background: '#313D4E', color: 'white', border: '1px solid #3d4b5e', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Prospect</Link>
                        )}
                        <Link href={`/gf1/proposals/${proposal.id}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', background: '#1C93ED', color: 'white', border: '1px solid #1580d4', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Pricing</Link>
                        <Link href={`/gf1/proposals/${proposal.id}/slides`} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', background: '#0f766e', color: 'white', border: '1px solid #115e59', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Slides</Link>
                        {legalName && displayName !== legalName && (
                          <span style={{ fontSize: '13px', color: '#a8b5c7', marginLeft: '8px', whiteSpace: 'nowrap' }}>Legal Name: {legalName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
