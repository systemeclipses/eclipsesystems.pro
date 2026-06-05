'use client';

import { useMemo } from 'react';
import { SlideBuilder } from '../[id]/_components/SlideBuilder/SlideBuilder';
import type { ProposalSlide, ProposalSlidesPayload, SalesContext } from '@/lib/gf1/slide-types';
import type { Gf1PayFrequency, Gf1ProposalRecord } from '@/lib/gf1/types';
import { migrateLegacySlides } from '@/lib/gf1/slide-migration';
import { buildSalesContext } from '@/lib/gf1/sales-context';

type ProposalSlidesClientProps = {
  proposal: Gf1ProposalRecord & {
    slides_json?: ProposalSlidesPayload | Record<string, unknown> | null;
    pricing_json?: Record<string, unknown> | null;
    pricing_summary?: Record<string, unknown> | null;
    wizard_payload?: Record<string, unknown> | null;
  };
  organization: {
    legal_name?: string | null;
    dba_name?: string | null;
    trade_name?: string | null;
    logo_url?: string | null;
    primary_contact_name?: string | null;
    primary_contact_email?: string | null;
    industry?: string | null;
    total_employees?: number | null;
    pay_frequency?: Gf1PayFrequency | null;
    sales_rep_name?: string | null;
  } | null;
  canEdit: boolean;
  onSaveSlides: (payload: ProposalSlidesPayload) => Promise<void>;
};

export function ProposalSlidesClient({
  proposal,
  organization,
  canEdit,
  onSaveSlides,
}: ProposalSlidesClientProps) {
  const initialSlides: ProposalSlide[] = useMemo(
    () => migrateLegacySlides(proposal.slides_json ?? null),
    [proposal.slides_json],
  );

  const salesContext: SalesContext = useMemo(
    () => buildSalesContext(proposal, organization),
    [proposal, organization],
  );

  const slideCount = initialSlides.length;
  const companyName = salesContext.org.name;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <section
        style={{
          borderRadius: '18px',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.92) 100%)',
          padding: '22px 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(15,118,110,0.12)',
              border: '1px solid rgba(20,184,166,0.2)',
            }}
          >
            <div style={{ color: '#99f6e4', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Deck
            </div>
            <div style={{ color: '#f8fafc', fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>
              {slideCount > 0 ? slideCount : '—'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {slideCount > 0 ? 'Slides currently in this proposal' : 'Default deck will seed on save'}
            </div>
          </div>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(96,165,250,0.2)',
            }}
          >
            <div style={{ color: '#bfdbfe', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Audience
            </div>
            <div style={{ color: '#f8fafc', fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>
              {companyName}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Live proposal deck workspace</div>
          </div>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(217,119,6,0.12)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <div style={{ color: '#fde68a', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Workflow
            </div>
            <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>
              Build, reorder, export
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Save the deck, then export the PDF when ready
            </div>
          </div>
        </div>
      </section>

      <SlideBuilder
        proposalId={proposal.id}
        initialSlides={initialSlides}
        salesContext={salesContext}
        canEdit={canEdit}
        onSave={onSaveSlides}
      />
    </div>
  );
}
