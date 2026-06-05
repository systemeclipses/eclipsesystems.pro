import path from 'node:path';
import fs from 'node:fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import PizZip from 'pizzip';
import { z } from 'zod';
import type { ProposalPptxPayload, WizardPricingPayload } from '@/lib/gf1/proposal-pptx-types';
import { supaServer } from '@/lib/supabase/server';
import { hasGf1Access, resolveProfileRole } from '@/lib/gf1/auth';

export const runtime = 'nodejs';

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'proposal template v2.pptx');
const DEFAULT_LOGO_SIZE: [number, number] = [320, 120];
const PLACEHOLDER_IMAGE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
);
const DEFAULT_FICA_RATE = 7.65;
const DEFAULT_FUTA_RATE = 0.6;

const booleanLike = z.union([z.boolean(), z.string(), z.number(), z.null()]);
const booleanLikeRecord = z.object({}).catchall(booleanLike);
const wizardServicesSchema = z
  .object({
    health: booleanLike.optional(),
    retirement401k: booleanLike.optional(),
    supplemental: booleanLike.optional(),
    otherCompanyPaid: booleanLike.optional(),
    additionalServices: booleanLikeRecord.optional().nullable(),
  })
  .catchall(booleanLike)
  .optional()
  .nullable();

const wizardSchema = z
  .object({
    statePricings: z
      .array(
        z
          .object({
            state: z.string().optional().nullable(),
            employees: z.number().optional().nullable(),
            annualPayroll: z.number().optional().nullable(),
            sutaRate: z.number().optional().nullable(),
            wcClassCode: z.string().optional().nullable(),
            wcRate: z.number().optional().nullable(),
          })
          .passthrough(),
      )
      .optional()
      .nullable(),
    adminFeeMode: z.string().optional().nullable(),
    adminFeeValue: z.number().optional().nullable(),
    setupFees: z.number().optional().nullable(),
    otherFees: z
      .array(
        z
          .object({
            id: z.string().optional().nullable(),
            label: z.string().optional().nullable(),
            amount: z.number().optional().nullable(),
          })
          .passthrough(),
      )
      .optional()
      .nullable(),
    services: wizardServicesSchema,
    additionalServices: booleanLikeRecord.optional().nullable(),
    payFrequency: z.string().optional().nullable(),
    notesForApprover: z.string().optional().nullable(),
    employeeCount: z.number().optional().nullable(),
    estimatedMonthlyAdminCost: z.number().optional().nullable(),
    estimatedSUTA: z.number().optional().nullable(),
    estimatedWCPremium: z.number().optional().nullable(),
  })
  .passthrough()
  .optional()
  .nullable();

const requestSchema = z.object({
  companyName: z.string().min(1),
  tradeName: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  prospectContactName: z.string().optional().nullable(),
  employeeCount: z.number().int().min(1),
  adminFeePerEmployee: z.number().nonnegative(),
  estimatedMonthlyAdminCost: z.number().nonnegative(),
  estimatedSUTA: z.number().nonnegative(),
  estimatedWCPremium: z.number().nonnegative(),
  industry: z.string().optional().nullable(),
  customTagline: z.string().optional().nullable(),
  services: booleanLikeRecord.optional(),
  wizardPricing: wizardSchema,
});

let cachedTemplate: Buffer | null = null;
let cachedTemplateMtime: number | null = null;

export async function POST(request: NextRequest) {
  try {
    const supabase = await supaServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = await resolveProfileRole(user);
    if (!hasGf1Access(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = requestSchema.parse(await request.json());

    const templateBuffer = await loadTemplate();
    const zip = new PizZip(templateBuffer);
    patchBenefitSyntax(zip);

    const logoBuffer = await fetchLogo(payload.logoUrl ?? null);

    const doc = new Docxtemplater(zip, {
      modules: [
        new ImageModule({
          getImage: (tagValue: any) => (tagValue?.data ? tagValue.data : PLACEHOLDER_IMAGE),
          getSize: (img: Buffer, tagValue: any) => tagValue?.size ?? DEFAULT_LOGO_SIZE,
        }),
      ],
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    const wizard = (payload.wizardPricing ?? {}) as WizardPricingPayload;
    const normalizedPayload: ProposalPptxPayload = {
      ...payload,
      wizardPricing: wizard,
      services: normalizePayloadServices(payload.services ?? {}),
    };
    const templateData = buildTemplateData(normalizedPayload, wizard, logoBuffer);

    doc.render(templateData);

    const pptBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const fileName = `${slugify(payload.companyName)}-proposal.pptx`;
    return new NextResponse(pptBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[generate-pptx] error', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid PPTX payload', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate presentation' }, { status: 500 });
  }
}

async function loadTemplate() {
  const stats = await fs.stat(TEMPLATE_PATH);
  if (!cachedTemplate || !cachedTemplateMtime || stats.mtimeMs !== cachedTemplateMtime) {
    cachedTemplate = await fs.readFile(TEMPLATE_PATH);
    cachedTemplateMtime = stats.mtimeMs;
  }
  return cachedTemplate;
}

function patchBenefitSyntax(zip: PizZip) {
  const slidePath = 'ppt/slides/slide6.xml';
  const file = zip.file(slidePath);
  if (!file) return;
  const patched = file
    .asText()
    .replace(/(?<!\{)\{#(benefits\.[^}]+)\}(?!\})/g, '{{#$1}}')
    .replace(/(?<!\{)\{\/(benefits\.[^}]+)\}(?!\})/g, '{{/$1}}');
  zip.file(slidePath, patched);
}

async function fetchLogo(url: string | null) {
  if (!url) return null;
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resolved = new URL(url, base);
    const res = await fetch(resolved);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer);
  } catch (err) {
    console.warn('[generate-pptx] failed to fetch logo', err);
    return null;
  }
}

function buildTemplateData(payload: ProposalPptxPayload, wizard: WizardPricingPayload, logo: Buffer | null) {
  const wizardServices = normalizeServiceFlags(wizard?.services ?? {});
  const payloadServices = normalizeServiceFlags(payload.services ?? {});
  const benefits = {
    health_insurance: coerceBoolean(wizardServices.health ?? payloadServices.health),
    four01k: coerceBoolean(wizardServices.retirement401k ?? payloadServices.retirement401k),
    section125: coerceBoolean(wizardServices.otherCompanyPaid ?? payloadServices.otherCompanyPaid),
    supplemental: coerceBoolean(wizardServices.supplemental ?? payloadServices.supplemental),
  };
  const rows = Array.isArray(wizard?.statePricings) ? wizard.statePricings : [];
  const otherFees = Array.isArray(wizard?.otherFees) ? wizard.otherFees : [];

  return {
    employees_count: payload.employeeCount.toString(),
    organizationLogo: logo
      ? {
          data: logo,
          size: DEFAULT_LOGO_SIZE,
        }
      : {
          data: PLACEHOLDER_IMAGE,
          size: DEFAULT_LOGO_SIZE,
        },
    fees: buildFeeMap(payload, wizard, rows, otherFees),
    benefits: {
      health_insurance: benefits.health_insurance ? [{}] : [],
      four01k: benefits.four01k ? [{}] : [],
      section125: benefits.section125 ? [{}] : [],
      supplemental: benefits.supplemental ? [{}] : [],
    },
  };
}

function buildFeeMap(
  payload: ProposalPptxPayload,
  wizard: WizardPricingPayload,
  rows: NonNullable<WizardPricingPayload['statePricings']>,
  otherFees: NonNullable<WizardPricingPayload['otherFees']>,
) {
  return {
    initial_setup: formatCurrency(wizard?.setupFees ?? findFeeAmount(otherFees, ['setup'])),
    aca_setup: formatCurrency(findFeeAmount(otherFees, ['aca'])),
    time_attendance: formatCurrency(findFeeAmount(otherFees, ['time', 'attendance'])),
    workers_comp_deposit: formatCurrency(findFeeAmount(otherFees, ['deposit'])),
    fica_pct: formatPercent(DEFAULT_FICA_RATE),
    futa_pct: formatPercent(DEFAULT_FUTA_RATE),
    suta_al_pct: formatPercent(findStateRate(rows, 'AL')),
    suta_ga_pct: formatPercent(findStateRate(rows, 'GA')),
    suta_fl_pct: formatPercent(findStateRate(rows, 'FL')),
    wc_8810_pct: formatPercent(findWcRate(rows, '8810')),
    wc_8742_pct: formatPercent(findWcRate(rows, '8742')),
    wc_8010_pct: formatPercent(findWcRate(rows, '8010')),
  };
}

function findFeeAmount(fees: WizardPricingPayload['otherFees'], keywords: string[]) {
  if (!fees) return 0;
  const lowered = keywords.map((k) => k.toLowerCase());
  for (const fee of fees) {
    const label = (fee.label ?? '').toLowerCase();
    if (lowered.every((kw) => label.includes(kw))) {
      return typeof fee.amount === 'number' ? fee.amount : 0;
    }
  }
  return 0;
}

function findStateRate(rows: WizardPricingPayload['statePricings'], state: string) {
  if (!rows) return null;
  const match = rows.find((row) => row.state?.toUpperCase() === state);
  return typeof match?.sutaRate === 'number' ? match?.sutaRate ?? null : null;
}

function findWcRate(rows: WizardPricingPayload['statePricings'], code: string) {
  if (!rows) return null;
  const normalized = code.replace(/\D/g, '');
  const match = rows.find((row) => (row.wcClassCode ?? '').replace(/\D/g, '') === normalized);
  return typeof match?.wcRate === 'number' ? match?.wcRate ?? null : null;
}

function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$0.00';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'TBD';
  return value.toFixed(2);
}

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'proposal'
  );
}

function coerceBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
    return normalized.length > 0;
  }
  return Boolean(value);
}

function normalizeServiceFlags(flags: Record<string, unknown>) {
  return {
    health: coerceBoolean(flags.health),
    retirement401k: coerceBoolean(flags.retirement401k),
    supplemental: coerceBoolean(flags.supplemental),
    otherCompanyPaid: coerceBoolean(flags.otherCompanyPaid),
  };
}

function normalizePayloadServices(flags: Record<string, unknown>) {
  return Object.keys(flags).reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = coerceBoolean(flags[key]);
    return acc;
  }, {});
}
