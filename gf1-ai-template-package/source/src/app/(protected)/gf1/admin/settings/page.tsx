import { redirect } from 'next/navigation';
import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { requireGf1Access } from '@/lib/gf1/auth';
import { loadAllSutaRates } from '@/lib/gf1/suta-rates-db';
import { SutaRatesEditor } from './_components/SutaRatesEditor';

export const dynamic = 'force-dynamic';

export default async function Gf1AdminSettingsPage() {
  const { role } = await requireGf1Access();
  if (role !== 'admin') {
    redirect('/gf1?auth=forbidden');
  }

  const rows = await loadAllSutaRates();

  return (
    <DashboardShell role={role}>
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#f59e0b',
              fontWeight: 700,
            }}
          >
            Admin · Settings
          </div>
          <h1
            style={{
              margin: '4px 0 0',
              fontSize: '28px',
              fontWeight: 800,
              color: '#e2e8f0',
              letterSpacing: '0.01em',
            }}
          >
            SUTA Default Rates
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px', maxWidth: '640px' }}>
            Per-state default SUTA rates used when a sales rep doesn't manually override the rate
            on a proposal or agreement. Edit any cell and click Save — changes apply immediately
            to new state-pricing rows. Existing saved proposals keep whatever rate was on them.
          </p>
        </div>

        <SutaRatesEditor rows={rows} />
      </div>
    </DashboardShell>
  );
}
