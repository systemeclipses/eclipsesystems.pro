import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BlueHeaderBar,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  BODY_TEXT,
  Glyph,
} from './_shared';
import { asChecklist, asString } from '@/lib/gf1/slide-tokens';

export const PAYROLL_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Payroll Made Easy' },
  {
    key: 'features',
    label: 'Features (toggle to hide, × to delete)',
    kind: 'checklist',
    defaultList: [
      'Easily import data from time and attendance platforms',
      'Specialized payroll reports and data files',
      'Galactic handles all local, state, and federal tax reporting',
      'Maintenance of payroll deductions',
      'ZayZoon automated payroll advance incorporation',
      'Seamlessly integrated benefits deductions for your employees',
      'Direct Deposit of employee net pay',
      'Employees can easily access pay stubs and W-2s in their personal employee portal',
    ],
  },
];

const ICONS = [
  Glyph.Clock,
  Glyph.Folder,
  Glyph.Scales,
  Glyph.Money,
  Glyph.ZayZoon,
  Glyph.Stethoscope,
  Glyph.Bank,
  Glyph.Monitor,
];

function ZayZoonMark({ size = 30 }: { size?: number }) {
  return (
    <img
      src="/zayzoon.svg"
      alt=""
      crossOrigin="anonymous"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

function FeatureRow({ idx, text }: { idx: number; text: string }) {
  const Icon = ICONS[idx % ICONS.length];
  const bg = WEDGE_COLORS[idx % WEDGE_COLORS.length];
  const isZayZoon = idx % ICONS.length === 4;
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
      <div
        style={{
          width: '52px',
          height: '52px',
          background: bg,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isZayZoon ? <ZayZoonMark size={52} /> : <Icon color="#ffffff" size={30} />}
      </div>
      <div style={{ flex: 1, color: BODY_TEXT, fontSize: '17px', fontWeight: 600, lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}

const WEDGE_COLORS = [
  '#005791',
  '#63ADf2',
  '#a7cced',
  '#c3ced5',
  '#005791',
  '#63ADf2',
  '#a7cced',
  '#c3ced5',
];

function Donut() {
  const size = 440;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 210;
  const rInner = 120;
  const segments = 8;
  const slotAngle = 360 / segments;
  const gap = 4;
  const roundCoord = (value: number) => Number(value.toFixed(4));

  function polar(r: number, deg: number): [number, number] {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [roundCoord(cx + r * Math.cos(rad)), roundCoord(cy + r * Math.sin(rad))];
  }

  function wedgePath(startDeg: number, endDeg: number): string {
    const [x1, y1] = polar(rOuter, startDeg);
    const [x2, y2] = polar(rOuter, endDeg);
    const [x3, y3] = polar(rInner, endDeg);
    const [x4, y4] = polar(rInner, startDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  const iconRadius = (rOuter + rInner) / 2;

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="wedgeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.22" />
          </filter>
        </defs>
        {Array.from({ length: segments }, (_, i) => {
          const startDeg = i * slotAngle + gap;
          const endDeg = (i + 1) * slotAngle - gap;
          return (
            <path
              key={i}
              d={wedgePath(startDeg, endDeg)}
              fill={WEDGE_COLORS[i % WEDGE_COLORS.length]}
              filter="url(#wedgeShadow)"
            />
          );
        })}
      </svg>
      {Array.from({ length: segments }, (_, i) => {
        const midDeg = i * slotAngle + slotAngle / 2;
        const [x, y] = polar(iconRadius, midDeg);
        const Icon = ICONS[i];
        const wedgeColor = WEDGE_COLORS[i % WEDGE_COLORS.length];
        const isZayZoon = i === 4;
        const iconRotation = midDeg;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x - 36}px`,
              top: `${y - 36}px`,
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: wedgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${iconRotation}deg)`,
              }}
            >
              {isZayZoon ? <ZayZoonMark size={76} /> : <Icon color="#ffffff" size={46} />}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: `${cx - 75}px`,
          top: `${cy - 75}px`,
          width: '150px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 100 100" fill={BRAND_BLUE}>
          <circle cx="50" cy="27" r="16" />
          <path d="M14 85 C14 61 28 51 50 51 C72 51 86 61 86 85 L86 89 L14 89 Z" />
        </svg>
      </div>
    </div>
  );
}

export function PayrollLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Payroll Made Easy';
  const features = asChecklist(data.features);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} titleAlign="center" titleFontSize={62} stripeColor="#63ADF2" />

      <div style={{ display: 'flex', padding: '40px 60px', gap: '40px', height: '550px' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut />
        </div>
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'repeat(4, auto)',
            gridAutoFlow: 'column',
            gap: '20px 24px',
            alignContent: 'center',
            marginLeft: '14px',
          }}
        >
          {features.map((t, i) => <FeatureRow key={i} idx={i} text={t} />)}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
