import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BlueHeaderBar,
  SlammedLogo,
  PlaceholderImage,
  SlideShell,
  BODY_TEXT,
  Glyph,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const BENEFITS_ENROLLMENT_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Streamlined Benefits Enrollment' },
  { key: 'screenshotUrl', label: 'Screenshot URL', kind: 'image_url', defaultValue: '/benefitsenrollment.png' },
  {
    key: 'features',
    label: 'Features (Title : Description, one per line)',
    kind: 'list',
    defaultList: [
      'Easy Enrollment on Any Device : Managing benefit elections is simple no matter what device an employee uses (desktop, laptop, or mobile).',
      'Crystal Clear Plan Comparison : An intuitive user experience and online tools help employees make selections that fit their needs.',
      'Faster, More Accurate Enrollment : Alerts let employees know when required information is missing, taking the manual effort out of following up to ensure selections are completed.',
      'Happier, Healthier Employees : Employees who are better informed about their plan options can more confidently enroll in the right plans and take advantage of benefits.',
    ],
  },
];

const ENROLL_ICONS = [Glyph.Phone, Glyph.Search, Glyph.Bolt, Glyph.Heart];

function FootItem({ idx, raw }: { idx: number; raw: string }) {
  const Icon = ENROLL_ICONS[idx % ENROLL_ICONS.length];
  const [head, ...rest] = raw.split(':');
  const title = head.trim();
  const desc = rest.join(':').trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '0 14px' }}>
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: '#e3eef7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
        }}
      >
        <Icon color={BRAND_BLUE} size={22} />
      </div>
      <div style={{ color: BRAND_BLUE, fontWeight: 800, fontSize: '15px', textAlign: 'center', marginBottom: '4px' }}>
        {title}
      </div>
      {desc ? (
        <div style={{ color: BODY_TEXT, fontSize: '13px', lineHeight: 1.4, textAlign: 'center' }}>{desc}</div>
      ) : null}
    </div>
  );
}

export function BenefitsEnrollmentLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Streamlined Benefits Enrollment';
  const features = asList(data.features);
  const screenshot = asString(data.screenshotUrl);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={110} titleAlign="center" />

      <div style={{ display: 'flex', padding: '28px 50px', gap: '40px', height: '380px', alignItems: 'center', justifyContent: 'center' }}>
        {screenshot ? (
          <img
            src={proxiedSrc(screenshot)}
            alt=""
            crossOrigin="anonymous"
            style={{
              maxWidth: '720px',
              maxHeight: '340px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <PlaceholderImage width={560} height={280} src={screenshot} rounded={6} background="#e8edf2" />
        )}
      </div>

      <div style={{ display: 'flex', padding: '0 50px 30px', gap: '12px' }}>
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
