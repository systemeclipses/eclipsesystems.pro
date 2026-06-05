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
import { asChecklist, asString } from '@/lib/gf1/slide-tokens';

export const BENEFITS_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Comprehensive Benefits Built for Your Team' },
  { key: 'imageUrl', label: 'Photo URL', kind: 'image_url', defaultValue: '/benefits 2.jpg' },
  {
    key: 'items',
    label: 'Benefit Items (toggle to hide, × to delete)',
    kind: 'checklist',
    subtitled: true,
    defaultList: [
      'GalactiCare Health Coverage : Comprehensive health insurance coverage for your team.',
      'Dental & Vision Plans : Quality dental and vision options to round out the benefits package.',
      'Eligibility Notification : Galactic notifies employees when they become eligible to enroll.',
      'Section 125 Cafeteria Plan : Pre-tax savings on premiums for qualifying medical, dental, and vision.',
      'Voluntary Group Plans : Optional supplemental plans your employees can elect on their own.',
      'Competitive Rates : Plans priced on company size with competitive disability rates.',
    ],
  },
];

const BENEFIT_ICONS = [Glyph.Heart, Glyph.Doc, Glyph.Bolt, Glyph.Users, Glyph.Money, Glyph.Shield];

function BenefitItem({ idx, raw }: { idx: number; raw: string }) {
  const Icon = BENEFIT_ICONS[idx % BENEFIT_ICONS.length];
  const [head, ...rest] = raw.split(':');
  const title = head.trim();
  const desc = rest.join(':').trim();
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          background: BRAND_BLUE,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon color="#ffffff" size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: BRAND_BLUE, fontSize: '17px', fontWeight: 800, marginBottom: '2px' }}>{title}</div>
        {desc ? (
          <div style={{ color: BODY_TEXT, fontSize: '14px', lineHeight: 1.4 }}>{desc}</div>
        ) : null}
      </div>
    </div>
  );
}

export function BenefitsLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Comprehensive Benefits Built for Your Team';
  const items = asChecklist(data.items);
  const imgUrl = asString(data.imageUrl);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={180} titleAlign="right" titleMaxWidth={820} goldStripeHeight={14} titleLineHeight={1.1} stripeColor="#a7cced" />

      <div style={{ display: 'flex', padding: '34px 50px', gap: '36px', height: '540px' }}>
        <div
          style={{
            flexShrink: 0,
            alignSelf: 'flex-start',
            marginTop: '-110px',
            marginLeft: '0px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <PlaceholderImage width={540} height={540} src={imgUrl} rounded={0} background="transparent" border="none" />
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 26px', alignContent: 'start', marginLeft: '20px' }}>
          {items.map((raw, i) => (
            <BenefitItem key={i} idx={i} raw={raw} />
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
