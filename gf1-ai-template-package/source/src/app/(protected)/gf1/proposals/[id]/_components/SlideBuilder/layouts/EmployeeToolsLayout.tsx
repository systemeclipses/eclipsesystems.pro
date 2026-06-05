import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BlueHeaderBar,
  SlammedLogo,
  HEADING_FONT,
  PlaceholderImage,
  SlideShell,
  BODY_TEXT,
  Glyph,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const EMPLOYEE_TOOLS_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Employee Tools in One Place' },
  { key: 'screenshotUrl', label: 'Screenshot URL', kind: 'image_url', defaultValue: '/tools.png' },
  { key: 'rightHeading', label: 'Right Column Heading', kind: 'text', defaultValue: 'Employee Information & Tools' },
  {
    key: 'rightItems',
    label: 'Right Column Bullets (one per line)',
    kind: 'list',
    defaultList: [
      'Benefits details and enrollment',
      'Pay stubs',
      'Paid Time Off requests (and approvals for managers)',
      'Document management (e.g., policies, handbooks)',
      'Personal contact and employment information',
      'Company event and holiday calendar',
      'Tax documents (e.g., W-2)',
      'HR support contacts',
      'Company-wide announcements',
    ],
  },
  {
    key: 'features',
    label: 'Footer features (Title : Description, one per line)',
    kind: 'list',
    defaultList: [
      '24/7 Access from Any Device : With its responsive design, the Employee Portal looks and works great on a smartphone, tablet, laptop or desktop.',
      'Simplify Manager Approvals : At work or on the go, managers can easily review and approve some time off requests—even on mobile devices.',
      'Keep Employee Data Safe : Multi-factor authentication verifies a user\u2019s identity and provides additional security against unauthorized access.',
      'Reduce Support Requests : Employees can quickly retrieve their username or reset their password without assistance from support staff.',
    ],
  },
];

const FEAT_ICONS = [Glyph.Phone, Glyph.Check, Glyph.Lock, Glyph.Megaphone];

function FootItem({ idx, raw }: { idx: number; raw: string }) {
  const Icon = FEAT_ICONS[idx % FEAT_ICONS.length];
  const [head, ...rest] = raw.split(':');
  const title = head.trim();
  const desc = rest.join(':').trim();
  return (
    <div style={{ flex: '0 0 270px', padding: '0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <Icon color={BRAND_BLUE} size={22} />
        <div style={{ color: BRAND_BLUE, fontWeight: 800, fontSize: '15px' }}>{title}</div>
      </div>
      <div style={{ color: BODY_TEXT, fontSize: '13px', lineHeight: 1.45 }}>{desc}</div>
    </div>
  );
}

export function EmployeeToolsLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Employee Tools in One Place';
  const screenshot = asString(data.screenshotUrl);
  const rightHeading = asString(data.rightHeading) || 'Employee Information & Tools';
  const rightItems = asList(data.rightItems);
  const features = asList(data.features);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={92} titleAlign="center" />

      <div style={{ display: 'flex', padding: '24px 50px', gap: '34px', height: '400px' }}>
        <div style={{ flex: 1 }}>
          <PlaceholderImage width="100%" height={360} src={screenshot} rounded={6} background="#e8edf2" />
        </div>
        <div style={{ width: '380px' }}>
          <h2
            style={{
              margin: '0 0 14px 0',
              color: BRAND_BLUE,
              fontFamily: HEADING_FONT,
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '0.02em',
            }}
          >
            {rightHeading}
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {rightItems.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', color: BODY_TEXT, fontSize: '14px', marginBottom: '5px', lineHeight: 1.4 }}>
                <span style={{ color: BRAND_BLUE, fontWeight: 900 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
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
