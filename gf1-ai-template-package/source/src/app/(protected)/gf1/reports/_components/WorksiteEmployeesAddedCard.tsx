'use client';

import type { CommissionRecord } from '@/lib/gf1/reports-types';
import { toCSV, downloadFile, exportPDF } from '@/lib/gf1/reports-utils';

interface WorksiteEmployeesAddedCardProps {
  // Already filtered by the page's time-range + rep filters via filteredCommissions.
  commissions: CommissionRecord[];
}

export function WorksiteEmployeesAddedCard({ commissions }: WorksiteEmployeesAddedCardProps) {
  const totalEmployees = commissions.reduce((sum, c) => sum + (c.totalEmployees ?? 0), 0);
  const clientsWithEmployees = commissions.filter((c) => (c.totalEmployees ?? 0) > 0).length;
  const avgPerClient = clientsWithEmployees > 0 ? Math.round(totalEmployees / clientsWithEmployees) : 0;

  // Bucket clients by the week their deal closed.
  const byWeek = new Map<string, number>();
  commissions.forEach((commission) => {
    if (!commission.totalEmployees) return;
    const date = new Date(commission.closeDate);
    if (Number.isNaN(date.getTime())) return;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    byWeek.set(weekKey, (byWeek.get(weekKey) || 0) + commission.totalEmployees);
  });

  const sortedWeeks = Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => ({
      week: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    }));

  const maxCount = Math.max(...sortedWeeks.map((w) => w.count), 1);

  const exportCSV = () => {
    const csv = toCSV(commissions, [
      ['Client', 'clientName'],
      ['Sales Rep', 'salesRepName'],
      ['Close Date', 'closeDate'],
      ['Worksite Employees', 'totalEmployees'],
    ]);
    downloadFile('worksite_employees_added.csv', new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportAsPDF = async () => {
    const sections = [
      {
        heading: 'Worksite Employees Added',
        lines: [
          `Total Worksite Employees Added: ${totalEmployees.toLocaleString()}`,
          `Clients Added: ${clientsWithEmployees}`,
          `Average per Client: ${avgPerClient.toLocaleString()}`,
          '',
          ...commissions.map(
            (c) =>
              `${c.clientName} — ${c.salesRepName ?? 'Unassigned'} — ${new Date(c.closeDate).toLocaleDateString()} — ${(c.totalEmployees ?? 0).toLocaleString()} employees`,
          ),
        ],
      },
    ];
    await exportPDF('Worksite Employees Added', sections);
  };

  return (
    <div
      style={{ background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '24px', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fa-solid fa-user-plus" style={{ color: '#1C93ED' }}></i>
        Worksite Employees Added
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
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>
            Total WSE Added
          </div>
          <div style={{ fontSize: '48px', fontWeight: 300, color: 'white' }}>
            {totalEmployees.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>
            Clients
          </div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{clientsWithEmployees}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#738297', fontWeight: 600, marginBottom: '6px' }}>
            Avg per Client
          </div>
          <div style={{ fontSize: '28px', fontWeight: 300, color: 'white' }}>{avgPerClient.toLocaleString()}</div>
        </div>
      </div>

      {sortedWeeks.length > 0 ? (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#738297', marginBottom: '12px' }}>
            Employees Added by Week
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedWeeks.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '80px', fontSize: '12px', color: '#a8b5c7' }}>{item.week}</div>
                <div style={{ flex: 1, background: '#273142', borderRadius: '4px', height: '28px', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${(item.count / maxCount) * 100}%`,
                      background: 'linear-gradient(90deg, #1C93ED, #1580d4)',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{item.count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#738297', fontSize: '13px' }}>
          No clients added in this period
        </div>
      )}
    </div>
  );
}
