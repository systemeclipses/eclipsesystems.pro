import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BulletList,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  BODY_TEXT,
} from './_shared';

const VOYA_ACCENT = '#A7CCED';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const RETIREMENT_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: '401(k) Retirement Plans' },
  { key: 'partnerName', label: 'Partner Name', kind: 'text', defaultValue: 'In Partnership with VOYA' },
  {
    key: 'sidebarTagline',
    label: 'Sidebar tagline',
    kind: 'multiline',
    defaultValue:
      'A Fortune 500 financial services partner managing retirement plans for over 6 million Americans.',
  },
  {
    key: 'sidebarFootnote',
    label: 'Sidebar footnote',
    kind: 'multiline',
    defaultValue:
      'Dedicated plan design, payroll-integrated contributions, and a participant experience your team will actually use.',
  },
  {
    key: 'intro',
    label: 'Intro paragraph',
    kind: 'multiline',
    defaultValue:
      'Galactic partners with VOYA Financial to deliver a competitive 401(k) plan that helps your team save for retirement and helps you attract and retain talent.',
  },
  {
    key: 'memberHeading',
    label: 'Left column heading',
    kind: 'text',
    defaultValue: 'Member Benefits',
  },
  {
    key: 'memberItems',
    label: 'Member Benefits (one per line)',
    kind: 'list',
    defaultList: [
      'Pre-tax & Roth contribution options',
      'Employer match programs',
      'Diverse, low-cost investment lineup',
      'Online enrollment & account management',
      'Mobile app for balances and elections',
      'Personalized retirement readiness scoring',
    ],
  },
  {
    key: 'paperworkHeading',
    label: 'Right column heading',
    kind: 'text',
    defaultValue: 'Paperwork & Compliance',
  },
  {
    key: 'paperworkItems',
    label: 'Paperwork bullets (one per line)',
    kind: 'list',
    defaultList: [
      'Plan design & document preparation',
      'Annual non-discrimination testing',
      'Form 5500 preparation & filing',
      'Required participant notices',
      'Eligibility tracking & enrollment alerts',
      'Payroll integration & contribution remittance',
    ],
  },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: BRAND_BLUE,
        fontFamily: HEADING_FONT,
        fontWeight: 900,
        fontSize: '24px',
        letterSpacing: '0.02em',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `3px solid ${VOYA_ACCENT}`,
      }}
    >
      {children}
    </div>
  );
}

export function RetirementLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || '401(k) Retirement Plans';
  const partnerName = asString(data.partnerName);
  const sidebarTagline = asString(data.sidebarTagline);
  const sidebarFootnote = asString(data.sidebarFootnote);
  const intro = asString(data.intro);
  const memberHeading = asString(data.memberHeading);
  const memberItems = asList(data.memberItems);
  const paperworkHeading = asString(data.paperworkHeading);
  const paperworkItems = asList(data.paperworkItems);

  return (
    <SlideShell>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Sidebar */}
        <div
          style={{
            width: '300px',
            flexShrink: 0,
            background: BRAND_BLUE,
            color: '#ffffff',
            padding: '60px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '6px',
              background: VOYA_ACCENT,
            }}
          />
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: VOYA_ACCENT,
            }}
          >
            In Partnership With
          </div>
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '56px',
              fontWeight: 900,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            {partnerName && partnerName.toLowerCase().includes('voya')
              ? 'VOYA'
              : partnerName || 'VOYA'}
          </div>
          {sidebarTagline ? (
            <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#cfe5f5', marginTop: '8px' }}>
              {sidebarTagline}
            </div>
          ) : null}
          {sidebarFootnote ? (
            <>
              <div
                style={{
                  width: '40px',
                  height: '3px',
                  background: VOYA_ACCENT,
                  marginTop: '20px',
                  marginBottom: '14px',
                }}
              />
              <div style={{ fontSize: '13px', lineHeight: 1.55, color: '#e5eff7' }}>
                {sidebarFootnote}
              </div>
            </>
          ) : null}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '60px 50px 0', minWidth: 0 }}>
          <h1
            style={{
              margin: '0 0 18px',
              color: BRAND_BLUE,
              fontFamily: HEADING_FONT,
              fontSize: '46px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </h1>
          <div
            style={{
              width: '80px',
              height: '5px',
              background: VOYA_ACCENT,
              marginBottom: '22px',
            }}
          />
          {intro ? (
            <p style={{ margin: '0 0 22px', color: BODY_TEXT, fontSize: '15px', lineHeight: 1.5 }}>{intro}</p>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <ColumnHeading>{memberHeading}</ColumnHeading>
              <BulletList items={memberItems} fontSize={15} gap={8} />
            </div>
            <div>
              <ColumnHeading>{paperworkHeading}</ColumnHeading>
              <BulletList items={paperworkItems} fontSize={15} gap={8} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
