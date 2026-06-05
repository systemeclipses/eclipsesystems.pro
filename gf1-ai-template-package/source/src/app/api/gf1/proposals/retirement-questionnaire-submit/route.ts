import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { supaAdmin } from '@/lib/supabase/admin';
import { sendRetirementQuestionnaireCompletedEmail } from '@/lib/brevo';
import {
  buildRetirementQuestionnairePdf,
  type RetirementQuestionnaireAnswers,
} from '@/lib/gf1/retirement-questionnaire-pdf';

const STORAGE_BUCKET = 'agreement-documents';
const STORAGE_PREFIX = 'retirement-questionnaires';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const NOTIFY_TO = 'vanessa@galactic-inc.com';
const NOTIFY_CC = ['blan@galactic-inc.com'];

const officerSchema = z.object({
  name: z.string().optional().default(''),
  title: z.string().optional().default(''),
  percent: z.string().optional().default(''),
});

const payloadSchema = z.object({
  orgId: z.string().uuid().optional().nullable(),
  companyName: z.string().min(1, 'Company name required'),
  prospectName: z.string().optional().nullable(),

  interestedInJoining: z.boolean().nullable().optional().default(null),
  estimatedDateOfAdoption: z.string().optional().default(''),
  offersRetirementPlan: z.boolean().nullable().optional().default(null),
  planType: z.string().optional().default(''),
  existingPlanTrustee: z.string().optional().default(''),
  planNumber: z.string().optional().default(''),
  planAssets: z.string().optional().default(''),
  providerName: z.string().optional().default(''),
  providerPhone: z.string().optional().default(''),
  providerEmail: z.string().optional().default(''),
  datePlanEstablished: z.string().optional().default(''),

  fiscalYearEnd: z.string().optional().default(''),
  officers: z.array(officerSchema).max(3).optional().default([]),

  serviceRequirement: z.string().optional().default(''),
  ageRequirement: z.string().optional().default(''),
  grandfatheredEligibilityDate: z.string().optional().default(''),
  entryDate: z.enum(['month', 'quarter']).nullable().optional().default(null),

  matchDetails: z.string().optional().default(''),
  vesting: z.enum(['immediate', '5-year', '6-year', '3-year']).nullable().optional().default(null),
  threeYearVestingYear1: z.string().optional().default(''),
  threeYearVestingYear2: z.string().optional().default(''),
});

function safeFileSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'company';
}

function randomToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = payloadSchema.parse(body);

    const answers: RetirementQuestionnaireAnswers = {
      ...data,
      officers: data.officers ?? [],
    };

    const pdfBytes = await buildRetirementQuestionnairePdf(answers);

    const admin = supaAdmin();
    const fileName = `${safeFileSlug(data.companyName)}-${randomToken()}.pdf`;
    const filePath = data.orgId
      ? `${STORAGE_PREFIX}/${data.orgId}/${fileName}`
      : `${STORAGE_PREFIX}/${fileName}`;
    console.log('[retirement-questionnaire-submit] uploading', {
      orgId: data.orgId,
      bucket: STORAGE_BUCKET,
      filePath,
    });

    const upload = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600',
      });
    if (upload.error) {
      console.error('[retirement-questionnaire-submit] upload failed', {
        bucket: STORAGE_BUCKET,
        filePath,
        error: upload.error,
      });
      const detail =
        (upload.error as { message?: string; statusCode?: string | number })?.message ??
        String(upload.error);
      return NextResponse.json(
        { error: `Failed to store questionnaire PDF: ${detail}` },
        { status: 500 }
      );
    }

    const signed = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) {
      console.error('[retirement-questionnaire-submit] sign url failed', signed.error);
      return NextResponse.json({ error: 'Failed to create PDF link' }, { status: 500 });
    }

    if (data.orgId) {
      const markerPath = `${STORAGE_PREFIX}/${data.orgId}/.submitted`;
      const markerPayload = JSON.stringify({
        submittedAt: new Date().toISOString(),
        pdfPath: filePath,
      });
      const markerUpload = await admin.storage
        .from(STORAGE_BUCKET)
        .upload(markerPath, Buffer.from(markerPayload), {
          contentType: 'application/json',
          upsert: true,
          cacheControl: '0',
        });
      if (markerUpload.error) {
        console.warn('[retirement-questionnaire-submit] marker upload failed', markerUpload.error);
      } else {
        console.log('[retirement-questionnaire-submit] marker written', { markerPath, pdfPath: filePath });
      }

      // Best-effort DB stamp (only if the column exists).
      try {
        const { error: updateError } = await admin
          .from('organizations')
          .update({ retirement_questionnaire_submitted_at: new Date().toISOString() })
          .eq('id', data.orgId);
        if (updateError) {
          console.warn('[retirement-questionnaire-submit] DB stamp failed (column may not exist)', updateError);
        }
      } catch (err) {
        console.warn('[retirement-questionnaire-submit] DB stamp threw', err);
      }
    }

    await sendRetirementQuestionnaireCompletedEmail({
      to: NOTIFY_TO,
      cc: NOTIFY_CC,
      recipientName: 'Vanessa',
      organizationName: data.companyName,
      prospectName: data.prospectName ?? null,
      pdfUrl: signed.data.signedUrl,
    });

    return NextResponse.json({ success: true, pdfUrl: signed.data.signedUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit questionnaire';
    console.error('[retirement-questionnaire-submit] error', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
