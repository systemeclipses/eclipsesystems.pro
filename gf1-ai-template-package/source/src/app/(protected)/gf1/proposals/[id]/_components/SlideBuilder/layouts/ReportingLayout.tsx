import React from 'react';
import type { SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BlueHeaderBar,
  SlammedLogo,
  PlaceholderImage,
  SlideShell,
  BODY_TEXT,
} from './_shared';
import { asString } from '@/lib/gf1/slide-tokens';

export const REPORTING_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Reporting & Analytics You Can Trust' },
  {
    key: 'sectionAHeading',
    label: 'Section A heading',
    kind: 'text',
    defaultValue: 'Simple, Yet Powerful Reporting',
  },
  {
    key: 'sectionADescription',
    label: 'Section A description',
    kind: 'multiline',
    defaultValue:
      'Using a simple and easy-to-use dashboard, you can search to quickly find any report you need and add frequently-used reports to the "favorites" menu for faster access. Pre-built reports let you quickly access payroll, HR and employee data that can be filtered using a wide range of parameters.',
  },
  { key: 'sectionAImageUrl', label: 'Section A Screenshot URL', kind: 'image_url', defaultValue: '/reporting 1.png' },
  {
    key: 'sectionBHeading',
    label: 'Section B heading',
    kind: 'text',
    defaultValue: 'Advanced Reporting with Data Retriever',
  },
  {
    key: 'sectionBDescription',
    label: 'Section B description',
    kind: 'multiline',
    defaultValue:
      'Go deeper and get the specific data you want with Data Retriever. Data Retriever makes it easy to select the data you want and quickly view or export to Excel. Additionally, if there is information that you need to access on an ongoing basis, you can create and save templates within Data Retriever.',
  },
  { key: 'sectionBImageUrl', label: 'Section B Screenshot URL', kind: 'image_url', defaultValue: '/reporting 2.png' },
];

function Section({
  heading,
  description,
  imgUrl,
  flipped,
  imageOffsetY = 0,
  imageWidth = 500,
  imageHeight = 280,
}: {
  heading: string;
  description: string;
  imgUrl: string;
  flipped?: boolean;
  imageOffsetY?: number;
  imageWidth?: number;
  imageHeight?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
        flexDirection: flipped ? 'row-reverse' : 'row',
      }}
    >
      <div style={{ flexShrink: 0, boxShadow: '0 10px 18px rgba(0,0,0,0.22)', transform: `translateY(${imageOffsetY}px)` }}>
        <PlaceholderImage width={imageWidth} height={imageHeight} src={imgUrl} rounded={0} background="transparent" border="none" />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color: BRAND_BLUE,
            fontWeight: 900,
            fontSize: '25px',
            letterSpacing: '-0.01em',
            marginBottom: '10px',
          }}
        >
          {heading}
        </div>
        <div style={{ color: BODY_TEXT, fontSize: '18px', lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  );
}

export function ReportingLayout({ data }: { data: Record<string, SlideFieldValue> }) {
  const title = asString(data.title) || 'Reporting & Analytics You Can Trust';
  const sA = asString(data.sectionAHeading);
  const sADesc = asString(data.sectionADescription);
  const sAImg = asString(data.sectionAImageUrl);
  const sB = asString(data.sectionBHeading);
  const sBDesc = asString(data.sectionBDescription);
  const sBImg = asString(data.sectionBImageUrl);

  return (
    <SlideShell>
      <BlueHeaderBar title={title} height={96} titleAlign="center" />

      <div style={{ padding: '20px 60px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Section heading={sA} description={sADesc} imgUrl={sAImg} />
          <Section heading={sB} description={sBDesc} imgUrl={sBImg} flipped imageOffsetY={-30} imageWidth={460} imageHeight={250} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '24px' }}>
        <SlammedLogo height={32} />
      </div>
    </SlideShell>
  );
}
