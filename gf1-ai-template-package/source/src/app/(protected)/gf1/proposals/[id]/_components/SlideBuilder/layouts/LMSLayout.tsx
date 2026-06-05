import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BulletList,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  BODY_TEXT,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

const ACCENT = '#63ADF2';

const SHARED_LMS_FIELD_BASE: Omit<SlideFieldDef, 'defaultValue' | 'defaultList'>[] = [
  { key: 'partnerName', label: 'Partner Name', kind: 'text' },
  { key: 'logoUrl', label: 'Partner Logo URL (optional)', kind: 'image_url' },
  { key: 'bannerEyebrow', label: 'Banner eyebrow', kind: 'text' },
  { key: 'bannerTagline', label: 'Banner tagline', kind: 'multiline' },
  { key: 'bannerHighlights', label: 'Banner highlight pills (3 short phrases)', kind: 'list' },
  { key: 'productImageUrl', label: 'Product / Laptop Mockup URL', kind: 'image_url' },
  { key: 'calloutAHeading', label: 'Callout A heading', kind: 'text' },
  { key: 'calloutABody', label: 'Callout A body', kind: 'multiline' },
  { key: 'calloutBHeading', label: 'Callout B heading', kind: 'text' },
  { key: 'calloutBBody', label: 'Callout B body', kind: 'multiline' },
  { key: 'featuresHeading', label: 'Key Features heading', kind: 'text' },
  { key: 'featuresItems', label: 'Key Features bullets', kind: 'list' },
  { key: 'topicsHeading', label: 'Popular Topics heading', kind: 'text' },
  { key: 'topicsItems', label: 'Popular Topics bullets', kind: 'list' },
];

function withDefaults(
  defaults: {
    partnerName: string;
    logoUrl: string;
    bannerEyebrow: string;
    bannerTagline: string;
    bannerHighlights: string[];
    productImageUrl: string;
    calloutAHeading: string;
    calloutABody: string;
    calloutBHeading: string;
    calloutBBody: string;
    featuresHeading: string;
    featuresItems: string[];
    topicsHeading: string;
    topicsItems: string[];
  },
): SlideFieldDef[] {
  return SHARED_LMS_FIELD_BASE.map((base) => {
    const key = base.key as keyof typeof defaults;
    const value = defaults[key];
    if (Array.isArray(value)) {
      return { ...base, defaultList: value };
    }
    return { ...base, defaultValue: value };
  });
}

export const LMS_ZYWAVE_FIELDS: SlideFieldDef[] = withDefaults({
  partnerName: 'Zywave',
  logoUrl: '',
  bannerEyebrow: 'LMS Option · Compliance & HR Training',
  bannerTagline:
    'Deep HR and compliance training maintained by industry experts and kept current with shifting regulations.',
  bannerHighlights: ['Hundreds of courses', 'Regulation-ready', 'Payroll-integrated'],
  productImageUrl: '/zywave2.jpg',
  calloutAHeading: 'Deep HR & Compliance Library',
  calloutABody:
    'Thousands of courses across HR, benefits, OSHA, HIPAA, and workplace conduct. Maintained by industry experts.',
  calloutBHeading: 'Always Current',
  calloutBBody:
    'Content is continuously refreshed as regulations shift, so every course you assign reflects the latest requirements.',
  featuresHeading: 'Key Features',
  featuresItems: [
    'Mobile-friendly, any device',
    'Assign by role, department, or individual',
    'Automated reminders and nudges',
    'Completion tracking with exportable certificates',
    'Audit-ready reports for compliance reviews',
    'Manager dashboards for team progress',
    'Custom courses for your own policies',
  ],
  topicsHeading: 'Popular Training Topics',
  topicsItems: [
    'Harassment Prevention',
    'HIPAA',
    'OSHA',
    'FMLA / ADA Basics',
    'FLSA & Overtime',
    'Code of Conduct',
    'Workplace Safety',
    'Benefits & Wellness',
    'Leadership Fundamentals',
    'Performance Management',
    'Hiring & Interviewing',
    'Data Security Basics',
  ],
});

export const LMS_ETHENA_FIELDS: SlideFieldDef[] = withDefaults({
  partnerName: 'Ethena',
  logoUrl: '/ethenalogo.png',
  bannerEyebrow: 'LMS Option · Modern Compliance Training',
  bannerTagline:
    "Short, engaging compliance courses your team will actually finish. Over 150 topics from harassment prevention to AI at work.",
  bannerHighlights: ['150+ topics', 'Bite-sized lessons', 'Auto-save every 30s'],
  productImageUrl: '/ethena.png',
  calloutAHeading: 'Modern, Engaging Compliance Training',
  calloutABody:
    'Offered on an easy system to deliver and track training. Fully integrated with PrismHR.',
  calloutBHeading: '150+ Topics Covering all compliance needs',
  calloutBBody:
    "Ethena's catalog includes over 150 full-length and mini-courses on the most popular compliance topics.",
  featuresHeading: 'Key Features',
  featuresItems: [
    'Mobile-friendly',
    'Progress saves every 30 seconds',
    'Kiosk and classroom modes available for frontline workers.',
    'Auto-assign training via campaigns',
    'Pre-schedule reminders',
    'Reporting dashboards on completion rates and quiz results',
    'Learner certificates',
  ],
  topicsHeading: 'Popular Training Topics',
  topicsItems: [
    'Harassment Prevention',
    'Diversity, Equity, Inclusion, and Belonging',
    'Data Privacy',
    'Cybersecurity Awareness',
    'Code of Conduct',
    'Management Essentials',
    'Hiring and Interviewing',
    'HIPAA',
    'Anti-Bribery and Corruption',
    'Unconscious Bias',
    'Workplace Violence Prevention',
    'Anti-Money Laundering',
    'Insider Trading',
    'Equity 101',
    'U.S. Export Controls and Sanctions',
    'Workplace Safety',
    'UDAAP',
    'AI in the Workplace',
    'Ethical Management',
  ],
});

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: BRAND_BLUE,
        fontFamily: HEADING_FONT,
        fontWeight: 900,
        fontSize: '22px',
        letterSpacing: '0.02em',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  );
}

function CalloutBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <div
        style={{
          color: BRAND_BLUE,
          fontFamily: HEADING_FONT,
          fontWeight: 900,
          fontSize: '20px',
          lineHeight: 1.2,
          marginBottom: '8px',
          letterSpacing: '0.02em',
        }}
      >
        {heading}
      </div>
      <div style={{ color: BODY_TEXT, fontSize: '15px', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

export function LMSLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const partnerName = asString(data.partnerName);
  const logoUrl = asString(data.logoUrl);
  const bannerEyebrow = asString(data.bannerEyebrow);
  const bannerTagline = asString(data.bannerTagline);
  const bannerHighlights = asList(data.bannerHighlights);
  const productImageUrl = asString(data.productImageUrl);
  const calloutAHeading = asString(data.calloutAHeading);
  const calloutABody = asString(data.calloutABody);
  const calloutBHeading = asString(data.calloutBHeading);
  const calloutBBody = asString(data.calloutBBody);
  const featuresHeading = asString(data.featuresHeading) || 'Key Features';
  const featuresItems = asList(data.featuresItems);
  const topicsHeading = asString(data.topicsHeading) || 'Popular Training Topics';
  const topicsItems = asList(data.topicsItems);

  // Split topics across 4 balanced columns for the full-width bottom row.
  const TOPIC_COLS = 4;
  const topicsPerCol = Math.ceil(topicsItems.length / TOPIC_COLS);
  const topicColumns: string[][] = [];
  for (let i = 0; i < TOPIC_COLS; i += 1) {
    topicColumns.push(topicsItems.slice(i * topicsPerCol, (i + 1) * topicsPerCol));
  }

  return (
    <SlideShell>
      {/* Top blue banner — partner mark + tagline */}
      <div
        style={{
          background: BRAND_BLUE,
          color: '#ffffff',
          padding: '0 50px',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          gap: '28px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '0', flexShrink: 0 }}>
          {logoUrl ? (
            <img
              src={proxiedSrc(logoUrl)}
              alt={partnerName}
              crossOrigin="anonymous"
              style={{
                height: '120px',
                width: 'auto',
                maxWidth: '560px',
                objectFit: 'contain',
                objectPosition: 'left center',
                display: 'block',
                marginLeft: '-10px',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                fontFamily: HEADING_FONT,
                fontSize: '56px',
                fontWeight: 900,
                letterSpacing: '0.01em',
                lineHeight: 1,
              }}
            >
              {partnerName}
            </div>
          )}
        </div>
        {bannerTagline || bannerHighlights.length ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: '20px',
              flex: '0 1 560px',
              padding: '14px 0',
            }}
          >
            <div style={{ width: '3px', background: ACCENT, alignSelf: 'stretch' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '520px' }}>
              {bannerTagline ? (
                <div style={{ fontSize: '14px', color: '#ffffff', lineHeight: 1.55 }}>{bannerTagline}</div>
              ) : null}
              {bannerHighlights.length ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {bannerHighlights.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        border: `1px solid ${ACCENT}`,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ffffff',
                        fontFamily: '"Poppins", "Segoe UI", system-ui, sans-serif',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT }} />
                      {h}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {/* Accent stripe under the banner — light blue instead of gold */}
      <div style={{ height: '6px', background: ACCENT }} />

      {/* Main body: 2 columns, image now occupies full right column height */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: '36px', padding: '22px 50px 0' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <CalloutBlock heading={calloutAHeading} body={calloutABody} />
            <CalloutBlock heading={calloutBHeading} body={calloutBBody} />
          </div>
          <div>
            <SectionHeading>{featuresHeading}</SectionHeading>
            <BulletList items={featuresItems} fontSize={14} gap={5} />
          </div>
        </div>

        {/* Right column — bigger product mockup, fills the full column height */}
        <div
          style={{
            width: '100%',
            height: '340px',
            background: '#e8edf2',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : null}
        </div>
      </div>

      {/* Popular Topics — full-width row across 4 columns */}
      <div style={{ padding: '18px 50px 0' }}>
        <SectionHeading>{topicsHeading}</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 24px' }}>
          {topicColumns.map((col, i) => (
            <BulletList key={i} items={col} fontSize={12.5} gap={4} />
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
