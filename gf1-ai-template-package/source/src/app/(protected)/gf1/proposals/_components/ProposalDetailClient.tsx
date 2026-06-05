"use client";

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProposalDetail.module.css';
import ProposalPricingEditor, {
  type ProposalPricingForm,
} from '@/components/gf1/ProposalPricingEditor';
import {
  approveProposalAction,
  rejectProposalAction,
} from '../[id]/actions';
import { generateProposalPDF } from '@/lib/gf1/proposal-pdf';
import type { Gf1PayFrequency, Gf1ProposalRecord, Gf1ProposalStatus } from '@/lib/gf1/types';

type ProposalDetail = {
  id: string;
  status: string | null;
  approval_status?: string | null;
  modeled_employee_count?: number | null;
  base_price_per_employee_per_year?: number | null;
  annual_admin_target?: number | null;
  billing_model?: string | null;
  percent_of_gross?: number | null;
  flat_admin_fee_per_employee_per_period?: number | null;
  notes_for_prospect?: string | null;
  notes_for_internal?: string | null;
  pricing_json?: Record<string, unknown> | null;
  pricing_summary?: Record<string, unknown> | null;
  wizard_payload?: Record<string, unknown> | null;
  manager_email?: string | null;
  services_json?: Record<string, boolean | undefined> | null;
  wc_cost_cents?: number | null;
  wc_selling_price_cents?: number | null;
  admin_fee_enabled?: boolean | null;
  admin_fee_rate_cents?: number | null;
  admin_fee_basis?: 'PEPC' | 'PEPM' | null;
  learning_management_system_fee_enabled?: boolean | null;
  learning_management_system_fee_rate_cents?: number | null;
  learning_management_system_fee_basis?: 'PEPC' | 'PEPM' | null;
  timekeeping_fee_enabled?: boolean | null;
  timekeeping_fee_rate_cents?: number | null;
  timekeeping_fee_basis?: 'PEPC' | 'PEPM' | null;
  checks_per_month?: number | null;
  admin_fee_percent?: number | null;
  payroll_volume?: number | null;
  setup_fee_total?: number | null;
  deposit_total?: number | null;
  addons_json?: Array<{
    id?: string;
    label?: string | null;
    enabled?: boolean | null;
    pricing_model?: 'flat_monthly' | 'per_employee_per_month' | 'per_employee_per_check' | null;
    amount_cents?: number | null;
  }> | null;
};

type ServicesPayload = {
  health?: boolean;
  retirement401k?: boolean;
  supplemental?: boolean;
  otherCompanyPaid?: boolean;
  additionalServices?: Record<string, boolean | undefined> | null;
  wizardPricing?: Record<string, unknown> | null;
};

type OrgSummary = {
  id?: string;
  legal_name?: string | null;
  dba_name?: string | null;
  trade_name?: string | null;
  logo_url?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  total_employees?: number | null;
  pay_frequency?: Gf1PayFrequency | null;
};

type ProposalDetailClientProps = {
  proposal: ProposalDetail;
  organization: OrgSummary | null;
  wizardPricing?: Record<string, unknown>;
  services: ServicesPayload;
  canApprove: boolean;
  canEdit: boolean;
  defaultHeadcount: number;
  defaultPayFrequency: Gf1PayFrequency;
  onSaveDraft?: (values: ProposalPricingForm) => Promise<void>;
  onSubmitForApproval?: (values: ProposalPricingForm) => Promise<void>;
  onSaveWizardPricing?: (wizardPricing: Record<string, unknown>) => Promise<void>;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function getPeriodsPerYear(payFrequency: string | null | undefined) {
  const normalized = payFrequency?.trim().toLowerCase();
  switch (normalized) {
    case 'weekly':
      return 52;
    case 'biweekly':
    case 'bi-weekly':
      return 26;
    case 'semimonthly':
    case 'semi-monthly':
    case 'semi_monthly':
      return 24;
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'annually':
      return 1;
    default:
      return 26;
  }
}

function safeNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function centsToDollars(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value / 100;
}

function mergeScalarPricingIntoWizard(
  proposal: ProposalDetail,
  wizard: Record<string, unknown>,
): Record<string, unknown> {
  const nextWizard = { ...wizard };

  nextWizard.adminFeeEnabled = proposal.admin_fee_enabled ?? nextWizard.adminFeeEnabled ?? false;
  nextWizard.adminFeeRate = centsToDollars(proposal.admin_fee_rate_cents) ?? nextWizard.adminFeeRate ?? null;
  nextWizard.adminFeeBasis = proposal.admin_fee_basis ?? nextWizard.adminFeeBasis ?? 'PEPM';

  if (proposal.billing_model === 'percent_of_gross') {
    nextWizard.adminFeeMode = 'percent_of_gross';
    nextWizard.adminFeeValue = proposal.admin_fee_percent ?? proposal.percent_of_gross ?? nextWizard.adminFeeValue ?? null;
  } else if (proposal.admin_fee_enabled) {
    nextWizard.adminFeeMode = proposal.admin_fee_basis === 'PEPC' ? 'per_check' : 'per_month';
    nextWizard.adminFeeValue = centsToDollars(proposal.admin_fee_rate_cents) ?? nextWizard.adminFeeValue ?? null;
  }

  nextWizard.timekeepingFeeEnabled =
    proposal.timekeeping_fee_enabled ?? nextWizard.timekeepingFeeEnabled ?? false;
  nextWizard.timekeepingFeeRate =
    centsToDollars(proposal.timekeeping_fee_rate_cents) ?? nextWizard.timekeepingFeeRate ?? null;
  nextWizard.timekeepingFeeBasis =
    proposal.timekeeping_fee_basis ?? nextWizard.timekeepingFeeBasis ?? 'PEPM';

  nextWizard.learningManagementSystemFeeEnabled =
    proposal.learning_management_system_fee_enabled ??
    nextWizard.learningManagementSystemFeeEnabled ??
    false;
  nextWizard.learningManagementSystemFeeRate =
    centsToDollars(proposal.learning_management_system_fee_rate_cents) ??
    nextWizard.learningManagementSystemFeeRate ??
    null;
  nextWizard.learningManagementSystemFeeBasis =
    proposal.learning_management_system_fee_basis ??
    nextWizard.learningManagementSystemFeeBasis ??
    'PEPM';

  nextWizard.checksPerMonth = proposal.checks_per_month ?? nextWizard.checksPerMonth ?? null;
  nextWizard.totalAnnualPayroll = proposal.payroll_volume ?? nextWizard.totalAnnualPayroll ?? null;
  nextWizard.setupFees = proposal.setup_fee_total ?? nextWizard.setupFees ?? null;

  return nextWizard;
}

function computeMonthlyFee(
  enabled: boolean | null | undefined,
  rateCents: number | null | undefined,
  basis: 'PEPC' | 'PEPM' | null | undefined,
  employeeCount: number,
  checksPerMonth: number
) {
  if (!enabled) return null;
  const rate = centsToDollars(rateCents);
  if (!rate) return null;
  if (basis === 'PEPC') return rate * employeeCount * checksPerMonth;
  return rate * employeeCount;
}

function formatFeeBasisLabel(
  rateCents: number | null | undefined,
  basis: 'PEPC' | 'PEPM' | null | undefined
) {
  const rate = centsToDollars(rateCents);
  if (!rate) return '—';
  if (basis === 'PEPC') return `${formatCurrency(rate)} per employee per check`;
  return `${formatCurrency(rate)} per employee per month`;
}

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Draft';
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function ProposalDetailClient({
  proposal,
  organization,
  wizardPricing = {},
  services,
  canApprove,
  canEdit,
  defaultHeadcount,
  defaultPayFrequency,
  onSaveDraft,
  onSubmitForApproval,
  onSaveWizardPricing,
}: ProposalDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(proposal.status ?? 'draft');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingAction, startTransition] = useTransition();
  const [editorNotice, setEditorNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editorPending, setEditorPending] = useState(false);
  const [wizardDraft, setWizardDraft] = useState<Record<string, any>>({});
  const [wizardNotice, setWizardNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [pdfNotice, setPdfNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pdfPending, setPdfPending] = useState(false);
  const canModifyWizard = canEdit && Boolean(onSaveWizardPricing);

  const pricing = useMemo(() => {
    return (proposal.pricing_json ?? proposal.pricing_summary ?? {}) as Record<string, unknown>;
  }, [proposal.pricing_json, proposal.pricing_summary]);

  const effectiveWizard = useMemo(() => {
    let baseWizard: Record<string, unknown> = {};
    if (proposal.wizard_payload && typeof proposal.wizard_payload === 'object') {
      baseWizard = proposal.wizard_payload;
    } else {
      const nested = (pricing as any)?.wizardPricing;
      if (nested && typeof nested === 'object') {
        baseWizard = nested;
      } else if (
        pricing &&
        typeof pricing === 'object' &&
        ((pricing as any).statePricings ||
          (pricing as any).adminFeeMode ||
          (pricing as any).adminFeeEnabled !== undefined ||
          (pricing as any).services)
      ) {
        baseWizard = pricing;
      } else if (wizardPricing && typeof wizardPricing === 'object') {
        baseWizard = wizardPricing;
      } else {
        const servicesWizard = (proposal.services_json as any)?.wizardPricing ?? (services as any)?.wizardPricing;
        if (servicesWizard && typeof servicesWizard === 'object') {
          baseWizard = servicesWizard;
        }
      }
    }
    return mergeScalarPricingIntoWizard(proposal, baseWizard);
  }, [pricing, proposal, wizardPricing, services]);

  useEffect(() => {
    setWizardDraft(effectiveWizard);
  }, [effectiveWizard]);

  const wizardStatePricings = useMemo(() => {
    const rows = (wizardDraft as any)?.statePricings ?? (effectiveWizard as any)?.statePricings;
    if (!Array.isArray(rows)) return [];
    return rows.map((row: any, idx: number) => ({
      key: row.id ?? idx,
      state: row.state ?? '—',
      employees: row.employees ?? 0,
      sutaRate: row.sutaRate ?? null,
      wcClassCode: row.wcClassCode ?? '',
      wcCostRate: row.wcCostRate ?? null,
      wcSellingRate: row.wcSellingRate ?? row.wcRate ?? null,
      annualPayroll: row.annualPayroll ?? null,
    }));
  }, [wizardDraft, effectiveWizard]);

  const updateWizardField = (path: string, value: any) => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const next = { ...(prev ?? {}) };
      const parts = path.split('.');
      let cursor: any = next;
      for (let i = 0; i < parts.length - 1; i += 1) {
        const key = parts[i];
        if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
        cursor = cursor[key];
      }
      cursor[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateWizardArrayItem = (arrayKey: 'statePricings' | 'otherFees', id: string, field: string, value: any) => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const next = { ...(prev ?? {}) };
      const arr = Array.isArray((next as any)[arrayKey]) ? [...(next as any)[arrayKey]] : [];
      const idx = arr.findIndex((item: any) => item.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], [field]: value };
      }
      (next as any)[arrayKey] = arr;
      return next;
    });
  };

  const addWizardStateRow = () => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const arr = Array.isArray((prev as any)?.statePricings) ? [...(prev as any).statePricings] : [];
      arr.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        state: 'CA',
        employees: 0,
        sutaRate: null,
        wcClassCode: '',
        wcCostRate: null,
        wcSellingRate: null,
        annualPayroll: null,
      });
      return { ...(prev ?? {}), statePricings: arr };
    });
  };

  const removeWizardStateRow = (id: string) => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const arr = Array.isArray((prev as any)?.statePricings) ? (prev as any).statePricings.filter((r: any) => r.id !== id) : [];
      return { ...(prev ?? {}), statePricings: arr };
    });
  };

  const addWizardOtherFee = () => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const arr = Array.isArray((prev as any)?.otherFees) ? [...(prev as any).otherFees] : [];
      arr.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        label: 'Other Fee',
        amount: 0,
      });
      return { ...(prev ?? {}), otherFees: arr };
    });
  };

  const removeWizardOtherFee = (id: string) => {
    if (!canModifyWizard) return;
    setWizardDraft((prev) => {
      const arr = Array.isArray((prev as any)?.otherFees) ? (prev as any).otherFees.filter((r: any) => r.id !== id) : [];
      return { ...(prev ?? {}), otherFees: arr };
    });
  };

  const handleSaveWizard = async () => {
    if (!canModifyWizard || !onSaveWizardPricing) return;
    setWizardNotice(null);
    try {
      await onSaveWizardPricing(wizardDraft);
      router.refresh();
      setWizardNotice({ type: 'success', text: 'Pricing saved.' });
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Unable to save pricing details.';
      setWizardNotice({ type: 'error', text });
    }
  };

  const allowAdminDecision =
    canApprove && (status === 'pending_approval' || status === 'draft');

  const servicesList = useMemo(
    () =>
      Object.entries(services ?? {})
        .filter(([, selected]) => typeof selected === 'boolean' && Boolean(selected))
        .map(([key]) => key),
    [services],
  );

  const headerName =
    organization?.dba_name ||
    organization?.trade_name ||
    organization?.legal_name ||
    'Organization';
  const logoUrl = organization?.logo_url ?? undefined;
  const organizationInitials = useMemo(
    () =>
      headerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase(),
    [headerName],
  );
  const contactName = organization?.primary_contact_name ?? null;
  const contactEmail = organization?.primary_contact_email ?? null;

  const wizardEmployeeCount = useMemo(() => {
    const rows = (effectiveWizard as any)?.statePricings;
    if (!Array.isArray(rows)) return null;
    return rows.reduce((sum: number, row: any) => sum + (row?.employees ?? 0), 0);
  }, [effectiveWizard]);

  const wizardServices = useMemo(() => {
    const servicesObj = (effectiveWizard as any)?.services;
    const additional = servicesObj?.additionalServices ?? {};
    const base = [
      servicesObj?.health && 'Health',
      servicesObj?.retirement401k && '401(k)',
      servicesObj?.supplemental && 'Supplemental',
      servicesObj?.otherCompanyPaid && 'Other Company Paid Benefits',
    ].filter(Boolean) as string[];
    const addOns = [
      additional.drugTesting && 'Drug Testing',
      additional.backgroundChecks && 'Background Checks',
      additional.pto && 'PTO',
      additional.swipeclock && 'Swipeclock',
      additional.workforceManagement && 'Workforce Management',
      additional.physicalTimeclocks && 'Physical Timeclocks',
      additional.applicantTracking && 'Applicant Tracking',
      additional.wotc && 'WOTC',
      additional.benefitsAdministration && 'Benefits Administration',
    ].filter(Boolean) as string[];
    return { base, addOns };
  }, [effectiveWizard]);

  const wizardServiceDraft = useMemo(() => {
    const draftServices = (wizardDraft as any)?.services;
    const effectiveServices = (effectiveWizard as any)?.services;
    if (draftServices && typeof draftServices === 'object') return draftServices;
    if (effectiveServices && typeof effectiveServices === 'object') return effectiveServices;
    if (services && typeof services === 'object') return services;
    return {};
  }, [wizardDraft, effectiveWizard, services]);

  const benefitsOptions = [
    { id: 'health', label: 'Health Insurance' },
    { id: 'retirement401k', label: '401(k) Plan' },
    { id: 'supplemental', label: 'Supplemental Benefits' },
    { id: 'otherCompanyPaid', label: 'Other Company Paid Benefits' },
  ] as const;

  const addOnOptions = [
    { id: 'drugTesting', label: 'Drug Testing' },
    { id: 'backgroundChecks', label: 'Background Checks' },
    { id: 'pto', label: 'PTO' },
    { id: 'swipeclock', label: 'Swipeclock' },
    { id: 'workforceManagement', label: 'Workforce Management' },
    { id: 'physicalTimeclocks', label: 'Physical Timeclocks' },
    { id: 'applicantTracking', label: 'Applicant Tracking' },
    { id: 'wotc', label: 'WOTC' },
    { id: 'benefitsAdministration', label: 'Benefits Administration' },
  ] as const;

  const wizardMonthlyAdmin = useMemo(() => {
    const employeeCountValue = wizardEmployeeCount ?? proposal.modeled_employee_count ?? 0;
    const payFrequencyValue =
      (wizardDraft as any)?.payFrequency ??
      (effectiveWizard as any)?.payFrequency ??
      null;
    const periodsPerYearValue = getPeriodsPerYear(payFrequencyValue);
    const checksPerMonthValue = periodsPerYearValue / 12;
    const adminEnabled = Boolean((wizardDraft as any)?.adminFeeEnabled ?? (effectiveWizard as any)?.adminFeeEnabled);
    const adminMode = (wizardDraft as any)?.adminFeeMode ?? (effectiveWizard as any)?.adminFeeMode;
    const adminRate = (wizardDraft as any)?.adminFeeRate ?? (effectiveWizard as any)?.adminFeeRate;
    const adminBasis = (wizardDraft as any)?.adminFeeBasis ?? (effectiveWizard as any)?.adminFeeBasis;
    const adminModePayrollRows =
      Array.isArray((wizardDraft as any)?.statePricings) && (wizardDraft as any).statePricings.length
        ? (wizardDraft as any).statePricings
        : Array.isArray((effectiveWizard as any)?.statePricings) && (effectiveWizard as any).statePricings.length
          ? (effectiveWizard as any).statePricings
          : [];
    const adminModePayrollTotal =
      adminModePayrollRows.length > 0
        ? adminModePayrollRows.reduce((sum: number, row: any) => sum + (row?.annualPayroll ?? 0), 0)
        : null;
    const timekeepingEnabled = Boolean(
      (wizardDraft as any)?.timekeepingFeeEnabled ?? (effectiveWizard as any)?.timekeepingFeeEnabled,
    );
    const timekeepingRate = (wizardDraft as any)?.timekeepingFeeRate ?? (effectiveWizard as any)?.timekeepingFeeRate;
    const timekeepingBasis = (wizardDraft as any)?.timekeepingFeeBasis ?? (effectiveWizard as any)?.timekeepingFeeBasis;
    const lmsEnabled = Boolean(
      (wizardDraft as any)?.learningManagementSystemFeeEnabled ??
        (effectiveWizard as any)?.learningManagementSystemFeeEnabled,
    );
    const lmsRate =
      (wizardDraft as any)?.learningManagementSystemFeeRate ??
      (effectiveWizard as any)?.learningManagementSystemFeeRate;
    const lmsBasis =
      (wizardDraft as any)?.learningManagementSystemFeeBasis ??
      (effectiveWizard as any)?.learningManagementSystemFeeBasis;

    const resolveMonthly = (enabled: boolean, rate: number | null | undefined, basis: string | null | undefined) => {
      if (!enabled || rate === null || rate === undefined) return 0;
      if (basis === 'PEPC') return employeeCountValue * rate * checksPerMonthValue;
      return employeeCountValue * rate;
    };
    const resolveAdminMonthly = () => {
      if (!adminEnabled || adminRate === null || adminRate === undefined) return 0;
      if (adminMode === 'percent_of_gross') {
        if (adminModePayrollTotal === null) return 0;
        return (adminModePayrollTotal * (adminRate / 100)) / 12;
      }
      if (adminBasis === 'PEPC') return employeeCountValue * adminRate * checksPerMonthValue;
      return employeeCountValue * adminRate;
    };
    const modernMonthly =
      resolveAdminMonthly() +
      resolveMonthly(timekeepingEnabled, timekeepingRate, timekeepingBasis) +
      resolveMonthly(lmsEnabled, lmsRate, lmsBasis);
    if (modernMonthly > 0) return modernMonthly;

    const mode = adminMode;
    const value =
      (wizardDraft as any)?.adminFeeValue ??
      (effectiveWizard as any)?.adminFeeValue ??
      adminRate;
    const employees = employeeCountValue;
    if (!mode || value === null || value === undefined) return null;
    if (mode === 'per_check') {
      return (employees || 0) * (value as number) * periodsPerYearValue / 12;
    }
    if (mode === 'per_month') {
      return (employees || 0) * (value as number);
    }
    if (mode === 'percent_of_gross') {
      if (adminModePayrollTotal !== null) {
        return (adminModePayrollTotal * ((value as number) / 100)) / 12;
      }
    }
    return null;
  }, [wizardDraft, effectiveWizard, wizardEmployeeCount, proposal.modeled_employee_count]);

  const wizardTotals = useMemo(() => {
    const rows = (effectiveWizard as any)?.statePricings;
    if (!Array.isArray(rows) || rows.length === 0) return { suta: null, wc: null };
    const defaultPayroll = 50000;
    const maxWageBase = 12000;
    let suta = 0;
    let wc = 0;
    rows.forEach((row: any) => {
      const employees = row?.employees ?? 0;
      const payroll = row?.annualPayroll ?? employees * defaultPayroll;
      const sutaRate = (row?.sutaRate ?? 0) / 100;
      const taxableWages = Math.min(payroll, employees * maxWageBase);
      suta += taxableWages * sutaRate;
      const wcSellingRate = (row?.wcSellingRate ?? row?.wcRate ?? 0) / 100;
      wc += payroll * wcSellingRate;
    });
    return { suta, wc };
  }, [effectiveWizard]);

  const wizardPayrollTotal = useMemo(() => {
    const rows = (effectiveWizard as any)?.statePricings;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const defaultPayroll = 50000;
    return rows.reduce((sum: number, row: any) => {
      const employees = row?.employees ?? 0;
      const payroll = row?.annualPayroll ?? employees * defaultPayroll;
      return sum + payroll;
    }, 0);
  }, [effectiveWizard]);

  const wizardBreakdowns = useMemo(() => {
    const rows = (effectiveWizard as any)?.statePricings;
    if (!Array.isArray(rows) || rows.length === 0) return { sutaByState: [], wcByState: [] };
    const defaultPayroll = 50000;
    const maxWageBase = 12000;
    const sutaByState = new Map<string, { amount: number; rate: number }>();
    const wcByState = new Map<string, { amount: number; rate: number }>();
    rows.forEach((row: any) => {
      const state = row?.state ?? '—';
      const employees = row?.employees ?? 0;
      const payroll = row?.annualPayroll ?? employees * defaultPayroll;
      const sutaRate = (row?.sutaRate ?? 0) / 100;
      const taxableWages = Math.min(payroll, employees * maxWageBase);
      const sutaAmount = taxableWages * sutaRate;
      const sutaExisting = sutaByState.get(state);
      sutaByState.set(state, {
        amount: (sutaExisting?.amount ?? 0) + sutaAmount,
        rate: row?.sutaRate ?? sutaExisting?.rate ?? 0,
      });
      const wcSellingRate = (row?.wcSellingRate ?? row?.wcRate ?? 0) / 100;
      const wcAmount = payroll * wcSellingRate;
      const classCode = row?.wcClassCode ?? '';
      const wcKey = `${state}::${classCode || '—'}`;
      const wcExisting = wcByState.get(wcKey);
      wcByState.set(wcKey, {
        amount: (wcExisting?.amount ?? 0) + wcAmount,
        rate: row?.wcSellingRate ?? row?.wcRate ?? wcExisting?.rate ?? 0,
      });
    });
    return {
      sutaByState: Array.from(sutaByState.entries()).map(([state, entry]) => ({
        state,
        amount: entry.amount,
        rate: entry.rate,
      })),
      wcByState: Array.from(wcByState.entries()).map(([key, entry]) => {
        const [state, classCode] = key.split('::');
        return { state, classCode, amount: entry.amount, rate: entry.rate };
      }),
    };
  }, [effectiveWizard]);

  const wizardCostSummary = useMemo(() => {
    const rows = Array.isArray((wizardDraft as any)?.statePricings)
      ? (wizardDraft as any).statePricings
      : Array.isArray((effectiveWizard as any)?.statePricings)
        ? (effectiveWizard as any).statePricings
        : [];
    const wcMap = new Map<string, { cost: number; selling: number }>();
    let wcCostTotal = 0;
    let wcSellingTotal = 0;
    rows.forEach((row: any) => {
      const state = row?.state ?? '—';
      const classCode = row?.wcClassCode ?? '—';
      const payroll = row?.annualPayroll ?? 0;
      const cost = payroll * ((row?.wcCostRate ?? 0) / 100);
      const selling = payroll * ((row?.wcSellingRate ?? row?.wcRate ?? 0) / 100);
      const key = `${state}::${classCode || '—'}`;
      const existing = wcMap.get(key);
      wcMap.set(key, {
        cost: (existing?.cost ?? 0) + cost,
        selling: (existing?.selling ?? 0) + selling,
      });
      wcCostTotal += cost;
      wcSellingTotal += selling;
    });

    const employeeCountValue = wizardEmployeeCount ?? proposal.modeled_employee_count ?? 0;
    const payFrequencyValue =
      (wizardDraft as any)?.payFrequency ??
      (effectiveWizard as any)?.payFrequency ??
      null;
    const periodsPerYearValue = getPeriodsPerYear(payFrequencyValue);
    const annualFromFee = (enabled: boolean, rate: number | null | undefined, basis: string | null | undefined) => {
      if (!enabled || rate === null || rate === undefined) return 0;
      if (basis === 'PEPC') return employeeCountValue * rate * periodsPerYearValue;
      return employeeCountValue * rate * 12;
    };

    const adminAnnual = annualFromFee(
      Boolean((wizardDraft as any)?.adminFeeEnabled ?? (effectiveWizard as any)?.adminFeeEnabled),
      (wizardDraft as any)?.adminFeeRate ?? (effectiveWizard as any)?.adminFeeRate,
      (wizardDraft as any)?.adminFeeBasis ?? (effectiveWizard as any)?.adminFeeBasis,
    );
    const adminMode = (wizardDraft as any)?.adminFeeMode ?? (effectiveWizard as any)?.adminFeeMode;
    const adminRate = (wizardDraft as any)?.adminFeeRate ?? (effectiveWizard as any)?.adminFeeRate;
    const adminEnabled = Boolean((wizardDraft as any)?.adminFeeEnabled ?? (effectiveWizard as any)?.adminFeeEnabled);
    const adminPayrollAnnual = rows.reduce((sum: number, row: any) => sum + (row?.annualPayroll ?? 0), 0);
    const adminAnnualAdjusted =
      adminMode === 'percent_of_gross' && adminEnabled && typeof adminRate === 'number'
        ? adminPayrollAnnual * (adminRate / 100)
        : adminAnnual;
    const timekeepingAnnual = annualFromFee(
      Boolean((wizardDraft as any)?.timekeepingFeeEnabled ?? (effectiveWizard as any)?.timekeepingFeeEnabled),
      (wizardDraft as any)?.timekeepingFeeRate ?? (effectiveWizard as any)?.timekeepingFeeRate,
      (wizardDraft as any)?.timekeepingFeeBasis ?? (effectiveWizard as any)?.timekeepingFeeBasis,
    );
    const lmsAnnual = annualFromFee(
      Boolean(
        (wizardDraft as any)?.learningManagementSystemFeeEnabled ??
          (effectiveWizard as any)?.learningManagementSystemFeeEnabled,
      ),
      (wizardDraft as any)?.learningManagementSystemFeeRate ??
        (effectiveWizard as any)?.learningManagementSystemFeeRate,
      (wizardDraft as any)?.learningManagementSystemFeeBasis ??
        (effectiveWizard as any)?.learningManagementSystemFeeBasis,
    );

    return {
      adminAnnual: adminAnnualAdjusted,
      timekeepingAnnual,
      lmsAnnual,
      setupFees: (wizardDraft as any)?.setupFees ?? (effectiveWizard as any)?.setupFees ?? 0,
      otherFees: Array.isArray((wizardDraft as any)?.otherFees)
        ? (wizardDraft as any).otherFees
        : Array.isArray((effectiveWizard as any)?.otherFees)
          ? (effectiveWizard as any).otherFees
          : [],
      wcByState: Array.from(wcMap.entries()).map(([key, value]) => {
        const [state, classCode] = key.split('::');
        return { state, classCode, cost: value.cost, selling: value.selling };
      }),
      wcCostTotal,
      wcSellingTotal,
    };
  }, [wizardDraft, effectiveWizard, wizardEmployeeCount, proposal.modeled_employee_count, proposal.checks_per_month]);

  const mappedServicesList = useMemo(() => {
    const labels: Record<string, string> = {
      health: 'Health Insurance',
      retirement401k: '401(k) Plan',
      supplemental: 'Supplemental Benefits',
      otherCompanyPaid: 'Other Company Paid Benefits',
      pto: 'PTO',
      swipeclock: 'Swipeclock',
      workforceManagement: 'Workforce Management',
      physicalTimeclocks: 'Physical Timeclocks',
      applicantTracking: 'Applicant Tracking',
      wotc: 'WOTC',
      benefitsAdministration: 'Benefits Administration',
    };
    return servicesList.map((key) => labels[key] ?? key);
  }, [servicesList]);

  const defaultServiceList = useMemo(
    () => [
      'Payroll processing',
      'Tax filings and payments',
      'W-2 and year-end reporting',
      'New hire reporting',
      "Workers' comp administration",
      'HR compliance guidance',
      'Employee self-service portal',
    ],
    [],
  );

  const selectedServiceList = useMemo(() => {
    const labels: Record<string, string> = {
      health: 'Health Insurance',
      retirement401k: '401(k) Plan',
      supplemental: 'Supplemental Benefits',
      otherCompanyPaid: 'Other Company Paid Benefits',
      pto: 'PTO',
      swipeclock: 'Swipeclock',
      workforceManagement: 'Workforce Management',
      physicalTimeclocks: 'Physical Timeclocks',
      applicantTracking: 'Applicant Tracking',
      wotc: 'WOTC',
      benefitsAdministration: 'Benefits Administration',
    };
    const baseServices = (wizardServiceDraft as any) ?? {};
    const additional = baseServices.additionalServices ?? (services as any)?.additionalServices ?? {};
    const baseKeys = ['health', 'retirement401k', 'supplemental', 'otherCompanyPaid'] as const;
    const addOnKeys = [
      'pto',
      'swipeclock',
      'workforceManagement',
      'physicalTimeclocks',
      'applicantTracking',
      'wotc',
      'benefitsAdministration',
    ] as const;
    const selectedBase = baseKeys.filter((key) => Boolean((baseServices as any)[key])).map((key) => labels[key]);
    const selectedAddOns = addOnKeys.filter((key) => Boolean((additional as any)[key])).map((key) => labels[key]);
    const combined = [...selectedBase, ...selectedAddOns].filter(Boolean);
    return combined.length ? combined : mappedServicesList;
  }, [wizardServiceDraft, services, mappedServicesList]);

  const buildPdfFilename = () => {
    const baseName = headerName ? headerName.replace(/[\\/:*?"<>|]/g, '').trim() : 'Proposal';
    return `${baseName} Proposal.pdf`;
  };

  const buildPdfPayload = () => {
    const employeeCount = wizardEmployeeCount ?? proposal.modeled_employee_count ?? 0;
    const monthlyAdminValue = monthlyAdmin ?? 0;
    const resolvedAdminMonthly = adminFeeMonthly ?? monthlyAdminValue;
    const perEmployeeAdmin = employeeCount ? resolvedAdminMonthly / employeeCount : 0;
    const wizardServiceFlags = (effectiveWizard as any)?.services ?? {};
    const fallbackServices = services ?? {};
    const setupFees =
      (wizardDraft as any)?.setupFees ??
      (effectiveWizard as any)?.setupFees ??
      null;
    const otherFees =
      Array.isArray((wizardDraft as any)?.otherFees)
        ? (wizardDraft as any).otherFees
        : Array.isArray((effectiveWizard as any)?.otherFees)
          ? (effectiveWizard as any).otherFees
          : [];

    return {
      companyName: headerName,
      tradeName: organization?.trade_name ?? organization?.dba_name ?? undefined,
      logoUrl: logoUrl,
      prospectContactName: contactName ?? undefined,
      employeeCount,
      adminFeePerEmployee: perEmployeeAdmin,
      adminFeeMode: (effectiveWizard as any)?.adminFeeMode ?? null,
      adminFeeValue: (effectiveWizard as any)?.adminFeeValue ?? null,
      estimatedSUTA: estimatedSUTA ?? 0,
      estimatedWCPremium: estimatedWc ?? 0,
      setupFees,
      otherFees: otherFees
        .filter((fee: any) => fee && (fee.amount || fee.label))
        .map((fee: any) => ({
          label: fee.label ?? 'Other Fee',
          amount: Number(fee.amount ?? 0),
        })),
      sutaByState: wizardBreakdowns.sutaByState,
      wcByState: wizardBreakdowns.wcByState,
      services: {
        health: Boolean(wizardServiceFlags.health ?? fallbackServices.health),
        retirement401k: Boolean(wizardServiceFlags.retirement401k ?? fallbackServices.retirement401k),
        supplemental: Boolean(wizardServiceFlags.supplemental ?? fallbackServices.supplemental),
      },
      selectedServices: selectedServiceList,
      defaultServices: defaultServiceList,
      industry: (effectiveWizard as any)?.industry ?? undefined,
      customTagline: (effectiveWizard as any)?.tagline ?? undefined,
      estimatedMonthlyAdminCost: resolvedAdminMonthly,
      notesForProspect: proposal.notes_for_prospect ?? null,
      adminFeeMonthly: adminFeeMonthly ?? null,
      adminFeeAnnual: adminFeeAnnual ?? null,
      adminFeeLabel,
      timekeepingFeeMonthly: timekeepingFeeMonthly ?? null,
      timekeepingFeeAnnual: timekeepingFeeAnnual ?? null,
      timekeepingFeeLabel,
      wcSellingAnnual: wcSelling ?? null,
      addons: addonsComputed,
    };
  };

  const downloadProposalPdf = async () => {
    const pdfBlob = await generateProposalPDF(buildPdfPayload(), { orientation: 'landscape' });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildPdfFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadProposalPdfFile = async () => {
    setPdfNotice(null);
    setPdfPending(true);
    try {
      await downloadProposalPdf();
      setPdfNotice({ type: 'success', text: 'Proposal PDF downloaded.' });
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Unable to generate proposal PDF.';
      setPdfNotice({ type: 'error', text });
    } finally {
      setPdfPending(false);
    }
  };

  function triggerDecision(decision: 'approved' | 'rejected') {
    setMessage(null);
    startTransition(async () => {
      try {
        if (decision === 'approved') {
          await approveProposalAction(proposal.id, approvalComment || null);
          await downloadProposalPdfFile();
        } else {
          await rejectProposalAction(proposal.id, approvalComment || null);
        }
        setStatus(decision);
        setMessage({
          type: 'success',
          text: decision === 'approved' ? 'Proposal approved.' : 'Proposal denied.',
        });
      } catch (err) {
        const text =
          err instanceof Error ? err.message : 'Unable to record your decision. Please try again.';
        setMessage({ type: 'error', text });
      }
    });
  }

  const statusLabel =
    status === 'pending_approval'
      ? 'Pending approval'
      : formatStatus(status);

  const monthlyAdmin = safeNumber(pricing?.estimatedMonthlyAdminCost) ?? wizardMonthlyAdmin;
  const employeeCount = wizardEmployeeCount ?? proposal.modeled_employee_count ?? 0;
  const adminFeeMode =
    (effectiveWizard as any)?.adminFeeMode ??
    ((effectiveWizard as any)?.adminFeeEnabled
      ? (effectiveWizard as any)?.adminFeeBasis === 'PEPC'
        ? 'per_check'
        : 'per_month'
      : null);
  const adminFeeValue =
    (effectiveWizard as any)?.adminFeeValue ??
    ((effectiveWizard as any)?.adminFeeEnabled ? (effectiveWizard as any)?.adminFeeRate ?? null : null);
  const payFrequency = (effectiveWizard as any)?.payFrequency ?? defaultPayFrequency ?? null;
  const periodsPerYear = getPeriodsPerYear(payFrequency);
  const impliedAnnualPerEmployee =
    (adminFeeMode === 'per_check' || adminFeeMode === 'per_month') && adminFeeValue !== null && adminFeeValue !== undefined
      ? (adminFeeValue as number) * periodsPerYear
      : adminFeeMode === 'percent_of_gross' && wizardPayrollTotal !== null && adminFeeValue !== null && adminFeeValue !== undefined
        ? (wizardPayrollTotal * ((adminFeeValue as number) / 100)) / (employeeCount || 1)
        : null;
  const impliedAnnualTotal =
    adminFeeMode === 'per_check' && adminFeeValue !== null && adminFeeValue !== undefined
      ? (adminFeeValue as number) * periodsPerYear * (employeeCount || 0)
      : adminFeeMode === 'per_month' && adminFeeValue !== null && adminFeeValue !== undefined
        ? (adminFeeValue as number) * 12 * (employeeCount || 0)
      : adminFeeMode === 'percent_of_gross' && wizardPayrollTotal !== null && adminFeeValue !== null && adminFeeValue !== undefined
        ? wizardPayrollTotal * ((adminFeeValue as number) / 100)
        : null;
  const impliedAnnualPerEmployeeValue =
    employeeCount && impliedAnnualTotal !== null ? impliedAnnualTotal / employeeCount : null;
  const estimatedSUTA =
    safeNumber(pricing?.estimatedSUTA ?? (effectiveWizard as any)?.estimatedSUTA) ??
    wizardTotals.suta;
  const estimatedWc =
    safeNumber(pricing?.estimatedWCPremium ?? (effectiveWizard as any)?.estimatedWCPremium) ??
    wizardTotals.wc;
  const canDownloadPdf = status === 'approved';
  const checksPerMonth = proposal.checks_per_month ?? (periodsPerYear / 12);
  const wcSelling = centsToDollars(proposal.wc_selling_price_cents ?? null);
  const wcCost = centsToDollars(proposal.wc_cost_cents ?? null);
  const wcProfit = wcSelling !== null && wcCost !== null ? wcSelling - wcCost : null;
  const wcMargin = wcSelling && wcSelling > 0 && wcProfit !== null ? wcProfit / wcSelling : null;
  const adminFeeMonthly = computeMonthlyFee(
    proposal.admin_fee_enabled,
    proposal.admin_fee_rate_cents,
    proposal.admin_fee_basis ?? null,
    employeeCount,
    checksPerMonth,
  );
  const timekeepingFeeMonthly = computeMonthlyFee(
    proposal.timekeeping_fee_enabled,
    proposal.timekeeping_fee_rate_cents,
    proposal.timekeeping_fee_basis ?? null,
    employeeCount,
    checksPerMonth,
  );
  const adminFeeAnnual = adminFeeMonthly !== null ? adminFeeMonthly * 12 : null;
  const timekeepingFeeAnnual = timekeepingFeeMonthly !== null ? timekeepingFeeMonthly * 12 : null;
  const addons = Array.isArray(proposal.addons_json) ? proposal.addons_json : [];
  const addonsComputed = addons
    .filter((addon) => addon && addon.enabled)
    .map((addon) => {
      const amount = centsToDollars(addon.amount_cents ?? null) ?? 0;
      let monthly = 0;
      switch (addon.pricing_model) {
        case 'per_employee_per_month':
          monthly = amount * employeeCount;
          break;
        case 'per_employee_per_check':
          monthly = amount * employeeCount * checksPerMonth;
          break;
        default:
          monthly = amount;
      }
      return {
        label: addon.label ?? 'Add-on',
        monthly,
        annual: monthly * 12,
      };
    });
  const addonMonthlyTotal = addonsComputed.reduce((sum, addon) => sum + addon.monthly, 0);
  const adminFeeLabel = proposal.admin_fee_enabled
    ? formatFeeBasisLabel(proposal.admin_fee_rate_cents, proposal.admin_fee_basis ?? null)
    : null;
  const timekeepingFeeLabel = proposal.timekeeping_fee_enabled
    ? formatFeeBasisLabel(proposal.timekeeping_fee_rate_cents, proposal.timekeeping_fee_basis ?? null)
    : null;

  const inputStyle = {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #3d4b5e',
    padding: '8px 10px',
    background: '#0f172a',
    color: 'white',
    fontSize: '14px',
    lineHeight: 1.2,
  } as const;

  async function handleSaveDraft(values: ProposalPricingForm) {
    if (!onSaveDraft) return;
    setEditorNotice(null);
    setEditorPending(true);
    try {
      await onSaveDraft(values);
      router.refresh();
      setEditorNotice({ type: 'success', text: 'Draft saved.' });
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Unable to save proposal.';
      setEditorNotice({ type: 'error', text });
    } finally {
      setEditorPending(false);
    }
  }

  async function handleSubmitForApproval(values: ProposalPricingForm) {
    if (!onSubmitForApproval) return;
    setEditorNotice(null);
    setEditorPending(true);
    try {
      await onSubmitForApproval(values);
      router.refresh();
      setEditorNotice({ type: 'success', text: 'Submitted for approval.' });
      setStatus('pending_approval');
    } catch (err) {
      const text =
        err instanceof Error ? err.message : 'Unable to submit for approval.';
      setEditorNotice({ type: 'error', text });
    } finally {
      setEditorPending(false);
    }
  }
  const showSubmitForApproval =
    Boolean(onSubmitForApproval) && status !== 'pending_approval' && status !== 'approved';
  const editorProposal = useMemo<Partial<Gf1ProposalRecord>>(
    () => ({
      ...(proposal as unknown as Partial<Gf1ProposalRecord>),
      status: (proposal.status ?? undefined) as Gf1ProposalStatus | undefined,
    }),
    [proposal],
  );

  // Simple, wizard-like layout for approvers
  if (true) {
    const card = {
      border: '1px solid #1f2937',
      borderRadius: '10px',
      padding: '14px',
      background: '#0b1220',
      color: 'white',
    } as const;
    const toggleBase = {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '10px',
      border: '1px solid #1f2937',
      background: '#0f172a',
      color: '#e2e8f0',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as const;
    const toggleDot = {
      width: '12px',
      height: '12px',
      borderRadius: '999px',
      border: '2px solid #334155',
      background: 'transparent',
      flex: '0 0 auto',
    } as const;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'white' }}>
        {(canDownloadPdf || message) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            {canDownloadPdf && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={pdfPending}
                  onClick={downloadProposalPdfFile}
                >
                  {pdfPending ? 'Generating PDF…' : 'Download proposal PDF'}
                </button>
                {pdfNotice && (
                  <div className={(pdfNotice?.type === 'success' ? styles.alertSuccess : styles.alertError)} style={{ width: '240px' }}>
                    {pdfNotice?.text}
                  </div>
                )}
              </div>
            )}
            {message && (
              <div className={(message?.type === 'success' ? styles.alertSuccess : styles.alertError)} style={{ width: '240px' }}>
                {message?.text}
              </div>
            )}
          </div>
        )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(260px, 0.85fr) minmax(320px, 1.15fr)',
              gap: '12px',
            }}
          >
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Admin & Fees</h3>
              {canModifyWizard && (
                <button className={styles.primaryButton} type="button" onClick={handleSaveWizard}>
                  Save details
                </button>
              )}
            </div>
            {wizardNotice && (
              <div className={wizardNotice?.type === 'success' ? styles.alertSuccess : styles.alertError}>
                {wizardNotice?.text}
              </div>
            )}
            <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
              {[
                {
                  label: 'Admin Fee',
                  enabled: Boolean((wizardDraft as any)?.adminFeeEnabled),
                  basis: (wizardDraft as any)?.adminFeeBasis ?? 'PEPM',
                  rate: (wizardDraft as any)?.adminFeeRate ?? '',
                  setEnabled: (next: boolean) => updateWizardField('adminFeeEnabled', next),
                  setBasis: (next: string) => updateWizardField('adminFeeBasis', next),
                  setRate: (next: number | null) => updateWizardField('adminFeeRate', next),
                },
                {
                  label: 'Timekeeping Fee',
                  enabled: Boolean((wizardDraft as any)?.timekeepingFeeEnabled),
                  basis: (wizardDraft as any)?.timekeepingFeeBasis ?? 'PEPM',
                  rate: (wizardDraft as any)?.timekeepingFeeRate ?? '',
                  setEnabled: (next: boolean) => updateWizardField('timekeepingFeeEnabled', next),
                  setBasis: (next: string) => updateWizardField('timekeepingFeeBasis', next),
                  setRate: (next: number | null) => updateWizardField('timekeepingFeeRate', next),
                },
                {
                  label: 'LMS Fee',
                  enabled: Boolean((wizardDraft as any)?.learningManagementSystemFeeEnabled),
                  basis: (wizardDraft as any)?.learningManagementSystemFeeBasis ?? 'PEPM',
                  rate: (wizardDraft as any)?.learningManagementSystemFeeRate ?? '',
                  setEnabled: (next: boolean) => updateWizardField('learningManagementSystemFeeEnabled', next),
                  setBasis: (next: string) => updateWizardField('learningManagementSystemFeeBasis', next),
                  setRate: (next: number | null) => updateWizardField('learningManagementSystemFeeRate', next),
                },
              ].map((fee) => (
                <div
                  key={fee.label}
                  style={{
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px',
                    background: '#0f172a',
                    display: 'grid',
                    gridTemplateColumns: '24px minmax(120px, 1fr) minmax(230px, 1fr) 120px',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input type="checkbox" checked={fee.enabled} onChange={(e) => fee.setEnabled(e.target.checked)} />
                  <span style={{ color: '#e2e8f0', fontWeight: 700, textAlign: 'left' }}>{fee.label}</span>
                  <select
                    value={fee.basis}
                    onChange={(e) => fee.setBasis(e.target.value)}
                    style={{ ...inputStyle, textAlign: 'left', fontSize: '12px', padding: '6px 8px' }}
                    disabled={!fee.enabled}
                  >
                    <option value="PEPC">Per employee per check (PEPC)</option>
                    <option value="PEPM">Per employee per month (PEPM)</option>
                  </select>
                  <input
                    type="number"
                    style={{ ...inputStyle, textAlign: 'left' }}
                    value={fee.rate}
                    onChange={(e) => fee.setRate(e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={!fee.enabled}
                    placeholder="Rate"
                  />
                </div>
              ))}
              <label style={{ color: '#94a3b8' }}>Setup fees</label>
              <input
                type="number"
                style={inputStyle}
                value={(wizardDraft as any)?.setupFees ?? ''}
                onChange={(e) => updateWizardField('setupFees', e.target.value ? parseFloat(e.target.value) : null)}
              />
              <label style={{ color: '#94a3b8' }}>Other fees</label>
              {Array.isArray((wizardDraft as any)?.otherFees) && (wizardDraft as any).otherFees.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(wizardDraft as any).otherFees.map((fee: any) => (
                    <div key={fee.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        style={inputStyle}
                        value={fee.label}
                        onChange={(e) => updateWizardArrayItem('otherFees', fee.id, 'label', e.target.value)}
                        placeholder="Fee name"
                      />
                      <input
                        type="number"
                        style={inputStyle}
                        value={fee.amount ?? ''}
                        onChange={(e) => updateWizardArrayItem('otherFees', fee.id, 'amount', e.target.value ? parseFloat(e.target.value) : 0)}
                        placeholder="Amount"
                      />
                      <button type="button" className={styles.secondaryButton} onClick={() => removeWizardOtherFee(fee.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8' }}>None</p>
              )}
              <button type="button" className={styles.primaryButton} onClick={addWizardOtherFee}>
                + Add other fee
              </button>
              <label style={{ color: '#94a3b8' }}>Notes for approver</label>
              <textarea
                rows={3}
                style={{ ...inputStyle, minHeight: '72px', marginBottom: '14px' }}
                value={(wizardDraft as any)?.notesForApprover ?? ''}
                onChange={(e) => updateWizardField('notesForApprover', e.target.value)}
                placeholder="Context for approver"
              />
            </div>
            <div style={card}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Pricing Breakdown (Annual)</h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Admin Fees</span>
                  <strong>{formatCurrency(wizardCostSummary.adminAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Timekeeping Fees</span>
                  <strong>{formatCurrency(wizardCostSummary.timekeepingAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Admin per Employee (annual)</span>
                  <strong>
                    {formatCurrency(
                      employeeCount > 0 ? wizardCostSummary.adminAnnual / employeeCount : 0,
                    )}
                  </strong>
                </div>
                {wizardBreakdowns.sutaByState.map((entry) => (
                  <div key={entry.state} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>SUTA ({entry.state})</span>
                    <strong>{formatCurrency(entry.amount)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>LMS Fee</span>
                  <strong>{formatCurrency(wizardCostSummary.lmsAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Setup Fees</span>
                  <strong>{formatCurrency(wizardCostSummary.setupFees)}</strong>
                </div>
                {wizardCostSummary.otherFees.map((fee: any) => (
                  <div key={fee.id ?? fee.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>{fee.label || 'Other Fee'}</span>
                    <strong>{formatCurrency(Number(fee.amount ?? 0))}</strong>
                  </div>
                ))}
                {wizardCostSummary.wcByState.map((row) => (
                  <div key={`${row.state}-${row.classCode}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>WC ({row.state} / {row.classCode})</span>
                    <strong>{`${formatCurrency(row.cost)} cost | ${formatCurrency(row.selling)} sell`}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Workers&apos; Comp Selling (annual)</span>
                  <strong>{formatCurrency(wizardCostSummary.wcSellingTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Workers&apos; Comp Cost (annual)</span>
                  <strong>{formatCurrency(wizardCostSummary.wcCostTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Workers&apos; Comp Profit</span>
                  <strong>{formatCurrency(wizardCostSummary.wcSellingTotal - wizardCostSummary.wcCostTotal)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...card, padding: '10px', maxHeight: '310px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>State pricing</h3>
              <button type="button" className={styles.primaryButton} onClick={addWizardStateRow}>
                + Add state
              </button>
            </div>
            <div style={{ overflow: 'auto', maxHeight: '250px' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Employees</th>
                    <th>SUTA %</th>
                    <th>WC Class</th>
                    <th>WC Cost %</th>
                    <th>WC Sell %</th>
                    <th>Annual Payroll</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(wizardDraft as any)?.statePricings && Array.isArray((wizardDraft as any).statePricings) ? (
                    (wizardDraft as any).statePricings.map((row: any) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="text"
                            style={inputStyle}
                            value={row.state}
                            onChange={(e) => updateWizardArrayItem('statePricings', row.id, 'state', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={inputStyle}
                            value={row.employees ?? ''}
                            onChange={(e) =>
                              updateWizardArrayItem('statePricings', row.id, 'employees', e.target.value ? parseInt(e.target.value, 10) : 0)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={inputStyle}
                            value={row.sutaRate ?? ''}
                            onChange={(e) =>
                              updateWizardArrayItem('statePricings', row.id, 'sutaRate', e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            style={inputStyle}
                            value={row.wcClassCode ?? ''}
                            onChange={(e) => updateWizardArrayItem('statePricings', row.id, 'wcClassCode', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={inputStyle}
                            value={row.wcCostRate ?? ''}
                            onChange={(e) =>
                              updateWizardArrayItem('statePricings', row.id, 'wcCostRate', e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={inputStyle}
                            value={row.wcSellingRate ?? row.wcRate ?? ''}
                            onChange={(e) =>
                              updateWizardArrayItem('statePricings', row.id, 'wcSellingRate', e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            style={inputStyle}
                            value={row.annualPayroll ?? ''}
                            onChange={(e) =>
                              updateWizardArrayItem('statePricings', row.id, 'annualPayroll', e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </td>
                        <td>
                          <button type="button" className={styles.secondaryButton} onClick={() => removeWizardStateRow(row.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '12px' }}>
                        No state data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 0.85fr) minmax(320px, 1.15fr)',
            gap: '12px',
            marginTop: '0',
            alignItems: 'start',
          }}
        >
          <div style={{ ...card, gridColumn: '2', marginTop: '-174px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Benefits</h3>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {benefitsOptions.map((option) => {
                const active = Boolean((wizardServiceDraft as any)?.[option.id]);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateWizardField(`services.${option.id}`, !active)}
                    style={{
                      ...toggleBase,
                      borderColor: active ? '#38bdf8' : '#1f2937',
                      background: active ? 'rgba(14, 116, 144, 0.2)' : '#0f172a',
                      color: active ? '#e0f2fe' : '#cbd5f5',
                      boxShadow: active ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
                    }}
                  >
                    <span>{option.label}</span>
                    <span
                      style={{
                        ...toggleDot,
                        borderColor: active ? '#38bdf8' : '#334155',
                        background: active ? '#38bdf8' : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ ...card, gridColumn: '2', marginTop: '-458px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Service add-ons</h3>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {addOnOptions.map((option) => {
                const active = Boolean((wizardServiceDraft as any)?.additionalServices?.[option.id]);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateWizardField(`services.additionalServices.${option.id}`, !active)}
                    style={{
                      ...toggleBase,
                      borderColor: active ? '#f59e0b' : '#1f2937',
                      background: active ? 'rgba(217, 119, 6, 0.2)' : '#0f172a',
                      color: active ? '#fef3c7' : '#cbd5f5',
                      boxShadow: active ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : 'none',
                    }}
                  >
                    <span>{option.label}</span>
                    <span
                      style={{
                        ...toggleDot,
                        borderColor: active ? '#f59e0b' : '#334155',
                        background: active ? '#f59e0b' : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrap}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={headerName} />
            ) : (
              <div className={styles.logoFallback}>
                {organizationInitials}
              </div>
            )}
          </div>
          <span className={styles.statusBadge}>{statusLabel}</span>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.proposalTitle}>{headerName}</h1>
          <p className={styles.subtitle}>
            {contactName && (
              <>
                Primary contact: <strong>{contactName}</strong>
              </>
            )}
            {contactEmail && (
              <>
                {' '}
                ·{' '}
                <a
                  href={`mailto:${contactEmail}`}
                  className={styles.link}
                >
                  {contactEmail}
                </a>
              </>
            )}
          </p>
          <div className={styles.statsRow}>
            <div>
              <p className={styles.statLabel} style={{ fontSize: '38px' }}>Employees modeled</p>
              <p className={styles.statValue} style={{ fontSize: '38px' }}>
                {wizardEmployeeCount ?? proposal.modeled_employee_count ?? '—'}
              </p>
            </div>
            <div>
              <p className={styles.statLabel} style={{ fontSize: '38px' }}>Monthly admin target</p>
              <p className={styles.statValue} style={{ fontSize: '38px' }}>
                {formatCurrency(monthlyAdmin ?? null)}
              </p>
            </div>
            <div>
              <p className={styles.statLabel} style={{ fontSize: '38px' }}>Primary services</p>
              <p className={styles.statValue} style={{ fontSize: '38px' }}>
                {wizardServices.base.length ? wizardServices.base.join(', ') : servicesList.length ? servicesList.join(', ') : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.actionColumn}>
          <div className={styles.actionStack}>
            {message && (
              <div
                className={
                  message?.type === 'success'
                    ? styles.alertSuccess
                    : styles.alertError
                }
              >
                {message?.text}
              </div>
            )}
            {allowAdminDecision && (
              <div className={styles.approvalComment}>
                <label className={styles.statLabel}>Approval / denial notes (optional)</label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #3d4b5e',
                    padding: '10px',
                    background: '#0f172a',
                    color: 'white',
                  }}
                  placeholder="Add context for the submitter"
                />
              </div>
            )}
            {allowAdminDecision && (
              <div className={styles.approvalButtons}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={pendingAction}
                  onClick={() => triggerDecision('approved')}
                >
                  {pendingAction ? 'Saving…' : 'Approve proposal'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={pendingAction}
                  onClick={() => triggerDecision('rejected')}
                >
                  Deny proposal
                </button>
              </div>
            )}
            {!allowAdminDecision && (
              <p className={styles.mutedText}>
                Status last updated:{' '}
                {formatStatus(proposal.approval_status) ?? statusLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className={styles.infoCard}>
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Proposal Details</h2>
          {canModifyWizard && (
            <button className={styles.primaryButton} type="button" onClick={handleSaveWizard}>
              Save details
            </button>
          )}
        </div>
        {wizardNotice && (
          <div className={wizardNotice?.type === 'success' ? styles.alertSuccess : styles.alertError}>
            {wizardNotice?.text}
          </div>
        )}
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Admin Fee</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={Boolean((wizardDraft as any)?.adminFeeEnabled)}
                onChange={(e) => updateWizardField('adminFeeEnabled', e.target.checked)}
              />
              Enabled
            </label>
            <select
              value={(wizardDraft as any)?.adminFeeBasis ?? 'PEPM'}
              onChange={(e) => updateWizardField('adminFeeBasis', e.target.value)}
              style={{ ...inputStyle, marginBottom: '8px' }}
              disabled={!Boolean((wizardDraft as any)?.adminFeeEnabled)}
            >
              <option value="PEPC">Per employee per check (PEPC)</option>
              <option value="PEPM">Per employee per month (PEPM)</option>
            </select>
            <input
              type="number"
              style={inputStyle}
              value={(wizardDraft as any)?.adminFeeRate ?? ''}
              onChange={(e) => updateWizardField('adminFeeRate', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!Boolean((wizardDraft as any)?.adminFeeEnabled)}
            />
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Timekeeping Fee</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={Boolean((wizardDraft as any)?.timekeepingFeeEnabled)}
                onChange={(e) => updateWizardField('timekeepingFeeEnabled', e.target.checked)}
              />
              Enabled
            </label>
            <select
              value={(wizardDraft as any)?.timekeepingFeeBasis ?? 'PEPM'}
              onChange={(e) => updateWizardField('timekeepingFeeBasis', e.target.value)}
              style={{ ...inputStyle, marginBottom: '8px' }}
              disabled={!Boolean((wizardDraft as any)?.timekeepingFeeEnabled)}
            >
              <option value="PEPC">Per employee per check (PEPC)</option>
              <option value="PEPM">Per employee per month (PEPM)</option>
            </select>
            <input
              type="number"
              style={inputStyle}
              value={(wizardDraft as any)?.timekeepingFeeRate ?? ''}
              onChange={(e) =>
                updateWizardField('timekeepingFeeRate', e.target.value ? parseFloat(e.target.value) : null)
              }
              disabled={!Boolean((wizardDraft as any)?.timekeepingFeeEnabled)}
            />
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>LMS Fee</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={Boolean((wizardDraft as any)?.learningManagementSystemFeeEnabled)}
                onChange={(e) => updateWizardField('learningManagementSystemFeeEnabled', e.target.checked)}
              />
              Enabled
            </label>
            <select
              value={(wizardDraft as any)?.learningManagementSystemFeeBasis ?? 'PEPM'}
              onChange={(e) => updateWizardField('learningManagementSystemFeeBasis', e.target.value)}
              style={{ ...inputStyle, marginBottom: '8px' }}
              disabled={!Boolean((wizardDraft as any)?.learningManagementSystemFeeEnabled)}
            >
              <option value="PEPC">Per employee per check (PEPC)</option>
              <option value="PEPM">Per employee per month (PEPM)</option>
            </select>
            <input
              type="number"
              style={inputStyle}
              value={(wizardDraft as any)?.learningManagementSystemFeeRate ?? ''}
              onChange={(e) =>
                updateWizardField('learningManagementSystemFeeRate', e.target.value ? parseFloat(e.target.value) : null)
              }
              disabled={!Boolean((wizardDraft as any)?.learningManagementSystemFeeEnabled)}
            />
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Setup Fees</p>
            <input
              type="number"
              style={inputStyle}
              value={(wizardDraft as any)?.setupFees ?? ''}
              onChange={(e) => updateWizardField('setupFees', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Notes for approver</p>
            <textarea
              rows={3}
              style={{ ...inputStyle, minHeight: '72px' }}
              value={(wizardDraft as any)?.notesForApprover ?? ''}
              onChange={(e) => updateWizardField('notesForApprover', e.target.value)}
              placeholder="Context for approver"
            />
          </div>
        </div>

        <div className={styles.infoBlock} style={{ marginTop: '12px' }}>
          <p className={styles.statLabel}>Other Fees</p>
          {Array.isArray((wizardDraft as any)?.otherFees) && (wizardDraft as any).otherFees.length > 0 ? (
            <div className={styles.infoGrid}>
              {(wizardDraft as any).otherFees.map((fee: any) => (
                <div key={fee.id} className={styles.infoBlock}>
                  <input
                    type="text"
                    style={inputStyle}
                    value={fee.label}
                    onChange={(e) => updateWizardArrayItem('otherFees', fee.id, 'label', e.target.value)}
                    placeholder="Fee name"
                  />
                  <input
                    type="number"
                    style={inputStyle}
                    value={fee.amount ?? ''}
                    onChange={(e) => updateWizardArrayItem('otherFees', fee.id, 'amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    placeholder="Amount"
                  />
                  <button type="button" className={styles.secondaryButton} onClick={() => removeWizardOtherFee(fee.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.statValue}>None</p>
          )}
          <button type="button" className={styles.primaryButton} onClick={addWizardOtherFee} style={{ marginTop: '8px' }}>
            + Add other fee
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>States</h3>
            <button type="button" className={styles.primaryButton} onClick={addWizardStateRow}>
              + Add state
            </button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>State</th>
                <th>Employees</th>
                <th>SUTA %</th>
                <th>WC Class</th>
                <th>WC Cost %</th>
                <th>WC Sell %</th>
                <th>Annual Payroll</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(wizardDraft as any)?.statePricings && Array.isArray((wizardDraft as any).statePricings) ? (
                (wizardDraft as any).statePricings.map((row: any) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="text"
                        style={inputStyle}
                        value={row.state}
                        onChange={(e) => updateWizardArrayItem('statePricings', row.id, 'state', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        style={inputStyle}
                        value={row.employees ?? ''}
                        onChange={(e) =>
                          updateWizardArrayItem('statePricings', row.id, 'employees', e.target.value ? parseInt(e.target.value, 10) : 0)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        style={inputStyle}
                        value={row.sutaRate ?? ''}
                        onChange={(e) =>
                          updateWizardArrayItem('statePricings', row.id, 'sutaRate', e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        style={inputStyle}
                        value={row.wcClassCode ?? ''}
                        onChange={(e) => updateWizardArrayItem('statePricings', row.id, 'wcClassCode', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        style={inputStyle}
                        value={row.wcCostRate ?? ''}
                        onChange={(e) =>
                          updateWizardArrayItem('statePricings', row.id, 'wcCostRate', e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        style={inputStyle}
                        value={row.wcSellingRate ?? row.wcRate ?? ''}
                        onChange={(e) =>
                          updateWizardArrayItem('statePricings', row.id, 'wcSellingRate', e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        style={inputStyle}
                        value={row.annualPayroll ?? ''}
                        onChange={(e) =>
                          updateWizardArrayItem('statePricings', row.id, 'annualPayroll', e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </td>
                    <td>
                      <button type="button" className={styles.secondaryButton} onClick={() => removeWizardStateRow(row.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '12px' }}>
                    No state data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.infoGrid} style={{ marginTop: '12px' }}>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Benefits</p>
            <p className={styles.statValue}>
              {wizardServices.base.length ? wizardServices.base.join(', ') : 'None'}
            </p>
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Service add-ons</p>
            <p className={styles.statValue}>
              {wizardServices.addOns.length ? wizardServices.addOns.join(', ') : 'None'}
            </p>
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.statLabel}>Notes for approver</p>
            <p className={styles.statValue}>
              {(effectiveWizard as any)?.notesForApprover || '—'}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>Pricing</h2>
          </header>
          <div className={styles.cardBody}>
            <dl className={styles.detailList}>
              <div>
                <dt>Base price / EE / year</dt>
                <dd>{formatCurrency(proposal.base_price_per_employee_per_year ?? null)}</dd>
              </div>
              <div>
                <dt>Billing model</dt>
                <dd>
                  {proposal.billing_model === 'percent_of_gross'
                    ? `${proposal.percent_of_gross ?? 0}% of gross`
                    : proposal.billing_model === 'flat_per_employee'
                      ? `${formatCurrency(
                          proposal.flat_admin_fee_per_employee_per_period ?? null,
                        )} per employee`
                      : '—'}
                </dd>
              </div>
              <div>
                <dt>Annual admin target</dt>
                <dd>{formatCurrency(proposal.annual_admin_target ?? null)}</dd>
              </div>
              <div>
                <dt>Estimated monthly admin</dt>
                <dd>{formatCurrency(monthlyAdmin ?? null)}</dd>
              </div>
              <div>
                <dt>Estimated SUTA</dt>
                <dd>{formatCurrency(estimatedSUTA)}</dd>
              </div>
              <div>
                <dt>Estimated WC premium</dt>
                <dd>{formatCurrency(estimatedWc)}</dd>
              </div>
              <div>
                <dt>Workers&apos; Comp (selling)</dt>
                <dd>{formatCurrency(wcSelling)}</dd>
              </div>
              <div>
                <dt>Workers&apos; Comp (cost)</dt>
                <dd>{formatCurrency(wcCost)}</dd>
              </div>
              <div>
                <dt>WC profit</dt>
                <dd>{formatCurrency(wcProfit)}</dd>
              </div>
              <div>
                <dt>WC margin</dt>
                <dd>{formatPercent(wcMargin)}</dd>
              </div>
              <div>
                <dt>Admin fee (monthly)</dt>
                <dd>{formatCurrency(adminFeeMonthly)}</dd>
              </div>
              <div>
                <dt>Admin fee (annual)</dt>
                <dd>{formatCurrency(adminFeeAnnual)}</dd>
              </div>
              <div>
                <dt>Timekeeping fee (monthly)</dt>
                <dd>{formatCurrency(timekeepingFeeMonthly)}</dd>
              </div>
              <div>
                <dt>Timekeeping fee (annual)</dt>
                <dd>{formatCurrency(timekeepingFeeAnnual)}</dd>
              </div>
              <div>
                <dt>Add-ons (monthly)</dt>
                <dd>{formatCurrency(addonMonthlyTotal)}</dd>
              </div>
              <div>
                <dt>Add-ons (annual)</dt>
                <dd>{formatCurrency(addonMonthlyTotal * 12)}</dd>
              </div>
            </dl>
            {proposal.notes_for_prospect && (
              <div className={styles.notesBlock}>
                <p className={styles.notesLabel}>Prospect notes</p>
                <p className={styles.notesValue}>{proposal.notes_for_prospect}</p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2>Services Included</h2>
          </header>
          <div className={styles.cardBody}>
            {servicesList.length === 0 ? (
              <p className={styles.mutedText}>No services selected for this proposal.</p>
            ) : (
              <ul className={styles.serviceList}>
                {servicesList.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {canEdit && (
        <section className={styles.editCard}>
          <header className={styles.cardHeader}>
            <div>
              <h2>Edit proposal</h2>
              <p className={styles.mutedText}>
                Update pricing, notes, or services directly from this view.
              </p>
            </div>
          </header>
          <div className={styles.cardBody}>
            {editorNotice && (
              <div
                className={
                  editorNotice?.type === 'success'
                    ? styles.alertSuccess
                    : styles.alertError
                }
                style={{ marginBottom: '12px' }}
              >
                {editorNotice?.text}
              </div>
            )}
            <ProposalPricingEditor
              proposal={editorProposal}
              defaultPayFrequency={defaultPayFrequency}
              defaultHeadcount={defaultHeadcount}
              onSave={handleSaveDraft}
              onSubmitForApproval={showSubmitForApproval ? handleSubmitForApproval : undefined}
              saving={editorPending}
              variant="gf1"
            />
            {allowAdminDecision && (
              <div className={styles.editActions}>
                <p className={styles.mutedText}>Ready to decide? Use the buttons below.</p>
                <div className={styles.approvalButtons}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={pendingAction}
                    onClick={() => triggerDecision('approved')}
                  >
                    {pendingAction ? 'Saving…' : 'Approve proposal'}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={pendingAction}
                    onClick={() => triggerDecision('rejected')}
                  >
                    Decline proposal
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
