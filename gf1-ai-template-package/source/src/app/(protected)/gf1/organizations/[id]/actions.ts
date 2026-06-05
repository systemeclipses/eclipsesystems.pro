"use server";

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireSalesUser, resolveProfileEmail, resolveProfileName, resolveProfilePhone } from '@/lib/gf1/auth';
import { createIntakeToken } from '@/lib/gf1/intake';
import { calculatePricing, MIN_BASE_PRICE_PER_EMPLOYEE } from '@/lib/gf1/pricing';
import { sendProspectIntakeEmail, sendRetirementQuestionnaireInviteEmail } from '@/lib/brevo';

export type IntakeLinkState = { url?: string; error?: string };
export type IntakeEmailState = { success?: string; error?: string };
export type RetirementQuestionnaireLinkState = { url?: string; error?: string };
export type RetirementQuestionnaireEmailState = { success?: string; error?: string };

async function buildBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : 'https://galactic365.com';
}

async function buildIntakeUrl(token: string) {
  const base = await buildBaseUrl();
  return `${base}/gf1/intake/${token}`;
}

type RetirementPrefill = {
  orgId: string | null;
  orgName: string | null;
  prospectName: string | null;
  interestedInJoining: boolean | null;
  offersRetirementPlan: boolean | null;
};

async function buildRetirementQuestionnaireUrl(prefill: RetirementPrefill) {
  const base = await buildBaseUrl();
  const params = new URLSearchParams();
  if (prefill.orgId) params.set('org_id', prefill.orgId);
  if (prefill.orgName) params.set('org', prefill.orgName);
  if (prefill.prospectName) params.set('prospect', prefill.prospectName);
  if (prefill.interestedInJoining !== null) {
    params.set('interested', prefill.interestedInJoining ? 'yes' : 'no');
  }
  if (prefill.offersRetirementPlan !== null) {
    params.set('offers_plan', prefill.offersRetirementPlan ? 'yes' : 'no');
  }
  const query = params.toString();
  return `${base}/gf1/retirement-questionnaire${query ? `?${query}` : ''}`;
}

export async function generateIntakeLinkAction(
  organizationId: string,
  _: IntakeLinkState,
  __: FormData
): Promise<IntakeLinkState> {
  void _;
  void __;
  const { supabase, user, role } = await requireSalesUser();
  const salesRepName = await resolveProfileName(user);
  let orgQuery = supabase
    .from('organizations')
    .select('id, legal_name, sales_rep_name')
    .eq('id', organizationId);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName ?? '__no_access__');
  }
  const { data: organization } = await orgQuery.maybeSingle();

  if (!organization) {
    return { error: 'Organization not found.' };
  }

  const token = await createIntakeToken(organizationId, user.id, undefined, 'generated');
  return { url: await buildIntakeUrl(token.token) };
}

export async function sendProspectIntakeEmailAction(
  _: IntakeEmailState,
  formData: FormData
): Promise<IntakeEmailState> {
  const organizationId = String(formData.get('organization_id') ?? '');
  if (!organizationId) {
    return { error: 'Missing organization' };
  }

  const { supabase, user, role } = await requireSalesUser();
  const salesRepName = await resolveProfileName(user);
  const salesRepEmail = await resolveProfileEmail(user);
  const salesRepPhone = await resolveProfilePhone(user);
  let orgQuery = supabase
    .from('organizations')
    .select('id, legal_name, primary_contact_email, sales_rep_name')
    .eq('id', organizationId);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName ?? '__no_access__');
  }
  const { data: organization } = await orgQuery.maybeSingle();

  if (!organization) {
    return { error: 'Organization not found.' };
  }
  if (!organization.primary_contact_email) {
    return { error: 'Primary contact email is missing.' };
  }

  try {
    const token = await createIntakeToken(organizationId, user.id, undefined, 'sent');
    const intakeUrl = await buildIntakeUrl(token.token);
    await sendProspectIntakeEmail({
      to: organization.primary_contact_email,
      organizationName: organization.legal_name ?? 'your organization',
      intakeUrl,
      senderName: salesRepName ?? undefined,
      senderEmail: salesRepEmail ?? undefined,
      senderPhone: salesRepPhone ?? undefined,
    });
    return { success: `Sent intake link to ${organization.primary_contact_email}.` };
  } catch (error) {
    console.error('send prospect intake email error', error);
    const message = error instanceof Error ? error.message : 'Failed to send intake email.';
    return { error: message };
  }
}

export async function generateRetirementQuestionnaireLinkAction(
  organizationId: string,
  _: RetirementQuestionnaireLinkState,
  __: FormData
): Promise<RetirementQuestionnaireLinkState> {
  void _;
  void __;
  const { supabase, user, role } = await requireSalesUser();
  const salesRepName = await resolveProfileName(user);
  let orgQuery = supabase
    .from('organizations')
    .select(
      'id, legal_name, primary_contact_name, wants_galactic_retirement_flag, has_retirement_plan_flag, sales_rep_name'
    )
    .eq('id', organizationId);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName ?? '__no_access__');
  }
  const { data: organization } = await orgQuery.maybeSingle();

  if (!organization) {
    return { error: 'Organization not found.' };
  }

  const url = await buildRetirementQuestionnaireUrl({
    orgId: organizationId,
    orgName: organization.legal_name ?? null,
    prospectName:
      (organization as { primary_contact_name?: string | null }).primary_contact_name ?? null,
    interestedInJoining:
      (organization as { wants_galactic_retirement_flag?: boolean | null })
        .wants_galactic_retirement_flag ?? null,
    offersRetirementPlan:
      (organization as { has_retirement_plan_flag?: boolean | null }).has_retirement_plan_flag ?? null,
  });
  return { url };
}

export async function sendRetirementQuestionnaireEmailAction(
  _: RetirementQuestionnaireEmailState,
  formData: FormData
): Promise<RetirementQuestionnaireEmailState> {
  const organizationId = String(formData.get('organization_id') ?? '');
  if (!organizationId) {
    return { error: 'Missing organization' };
  }

  const { supabase, user, role } = await requireSalesUser();
  const salesRepName = await resolveProfileName(user);
  const salesRepEmail = await resolveProfileEmail(user);
  const salesRepPhone = await resolveProfilePhone(user);
  let orgQuery = supabase
    .from('organizations')
    .select(
      'id, legal_name, primary_contact_email, primary_contact_name, wants_galactic_retirement_flag, has_retirement_plan_flag, sales_rep_name'
    )
    .eq('id', organizationId);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName ?? '__no_access__');
  }
  const { data: organization } = await orgQuery.maybeSingle();

  if (!organization) {
    return { error: 'Organization not found.' };
  }
  if (!organization.primary_contact_email) {
    return { error: 'Primary contact email is missing.' };
  }

  try {
    const questionnaireUrl = await buildRetirementQuestionnaireUrl({
      orgId: organizationId,
      orgName: organization.legal_name ?? null,
      prospectName:
        (organization as { primary_contact_name?: string | null }).primary_contact_name ?? null,
      interestedInJoining:
        (organization as { wants_galactic_retirement_flag?: boolean | null })
          .wants_galactic_retirement_flag ?? null,
      offersRetirementPlan:
        (organization as { has_retirement_plan_flag?: boolean | null })
          .has_retirement_plan_flag ?? null,
    });
    // TODO: Restore prospect-facing recipient once testing is complete.
    const testingRecipient = 'garrett@galactic-inc.com';
    await sendRetirementQuestionnaireInviteEmail({
      to: testingRecipient,
      recipientName:
        (organization as { primary_contact_name?: string | null }).primary_contact_name ?? undefined,
      organizationName: organization.legal_name ?? 'your organization',
      questionnaireUrl,
      senderName: salesRepName ?? undefined,
      senderEmail: salesRepEmail ?? undefined,
      senderPhone: salesRepPhone ?? undefined,
    });
    return { success: `Sent questionnaire to ${testingRecipient} (testing).` };
  } catch (error) {
    console.error('send retirement questionnaire email error', error);
    const message = error instanceof Error ? error.message : 'Failed to send questionnaire email.';
    return { error: message };
  }
}

export async function createPreProposalAction(_: unknown, formData: FormData) {
  const organizationId = String(formData.get('organization_id') ?? '');
  const { supabase, user, role } = await requireSalesUser();
  const salesRepName = role === 'sales' ? await resolveProfileName(user) : null;
  let orgQuery = supabase
    .from('organizations')
    .select('id, total_employees, pay_frequency, sales_rep_name')
    .eq('id', organizationId);
  if (role === 'sales') {
    orgQuery = orgQuery.eq('sales_rep_name', salesRepName ?? '__no_access__');
  }
  const { data: organization } = await orgQuery.maybeSingle();

  if (!organization) {
    return { error: 'Organization not found.' };
  }

  const headcount = organization.total_employees ?? 0;
  const payFrequency = organization.pay_frequency ?? 'biweekly';
  const pricing = calculatePricing({
    headcount,
    payFrequency,
    basePricePerEmployeePerYear: MIN_BASE_PRICE_PER_EMPLOYEE,
  });

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      status: 'draft',
      base_price_per_employee_per_year: pricing.normalizedBase,
      minimum_price_per_employee_per_year: MIN_BASE_PRICE_PER_EMPLOYEE,
      annual_admin_target: pricing.annualAdminTarget,
      billing_model: pricing.billingModel,
      percent_of_gross: pricing.percentOfGross,
      flat_admin_fee_per_employee_per_period: pricing.flatPerEmployeePerPeriod,
      modeled_employee_count: headcount,
      services_json: {},
    })
    .select('id')
    .maybeSingle();

  if (error || !proposal) {
    console.error('create proposal error', error);
    return { error: 'Could not create proposal.' };
  }

  redirect(`/gf1/proposals/${proposal.id}`);
}
