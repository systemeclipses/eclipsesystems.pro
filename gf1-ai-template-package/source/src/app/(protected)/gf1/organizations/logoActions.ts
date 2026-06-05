"use server";

import { requireSalesUser } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateOrganizationLogoUrlAction(organizationId: string, logoUrl: string) {
  if (!organizationId) {
    throw new Error('Missing organization ID');
  }
  await requireSalesUser();
  const admin = supaAdmin();
  const { error } = await admin.from('organizations').update({ logo_url: logoUrl }).eq('id', organizationId);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath(`/gf1/organizations/${organizationId}`);
  revalidatePath('/gf1/organizations');
  revalidatePath('/gf1/pipeline');
  return { success: true };
}
