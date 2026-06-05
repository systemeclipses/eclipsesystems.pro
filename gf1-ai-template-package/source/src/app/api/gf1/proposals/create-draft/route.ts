import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import { MIN_BASE_PRICE_PER_EMPLOYEE } from '@/lib/gf1/pricing';
import { hasGf1Access, resolveProfileName, resolveProfileRole } from '@/lib/gf1/auth';

const proposalDraftSchema = z.object({
  prospectId: z.string().uuid('Invalid prospect ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  prospectName: z.string().min(1, 'Prospect name required'),
  companyName: z.string().min(1, 'Company name required'),
  employeeCount: z.number().int().min(1),
  industry: z.string().optional(),
  state: z.string().min(2).max(2),
  sutaRate: z.number().min(0).max(100),
  wcRateClass: z.string(),
  wcModFactor: z.number().min(0.5).max(2.0),
  adminFeePerEmployee: z.number().min(0),
  estimatedMonthlyAdminCost: z.number().min(0),
  estimatedSUTA: z.number().min(0),
  estimatedWCPremium: z.number().min(0),
  services: z.object({
    health: z.boolean(),
    retirement401k: z.boolean(),
    supplemental: z.boolean(),
    otherCompanyPaid: z.boolean().optional(),
    additionalServices: z
      .object({
        pto: z.boolean().optional(),
        swipeclock: z.boolean().optional(),
        workforceManagement: z.boolean().optional(),
        physicalTimeclocks: z.boolean().optional(),
        applicantTracking: z.boolean().optional(),
        drugTesting: z.boolean().optional(),
        backgroundChecks: z.boolean().optional(),
        wotc: z.boolean().optional(),
        benefitsAdministration: z.boolean().optional(),
      })
      .partial()
      .optional(),
  }),
  customTagline: z.string().optional(),
  managerId: z.string().uuid('Invalid manager ID'),
  managerEmail: z.string().email('Invalid manager email'),
  managerName: z.string().optional(),
  pricingDetails: z.any().optional(),
});

type ProposalDraftPayload = z.infer<typeof proposalDraftSchema>;

function getBaseAppUrl() {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://galactic365.com';
  return base.replace(/\/$/, '');
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Received proposal draft payload:', JSON.stringify(payload, null, 2));

    // Validate payload
    let validated;
    try {
      validated = proposalDraftSchema.parse(payload);
    } catch (zodErr) {
      console.error('Validation error:', zodErr);
      let details: any = zodErr;
      // Only call flatten if this is a ZodError
      if (typeof zodErr === 'object' && zodErr !== null && 'flatten' in zodErr && typeof (zodErr as any).flatten === 'function') {
        details = (zodErr as any).flatten();
      }
      return NextResponse.json(
        { error: 'Validation error', details },
        { status: 400 }
      );
    }

    // Get authenticated user. For local testing you can set the header
    // `x-debug-user` to a user UUID to bypass auth and act as that user.
    const supabase = await supaServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    let authUser = user;
    if ((userError || !user) && typeof (request as any).headers?.get === 'function') {
      const debugUser = (request as any).headers.get('x-debug-user');
      if (debugUser) {
        console.warn('Using debug user override for create-draft:', debugUser);
        authUser = { id: debugUser } as any;
      }
    }

    if (!authUser) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized', details: userError },
        { status: 401 }
      );
    }

    const role = await resolveProfileRole(authUser as any);
    if (!hasGf1Access(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (role === 'sales') {
      const salesRepName = await resolveProfileName(authUser as any);
      const salesRepFilter = salesRepName ?? '__no_access__';
      const { data: org } = await supabase
        .from('organizations')
        .select('sales_rep_name')
        .eq('id', validated.organizationId)
        .maybeSingle();
      if (org?.sales_rep_name !== salesRepFilter) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Create proposal draft in database using admin client and request approval
    const admin = supaAdmin();

    // Inspect proposals table columns so we only insert columns that exist in this DB
    const approvalToken = require('crypto').randomUUID();
    const nowIso = new Date().toISOString();

    const baseProposalPayload: any = {
      status: 'pending_approval',
      updated_at: nowIso,
    };

    const pricingPayload = {
      state: validated.state,
      sutaRate: validated.sutaRate,
      wcRateClass: validated.wcRateClass,
      wcModFactor: validated.wcModFactor,
      adminFeePerEmployee: validated.adminFeePerEmployee,
      estimatedMonthlyAdminCost: validated.estimatedMonthlyAdminCost,
      estimatedSUTA: validated.estimatedSUTA,
      estimatedWCPremium: validated.estimatedWCPremium,
      customTagline: validated.customTagline,
      // Persist the entire wizard payload for downstream pages
      wizardPricing: validated.pricingDetails ?? null,
      // Mirror top-level for safety when consuming without nested access
      ...((validated.pricingDetails ?? {}) as Record<string, any>),
    };

    const derivedEmployeeCount = validated.employeeCount ?? 0;
    const derivedAnnualAdminTarget = Math.round(validated.estimatedMonthlyAdminCost * 12);
    const derivedBasePrice =
      derivedEmployeeCount > 0 ? derivedAnnualAdminTarget / derivedEmployeeCount : MIN_BASE_PRICE_PER_EMPLOYEE;
    const isPercentOfGross = validated.pricingDetails?.adminFeeMode === 'percent_of_gross';
    const adminFeeValue = validated.pricingDetails?.adminFeeValue ?? 0;

    const pricingDetails = (validated.pricingDetails ?? {}) as Record<string, any>;
    const toCents = (value: unknown) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      return Math.round(value * 100);
    };
    const checksPerMonth =
      typeof pricingDetails.checksPerMonth === 'number' && Number.isFinite(pricingDetails.checksPerMonth)
        ? pricingDetails.checksPerMonth
        : null;
    const addonCatalog = Array.isArray(pricingDetails.addons) ? pricingDetails.addons : [];
    const statePricings = Array.isArray(pricingDetails.statePricings) ? pricingDetails.statePricings : [];
    const wcFromStateRows = statePricings.reduce(
      (acc: { cost: number; selling: number }, row: Record<string, unknown>) => {
        const payroll = typeof row.annualPayroll === 'number' && Number.isFinite(row.annualPayroll) ? row.annualPayroll : 0;
        const wcCostRate = typeof row.wcCostRate === 'number' && Number.isFinite(row.wcCostRate) ? row.wcCostRate : 0;
        const wcSellingRate = typeof row.wcSellingRate === 'number' && Number.isFinite(row.wcSellingRate) ? row.wcSellingRate : 0;
        return {
          cost: acc.cost + payroll * (wcCostRate / 100),
          selling: acc.selling + payroll * (wcSellingRate / 100),
        };
      },
      { cost: 0, selling: 0 },
    );
    const wcCostCents = toCents(wcFromStateRows.cost) ?? toCents(pricingDetails.wcCostAnnual) ?? toCents(pricingDetails.wcCost);
    const wcSellingCents =
      toCents(wcFromStateRows.selling) ?? toCents(pricingDetails.wcSellingAnnual) ?? toCents(pricingDetails.wcSellingPrice);

    const optionalProposalPayload: Record<string, any> = {
      prospect_id: validated.prospectId ?? undefined,
      wizard_payload: validated.pricingDetails ?? null,
      pricing_json: pricingPayload,
      pricing_summary: pricingPayload,
      services_json: validated.services ?? null,
      services_snapshot: validated.services ?? null,
      approval_requested_by: authUser.id,
      approval_requested_at: nowIso,
      approval_required: true,
      approval_status: 'awaiting_approval',
      approval_token: approvalToken,
      approval_notes: null,
      wc_cost_cents: wcCostCents,
      wc_selling_price_cents: wcSellingCents,
      admin_fee_enabled: Boolean(pricingDetails.adminFeeEnabled),
      admin_fee_rate_cents: pricingDetails.adminFeeEnabled ? toCents(pricingDetails.adminFeeRate) : null,
      admin_fee_basis: pricingDetails.adminFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      admin_fee_percent:
        pricingDetails.adminFeeMode === 'percent_of_gross' && typeof pricingDetails.adminFeeValue === 'number'
          ? pricingDetails.adminFeeValue
          : null,
      payroll_volume:
        typeof pricingDetails.totalAnnualPayroll === 'number' ? pricingDetails.totalAnnualPayroll : null,
      setup_fee_total: typeof pricingDetails.setupFees === 'number' ? pricingDetails.setupFees : null,
      deposit_total:
        Array.isArray(pricingDetails.otherFees)
          ? pricingDetails.otherFees.reduce((sum: number, fee: Record<string, unknown>) => {
              const amount = typeof fee.amount === 'number' && Number.isFinite(fee.amount) ? fee.amount : 0;
              return sum + amount;
            }, 0)
          : null,
      timekeeping_fee_enabled: Boolean(pricingDetails.timekeepingFeeEnabled),
      timekeeping_fee_rate_cents: pricingDetails.timekeepingFeeEnabled ? toCents(pricingDetails.timekeepingFeeRate) : null,
      timekeeping_fee_basis: pricingDetails.timekeepingFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      learning_management_system_fee_enabled: Boolean(pricingDetails.learningManagementSystemFeeEnabled),
      learning_management_system_fee_rate_cents:
        pricingDetails.learningManagementSystemFeeEnabled ? toCents(pricingDetails.learningManagementSystemFeeRate) : null,
      learning_management_system_fee_basis:
        pricingDetails.learningManagementSystemFeeBasis === 'PEPC' ? 'PEPC' : 'PEPM',
      checks_per_month: checksPerMonth,
      addons_json: addonCatalog,
      updated_at: nowIso,
    };

    let bypassForeignKeys = false;
    try {
      bypassForeignKeys =
        Boolean((request as any).headers?.get) &&
        (request as any).headers.get('x-debug-bypass-fks') === '1';
    } catch {
      bypassForeignKeys = false;
    }

    const selectCols = ['id', 'created_at', 'status', 'created_by'];
    const { data: existingProposal } = await admin
      .from('proposals')
      .select('id, status, created_by')
      .eq('organization_id', validated.organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let proposal;
    let dbError;
    if (existingProposal?.id) {
      const { data, error } = await admin
        .from('proposals')
        .update({ ...baseProposalPayload, status: 'pending_approval' })
        .eq('id', existingProposal.id)
        .select(selectCols.join(', '))
        .single();
      proposal = data;
      dbError = error;
    } else {
      const insertPayload: any = {
        ...baseProposalPayload,
        status: 'pending_approval',
        organization_id: validated.organizationId,
        created_by: authUser.id,
        created_at: nowIso,
      };

      if (bypassForeignKeys) delete insertPayload.organization_id;

      const { data, error } = await admin
        .from('proposals')
        .insert(insertPayload)
        .select(selectCols.join(', '))
        .single();
      proposal = data;
      dbError = error;
    }

    if (dbError || !proposal) {
      console.error('Database error creating proposal:', dbError, '\nPayload:', JSON.stringify(validated, null, 2));
      return NextResponse.json(
        { error: 'Failed to create proposal draft', details: dbError ?? 'No proposal record returned' },
        { status: 500 }
      );
    }
    const proposalRecord = proposal as unknown as {
      id: string;
      approval_token?: string | null;
      manager_email?: string | null;
      status?: string | null;
      created_by?: string | null;
    };

    if (proposalRecord.status !== 'pending_approval') {
      const { error: statusError } = await admin.from('proposals').update({ status: 'pending_approval' }).eq('id', proposalRecord.id);
      if (!statusError) proposalRecord.status = 'pending_approval';
    }

    let approvalTokenPersisted = true;
    const applyOptionalFields = async (payload: Record<string, any>) => {
      let remaining = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
      if (!proposalRecord.created_by && authUser?.id) {
        remaining = { created_by: authUser.id, ...remaining };
      }
      for (let attempt = 0; attempt < 5 && Object.keys(remaining).length > 0; attempt += 1) {
        const { error } = await admin.from('proposals').update(remaining).eq('id', proposalRecord.id);
        if (!error) return;
        if (error.code === 'PGRST204' && typeof error.message === 'string') {
          const match = error.message.match(/'([^']+)' column/);
          if (match?.[1]) {
            if (match[1] === 'approval_token') {
              approvalTokenPersisted = false;
            }
            delete remaining[match[1]];
            continue;
          }
        }
        if (error.code === '23503' && typeof error.message === 'string' && error.message.includes('prospect_id')) {
          delete remaining.prospect_id;
          continue;
        }
        // Fall back to field-by-field updates so one bad value does not drop all pricing fields.
        let recovered = false;
        for (const [key, value] of Object.entries(remaining)) {
          const { error: singleError } = await admin.from('proposals').update({ [key]: value }).eq('id', proposalRecord.id);
          if (!singleError) {
            recovered = true;
            delete remaining[key];
            continue;
          }
          if (singleError.code === '23503' && key === 'prospect_id') {
            delete remaining[key];
            continue;
          }
          console.warn(`Failed to persist proposal field ${key}`, singleError);
        }
        if (!recovered && Object.keys(remaining).length > 0) {
          throw new Error('Failed to persist proposal pricing fields');
        }
      }
    };
    await applyOptionalFields(optionalProposalPayload);

    // Verify that persisted proposal data actually landed on the record.
    // If the DB schema is missing columns or an update silently dropped fields,
    // fail fast with a clear server log so we can diagnose quickly.
    const { data: persistedProposal, error: persistedReadError } = await admin
      .from('proposals')
      .select('*')
      .eq('id', proposalRecord.id)
      .maybeSingle();

    if (persistedReadError || !persistedProposal) {
      console.error('Proposal persistence verification failed: unable to read proposal', {
        proposalId: proposalRecord.id,
        persistedReadError,
      });
      return NextResponse.json(
        { error: 'Proposal saved but verification read failed', details: persistedReadError ?? null },
        { status: 500 },
      );
    }

    const expectedChecks: Record<string, boolean> = {
      pricing_json: Boolean(validated.pricingDetails),
      wizard_payload: Boolean(validated.pricingDetails),
      pricing_summary: Boolean(validated.pricingDetails),
      services_json: Boolean(validated.services),
      services_snapshot: Boolean(validated.services),
      wc_cost_cents: wcCostCents !== null,
      wc_selling_price_cents: wcSellingCents !== null,
      admin_fee_enabled: true,
      timekeeping_fee_enabled: true,
    };

    const missingFields = Object.entries(expectedChecks)
      .filter(([field, shouldExist]) => {
        if (!shouldExist) return false;
        if (!(field in (persistedProposal as Record<string, unknown>))) return false;
        const value = (persistedProposal as Record<string, unknown>)[field];
        if (typeof value === 'boolean') return false;
        if (value === null || value === undefined) return true;
        if (typeof value === 'object') {
          if (Array.isArray(value)) return value.length === 0;
          return Object.keys(value as Record<string, unknown>).length === 0;
        }
        return false;
      })
      .map(([field]) => field);

    if (missingFields.length > 0) {
      const sanitizeJson = (value: unknown) => {
        try {
          return value === undefined ? null : JSON.parse(JSON.stringify(value));
        } catch {
          return null;
        }
      };
      const recoveryPayload: Record<string, unknown> = {
        pricing_json: sanitizeJson(pricingPayload),
        wizard_payload: sanitizeJson(validated.pricingDetails ?? null),
        pricing_summary: sanitizeJson(pricingPayload),
        services_json: sanitizeJson(validated.services ?? null),
        services_snapshot: sanitizeJson(validated.services ?? null),
        wc_cost_cents: wcCostCents,
        wc_selling_price_cents: wcSellingCents,
      };
      const retryPatch = Object.fromEntries(
        missingFields
          .filter((field) => field in recoveryPayload)
          .map((field) => [field, recoveryPayload[field]])
          .filter(([, value]) => value !== undefined),
      );
      if (Object.keys(retryPatch).length > 0) {
        const { error: retryError } = await admin.from('proposals').update(retryPatch).eq('id', proposalRecord.id);
        if (retryError) {
          console.error('Proposal persistence recovery update failed', {
            proposalId: proposalRecord.id,
            retryPatchKeys: Object.keys(retryPatch),
            retryError,
          });
        }
      }

      const { data: persistedAfterRetry } = await admin
        .from('proposals')
        .select('*')
        .eq('id', proposalRecord.id)
        .maybeSingle();
      const stillMissing =
        persistedAfterRetry
          ? Object.entries(expectedChecks)
              .filter(([field, shouldExist]) => {
                if (!shouldExist) return false;
                if (!(field in (persistedAfterRetry as Record<string, unknown>))) return false;
                const value = (persistedAfterRetry as Record<string, unknown>)[field];
                if (typeof value === 'boolean') return false;
                if (value === null || value === undefined) return true;
                if (typeof value === 'object') {
                  if (Array.isArray(value)) return value.length === 0;
                  return Object.keys(value as Record<string, unknown>).length === 0;
                }
                return false;
              })
              .map(([field]) => field)
          : missingFields;

      if (stillMissing.length === 0) {
        console.warn('Proposal persistence verification required a retry but recovered', {
          proposalId: proposalRecord.id,
          recoveredFields: missingFields,
        });
      } else {
      console.error('Proposal persistence verification failed: missing expected data', {
        proposalId: proposalRecord.id,
        missingFields: stillMissing,
        payloadSummary: {
          hasPricingDetails: Boolean(validated.pricingDetails),
          hasServices: Boolean(validated.services),
          wcCostCents,
          wcSellingCents,
        },
      });
      return NextResponse.json(
        {
          error: 'Proposal data did not fully persist',
          missingFields: stillMissing,
          proposalId: proposalRecord.id,
        },
        { status: 500 },
      );
      }
    }

    // Send approval email to manager (Brevo)
    try {
      const manager = validated.managerEmail;
      const proposalId = proposalRecord.id;
      const baseUrl = getBaseAppUrl();
      const fallbackUrl = `${baseUrl}/gf1/proposals/${proposalId}`;
      const approvalUrl = approvalTokenPersisted
        ? `${baseUrl}/api/gf1/proposals/${proposalId}/approve?token=${approvalToken}`
        : fallbackUrl;
      if (manager) {
        const { sendApprovalEmail } = await import('@/lib/brevo');
        await sendApprovalEmail({
          to: manager,
          proposalId,
          proposalData: {
            client: validated.prospectName,
            amount: `$${validated.estimatedMonthlyAdminCost.toLocaleString('en-US')}/mo`,
            terms: validated.customTagline ?? '',
          },
          approvalUrl,
          approverName: validated.managerName ?? undefined,
        });
      }
    } catch (err) {
      console.error('Failed to send approval email', err);
    }

    return NextResponse.json({
      success: true,
      proposalId: proposalRecord.id,
      message: `Proposal sent to manager for approval`,
    });
  } catch (error) {
    console.error('Unexpected error in proposal draft API:', error);
    let details: any = error;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
      details = (error as any).message;
    }
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 }
    );
  }
}

async function sendApprovalEmail(
  managerEmail: string,
  prospectName: string,
  companyName: string,
  employeeCount: number,
  estimatedMonthlyCost: number,
  proposalId: string,
  createdByEmail: string
): Promise<void> {
  // Note: In production, integrate with SendGrid, Resend, or your email service
  // For now, log the email that would be sent
  console.log('📧 APPROVAL EMAIL:', {
    to: managerEmail,
    subject: `New Proposal Pending Approval – ${prospectName}`,
    prospectName,
    companyName,
    employeeCount,
    estimatedMonthlyCost,
    proposalId,
    createdByEmail,
    reviewLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gf1/proposals/${proposalId}`,
  });

  // TODO: Implement actual email sending via your email service
  // Example with Resend:
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@galactic365.com',
    to: managerEmail,
    subject: `New Proposal Pending Approval – ${prospectName}`,
    html: generateApprovalEmailHTML(...),
  });
  */
}

function generateApprovalEmailHTML(
  prospectName: string,
  companyName: string,
  employeeCount: number,
  estimatedMonthlyCost: number,
  proposalId: string,
  createdByEmail: string
): string {
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gf1/proposals/${proposalId}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #050f27; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #005791; }
          .button { display: inline-block; background: #005791; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Proposal Pending Your Approval</h1>
          </div>
          
          <p>Hello,</p>
          
          <p>${createdByEmail} has submitted a new proposal that requires your approval.</p>
          
          <div class="section">
            <h3 style="margin-top: 0;">Prospect Details</h3>
            <p><strong>Prospect:</strong> ${prospectName}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Employee Count:</strong> ${employeeCount}</p>
            <p><strong>Estimated Monthly Admin Cost:</strong> $${estimatedMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <p>Please review the proposal details and approve or reject it.</p>
          
          <a href="${reviewLink}" class="button">Review Proposal</a>
          
          <div class="footer">
            <p>This is an automated message from Galactic 365. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
