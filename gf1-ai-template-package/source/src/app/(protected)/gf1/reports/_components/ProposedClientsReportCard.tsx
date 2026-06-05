'use client';

import type { ProspectRecord } from '@/lib/gf1/reports-types';
import { formatCurrency, toCSV, downloadFile, exportPDF } from '@/lib/gf1/reports-utils';

interface ProposedClientsReportCardProps {
  prospects: ProspectRecord[];
}

export function ProposedClientsReportCard({ prospects }: ProposedClientsReportCardProps) {
  const totalEstimatedRevenue = prospects.reduce((sum, p) => sum + p.estimatedRevenue, 0);

  const exportCSV = () => {
    const csv = toCSV(prospects, [
      ['Prospect Name', 'name'],
      ['Status', 'status'],
      ['Estimated Revenue', 'estimatedRevenue'],
      ['Created', 'createdAt'],
    ]);
    downloadFile('proposed_clients.csv', new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportAsPDF = async () => {
    const sections = [{
      heading: 'Proposed Clients Summary',
      lines: [
        `Total Proposed Revenue: ${formatCurrency(totalEstimatedRevenue)}`,
        `Prospect Count: ${prospects.length}`,
        '',
        ...prospects.map((p) => `${p.name} — ${p.status} — ${formatCurrency(p.estimatedRevenue)} — ${new Date(p.createdAt).toLocaleDateString()}`),
      ],
    }];
    await exportPDF('Proposed Clients Report', sections);
  };

  return (
    <div style={{ background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '24px', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-users" style={{ color: '#1C93ED' }}></i>
          Proposed Clients
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600 }}>
            Total Proposed Revenue
          </span>
          <span style={{ fontSize: '32px', fontWeight: 300, color: 'white', lineHeight: 1 }}>
            {formatCurrency(totalEstimatedRevenue)}
          </span>
        </div>
      </div>
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

      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Prospect Name</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Est. Revenue</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#738297', fontSize: '13px' }}>
                  No prospects for this period
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect.id} style={{ transition: 'background 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', fontWeight: 600 }}>{prospect.name}</td>
                  <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#273142',
                      color: '#a8b5c7',
                    }}>
                      {prospect.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(prospect.estimatedRevenue)}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '13px' }}>
                    {new Date(prospect.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
