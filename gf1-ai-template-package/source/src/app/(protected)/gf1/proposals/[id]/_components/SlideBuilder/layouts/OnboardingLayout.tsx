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
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const ONBOARDING_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Seamlessly Onboard New Employees' },
  { key: 'screenshotUrl', label: 'Screenshot URL', kind: 'image_url', defaultValue: '/onboard.png' },
  {
    key: 'features',
    label: 'Features (Title : Description, one per line)',
    kind: 'list',
    defaultList: [
      'Paperless Onboarding : New employees can quickly complete required employment forms, view faculty and organization charts, watch videos, and more.',
      'Custom Workflows : Create custom onboarding plans for both new hires and internal movement of employees from one position to another.',
      'Employee Self-Service : The Employee Portal allows new employees to access forms, videos, calendars, policies, and benefit information at any time.',
      'Securely Track Documents : All forms and documents are securely tracked and stored electronically. Digital signatures can be easily captured for complete and auditable records.',
    ],
  },
];

const ICONS = [Glyph.Doc, Glyph.Bolt, Glyph.Phone, Glyph.Lock];

function FootItem({ idx, raw }: { idx: number; raw: string }) {
  const Icon = ICONS[idx % ICONS.length];
  const [head, ...rest] = raw.split(':');
  const title = head.trim();
  const desc = rest.join(':').trim();
  return (
    <div style={{ flex: 1, padding: '0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <Icon color={BRAND_BLUE} size={20} />
        <div style={{ color: BRAND_BLUE, fontWeight: 800, fontSize: '14px' }}>{title}</div>
      </div>
      <div style={{ color: BODY_TEXT, fontSize: '12.5px', lineHeight: 1.45 }}>{desc}</div>
    </div>
  );
}

export function OnboardingLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Seamlessly Onboard New Employees';
  const features = asList(data.features);
  const screenshot = asString(data.screenshotUrl);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={100} titleAlign="center" />

      <div style={{ display: 'flex', padding: '24px 60px', gap: '40px', height: '380px', alignItems: 'center', justifyContent: 'center' }}>
        <PlaceholderImage width={760} height={360} src={screenshot} rounded={6} background="#e8edf2" />
      </div>

      <div style={{ display: 'flex', padding: '24px 40px 32px' }}>
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
