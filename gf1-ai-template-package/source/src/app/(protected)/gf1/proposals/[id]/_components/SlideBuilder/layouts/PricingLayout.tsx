import React from 'react';
import type { SalesContext, SlideFieldDef, SlideFieldValue } from '@/lib/gf1/slide-types';
import {
  BRAND_BLUE,
  BRAND_GOLD,
  SlammedLogo,
  HEADING_FONT,
  SlideShell,
  BODY_TEXT,
  MUTED_TEXT,
} from './_shared';
import { asList, asString } from '@/lib/gf1/slide-tokens';

export const PRICING_FIELDS: SlideFieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', defaultValue: 'Pricing & Investment' },
  { key: 'subtitle', label: 'Subtitle', kind: 'text', defaultValue: 'Pricing valid through {{date.monthYear}}' },
  {
    key: 'adminFeeNote',
    label: 'Admin Fee note',
    kind: 'text',
    defaultValue: 'Includes payroll processing, HR support, employee portal, onboarding, and reporting.',
  },
  {
    key: 'taxesNote',
    label: 'Employer taxes note',
    kind: 'multiline',
    defaultValue:
      'FICA (Social Security + Medicare): 7.65% of gross wages.\nFUTA: 0.6% on first $7,000 of wages per employee.\nSUTA rates vary by state and employer experience.',
  },
  {
    key: 'wcNote',
    label: 'Workers Comp note',
    kind: 'text',
    defaultValue: 'Workers Compensation premium calculated per state class code shown below.',
  },
  {
    key: 'tableRows',
    label: 'WC / SUTA Table — leave empty to auto-fill from proposal pricing',
    kind: 'pricing_rows',
    defaultList: [],
  },
];

type TableRow = {
  state: string;
  wcClassCode: string;
  wcSellingRate: number | null;
  sutaRate: number | null;
};

function parseRate(raw: string): number | null {
  const cleaned = raw.replace(/%/g, '').trim();
  if (cleaned === '' || cleaned === '—' || cleaned === '-') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseTableRow(raw: string): TableRow | null {
  const parts = raw.split('|').map((p) => p.trim());
  if (parts.length === 0 || parts.every((p) => p === '')) return null;
  return {
    state: parts[0] ?? '',
    wcClassCode: parts[1] ?? '',
    wcSellingRate: parts[2] != null ? parseRate(parts[2]) : null,
    sutaRate: parts[3] != null ? parseRate(parts[3]) : null,
  };
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function fmtRate(n: number | null | undefined): string {
  if (n == null) return '—';
  // SUTA / WC selling rates are stored as percentage values (e.g. 0.95 means
  // 0.95%, 2.7 means 2.7%) — math elsewhere divides by 100 — so format
  // directly without multiplying.
  return `${n.toFixed(2)}%`;
}

function SidebarStat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        paddingBottom: '14px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          color: BRAND_GOLD,
          letterSpacing: '0.1em',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '28px',
          color: '#ffffff',
          fontFamily: HEADING_FONT,
          fontWeight: 900,
          letterSpacing: '0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {caption ? (
        <span style={{ fontSize: '11px', color: '#cfe5f5' }}>{caption}</span>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: BRAND_BLUE,
        fontFamily: HEADING_FONT,
        fontWeight: 900,
        fontSize: '18px',
        letterSpacing: '0.02em',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: `2px solid ${BRAND_GOLD}`,
      }}
    >
      {children}
    </div>
  );
}

export function PricingLayout({
  data,
  ctx,
}: {
  data: Record<string, SlideFieldValue>;
  ctx?: SalesContext;
}) {
  const title = asString(data.title) || 'Pricing & Investment';
  const subtitle = asString(data.subtitle);
  const adminFeeNote = asString(data.adminFeeNote);
  const taxesNote = asString(data.taxesNote);
  const wcNote = asString(data.wcNote);

  const pricing = ctx?.pricing;
  const oneTimeFees = pricing?.oneTimeFees ?? [];

  // If the user has typed rows into the editable table field, use those.
  // Otherwise auto-fill from the proposal's saved pricing data so the table
  // populates without manual entry on first load.
  const customRows = asList(data.tableRows)
    .map(parseTableRow)
    .filter((row): row is TableRow => row != null);
  const statePricings: TableRow[] =
    customRows.length > 0
      ? customRows
      : (pricing?.statePricings ?? []).map((sp) => ({
          state: sp.state,
          wcClassCode: sp.wcClassCode,
          wcSellingRate: sp.wcSellingRate,
          sutaRate: sp.sutaRate,
        }));
  const employeeCount = pricing?.employeeCount ?? ctx?.org.employees ?? null;
  const payFrequency = ctx?.org.payFrequencyLabel ?? '—';
  const adminFee = pricing?.adminFeeFormatted ?? '—';
  const adminFeeBasis = pricing?.adminFeeBasisLabel ?? '';
  const timekeepingFee = pricing?.timekeepingFeeFormatted ?? null;
  const lmsFee = pricing?.lmsFeeFormatted ?? null;

  return (
    <SlideShell>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Sidebar */}
        <div
          style={{
            width: '300px',
            flexShrink: 0,
            background: BRAND_BLUE,
            color: '#ffffff',
            padding: '56px 28px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '6px',
              background: BRAND_GOLD,
            }}
          />
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BRAND_GOLD,
            }}
          >
            Your Investment
          </div>
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: '44px',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            Pricing
          </div>
          {subtitle ? (
            <div style={{ fontSize: '12px', color: '#cfe5f5', lineHeight: 1.5, marginBottom: '10px' }}>
              {subtitle}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <SidebarStat label="Employees" value={employeeCount != null ? String(employeeCount) : '—'} />
            <SidebarStat label="Pay Frequency" value={payFrequency} />
            <SidebarStat label="Admin Fee" value={adminFee} caption={adminFeeBasis} />
            {timekeepingFee ? (() => {
              const idx = timekeepingFee.indexOf(' per ');
              const value = idx > 0 ? timekeepingFee.slice(0, idx) : timekeepingFee;
              const caption = idx > 0 ? timekeepingFee.slice(idx + 1) : undefined;
              return <SidebarStat label="Timekeeping Fee" value={value} caption={caption} />;
            })() : null}
            {lmsFee ? (() => {
              const idx = lmsFee.indexOf(' per ');
              const value = idx > 0 ? lmsFee.slice(0, idx) : lmsFee;
              const caption = idx > 0 ? lmsFee.slice(idx + 1) : undefined;
              return <SidebarStat label="LMS Fee" value={value} caption={caption} />;
            })() : null}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '40px 50px 20px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
          <div
            style={{
              width: '80px',
              height: '5px',
              background: BRAND_GOLD,
            }}
          />

          {adminFeeNote ? (
            <div style={{ fontSize: '13px', color: BODY_TEXT, lineHeight: 1.45 }}>{adminFeeNote}</div>
          ) : null}

          {/* Workers Comp / SUTA table */}
          <div>
            <SectionTitle>Workers Compensation &amp; SUTA by State</SectionTitle>
            {statePricings.length === 0 ? (
              <div style={{ fontSize: '12px', color: MUTED_TEXT, fontStyle: 'italic' }}>
                No state pricing entered yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', color: BODY_TEXT }}>
                <thead>
                  <tr style={{ background: BRAND_BLUE, color: '#ffffff' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>State</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>WC Class Code</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>WC Selling Rate</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>SUTA Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statePricings.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f5f9fc' }}>
                      <td style={{ padding: '6px 10px' }}>{row.state}</td>
                      <td style={{ padding: '6px 10px' }}>{row.wcClassCode || '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtRate(row.wcSellingRate)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtRate(row.sutaRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {wcNote ? (
              <div style={{ marginTop: '4px', fontSize: '11px', color: MUTED_TEXT }}>{wcNote}</div>
            ) : null}
          </div>

          {/* Two columns: employer taxes + one time fees */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <SectionTitle>Employer Taxes</SectionTitle>
              <div style={{ fontSize: '12.5px', color: BODY_TEXT, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {taxesNote}
              </div>
            </div>
            <div>
              <SectionTitle>One-Time Fees</SectionTitle>
              {oneTimeFees.length === 0 ? (
                <div style={{ fontSize: '12px', color: MUTED_TEXT, fontStyle: 'italic' }}>None</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', color: BODY_TEXT }}>
                  <tbody>
                    {oneTimeFees.map((fee, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e0e7ee' }}>
                        <td style={{ padding: '4px 0' }}>{fee.label}</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700 }}>
                          {fmtMoney(fee.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '18px', right: '30px' }}>
        <SlammedLogo height={30} />
      </div>
    </SlideShell>
  );
}
