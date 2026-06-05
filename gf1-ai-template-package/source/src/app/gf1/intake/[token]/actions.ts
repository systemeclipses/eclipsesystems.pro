"use server";

import { supaAdmin } from '@/lib/supabase/admin';
import { markIntakeTokenUsed, validateIntakeToken } from '@/lib/gf1/intake';

export type IntakeSubmitState = { error?: string; success?: boolean };

const STORAGE_BUCKET = 'gf1-org-assets';

export async function submitIntakeAction(
  token: string,
  _: IntakeSubmitState,
  formData: FormData
): Promise<IntakeSubmitState> {
  try {
    const validated = await validateIntakeToken(token);
    if (!validated) return { error: 'This intake link is invalid or expired.' };
    if (validated.token.used_at) return { error: 'This intake link has already been used.' };

    const admin = supaAdmin();
    const orgId = validated.organization.id;

  const bool = (key: string) => formData.get(key) === 'on' || formData.get(key) === 'true';
  const str = (key: string) => {
    const value = formData.get(key);
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  };
  const num = (key: string) => {
    const value = formData.get(key);
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const parseOwnersList = (raw: string | null) => {
    if (!raw) return null;
    const rows = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!rows.length) return null;
    return rows.map((line) => {
      const [namePart, percentPart] = line.split(/-|,/).map((piece) => piece.trim());
      const percent = percentPart ? Number(percentPart.replace('%', '')) : null;
      return { name: namePart, percent: Number.isFinite(percent) ? percent : null };
    });
  };

    const additionalFeins = str('additional_feins');
    const remoteStates = str('remote_states');

    // Only update columns that actually exist on this table. Supabase cache may not see new columns until migrations run.
    const existingColumns = new Set(Object.keys(validated.organization));
    const candidatePayload: Record<string, unknown> = {
      // Name/identity
      name: str('legal_name') ?? (validated.organization as any).name,
      legal_name: str('legal_name'),
      dba_name: str('dba_name'),
      website: str('website'),
      // Addresses (fallback to legacy line1/line2/city/state/postal_code)
      address_line1: str('address_street'),
      address_line2: str('address_line2'),
      city: str('address_city'),
      state: str('address_state'),
      postal_code: str('address_zip'),
      country: str('address_country'),
      address_county: str('address_county'),
      // Company details
      description_of_operations: str('description_of_operations'),
      naics_code: str('naics_code'),
      years_in_business: num('years_in_business'),
      company_type: str('company_type'),
      owners_json: parseOwnersList(str('owners_list')),
      bankruptcy_flag: bool('bankruptcy_flag'),
      lawsuits_flag: bool('lawsuits_flag'),
      controlled_group_flag: bool('controlled_group_flag'),
      fein: str('fein'),
      additional_feins: additionalFeins ? additionalFeins.split(',').map((entry) => entry.trim()).filter(Boolean) : null,
      multi_state_flag: bool('multi_state_flag'),
      local_taxes_flag: bool('local_taxes_flag'),
      total_employees: num('total_employees'),
      full_time_employees: num('full_time_employees'),
      part_time_employees: num('part_time_employees'),
      commission_only_employees: num('commission_only_employees'),
      pay_frequency: str('pay_frequency'),
      pay_frequency_other: str('pay_frequency_other'),
      pay_schedule_json: str('pay_schedule_notes') ? { notes: str('pay_schedule_notes') } : null,
      first_check_date: str('first_check_date'),
      first_period_start: str('first_period_start'),
      first_period_end: str('first_period_end'),
      regular_commissions_or_bonuses_flag: bool('regular_commissions_or_bonuses_flag'),
      payroll_submission_method: str('payroll_submission_method'),
      preferred_payment_method: str('preferred_payment_method'),
      current_payroll_provider: str('current_payroll_provider'),
      has_remote_employees_flag: bool('has_remote_employees_flag'),
      remote_states: remoteStates ? remoteStates.split(',').map((state) => state.trim()).filter(Boolean) : null,
      has_1099s_flag: bool('has_1099s_flag'),
      employees_live_vs_work_state_flag: bool('employees_live_vs_work_state_flag'),
      offers_health_flag: bool('offers_health_flag'),
      offers_dental_flag: bool('offers_dental_flag'),
      offers_vision_flag: bool('offers_vision_flag'),
      other_benefit_plans: str('other_benefit_plans'),
      wc_states_json: str('wc_states_list')
        ? str('wc_states_list')!
            .split(',')
            .map((state) => state.trim())
            .filter(Boolean)
        : null,
      pto_tracking_needed_flag: bool('pto_tracking_needed_flag'),
      has_retirement_plan_flag: bool('has_retirement_plan_flag'),
      wants_galactic_retirement_flag: bool('wants_galactic_retirement_flag'),
      gl_import_needed_flag: bool('gl_import_needed_flag'),
      large_employer_aca_flag: bool('large_employer_aca_flag'),
      labor_posters_needed_flag: bool('labor_posters_needed_flag'),
      timekeeping_needed_flag: bool('timekeeping_needed_flag'),
      background_checks_needed_flag: bool('background_checks_needed_flag'),
      drug_screenings_needed_flag: bool('drug_screenings_needed_flag'),
      wants_wotc_flag: bool('wants_wotc_flag'),
      ats_needed_flag: bool('ats_needed_flag'),
      additional_reporting_needed_flag: bool('additional_reporting_needed_flag'),
      additional_details: str('additional_details'),
      status: 'prospect',
    };

    // Logo upload is optional.
    const logo = formData.get('logo');
    if (logo && logo instanceof File && logo.size > 0) {
      const path = `logos/${orgId}-${Date.now()}.${(logo.name.split('.').pop() ?? 'png').toLowerCase()}`;
      const upload = await admin.storage.from(STORAGE_BUCKET).upload(path, logo, {
        cacheControl: '3600',
        upsert: true,
      });
      if (upload.error) {
        console.error('logo upload failed', upload.error);
      } else {
        const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        candidatePayload.logo_url = data.publicUrl;
      }
    }

    const contactsJson = str('contacts_json');
    const worksitesJson = str('worksites_json');
    const contacts = contactsJson ? safeArrayParse(contactsJson) : [];
    const worksites = worksitesJson ? safeArrayParse(worksitesJson) : [];

    // Legacy primary contact fields for org listing
    const primaryContact = contacts.find((c: any) => c.is_primary) ?? contacts[0];
    if (primaryContact) {
      if (existingColumns.has('primary_contact_name')) candidatePayload.primary_contact_name = primaryContact.full_name ?? null;
      if (existingColumns.has('primary_contact_email')) candidatePayload.primary_contact_email = primaryContact.email ?? null;
      if (existingColumns.has('primary_contact_phone')) candidatePayload.primary_contact_phone = primaryContact.phone ?? null;
    }

    // Fill legacy address fields if present
    if (existingColumns.has('address_line1')) candidatePayload.address_line1 = str('address_street');
    if (existingColumns.has('address_line2')) candidatePayload.address_line2 = null;
    if (existingColumns.has('city')) candidatePayload.city = str('address_city');
    if (existingColumns.has('state')) candidatePayload.state = str('address_state');
    if (existingColumns.has('postal_code')) candidatePayload.postal_code = str('address_zip');
    if (existingColumns.has('country')) candidatePayload.country = 'United States';
    if (existingColumns.has('name') && !candidatePayload.name) {
      candidatePayload.name = str('legal_name') ?? (validated.organization as any).name;
    }

    const updatePayload = Object.fromEntries(
      Object.entries(candidatePayload).filter(
        ([column, value]) => existingColumns.has(column) && value !== undefined
      )
    );

    const { error: orgError } = await admin.from('organizations').update(updatePayload).eq('id', orgId);
    if (orgError) {
      console.error('org update failed', orgError);
      return { error: 'Could not save organization details.' };
    }

    await admin.from('contacts').delete().eq('organization_id', orgId);
    if (contacts.length) {
      await admin
        .from('contacts')
        .insert(
          contacts.map((contact: any, index: number) => ({
            organization_id: orgId,
            full_name: contact.full_name || `Contact ${index + 1}`,
            title: contact.title || null,
            phone: contact.phone || null,
            email: contact.email || null,
            is_primary: Boolean(contact.is_primary ?? index === 0),
          }))
        );
    }

    await admin.from('worksites').delete().eq('organization_id', orgId);
    if (worksites.length) {
      await admin
        .from('worksites')
        .insert(
          worksites.map((site: any) => ({
            organization_id: orgId,
            street: site.street || null,
            city: site.city || null,
            state: site.state || null,
            zip: site.zip || null,
            county: site.county || null,
          }))
        );
    }

    await markIntakeTokenUsed(validated.token.id);
    return { success: true };
  } catch (err) {
    console.error('intake submit failed', err);
    return { error: 'We hit an unexpected error saving your intake. Please try again.' };
  }
}

function safeArrayParse(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
