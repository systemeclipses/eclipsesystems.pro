"use server";

import { redirect } from 'next/navigation';

export async function convertLeadToOrganization(formData: FormData): Promise<void> {
  const orgId = String(formData.get('organizationId') || formData.get('leadId') || '');
  if (orgId) {
    redirect(`/gf1/organizations/${orgId}`);
  }
  redirect('/gf1/organizations');
}
