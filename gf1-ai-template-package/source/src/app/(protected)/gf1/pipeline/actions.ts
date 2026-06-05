"use server";

import { requireSalesUser } from '@/lib/gf1/auth';
import { revalidatePath } from 'next/cache';

export async function moveOrgStageAction(orgId: string, toStage: string): Promise<{ error?: string }> {
  const { supabase } = await requireSalesUser();

  const { error } = await supabase
    .from('organizations')
    .update({ status: toStage })
    .eq('id', orgId);

  if (error) {
    console.error('moveOrgStageAction error', error);
    return { error: error.message || 'Could not update stage.' };
  }

  revalidatePath('/gf1/pipeline');
  revalidatePath(`/gf1/organizations/${orgId}`);
  return {};
}
