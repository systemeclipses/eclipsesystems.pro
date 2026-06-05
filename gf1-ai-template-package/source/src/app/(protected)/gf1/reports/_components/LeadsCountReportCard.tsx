'use client';

import type { LeadRecord } from '@/lib/gf1/reports-types';
import { toCSV, downloadFile, exportPDF } from '@/lib/gf1/reports-utils';

interface LeadsCountReportCardProps {
  leads: LeadRecord[];
}

export function LeadsCountReportCard({ leads }: LeadsCountReportCardProps) {
  const exportCSV = () => {
    const csv = toCSV(leads, [
      ['Suspect Name', 'name'],
      ['Source', 'source'],
      ['Created', 'createdAt'],
    ]);
    downloadFile('leads_count.csv', new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportAsPDF = async () => {
    const sections = [{
      heading: 'Suspects Count Report',
      lines: [
        `Total Suspects: ${leads.length}`,
        '',
        ...leads.map((l) => `${l.name} — ${l.source} — ${new Date(l.createdAt).toLocaleDateString()}`),
      ],
    }];
    await exportPDF('Suspects Count Report', sections);
  };

  return (
    <div style={{ background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '24px', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-magnifying-glass-chart" style={{ color: '#1C93ED' }}></i>
          Number of Suspects
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600 }}>
            Total Suspects
          </span>
          <span style={{ fontSize: '32px', fontWeight: 300, color: 'white', lineHeight: 1 }}>
            {leads.length}
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
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Suspect Name</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Sales Rep</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, borderBottom: '1px solid #3d4b5e' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#738297', fontSize: '13px' }}>
                  No suspects for this period
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  style={{ transition: 'background 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 8px', color: 'white', fontSize: '13px', fontWeight: 600 }}>{lead.name}</td>
                  <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '13px' }}>
                    {lead.salesRepName ?? 'Unassigned'}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#a8b5c7', fontSize: '13px' }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
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
