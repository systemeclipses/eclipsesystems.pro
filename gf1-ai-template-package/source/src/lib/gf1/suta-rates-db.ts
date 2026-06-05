import { supaAdmin } from '@/lib/supabase/admin';
import { SUTA_RATES, US_STATES, type USState } from './rates';

export type SutaRateRow = {
  state: USState;
  rate: number;
  updatedAt: string | null;
};

const FALLBACK_RATE = 1.7;

/**
 * Loads the current per-state SUTA rates from the editable DB table. Falls
 * back to the static seed values from rates.ts if the table is unreachable
 * (e.g. before the migration runs). The returned list always covers all 50
 * states so the admin UI can show every row, even ones that haven't been
 * customized yet.
 */
export async function loadAllSutaRates(): Promise<SutaRateRow[]> {
  const admin = supaAdmin();
  const dbMap = new Map<string, { rate: number; updated_at: string | null }>();

  try {
    const { data, error } = await admin
      .from('gf1_suta_rates')
      .select('state, rate, updated_at');
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ state: string; rate: number | null; updated_at: string | null }>) {
        if (typeof row.state === 'string' && typeof row.rate === 'number') {
          dbMap.set(row.state.toUpperCase(), { rate: row.rate, updated_at: row.updated_at });
        }
      }
    }
  } catch {
    // Migration not run yet; fall through to static seed.
  }

  return US_STATES.map(({ value }) => {
    const dbRow = dbMap.get(value);
    if (dbRow) {
      return { state: value, rate: dbRow.rate, updatedAt: dbRow.updated_at };
    }
    const seed = SUTA_RATES[value];
    return {
      state: value,
      rate: typeof seed === 'number' ? seed : FALLBACK_RATE,
      updatedAt: null,
    };
  });
}
