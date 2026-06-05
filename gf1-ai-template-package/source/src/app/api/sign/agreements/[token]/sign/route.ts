import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supaAdmin } from '@/lib/supabase/admin';
import { calculateAgreement } from '@/lib/gf1/agreements-calculations';
import { generateAgreementPdfBytes } from '@/lib/gf1/agreements-pdf';

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function dataUrlToBytes(dataUrl: string) {
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  return Buffer.from(parts[1], 'base64');
}

function formatSignatureDate(value?: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const body = await request.json();
    const signatureType = body?.signatureType as 'typed' | 'drawn' | undefined;
    const typedName = body?.typedName as string | undefined;
    const printName = body?.printName as string | undefined;
    const signerTitle = body?.signerTitle as string | undefined;
    const signatureDate = body?.signatureDate as string | undefined;
    const signatureDataUrl = body?.signatureDataUrl as string | undefined;
    const consentText = body?.consentText as string | undefined;
    const consentChecked = Boolean(body?.consentChecked);

    if (!signatureType || !consentChecked || !consentText) {
      return NextResponse.json({ error: 'Consent required' }, { status: 400 });
    }

    if (signatureType === 'typed' && !typedName?.trim()) {
      return NextResponse.json({ error: 'Typed signature required' }, { status: 400 });
    }

    if (!printName?.trim()) {
      return NextResponse.json({ error: 'Printed name required' }, { status: 400 });
    }

    if (!signerTitle?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    if (!signatureDate?.trim()) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 });
    }

    if (signatureType === 'drawn' && !signatureDataUrl) {
      return NextResponse.json({ error: 'Drawn signature required' }, { status: 400 });
    }

    const admin = supaAdmin();
    const tokenHash = sha256(token);
    const { data: requestRow, error } = await admin
      .from('agreement_signing_requests')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !requestRow) {
      return NextResponse.json({ error: 'Signing request not found' }, { status: 404 });
    }

    if (requestRow.status === 'signed') {
      return NextResponse.json({ error: 'Already signed' }, { status: 409 });
    }

    const now = new Date();
    if (new Date(requestRow.expires_at).getTime() < now.getTime()) {
      return NextResponse.json({ error: 'Signing link expired' }, { status: 410 });
    }

    let signatureImagePath: string | null = null;
    let signaturePngBytes: Uint8Array | null = null;
    if (signatureType === 'drawn' && signatureDataUrl) {
      const bytes = dataUrlToBytes(signatureDataUrl);
      if (!bytes) {
        return NextResponse.json({ error: 'Invalid signature payload' }, { status: 400 });
      }
      signaturePngBytes = bytes;
      signatureImagePath = `agreement-signatures/${requestRow.id}/client-signature.png`;
      const uploadResult = await admin.storage
        .from('agreement-signatures')
        .upload(signatureImagePath, bytes, {
          contentType: 'image/png',
          upsert: true,
        });
      if (uploadResult.error) {
        console.error(uploadResult.error);
        return NextResponse.json({ error: 'Unable to store signature image' }, { status: 500 });
      }
    }

    const agreementForm = requestRow.form_json;
    const calculations = calculateAgreement(agreementForm);
    const pdfBytes = await generateAgreementPdfBytes({
      form: agreementForm,
      calculations,
      clientSignature: {
        name: typedName?.trim() || requestRow.recipient_name,
        printName: printName.trim(),
        title: signerTitle.trim(),
        dateText: formatSignatureDate(signatureDate),
        signaturePngBytes,
        signatureText: signatureType === 'typed' ? typedName?.trim() || requestRow.recipient_name : null,
      },
      providerSignature: {
        name: requestRow.provider_signatory_name,
        title: requestRow.provider_signatory_title,
      },
      assetBaseUrl: requestOrigin,
    });

    const pdfPath = `agreement-documents/${requestRow.id}/signed-agreement.pdf`;
    const pdfUpload = await admin.storage.from('agreement-documents').upload(pdfPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (pdfUpload.error) {
      console.error(pdfUpload.error);
      return NextResponse.json({ error: 'Unable to store signed PDF' }, { status: 500 });
    }

    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null;
    const signerUserAgent = request.headers.get('user-agent');

    const { error: sigError } = await admin.from('agreement_signatures').insert({
      signing_request_id: requestRow.id,
      signature_type: signatureType,
      typed_name: typedName?.trim() || null,
      signature_image_path: signatureImagePath,
      consent_text: consentText,
      consent_checked: true,
      signer_ip: signerIp,
      signer_user_agent: signerUserAgent,
    });

    if (sigError) {
      console.error(sigError);
      return NextResponse.json({ error: 'Unable to save signature' }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from('agreement_signing_requests')
      .update({
        status: 'signed',
        signed_at: now.toISOString(),
        signed_pdf_path: pdfPath,
      })
      .eq('id', requestRow.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: 'Unable to finalize signature' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      downloadUrl: `/api/sign/agreements/${token}/pdf`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
