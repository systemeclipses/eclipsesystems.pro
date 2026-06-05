import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  CornerRibbon,
  SlammedLogo,
  HEADING_FONT,
  BODY_FONT,
  SlideShell,
  BODY_TEXT,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const HOW_IT_WORKS_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'How Does It Work?' },
  { key: 'tagline', label: 'Tagline', kind: 'multiline', defaultValue: 'Galactic is a PEO (Professional Employer Organization).' },
  { key: 'taglineHighlight', label: 'Tagline Highlight Word', kind: 'text', defaultValue: 'PEO' },
  {
    key: 'paragraph',
    label: 'Body Paragraph',
    kind: 'multiline',
    defaultValue:
      'Galactic partners with you to manage HR functions like payroll, benefits, compliance, and more. We act as your administrative employer, while you remain as the job site employer. Galactic works to improve your business by streamlining HR operations, reducing administrative burdens, ensuring compliance, and giving you access to better employee benefits so you can focus on growing your business.',
  },
  { key: 'step1Title', label: 'Step 1 Title', kind: 'text', defaultValue: 'Focus on Your Business' },
  {
    key: 'step1Body',
    label: 'Step 1 Body',
    kind: 'multiline',
    defaultValue:
      'By outsourcing payroll and administrative tasks to Galactic, you add productive hours to your business.',
  },
  { key: 'step2Title', label: 'Step 2 Title', kind: 'text', defaultValue: "You're the Boss" },
  {
    key: 'step2Body',
    label: 'Step 2 Body',
    kind: 'multiline',
    defaultValue:
      "You're the job site employer. You'll still be responsible for hiring, firing, and supervising your employees.",
  },
];

function highlightWord(text: string, highlight: string) {
  if (!highlight) return text;
  const idx = text.indexOf(highlight);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: BRAND_GOLD }}>{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function ChevronStep({ title, body }: { title: string; body: string }) {
  const arrowPoints = '0,0 74,0 114,50 74,100 0,100 40,50';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div
        style={{
          width: '114px',
          height: '100px',
          flexShrink: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="-4 -4 122 108"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <polygon
            points={arrowPoints}
            fill={BRAND_GOLD}
            stroke="#ffffff"
            strokeWidth={3}
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div style={{ flex: 1, color: '#ffffff', textAlign: 'center', padding: '0 12px' }}>
        <div
          style={{
            fontFamily: BODY_FONT,
            fontSize: '24px',
            fontWeight: 900,
            marginBottom: '0px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: '310px',
            margin: '0 auto',
            fontFamily: BODY_FONT,
            fontSize: '15px',
            lineHeight: 1.4,
            fontWeight: 600,
            letterSpacing: 0,
            wordSpacing: 'normal',
            whiteSpace: 'normal',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

export function HowItWorksLayout({
  data,
  renderMode,
}: {
  data: Record<string, SlideFieldValue>;
  renderMode?: 'preview' | 'export';
}) {
  const title = asString(data.title) || 'How Does It Work?';
  const tagline = asString(data.tagline);
  const highlight = asString(data.taglineHighlight);
  const paragraph = asString(data.paragraph);
  const s1t = asString(data.step1Title);
  const s1b = asString(data.step1Body);
  const s2t = asString(data.step2Title);
  const s2b = asString(data.step2Body);

  return (
    <SlideShell>
      <CornerRibbon
        position="top-left"
        scale={0.9}
        variant="gold-on-top"
        flipY={renderMode === 'export'}
        stripeAngle={51}
        goldWidth={20}
        blueWidth={58}
      />
      <CornerRibbon position="bottom-right" scale={0.9} variant="gold-on-top" flipY stripeAngle={51} goldWidth={20} blueWidth={58} />

      <div style={{ position: 'absolute', top: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>

      <div style={{ position: 'absolute', top: '82px', left: 0, right: 0, textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontSize: '78px',
            fontWeight: 900,
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '210px',
          left: '90px',
          right: '90px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', fontWeight: 700, color: '#1f1f1f' }}>
          {highlightWord(tagline, highlight)}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '300px',
          left: '90px',
          right: '90px',
        }}
      >
        <p style={{ margin: 0, color: BODY_TEXT, fontSize: '20px', lineHeight: 1.55, textAlign: 'center' }}>
          {paragraph}
        </p>
      </div>

      {/* Two-step arrow ribbon */}
      <div
        style={{
          position: 'absolute',
          left: '90px',
          right: '90px',
          bottom: '90px',
          height: '170px',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="-10 -10 1120 190"
          preserveAspectRatio="none"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <polygon
            points="0,0 1030,0 1100,85 1030,170 0,170 70,85"
            fill={BRAND_BLUE}
            stroke={BRAND_GOLD}
            strokeWidth={14}
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 80px',
            gap: '24px',
          }}
        >
          <ChevronStep title={s1t} body={s1b} />
          <ChevronStep title={s2t} body={s2b} />
        </div>
      </div>
    </SlideShell>
  );
}
