'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { US_STATES } from '@/lib/gf1/rates';

const VALID_STATES = new Set(US_STATES.map((s) => s.value));

export type SutaRateUpdate = { state: string; rate: number };

/**
 * Bulk-upsert per-state SUTA rates. Admin-only. Each `rate` is the displayed
 * percentage value (e.g. 1.70 means 1.70%) — same convention used everywhere
 * else in the app.
 */
export async function saveSutaRatesAction(updates: SutaRateUpdate[]): Promise<void> {
  const { user } = await requireAdmin();
  const admin = supaAdmin();

  const cleaned = updates
    .map((u) => ({
      state: typeof u.state === 'string' ? u.state.toUpperCase().trim() : '',
      rate: typeof u.rate === 'number' && Number.isFinite(u.rate) ? u.rate : null,
    }))
    .filter((u) => VALID_STATES.has(u.state) && u.rate != null && u.rate >= 0 && u.rate < 100)
    .map((u) => ({
      state: u.state,
      rate: u.rate as number,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }));

  if (cleaned.length === 0) return;

  const { error } = await admin
    .from('gf1_suta_rates')
    .upsert(cleaned, { onConflict: 'state' });
  if (error) {
    throw new Error(error.message || 'Could not save SUTA rates');
  }

  revalidatePath('/gf1/admin/settings');
}
