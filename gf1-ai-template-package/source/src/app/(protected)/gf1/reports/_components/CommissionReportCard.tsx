'use client';

import type { CommissionRecord } from '@/lib/gf1/reports-types';
import { formatCurrency, calculateAverage, toCSV, downloadFile, exportPDF } from '@/lib/gf1/reports-utils';

interface CommissionReportCardProps {
  commissions: CommissionRecord[];
  showWcMetrics?: boolean;
}

export function CommissionReportCard({ commissions, showWcMetrics = false }: CommissionReportCardProps) {
  const totalCommission = commissions.reduce((sum, c) => sum + c.annualCommission, 0);
  const totalAdminFees = commissions.reduce((sum, c) => sum + c.annualAdminFees, 0);
  const totalRevenue = commissions.reduce((sum, c) => sum + c.annualRevenue, 0);
  const totalAddons = commissions.reduce((sum, c) => sum + (c.annualAddons ?? 0), 0);
  const totalWcProfit = commissions.reduce((sum, c) => sum + (c.wcProfit ?? 0), 0);
  const avgWcMargin = calculateAverage(
    commissions.map((c) => c.wcMarginPct ?? null).filter((value): value is number => value !== null),
  );
  const avgCommission = calculateAverage(commissions.map((c) => c.annualCommission));
  const dealCount = commissions.length;

  const exportCSV = () => {
    const csv = toCSV(commissions, [
      ['Client', 'clientName'],
      ['Sales Rep', 'salesRepName'],
      ['Close Date', 'closeDate'],
      ['Annual Admin Fees', 'annualAdminFees'],
      ['Annual Revenue', 'annualRevenue'],
      ['Annual Commission', 'annualCommission'],
      ...(showWcMetrics
        ? [
            ['WC Profit', 'wcProfit'],
            ['WC Margin %', 'wcMarginPct'],
            ['Annual Add-ons', 'annualAddons'],
          ]
        : []),
    ]);
    downloadFile('commission_report.csv', new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportAsPDF = async () => {
    const sections = [{
      heading: 'Commission Report Summary',
      lines: [
        `Total Admin Fees: ${formatCurrency(totalAdminFees)}`,
        `Total Revenue: ${formatCurrency(totalRevenue)}`,
        `Total Commission: ${formatCurrency(totalCommission)}`,
        ...(showWcMetrics
          ? [
              `Total WC Profit: ${formatCurrency(totalWcProfit)}`,
              `Avg WC Margin: ${(avgWcMargin * 100).toFixed(1)}%`,
              `Total Add-ons: ${formatCurrency(totalAddons)}`,
            ]
          : []),
        `Average per Deal: ${formatCurrency(avgCommission)}`,
        `Deal Count: ${dealCount}`,
        '',
        ...commissions.map(
          (c) =>
            `${c.clientName} — ${c.salesRepName ?? 'Unassigned'} — ${new Date(c.closeDate).toLocaleDateString()} — Admin ${formatCurrency(
              c.annualAdminFees,
            )} — Revenue ${formatCurrency(c.annualRevenue)} — Commission ${formatCurrency(c.annualCommission)}${showWcMetrics ? ` — WC Profit ${formatCurrency(c.wcProfit ?? 0)}` : ''}`,
        ),
      ],
    }];
    await exportPDF('Commission Report', sections);
  };

  return (
    <div style={{ background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '24px', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fa-solid fa-dollar-sign" style={{ color: '#1C93ED' }}></i>
        Commission Report
      </h2>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button onClick={exportCSV} style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 600, background: 'white', color: '#273142', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}>
          <i className="fa-solid fa-file-csv" style={{ marginRight: '6px' }}></i>
          Export CSV
        </button>
        <button onClick={exportAsPDF} style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 600, background: '#1C93ED', color: 'white', border: '1px solid #1580d4', borderRadius: '4px', cursor: 'pointer' }}>
          <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }}></i>
          Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Total Admin Fees</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(totalAdminFees)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(totalRevenue)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Total Commission</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(totalCommission)}</div>
        </div>
        {showWcMetrics && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>WC Profit</div>
            <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(totalWcProfit)}</div>
          </div>
        )}
        {showWcMetrics && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Avg WC Margin</div>
            <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{(avgWcMargin * 100).toFixed(1)}%</div>
          </div>
        )}
        {showWcMetrics && (
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Add-ons</div>
            <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(totalAddons)}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Avg per Deal</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{formatCurrency(avgCommission)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>Deal Count</div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{dealCount}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Client</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Rep</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Close Date</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Admin Fees</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Annual Revenue</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Commission</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#738297', fontSize: '13px' }}>
                  No commission data for this period
                </td>
              </tr>
            ) : (
              commissions.map((commission) => (
                <tr key={commission.id} style={{ transition: 'background 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px' }}>{commission.clientName}</td>
                  <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '13px' }}>
                    {commission.salesRepName ?? 'Unassigned'}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '13px' }}>
                    {new Date(commission.closeDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(commission.annualAdminFees)}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(commission.annualRevenue)}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(commission.annualCommission)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {commissions.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '12px', fontWeight: 600 }} colSpan={3}>
                  Totals
                </td>
                <td style={{ padding: '12px 8px', color: 'white', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totalAdminFees)}
                </td>
                <td style={{ padding: '12px 8px', color: 'white', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totalRevenue)}
                </td>
                <td style={{ padding: '12px 8px', color: 'white', fontSize: '12px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totalCommission)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
