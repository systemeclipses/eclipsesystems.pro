"use server";

import { requireSalesUser, resolveProfileName } from '@/lib/gf1/auth';
import { revalidatePath } from 'next/cache';

type ContactInput = {
  full_name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
};

type WorksiteInput = {
  name?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
};

type UpdateOrganizationPayload = {
  organization: Record<string, any>;
  contacts?: ContactInput[];
  worksites?: WorksiteInput[];
};

export async function updateOrganizationAction(id: string, payload: UpdateOrganizationPayload) {
  const { supabase, role, user } = await requireSalesUser();
  const { organization, contacts = [], worksites = [] } = payload;

  if (role !== 'admin') {
    delete organization.commission_percent;
    delete organization.assigned_sales_rep_id;
  }
  if (role === 'sales') {
    const salesRepName = await resolveProfileName(user);
    const { data: orgRow, error: orgLookupError } = await supabase
      .from('organizations')
      .select('sales_rep_name')
      .eq('id', id)
      .maybeSingle();
    if (orgLookupError || !orgRow) throw new Error('Organization not found.');
    if (orgRow.sales_rep_name !== (salesRepName ?? '__no_access__')) {
      throw new Error('Forbidden');
    }
  }

  let { error: orgError } = await supabase.from('organizations').update(organization).eq('id', id);
  if (orgError && typeof orgError.message === 'string' && orgError.message.toLowerCase().includes('sales_rep_name')) {
    const fallbackPayload = { ...organization };
    delete fallbackPayload.sales_rep_name;
    ({ error: orgError } = await supabase.from('organizations').update(fallbackPayload).eq('id', id));
  }
  if (orgError) throw new Error(orgError.message);


  // Replace contact + worksite records so the UI edits stay in sync with intake form shape.
  const { error: deleteContactsError } = await supabase.from('contacts').delete().eq('organization_id', id);
  if (deleteContactsError) throw new Error(deleteContactsError.message);

  if (contacts.length) {
    const contactsPayload = contacts.map((contact, index) => ({
      organization_id: id,
      full_name: contact.full_name || `Contact ${index + 1}`,
      title: contact.title || null,
      phone: contact.phone || null,
      email: contact.email || null,
      is_primary: contact.is_primary ?? index === 0,
    }));
    const { error: insertContactsError } = await supabase.from('contacts').insert(contactsPayload);
    if (insertContactsError) throw new Error(insertContactsError.message);
  }

  const { error: deleteWorksitesError } = await supabase.from('worksites').delete().eq('organization_id', id);
  if (deleteWorksitesError) throw new Error(deleteWorksitesError.message);

  if (worksites.length) {
    const worksitesPayload = worksites.map((site) => ({
      organization_id: id,
      name: site.name || null,
      street: site.street || null,
      city: site.city || null,
      state: site.state || null,
      zip: site.zip || null,
      county: site.county || null,
    }));
    const { error: insertWorksitesError } = await supabase.from('worksites').insert(worksitesPayload);
    if (insertWorksitesError) throw new Error(insertWorksitesError.message);
  }

  revalidatePath(`/gf1/organizations/${id}`);
  revalidatePath('/gf1/organizations');
  return { success: true };
}
