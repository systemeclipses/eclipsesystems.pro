import crypto from 'crypto';
import { supaAdmin } from '@/lib/supabase/admin';
import type { Gf1IntakeToken, Gf1OrganizationProfile, Gf1ContactRecord, Gf1Worksite } from './types';

const DEFAULT_TOKEN_DAYS = 14;

export type IntakeTokenSource = 'generated' | 'sent' | 'system';

function buildIntakeTokenValue(source: IntakeTokenSource) {
  const random = crypto.randomBytes(16).toString('hex');
  if (source === 'sent') return `sent_${random}`;
  if (source === 'generated') return `gen_${random}`;
  return `tok_${random}`;
}

export async function createIntakeToken(
  organizationId: string,
  createdBy: string | null,
  daysValid = DEFAULT_TOKEN_DAYS,
  source: IntakeTokenSource = 'generated'
) {
  const admin = supaAdmin();
  const token = buildIntakeTokenValue(source);
  const expires_at = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('gf1_intake_tokens')
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      token,
      expires_at,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not create intake token');
  }

  return data as Gf1IntakeToken;
}

export async function validateIntakeToken(token: string) {
  const admin = supaAdmin();
  const { data: tokenRow, error } = await admin
    .from('gf1_intake_tokens')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!tokenRow) return null;

  const [{ data: organization }, { data: contacts }, { data: worksites }] = await Promise.all([
    admin.from('organizations').select('*').eq('id', tokenRow.organization_id).maybeSingle(),
    admin.from('contacts').select('*').eq('organization_id', tokenRow.organization_id),
    admin.from('worksites').select('*').eq('organization_id', tokenRow.organization_id),
  ]);

  if (!organization) return null;

  return {
    token: tokenRow as Gf1IntakeToken,
    organization: organization as Gf1OrganizationProfile,
    contacts: (contacts ?? []) as Gf1ContactRecord[],
    worksites: (worksites ?? []) as Gf1Worksite[],
  };
}

export async function markIntakeTokenUsed(id: string) {
  const admin = supaAdmin();
  await admin.from('gf1_intake_tokens').update({ used_at: new Date().toISOString() }).eq('id', id);
}
