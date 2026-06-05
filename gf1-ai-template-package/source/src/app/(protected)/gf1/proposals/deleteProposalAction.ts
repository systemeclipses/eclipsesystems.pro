"use server";

import { revalidatePath } from 'next/cache';
import { requireSalesUser } from '@/lib/gf1/auth';

export async function deleteProposalAction(proposalId: string) {
  const { supabase } = await requireSalesUser();
  const { error } = await supabase.from('proposals').delete().eq('id', proposalId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/gf1/proposals');
  revalidatePath('/gf1');
  return { success: true };
}
