"use client";

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import styles from './ProposalWorkspaceHeader.module.css';

type Props = {
  proposalId: string;
  title: string;
  subtitle?: string | null;
  status: string | null | undefined;
  activeView: 'overview' | 'slides';
  slideCount?: number;
  logoUrl?: string | null;
  actions?: ReactNode;
};

function formatStatus(status: string | null | undefined) {
  if (!status) return 'Draft';
  const spaced = status.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function ProposalWorkspaceHeader({
  proposalId,
  title,
  subtitle,
  status,
  activeView,
  slideCount = 0,
  logoUrl,
  actions,
}: Props) {
  const activeIndex = activeView === 'slides' ? 1 : 0;
  const tabVars = {
    ['--tab-count' as string]: 2,
    ['--active-index' as string]: activeIndex,
  } as CSSProperties;

  return (
    <section className={styles.header}>
      <div className={styles.headerInner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '14px',
                objectFit: 'contain',
                background: '#101a2d',
                border: '1px solid #1f2a3d',
                flexShrink: 0,
              }}
            />
          ) : null}
          <div className={styles.titleBlock}>
            <div className={styles.breadcrumb}>
              <Link href="/gf1/proposals" className={styles.breadcrumbLink}>
                All Proposals
              </Link>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbCurrent}>Workspace</span>
              <span
                className={styles.status}
                style={{ marginLeft: '8px', borderRadius: '8px' }}
              >
                {formatStatus(status)}
              </span>
            </div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
            </div>
            {(subtitle || actions) ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                }}
              >
                {subtitle ? <p className={styles.subtitle} style={{ margin: 0 }}>{subtitle}</p> : null}
                {actions ?? null}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.tabsWrap}>
          <div className={styles.tabs} role="tablist" aria-label="Proposal workspace tabs" style={tabVars}>
            <Link
              href={`/gf1/proposals/${proposalId}`}
              className={`${styles.tab} ${activeView === 'overview' ? styles.tabActive : ''}`}
              aria-current={activeView === 'overview' ? 'page' : undefined}
            >
              <span>Pricing</span>
            </Link>
            <Link
              href={`/gf1/proposals/${proposalId}/slides`}
              className={`${styles.tab} ${activeView === 'slides' ? styles.tabActive : ''}`}
              aria-current={activeView === 'slides' ? 'page' : undefined}
            >
              <span>Slides</span>
              <span className={`${styles.tabCount} ${activeView === 'slides' ? styles.tabCountActive : ''}`}>
                {slideCount}
              </span>
            </Link>
            <span className={styles.tabGlider} aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
