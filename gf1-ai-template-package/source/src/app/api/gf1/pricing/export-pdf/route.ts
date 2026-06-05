import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { calculateAgreement } from '@/lib/gf1/agreements-calculations';
import {
  generateAgreementPdfBytes,
  generateCostAnalysisPdfBytes,
  type CostAnalysisPdfPayload,
} from '@/lib/gf1/agreements-pdf';
import { resolveProfileRole, hasGf1Access } from '@/lib/gf1/auth';
import type { AgreementFormValues } from '@/lib/gf1/agreements-types';
import type { User } from '@supabase/supabase-js';

type ExportKind = 'billing-agreement' | 'cost-analysis';

type ExportRequestBody = {
  kind: ExportKind;
  organizationId: string;
  form: AgreementFormValues;
  analysis?: CostAnalysisPdfPayload['analysis'];
  billingOverrides?: Record<string, string>;
};

const STORAGE_BUCKET = 'agreement-documents';

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildTimestampStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

function labelForKind(kind: ExportKind) {
  return kind === 'billing-agreement' ? 'Billing Agreement' : 'Cost Analysis';
}

function parseBearerToken(header: string | null) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

async function resolveRequestUser(request: Request): Promise<User | null> {
  const bearerToken = parseBearerToken(request.headers.get('authorization'));
  if (bearerToken) {
    const admin = supaAdmin();
    const { data, error } = await admin.auth.getUser(bearerToken);
    if (!error && data.user) return data.user;
  }

  const supabase = await supaServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const requestOrigin = new URL(request.url).origin;
    const user = await resolveRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveProfileRole(user);
    if (!hasGf1Access(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as ExportRequestBody;
    if (!body?.kind || !body?.organizationId || !body?.form) {
      return NextResponse.json({ error: 'Missing export payload.' }, { status: 400 });
    }

    const calculations = calculateAgreement(body.form);
    const admin = supaAdmin();
    const { data: organization } = await admin
      .from('organizations')
      .select('id, name, legal_name, dba_name')
      .eq('id', body.organizationId)
      .maybeSingle();

    const organizationName =
      organization?.legal_name || organization?.dba_name || organization?.name || body.form.legalName || 'Client';
    const filenameBase = sanitizeFilenamePart(organizationName) || 'pricing';
    const timestamp = buildTimestampStamp();
    const fileName = `${filenameBase}-${body.kind}-${timestamp}.pdf`;
    const storagePath = `gf1/pricing/${body.organizationId}/${fileName}`;

    let pdfBytes: Uint8Array;
    if (body.kind === 'billing-agreement') {
      pdfBytes = await generateAgreementPdfBytes({
        form: body.form,
        calculations,
        assetBaseUrl: requestOrigin,
        billingOverrides: body.billingOverrides,
      });
    } else {
      if (!body.analysis) {
        return NextResponse.json({ error: 'Missing cost analysis payload.' }, { status: 400 });
      }
      pdfBytes = await generateCostAnalysisPdfBytes({
        form: body.form,
        calculations,
        analysis: body.analysis,
      });
    }

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload generated pricing PDF', uploadError);
      return NextResponse.json({ error: 'Failed to store PDF.' }, { status: 500 });
    }

    const { data: infoSheet } = await admin
      .from('pricing_info_sheets')
      .select('id')
      .eq('organization_id', body.organizationId)
      .maybeSingle();

    const { error: insertError } = await admin.from('generated_pdfs').insert({
      document_type: body.kind,
      source_module: 'gf1_pricing',
      title: `${organizationName} ${labelForKind(body.kind)}`,
      file_name: fileName,
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      organization_id: body.organizationId,
      pricing_info_sheet_id: infoSheet?.id ?? null,
      created_by: user.id,
      metadata: {
        organization_name: organizationName,
        pay_periods: calculations.payPeriodsPerYear,
        employee_count: calculations.employeeCount,
        kind: body.kind,
      },
    });

    if (insertError) {
      console.error('Failed to log generated pricing PDF', insertError);
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
        'X-Pdf-Log-Status': insertError ? 'failed' : 'ok',
      },
    });
  } catch (error) {
    console.error('Pricing PDF export failed', error);
    return NextResponse.json({ error: 'Failed to generate PDF.' }, { status: 500 });
  }
}
