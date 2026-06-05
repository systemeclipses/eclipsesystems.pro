import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BulletList,
  CornerChevron,
  DiamondImage,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  proxiedSrc,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const HR_SERVICES_FIELDS: SlideFieldDef[] = [
  {
    key: 'title',
    label: 'Title',
    kind: 'text',
    defaultValue: 'Reliable HR Services Tailored to Your Team',
  },
  {
    key: 'features',
    label: 'Bulleted Items (one per line)',
    kind: 'list',
    defaultList: [
      'Compliance with state & federal agencies on Form W-4, I-9, E-Verify and state withholding forms',
      'WOTC Tax Credits for applicable new hires',
      'EPLI Coverage limits $1,000,000 / $2,000,000 ($25k deductible)',
      'Time and Attendance via webclock, phone app with geo-fencing, timeclock hardware with dashboard, reporting, exceptions, and integration with payroll',
      'Assistance in HR areas (FLSA, ADA, FMLA, Terminations, Discrimination, Sexual Harassment)',
      'HIPAA & Cobra administration',
      'Assistance with design and publishing of Employee Handbooks',
    ],
  },
  { key: 'imageA', label: 'Photo 1 URL', kind: 'image_url', defaultValue: '/Logomark.png' },
  { key: 'imageB', label: 'Photo 2 URL', kind: 'image_url', defaultValue: '/hr pic 2.jpg' },
  { key: 'imageC', label: 'Photo 3 URL', kind: 'image_url', defaultValue: '/hr pic 1.jpg' },
];

export function HRServicesLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Reliable HR Services';
  const features = asList(data.features);
  const imgA = asString(data.imageA);
  const imgB = asString(data.imageB);
  const imgC = asString(data.imageC);

  const titleLines = title.split(/\s*(?:\/|\|)\s*/).map((s) => s.trim());

  return (
    <SlideShell>
      <CornerChevron position="top-left" offsetX={60} />
      <CornerChevron position="bottom-left" offsetX={60} />
      {/* Small diamond photos to the right of each triangle */}
      <div style={{ position: 'absolute', left: '250px', top: '-20px' }}>
        <DiamondImage size={360} src={imgB} background="#dde3ea" />
      </div>
      <div style={{ position: 'absolute', left: '250px', bottom: '-20px' }}>
        <DiamondImage size={360} src={imgC} background="#dde3ea" />
      </div>

      {/* Photo (or default logomark) between the two corner chevrons */}
      <div
        style={{
          position: 'absolute',
          left: '-15px',
          top: '150px',
          width: '420px',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgA ? (
          <img
            src={proxiedSrc(imgA)}
            alt=""
            crossOrigin="anonymous"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </div>

      {/* Right column: title + bullets */}
      <div style={{ position: 'absolute', left: '670px', right: '20px', top: '60px' }}>
        <h1
          style={{
            margin: 0,
            color: BRAND_BLUE,
            fontFamily: HEADING_FONT,
            fontSize: '42px',
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: '0.02em',
            marginBottom: '28px',
            textAlign: 'center',
          }}
        >
          {titleLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </h1>
        <BulletList items={features} fontSize={17} gap={10} bulletColor={BRAND_BLUE} />
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
