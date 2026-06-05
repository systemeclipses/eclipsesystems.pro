import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BlueHeaderBar,
  SlammedLogo,
  SlideShell,
  BODY_TEXT,
  Glyph,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const APPLICANT_TRACKING_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Applicant Tracking System' },
  { key: 'screenshotTopUrl', label: 'Top Screenshot URL', kind: 'image_url', defaultValue: '/track2.png' },
  { key: 'screenshotBottomUrl', label: 'Bottom Screenshot URL', kind: 'image_url', defaultValue: '/track1.png' },
  {
    key: 'introHeading',
    label: 'First heading',
    kind: 'text',
    defaultValue: 'Hire the right talent, faster',
  },
  {
    key: 'intro',
    label: 'First paragraph',
    kind: 'multiline',
    defaultValue:
      'Find qualified candidates, assess skills, and streamline communication so you can hire the right talent faster.',
  },
  {
    key: 'secondHeading',
    label: 'Second heading',
    kind: 'text',
    defaultValue: 'Know what’s working',
  },
  {
    key: 'secondBody',
    label: 'Second paragraph',
    kind: 'multiline',
    defaultValue:
      'Real-time dashboards show where your best candidates are coming from, how long it takes to fill each role, and where applicants drop off, so you can double down on what actually works.',
  },
  {
    key: 'features',
    label: 'Footer features (Title : Description, one per line)',
    kind: 'list',
    defaultList: [
      'Automated Job Posting : Post jobs to your website career portal plus job boards and social media like Indeed, LinkedIn, and Facebook with a single click.',
      'Candidate Communication : Improve engagement and time-to-hire by communicating with candidates through automated email messages and SMS texting.',
      'Custom Screening Questions : Score and rank candidates as they apply. Automatically screen out candidates that don’t meet minimum qualifications.',
      'Tag and Keyword Matching : Automatically review and filter resumes for keywords and skills that match your jobs’ requirements.',
    ],
  },
];

const FEAT_ICONS = [Glyph.Megaphone, Glyph.Phone, Glyph.Check, Glyph.Users];

function FootItem({ idx, raw }: { idx: number; raw: string }) {
  const Icon = FEAT_ICONS[idx % FEAT_ICONS.length];
  const [head, ...rest] = raw.split(':');
  const title = head.trim();
  const desc = rest.join(':').trim();
  return (
    <div style={{ flex: '0 0 270px', padding: '0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <Icon color={BRAND_BLUE} size={26} />
        <div style={{ color: BRAND_BLUE, fontWeight: 800, fontSize: '15px' }}>{title}</div>
      </div>
      <div style={{ color: BODY_TEXT, fontSize: '13px', lineHeight: 1.45 }}>{desc}</div>
    </div>
  );
}

export function ApplicantTrackingLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Applicant Tracking System';
  const screenshotTop = asString(data.screenshotTopUrl);
  const screenshotBottom = asString(data.screenshotBottomUrl);
  const introHeading = asString(data.introHeading);
  const intro = asString(data.intro);
  const secondHeading = asString(data.secondHeading);
  const secondBody = asString(data.secondBody);
  const features = asList(data.features);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={96} titleAlign="center" stripeColor="#63ADF2" />

      <div
        style={{
          display: 'flex',
          padding: '28px 50px',
          gap: '30px',
          height: '380px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
          }}
        >
          {screenshotTop ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '70%',
                height: '70%',
                boxShadow: '0 12px 24px rgba(0,0,0,0.22)',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#ffffff',
                zIndex: 1,
              }}
            >
              <img
                src={proxiedSrc(screenshotTop)}
                alt=""
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : null}
          {screenshotBottom ? (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '70%',
                height: '62%',
                boxShadow: '0 12px 24px rgba(0,0,0,0.28)',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#ffffff',
                zIndex: 2,
              }}
            >
              <img
                src={proxiedSrc(screenshotBottom)}
                alt=""
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : null}
        </div>
        <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            {introHeading ? (
              <div
                style={{
                  color: BRAND_BLUE,
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '0.02em',
                  marginBottom: '6px',
                  lineHeight: 1.15,
                }}
              >
                {introHeading}
              </div>
            ) : null}
            {intro ? (
              <p
                style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 1.45,
                }}
              >
                {intro}
              </p>
            ) : null}
          </div>
          <div>
            {secondHeading ? (
              <div
                style={{
                  color: BRAND_BLUE,
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '0.02em',
                  marginBottom: '6px',
                  lineHeight: 1.15,
                }}
              >
                {secondHeading}
              </div>
            ) : null}
            {secondBody ? (
              <p
                style={{
                  margin: 0,
                  color: '#1f2937',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: 1.45,
                }}
              >
                {secondBody}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '28px 40px 28px', justifyContent: 'space-between', gap: '20px' }}>
        {features.map((raw, i) => (
          <FootItem key={i} idx={i} raw={raw} />
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
