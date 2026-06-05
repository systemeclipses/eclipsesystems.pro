import React from 'react';
import type { SalesContext, SlideFieldDef, SlideFieldValue, SlideLayoutId } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  BODY_TEXT,
  HEADING_FONT,
  SlammedLogo,
  SlideShell,
} from './_shared';
import { asChecklist, asList, asString } from '@/lib/gf1/slide-tokens';
import type { LayoutDeckInfo } from './index';

type SectionSpec = {
  /** Section shows if ANY of these layouts is visible in the deck. */
  layoutIds: SlideLayoutId[];
  headingKey: string;
  headingLabel: string;
  headingDefault: string;
  bulletsKey: string;
  bulletsLabel: string;
  bulletsDefault: string[];
};

const SECTION_ORDER: SectionSpec[] = [
  {
    layoutIds: ['payroll'],
    headingKey: 'payrollHeading',
    headingLabel: 'Payroll heading',
    headingDefault: 'Payroll',
    bulletsKey: 'payrollBullets',
    bulletsLabel: 'Payroll bullets',
    bulletsDefault: [
      'Intake, calculation and processing of payroll.',
      'Onboarding, benefit enrollment and employee portal admin.',
      'Tax filings, garnishment, unemployment and other HR administration.',
      'Ad-hoc Reporting via Report Center',
    ],
  },
  {
    layoutIds: ['timekeeping'],
    headingKey: 'timekeepingHeading',
    headingLabel: 'Time & Attendance heading',
    headingDefault: 'Time & Attendance',
    bulletsKey: 'timekeepingBullets',
    bulletsLabel: 'Time & Attendance bullets',
    bulletsDefault: [
      'Workforce Management Platform with built-in support to timesheet.',
    ],
  },
  {
    layoutIds: ['hr_services'],
    headingKey: 'hrHeading',
    headingLabel: 'HR & Compliance heading',
    headingDefault: 'HR Services & Compliance',
    bulletsKey: 'hrBullets',
    bulletsLabel: 'HR & Compliance bullets',
    bulletsDefault: [
      'W-4, I-9, E-Verify and state withholding forms.',
      'FLSA, ADA, FMLA, and terminations guidance.',
      'HIPAA and COBRA administration.',
      'EPLI coverage coordination.',
    ],
  },
  {
    layoutIds: ['workers_comp'],
    headingKey: 'wcHeading',
    headingLabel: "Workers' Comp heading",
    headingDefault: "Workers' Compensation Admin",
    bulletsKey: 'wcBullets',
    bulletsLabel: "Workers' Comp bullets",
    bulletsDefault: ['Audits', 'Claims', 'Pay as you go premiums'],
  },
  {
    layoutIds: ['benefits'],
    headingKey: 'benefitsHeading',
    headingLabel: 'Benefits heading',
    headingDefault: 'Health & Supplemental Benefits',
    bulletsKey: 'benefitsBullets',
    bulletsLabel: 'Benefits bullets',
    bulletsDefault: [
      'GalactiCare plans offered.',
      'Five plans available that range from HDHP to zero deductible.',
    ],
  },
  {
    layoutIds: ['benefits_enrollment'],
    headingKey: 'benefitsEnrollHeading',
    headingLabel: 'Benefits Enrollment heading',
    headingDefault: 'Benefits Enrollment',
    bulletsKey: 'benefitsEnrollBullets',
    bulletsLabel: 'Benefits Enrollment bullets',
    bulletsDefault: [
      'Self-service enrollment on any device.',
      'Plan comparisons and employee decision support.',
    ],
  },
  {
    layoutIds: ['onboarding'],
    headingKey: 'onboardingHeading',
    headingLabel: 'Onboarding heading',
    headingDefault: 'Paperless Onboarding',
    bulletsKey: 'onboardingBullets',
    bulletsLabel: 'Onboarding bullets',
    bulletsDefault: [
      'Paperless I-9, W-4, and state packets.',
      'Custom new-hire workflows with audit trails.',
    ],
  },
  {
    layoutIds: ['employee_tools'],
    headingKey: 'portalHeading',
    headingLabel: 'Employee Portal heading',
    headingDefault: 'Employee Portal',
    bulletsKey: 'portalBullets',
    bulletsLabel: 'Employee Portal bullets',
    bulletsDefault: [
      '24/7 self-service for pay stubs, W-2s, and benefits.',
      'Mobile, tablet, and desktop access with MFA.',
    ],
  },
  {
    layoutIds: ['applicant_tracking'],
    headingKey: 'atsHeading',
    headingLabel: 'ATS heading',
    headingDefault: 'Applicant Tracking System',
    bulletsKey: 'atsBullets',
    bulletsLabel: 'ATS bullets',
    bulletsDefault: [
      'Built-in to Payroll Software; fully integrated',
      'Job postings, interview scheduling, offer letters, and more.',
    ],
  },
  {
    layoutIds: ['lms_zywave', 'lms_ethena'],
    headingKey: 'lmsHeading',
    headingLabel: 'LMS heading',
    headingDefault: 'LMS Options Available',
    bulletsKey: 'lmsBullets',
    bulletsLabel: 'LMS bullets',
    bulletsDefault: [
      'ethena or zywave',
      'Two great options that offer courses on relevant subject matter.',
    ],
  },
  {
    layoutIds: ['reporting'],
    headingKey: 'reportingHeading',
    headingLabel: 'Reporting heading',
    headingDefault: 'Reporting & Analytics',
    bulletsKey: 'reportingBullets',
    bulletsLabel: 'Reporting bullets',
    bulletsDefault: [
      'Real-time dashboards and scheduled reports.',
      'Data Retriever for ad-hoc queries and exports.',
    ],
  },
  {
    layoutIds: ['multi_company_reporting'],
    headingKey: 'multiCompanyHeading',
    headingLabel: 'Multi-Company heading',
    headingDefault: 'Multi-Company Management',
    bulletsKey: 'multiCompanyBullets',
    bulletsLabel: 'Multi-Company bullets',
    bulletsDefault: [
      'Manage every FEIN from a single login.',
      'Consolidated reporting across all entities.',
    ],
  },
  {
    layoutIds: ['retirement_401k'],
    headingKey: 'retirementHeading',
    headingLabel: '401(k) heading',
    headingDefault: '401(k) Retirement',
    bulletsKey: 'retirementBullets',
    bulletsLabel: '401(k) bullets',
    bulletsDefault: [
      'In partnership with VOYA Financial.',
      'Pre-tax, Roth, and employer match options.',
    ],
  },
];

const PINNED_SECTIONS: Array<{
  key: string;
  label: string;
  headingKey: string;
  headingLabel: string;
  headingDefault: string;
  bulletsKey: string;
  bulletsLabel: string;
  bulletsDefault: string[];
}> = [
];

export const EXECUTIVE_SUMMARY_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Executive Summary' },
  {
    key: 'sidebarEyebrow',
    label: 'Eyebrow (top banner)',
    kind: 'text',
    defaultValue: 'Proposal Recap',
  },
  {
    key: 'sidebarTagline',
    label: 'Tagline (top banner)',
    kind: 'multiline',
    defaultValue:
      "A quick read of every service included in your proposal. One page, the whole picture.",
  },
  {
    key: 'pinnedSections',
    label: 'Extra sections (not tied to a slide)',
    kind: 'checklist',
    defaultList: PINNED_SECTIONS.map((s) => s.label),
  },
  ...SECTION_ORDER.flatMap((s) => [
    { key: s.headingKey, label: s.headingLabel, kind: 'text' as const, defaultValue: s.headingDefault },
    { key: s.bulletsKey, label: s.bulletsLabel, kind: 'list' as const, defaultList: s.bulletsDefault },
  ]),
  ...PINNED_SECTIONS.flatMap((s) => [
    { key: s.headingKey, label: s.headingLabel, kind: 'text' as const, defaultValue: s.headingDefault },
    { key: s.bulletsKey, label: s.bulletsLabel, kind: 'list' as const, defaultList: s.bulletsDefault },
  ]),
];

type Density = {
  headingSize: number;
  bulletSize: number;
  bulletLineHeight: number;
  bulletGap: number;
  sectionMarginBottom: number;
  headingMarginBottom: number;
  columnGap: number;
  contentPaddingTop: number;
  contentPaddingBottom: number;
};

const DENSITY_COZY: Density = {
  headingSize: 19,
  bulletSize: 12.5,
  bulletLineHeight: 1.4,
  bulletGap: 5,
  sectionMarginBottom: 14,
  headingMarginBottom: 6,
  columnGap: 40,
  contentPaddingTop: 26,
  contentPaddingBottom: 20,
};

const DENSITY_COMPACT: Density = {
  headingSize: 17,
  bulletSize: 11.5,
  bulletLineHeight: 1.35,
  bulletGap: 4,
  sectionMarginBottom: 11,
  headingMarginBottom: 5,
  columnGap: 32,
  contentPaddingTop: 20,
  contentPaddingBottom: 16,
};

const DENSITY_DENSE: Density = {
  headingSize: 15.5,
  bulletSize: 10.5,
  bulletLineHeight: 1.3,
  bulletGap: 3,
  sectionMarginBottom: 9,
  headingMarginBottom: 4,
  columnGap: 26,
  contentPaddingTop: 16,
  contentPaddingBottom: 14,
};

const DENSITY_ULTRA: Density = {
  headingSize: 14,
  bulletSize: 9.5,
  bulletLineHeight: 1.25,
  bulletGap: 2,
  sectionMarginBottom: 7,
  headingMarginBottom: 3,
  columnGap: 22,
  contentPaddingTop: 12,
  contentPaddingBottom: 12,
};

function pickDensity(sectionCount: number, totalBullets: number): Density {
  // "weight" approximates the vertical content load. Each section eats a
  // heading + spacing; each bullet adds a line. Tuned against the available
  // page area below the banner.
  const weight = sectionCount * 2 + totalBullets;
  if (weight <= 30) return DENSITY_COZY;
  if (weight <= 42) return DENSITY_COMPACT;
  if (weight <= 56) return DENSITY_DENSE;
  return DENSITY_ULTRA;
}

function SectionBlock({
  heading,
  bullets,
  density,
}: {
  heading: string;
  bullets: string[];
  density: Density;
}) {
  return (
    <div style={{ breakInside: 'avoid', marginBottom: `${density.sectionMarginBottom}px` }}>
      <div
        style={{
          color: BRAND_BLUE,
          fontFamily: HEADING_FONT,
          fontWeight: 900,
          fontSize: `${density.headingSize}px`,
          letterSpacing: '0.02em',
          marginBottom: `${density.headingMarginBottom}px`,
        }}
      >
        {heading}
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: `${density.bulletGap}px`,
        }}
      >
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: '8px',
              fontSize: `${density.bulletSize}px`,
              color: BODY_TEXT,
              lineHeight: density.bulletLineHeight,
            }}
          >
            <span style={{ color: BRAND_BLUE, fontWeight: 900, flexShrink: 0 }}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveSummaryLayout({
  data,
  ctx,
  deck,
}: {
  data: Record<string, SlideFieldValue>;
  ctx?: SalesContext;
  deck?: LayoutDeckInfo;
}) {
  const title = asString(data.title) || 'Executive Summary';
  const sidebarTagline = asString(data.sidebarTagline);
  const orgName = ctx?.org?.name ?? '';
  const deckIds = new Set<SlideLayoutId>(deck?.layoutIds ?? []);
  const hasDeckInfo = (deck?.layoutIds?.length ?? 0) > 0;
  const pinnedEnabled = new Set(asChecklist(data.pinnedSections));

  type RenderedSection = { heading: string; bullets: string[] };
  const sections: RenderedSection[] = [];

  for (const s of SECTION_ORDER) {
    if (hasDeckInfo && !s.layoutIds.some((id) => deckIds.has(id))) continue;
    const heading = asString(data[s.headingKey]) || s.headingDefault;
    const bullets = asList(data[s.bulletsKey]);
    if (!bullets.length) continue;
    sections.push({ heading, bullets });
  }

  for (const s of PINNED_SECTIONS) {
    if (!pinnedEnabled.has(s.label)) continue;
    const heading = asString(data[s.headingKey]) || s.headingDefault;
    const bullets = asList(data[s.bulletsKey]);
    if (!bullets.length) continue;
    sections.push({ heading, bullets });
  }

  const totalBullets = sections.reduce((acc, s) => acc + s.bullets.length, 0);
  const density = pickDensity(sections.length, totalBullets);

  return (
    <SlideShell>
      {/* Top banner with decorative circles — flat rectangle, circular accents inside */}
      <div
        style={{
          position: 'relative',
          background: BRAND_BLUE,
          color: '#ffffff',
          padding: '30px 50px 34px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '32px',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gold + light-blue circles as background accents */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-60px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: BRAND_GOLD,
            opacity: 0.18,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '180px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: '#ffffff',
            opacity: 0.08,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '760px', position: 'relative' }}>
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '52px',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}
          >
            {title}
          </div>
          {sidebarTagline ? (
            <div style={{ fontSize: '13px', color: '#cfe5f5', lineHeight: 1.5, marginTop: '6px' }}>
              {sidebarTagline}
            </div>
          ) : null}
        </div>

        {orgName ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: BRAND_GOLD,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontFamily: HEADING_FONT,
                fontWeight: 900,
                fontSize: '48px',
                lineHeight: 1,
                paddingTop: '4px',
                flexShrink: 0,
                boxShadow: `0 0 0 6px ${BRAND_BLUE}`,
              }}
            >
              {orgName.trim().charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '13px',
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: BRAND_GOLD,
                }}
              >
                Prepared For
              </div>
              <div
                style={{
                  fontFamily: HEADING_FONT,
                  fontSize: '28px',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  maxWidth: '320px',
                }}
              >
                {orgName}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Gold accent stripe beneath the banner */}
      <div style={{ height: '6px', background: BRAND_GOLD }} />

      {/* Main content */}
      <div
        style={{
          padding: `${density.contentPaddingTop}px 50px ${density.contentPaddingBottom}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ columnCount: 2, columnGap: `${density.columnGap}px` }}>
          {sections.map((s, i) => (
            <SectionBlock key={i} heading={s.heading} bullets={s.bullets} density={density} />
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '30px' }}>
        <SlammedLogo height={30} />
      </div>
    </SlideShell>
  );
}
