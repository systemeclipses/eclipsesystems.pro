'use server';

import { revalidatePath } from 'next/cache';
import { requireSalesUser } from '@/lib/gf1/auth';
import { supaAdmin } from '@/lib/supabase/admin';
import { generateDealLossPdf } from '@/lib/gf1/deal-loss-pdf';
import { Buffer } from 'node:buffer';

export type DealLostPayload = {
  previousStatus: string;
  primaryReason: string;
  competitorName: string | null;
  returnProbability: string;
  whatCouldImprove: string | null;
  additionalNotes: string | null;
};

export async function dealLostAction(organizationId: string, payload: DealLostPayload) {
  const { user } = await requireSalesUser();
  const admin = supaAdmin();

  const { data: org } = await admin
    .from('organizations')
    .select('name, legal_name, dba_name')
    .eq('id', organizationId)
    .maybeSingle();

  const orgName = org?.legal_name || org?.dba_name || org?.name || 'Unknown Organization';

  const pdfBytes = await generateDealLossPdf({
    organizationName: orgName,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    previousStatus: payload.previousStatus,
    primaryReason: payload.primaryReason,
    competitorName: payload.competitorName,
    returnProbability: payload.returnProbability,
    whatCouldImprove: payload.whatCouldImprove,
    additionalNotes: payload.additionalNotes,
  });

  const timestamp = Date.now();
  const pdfPath = `deal-loss-reports/${organizationId}/deal-loss-${timestamp}.pdf`;

  let pdfUrl: string | null = null;
  const { error: uploadError } = await admin.storage
    .from('organization_logos')
    .upload(pdfPath, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (!uploadError) {
    const { data: signedData } = await admin.storage
      .from('organization_logos')
      .createSignedUrl(pdfPath, 60 * 60 * 24 * 365 * 10);
    pdfUrl = signedData?.signedUrl ?? null;
  } else {
    console.error('Failed to upload deal loss PDF', uploadError);
  }

  const { error: insertError } = await admin.from('deal_loss_reports').insert({
    organization_id: organizationId,
    created_by_user_id: user.id,
    previous_status: payload.previousStatus,
    primary_reason: payload.primaryReason,
    competitor_name: payload.competitorName,
    return_probability: payload.returnProbability,
    what_could_improve: payload.whatCouldImprove,
    additional_notes: payload.additionalNotes,
    pdf_url: pdfUrl,
  });

  if (insertError) {
    throw new Error('Failed to save deal loss report.');
  }

  await admin.from('organizations').update({ status: 'lead' }).eq('id', organizationId);

  revalidatePath(`/gf1/organizations/${organizationId}`);
  revalidatePath('/gf1/organizations');
  revalidatePath('/gf1/pipeline');
}
