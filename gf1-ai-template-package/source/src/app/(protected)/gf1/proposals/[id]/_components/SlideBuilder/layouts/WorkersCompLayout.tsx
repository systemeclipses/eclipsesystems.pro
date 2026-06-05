import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  BODY_TEXT,
  proxiedSrc,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const WORKERS_COMP_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: "Workers' Compensation Administration" },
  { key: 'imageUrl', label: 'Photo URL', kind: 'image_url', defaultValue: '/wc4.png' },
  {
    key: 'item1Heading',
    label: 'Item 1 heading',
    kind: 'text',
    defaultValue: 'Pay-as-you-go premiums',
  },
  {
    key: 'item1Description',
    label: 'Item 1 description',
    kind: 'multiline',
    defaultValue:
      'Premiums are calculated directly off actual payroll. Cash flow stays predictable and aligned with real wages.',
  },
  {
    key: 'item2Heading',
    label: 'Item 2 heading',
    kind: 'text',
    defaultValue: 'Consultative claims service with 24/7 hotline',
  },
  {
    key: 'item2Description',
    label: 'Item 2 description',
    kind: 'multiline',
    defaultValue:
      "Injuries are reported immediately. Claims are triaged by workers' comp specialists who guide supervisors and employees through next steps, help control claim severity, and ensure proper documentation from day one.",
  },
  {
    key: 'item3Heading',
    label: 'Item 3 heading',
    kind: 'text',
    defaultValue: 'Audit services',
  },
  {
    key: 'item3Description',
    label: 'Item 3 description',
    kind: 'multiline',
    defaultValue:
      'Galactic manages carrier audits on your behalf, including payroll reconciliation, class code review, and documentation support. This reduces audit risk, prevents misclassification issues, and minimizes unexpected additional premiums.',
  },
];

function WcIcon({ src, size = 96 }: { src: string; size?: number }) {
  return (
    <img
      src={proxiedSrc(src)}
      alt=""
      crossOrigin="anonymous"
      style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', display: 'block' }}
    />
  );
}

function FeatureRow({
  icon,
  heading,
  description,
}: {
  icon: React.ReactNode;
  heading: string;
  description: string;
}) {
  return (
    <div style={{ display: 'flex', gap: '22px', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: '96px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '0.02em',
            marginBottom: '8px',
            lineHeight: 1.15,
          }}
        >
          {heading}
        </div>
        <div style={{ color: BODY_TEXT, fontSize: '16px', lineHeight: 1.55 }}>{description}</div>
      </div>
    </div>
  );
}

export function WorkersCompLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || "Workers' Compensation Administration";
  const imageUrl = asString(data.imageUrl);
  const h1 = asString(data.item1Heading);
  const d1 = asString(data.item1Description);
  const h2 = asString(data.item2Heading);
  const d2 = asString(data.item2Description);
  const h3 = asString(data.item3Heading);
  const d3 = asString(data.item3Description);

  return (
    <SlideShell>
      {/* Brand-blue top bar */}
      <div style={{ height: '24px', background: BRAND_BLUE }} />

      {/* Title */}
      <div style={{ padding: '50px 50px 0' }}>
        <h1
          style={{
            margin: 0,
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontSize: '42px',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Main content — features on left, photo on right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 460px',
          gap: '40px',
          padding: '28px 50px 0',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          <FeatureRow icon={<WcIcon src="/wc1.png" />} heading={h1} description={d1} />
          <FeatureRow icon={<WcIcon src="/wc2.png" />} heading={h2} description={d2} />
          <FeatureRow icon={<WcIcon src="/wc3.png" />} heading={h3} description={d3} />
        </div>

        <div style={{ width: '100%', aspectRatio: '1 / 0.85', background: '#e8edf2', borderRadius: '4px', overflow: 'hidden' }}>
          {imageUrl ? (
            <img
              src={proxiedSrc(imageUrl)}
              alt=""
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : null}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '22px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
