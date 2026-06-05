"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireSalesUser } from '@/lib/gf1/auth';
import { LOGO_BUCKET } from '@/lib/gf1/logos';
import { supaAdmin } from '@/lib/supabase/admin';

export type LeadActionState = { error?: string };

function getDefaultFollowUpAt() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next.toISOString();
}

export async function createLeadAction(_: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const { supabase, user } = await requireSalesUser();
  const admin = supaAdmin();

  const logoFile = formData.get('logo_file');
  const legalName = String(formData.get('legal_name') ?? '').trim();
  const tradeName = String(formData.get('trade_name') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();
  const contactName = String(formData.get('contact_name') ?? '').trim();
  const contactTitle = String(formData.get('contact_title') ?? '').trim();
  const contactPhone = String(formData.get('contact_phone') ?? '').trim();
  const contactEmail = String(formData.get('contact_email') ?? '').trim();
  const addressLine1 = String(formData.get('address_line1') ?? '').trim();
  const addressLine2 = String(formData.get('address_line2') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const postalCode = String(formData.get('postal_code') ?? '').trim();

  if (!legalName || !contactName || !contactEmail) {
    return { error: 'Company name, contact name, and email are required.' };
  }

  if (!addressLine1 || !city || !state || !postalCode) {
    return { error: 'Street address, city, state, and zip code are required.' };
  }

  let profileName: string | null = null;
  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to load sales rep profile', profileError);
    } else if (typeof profile?.name === 'string') {
      const trimmed = profile.name.trim();
      profileName = trimmed ? trimmed : null;
    }
  } catch (profileErr) {
    console.error('Unexpected error fetching sales rep profile', profileErr);
  }

  const salesRepName = profileName || null;

  const organizationInsert: Record<string, any> = {
    legal_name: legalName,
    trade_name: tradeName || null,
    website: website || null,
    status: 'lead',
    created_by: user.id,
    assigned_sales_rep_id: user.id,
    primary_contact_id: null,
    primary_contact_name: contactName || null,
    primary_contact_email: contactEmail || null,
    primary_contact_phone: contactPhone || null,
    address_line1: addressLine1 || null,
    address_line2: addressLine2 || null,
    city: city || null,
    state: state || null,
    postal_code: postalCode || null,
  };
  if (salesRepName) {
    organizationInsert.sales_rep_name = salesRepName;
  }

  const attemptInsert = async () =>
    supabase.from('organizations').insert(organizationInsert).select('*').maybeSingle();

  let { data: organization, error } = await attemptInsert();

  if (error && salesRepName && typeof error.message === 'string' && error.message.toLowerCase().includes('sales_rep_name')) {
    console.warn('sales_rep_name column missing, retrying organization insert without it');
    delete organizationInsert.sales_rep_name;
    ({ data: organization, error } = await attemptInsert());
  }

  if (error || !organization) {
    console.error('create lead error', error);
    return { error: error?.message || 'Could not create organization.' };
  }

  let uploadedLogoUrl: string | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    const extension = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
    const storagePath = `organizations/${organization.id}/logo.${extension}`;
    const { error: uploadError } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(storagePath, logoFile, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('lead logo upload failed', uploadError);
    } else {
      const { data: publicUrlData } = admin.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);
      let publicUrl = publicUrlData?.publicUrl ?? null;

      if (!publicUrl) {
        const { data: signedData, error: signedError } = await admin.storage
          .from(LOGO_BUCKET)
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
        if (signedError) {
          console.error('Failed to generate signed logo URL', signedError);
        } else {
          publicUrl = signedData?.signedUrl ?? null;
        }
      }

      uploadedLogoUrl = publicUrl;

      if (!uploadedLogoUrl) {
        console.warn('Logo uploaded but no accessible URL returned', { organizationId: organization.id, storagePath });
      }
    }
  }

  const { data: contact } = await supabase
    .from('contacts')
    .insert({
      organization_id: organization.id,
      full_name: contactName,
      title: contactTitle || null,
      phone: contactPhone || null,
      email: contactEmail || null,
      is_primary: true,
    })
    .select('id')
    .maybeSingle();

  // Update organization with both contact and lead info
  const updates: Record<string, any> = {};
  if (contact?.id) {
    updates.primary_contact_id = contact.id;
  }
  if (uploadedLogoUrl) {
    updates.logo_url = uploadedLogoUrl;
  }

  if (Object.keys(updates).length > 0) {
    const attemptUpdate = async () =>
      supabase.from('organizations').update(updates).eq('id', organization.id);

    let { error: updateError } = await attemptUpdate();

    if (
      updateError &&
      uploadedLogoUrl &&
      typeof updateError.message === 'string' &&
      updateError.message.toLowerCase().includes('logo_url')
    ) {
      console.warn('logo_url column missing, retrying organization update without it');
      delete updates.logo_url;
      updateError = Object.keys(updates).length > 0 ? (await attemptUpdate()).error : null;
    }
    
    if (updateError) {
      console.error('Failed to update organization', updateError);
    }
  }

  try {
    const opportunityPayload = {
      organization_name: legalName,
      primary_contact_name: contactName || null,
      primary_contact_phone: contactPhone || null,
      primary_contact_email: contactEmail || null,
      source: 'GF1 Lead Form',
      notes: 'Lead created in GF1.',
      created_by: user.id,
      last_contacted_at: new Date().toISOString(),
      last_contacted_by: user.id,
    };

    const { data: opportunityLead, error: opportunityLeadError } = await supabase
      .from('opportunity_leads')
      .insert(opportunityPayload)
      .select('id')
      .maybeSingle();

    if (opportunityLeadError) {
      console.error('Failed to create opportunity lead activity bootstrap', opportunityLeadError);
    } else if (opportunityLead?.id) {
      const { error: contactLogError } = await supabase.from('opportunity_contact_logs').insert({
        opportunity_id: opportunityLead.id,
        contacted_by: user.id,
        channel: 'other',
        follow_up_type: 'other',
        notes: 'Initial outreach logged automatically when the lead was created in GF1.',
        follow_up_at: getDefaultFollowUpAt(),
        got_response: false,
      });

      if (contactLogError) {
        console.error('Failed to create default opportunity contact log for new lead', contactLogError);
      }
    }
  } catch (activityBootstrapError) {
    console.error('Unexpected error creating default opportunity activity for new lead', activityBootstrapError);
  }

  // Revalidate all pages that display organizations
  revalidatePath('/gf1/pipeline');
  revalidatePath('/gf1/organizations');
  revalidatePath('/gf1/opportunities');
  revalidatePath('/gf1/activity');
  revalidatePath('/gf1');
  revalidatePath(`/gf1/organizations/${organization.id}`);
  
  redirect(`/gf1/organizations/${organization.id}`);
}
