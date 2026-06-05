'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { US_STATES, getSUTARate } from '@/lib/gf1/rates';
import ProposalGeneratorStyles from './ProposalGenerator.module.css';

export type Prospect = {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  legal_name?: string | null;
  email: string | null;
  total_employees?: number | null;
  employee_count?: number | string | null;
  pay_frequency?: string | null;
};

export interface ProposalGeneratorClientProps {
  prospects: Prospect[];
  organizationId?: string;
}

type AdminFeeMode = 'per_check' | 'per_month' | 'percent_of_gross';
type FeeBasis = 'PEPC' | 'PEPM';
type AdminFeeSelection = FeeBasis | 'PERCENT_OF_GROSS';

type StatePricing = {
  id: string;
  state: string;
  employees: number;
  annualPayroll: number | null;
  sutaRate: number | null;
  wcClassCode: string;
  wcCostRate: number | null;
  wcSellingRate: number | null;
};

type OtherFee = {
  id: string;
  label: string;
  amount: number;
};

type AdminOption = {
  user_id: string;
  email: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  name?: string | null;
};

function formatAdminName(option: AdminOption): string {
  const preferred = option.name?.trim();
  if (preferred) return preferred;
  const display = option.display_name?.trim();
  if (display) return display;
  const first = option.first_name?.trim() ?? '';
  const last = option.last_name?.trim() ?? '';
  if (first || last) return `${first} ${last}`.trim();
  const fullName = option.full_name?.trim();
  if (fullName) return fullName;
  if (option.email) return option.email;
  return 'Admin reviewer';
}

const averageAnnualPayrollPerEmployee = 50000;
const DEFAULT_ADMIN_FEE_MODE: AdminFeeMode = 'per_check';

const createStateRow = (state: string, employees: number): StatePricing => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  state,
  employees,
  annualPayroll: employees * averageAnnualPayrollPerEmployee,
  sutaRate: getSUTARate(state as any),
  wcClassCode: '',
  wcCostRate: null,
  wcSellingRate: null,
});

export interface FormData {
  prospectId: string;
  companyName: string;
  employeeCount: number;
  statePricings: StatePricing[];
  adminFeeMode: AdminFeeMode;
  adminFeeValue: number;
  checksPerMonth: number;
  adminFeeEnabled: boolean;
  adminFeeRate: number;
  adminFeeBasis: FeeBasis;
  timekeepingFeeEnabled: boolean;
  timekeepingFeeRate: number;
  timekeepingFeeBasis: FeeBasis;
  learningManagementSystemFeeEnabled: boolean;
  learningManagementSystemFeeRate: number;
  learningManagementSystemFeeBasis: FeeBasis;
  setupFees: number;
  otherFees: OtherFee[];
  services: {
    health: boolean;
    retirement401k: boolean;
    supplemental: boolean;
    otherCompanyPaid: boolean;
  };
  additionalServices: {
    pto: boolean;
    swipeclock: boolean;
    workforceManagement: boolean;
    physicalTimeclocks: boolean;
    applicantTracking: boolean;
    drugTesting: boolean;
    backgroundChecks: boolean;
    wotc: boolean;
    benefitsAdministration: boolean;
  };
  managerId: string;
  managerEmail: string;
  managerName: string;
  notesForApprover: string;
}

const INITIAL_FORM: FormData = {
  prospectId: '',
  companyName: '',
  employeeCount: 25,
  statePricings: [createStateRow('AL', 25)],
  adminFeeMode: DEFAULT_ADMIN_FEE_MODE,
  adminFeeValue: 15,
  checksPerMonth: 26 / 12,
  adminFeeEnabled: true,
  adminFeeRate: 15,
  adminFeeBasis: 'PEPC',
  timekeepingFeeEnabled: false,
  timekeepingFeeRate: 0,
  timekeepingFeeBasis: 'PEPM',
  learningManagementSystemFeeEnabled: false,
  learningManagementSystemFeeRate: 0,
  learningManagementSystemFeeBasis: 'PEPM',
  setupFees: 0,
  otherFees: [
    { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), label: 'Other Fee', amount: 0 },
  ],
  services: {
    health: false,
    retirement401k: false,
    supplemental: true,
    otherCompanyPaid: false,
  },
  additionalServices: {
    pto: false,
    swipeclock: false,
    workforceManagement: false,
    physicalTimeclocks: false,
    applicantTracking: false,
    drugTesting: false,
    backgroundChecks: false,
    wotc: false,
    benefitsAdministration: false,
  },
  managerId: '',
  managerEmail: '',
  managerName: '',
  notesForApprover: '',
};

const formatCurrency = (val: number) =>
  `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (val: number) =>
  `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const getPeriodsPerYear = (payFrequency?: string | null) => {
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
    case 'other':
      return 12;
    default:
      return 26;
  }
};

const getChecksPerMonth = (payFrequency?: string | null) => {
  return getPeriodsPerYear(payFrequency) / 12;
};

export function ProposalGeneratorClient({ prospects }: ProposalGeneratorClientProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const router = useRouter();
  const healthNotificationSent = useRef(new Set<string>());
  const retirementNotificationSent = useRef(new Set<string>());

  const selectedProspect = prospects.find((p) => p.id === form.prospectId);

  useEffect(() => {
    if (!selectedProspect) return;

    const employeeCountFromProspect = selectedProspect.total_employees ?? selectedProspect.employee_count ?? null;
    const normalizedEmployeeCount =
      typeof employeeCountFromProspect === 'string'
        ? Number.parseInt(employeeCountFromProspect, 10)
        : employeeCountFromProspect;

    setForm((prev) => {
      const nextEmployeeCount = Number.isFinite(normalizedEmployeeCount ?? NaN)
        ? (normalizedEmployeeCount as number)
        : prev.employeeCount;

      const nextStateRows =
        prev.statePricings.length > 0
          ? prev.statePricings.map((row, idx) =>
              idx === 0 && row.employees === prev.employeeCount ? { ...row, employees: nextEmployeeCount } : row
            )
          : prev.statePricings;

      return {
        ...prev,
        companyName: selectedProspect.legal_name || selectedProspect.organization_name || selectedProspect.name || '',
        employeeCount: nextEmployeeCount,
        statePricings: nextStateRows,
      };
    });
  }, [selectedProspect]);

  useEffect(() => {
    // Keep single state row in sync with overall employee count when no allocation is provided
    setForm((prev) => {
      if (prev.statePricings.length !== 1) return prev;
      const [row] = prev.statePricings;
      if (row.employees !== 0) return prev;
      return {
        ...prev,
        statePricings: [{ ...row, employees: prev.employeeCount }],
      };
    });
  }, [form.employeeCount]);

  useEffect(() => {
    if (!selectedProspect?.pay_frequency) return;
    const inferredChecksPerMonth = getChecksPerMonth(selectedProspect.pay_frequency);
    setForm((prev) => {
      if (Math.abs(prev.checksPerMonth - inferredChecksPerMonth) < 0.001) return prev;
      return { ...prev, checksPerMonth: inferredChecksPerMonth };
    });
  }, [selectedProspect?.pay_frequency]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/gf1/admin-users');
        if (!res.ok) return;
        if (!res.headers.get('content-type')?.includes('application/json')) return;
        const data = await res.json();
        if (mounted) setAdmins(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addOtherFee = () => {
    const newFee: OtherFee = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      label: 'Other Fee',
      amount: 0,
    };
    setForm((prev) => ({ ...prev, otherFees: [...prev.otherFees, newFee] }));
  };

  const updateOtherFee = (id: string, field: keyof OtherFee, value: any) => {
    setForm((prev) => ({
      ...prev,
      otherFees: prev.otherFees.map((fee) => (fee.id === id ? { ...fee, [field]: value } : fee)),
    }));
  };

  const removeOtherFee = (id: string) => {
    setForm((prev) => {
      if (prev.otherFees.length === 1) return prev;
      return { ...prev, otherFees: prev.otherFees.filter((fee) => fee.id !== id) };
    });
  };

  const handleStatePricingChange = (id: string, field: keyof StatePricing, value: any) => {
    setForm((prev) => ({
      ...prev,
      statePricings: prev.statePricings.map((sp) => {
        if (sp.id !== id) return sp;
        if (field === 'state') {
          return {
            ...sp,
            state: value,
            sutaRate: getSUTARate(value as any),
          };
        }
        return { ...sp, [field]: value };
      }),
    }));
    setError(null);
  };

  const sendHealthCensusNotification = async (enabled: boolean) => {
    if (!enabled) return;
    if (!form.prospectId || healthNotificationSent.current.has(form.prospectId)) return;

    const organizationName =
      form.companyName ||
      selectedProspect?.legal_name ||
      selectedProspect?.organization_name ||
      selectedProspect?.name ||
      'Prospective client';

    try {
      const res = await fetch('/api/gf1/proposals/health-census-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: form.prospectId,
          organizationName,
          prospectName: selectedProspect?.name ?? null,
        }),
      });
      if (res.ok) {
        healthNotificationSent.current.add(form.prospectId);
      } else {
        const data = await res.json().catch(() => null);
        console.error('[health-census] notify failed', data);
      }
    } catch (err) {
      console.error('[health-census] notify failed', err);
    }
  };

  const sendRetirementNotification = async (enabled: boolean) => {
    if (!enabled) return;
    if (!form.prospectId || retirementNotificationSent.current.has(form.prospectId)) return;

    const organizationName =
      form.companyName ||
      selectedProspect?.legal_name ||
      selectedProspect?.organization_name ||
      selectedProspect?.name ||
      'Prospective client';

    try {
      const res = await fetch('/api/gf1/proposals/retirement-401k-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: form.prospectId,
          organizationName,
          prospectName: selectedProspect?.name ?? null,
        }),
      });
      if (res.ok) {
        retirementNotificationSent.current.add(form.prospectId);
      } else {
        const data = await res.json().catch(() => null);
        console.error('[retirement-401k] notify failed', data);
      }
    } catch (err) {
      console.error('[retirement-401k] notify failed', err);
    }
  };

  const addStateRow = () => {
    const last = form.statePricings[form.statePricings.length - 1];
    const newRow = createStateRow(last?.state || 'CA', 0);
    setForm((prev) => ({
      ...prev,
      statePricings: [...prev.statePricings, newRow],
    }));
  };

  const removeStateRow = (id: string) => {
    if (form.statePricings.length === 1) return;
    setForm((prev) => ({
      ...prev,
      statePricings: prev.statePricings.filter((sp) => sp.id !== id),
    }));
  };

  const totalStateEmployees = useMemo(
    () => form.statePricings.reduce((sum, sp) => sum + (Number.isFinite(sp.employees) ? sp.employees : 0), 0),
    [form.statePricings]
  );
  const effectiveEmployeeCount = totalStateEmployees || form.employeeCount;

  const totalAnnualPayroll = useMemo(
    () =>
      form.statePricings.reduce((sum, sp) => {
        const employees = sp.employees || (form.statePricings.length === 1 ? form.employeeCount : 0);
        const payroll = sp.annualPayroll ?? Math.max(employees, 0) * averageAnnualPayrollPerEmployee;
        return sum + payroll;
      }, 0),
    [form.statePricings, form.employeeCount]
  );

  const estimateStateSUTA = (sp: StatePricing) => {
    const employees = sp.employees || (form.statePricings.length === 1 ? form.employeeCount : 0);
    const rate = (sp.sutaRate ?? getSUTARate(sp.state as any)) / 100;
    const estimatedMaxWageBase = 12000;
    const payroll = sp.annualPayroll ?? Math.max(employees, 0) * averageAnnualPayrollPerEmployee;
    const taxableWages = Math.min(payroll, Math.max(employees, 0) * estimatedMaxWageBase);
    return taxableWages * rate;
  };

  const totalAnnualSUTA = useMemo(
    () => form.statePricings.reduce((sum, sp) => sum + estimateStateSUTA(sp), 0),
    [form.statePricings, form.employeeCount]
  );
  const sutaByState = useMemo(() => {
    const totals = new Map<string, number>();
    form.statePricings.forEach((sp) => {
      const current = totals.get(sp.state) ?? 0;
      totals.set(sp.state, current + estimateStateSUTA(sp));
    });
    return Array.from(totals.entries()).map(([state, amount]) => ({ state, amount }));
  }, [form.statePricings, form.employeeCount]);

  const wcAnnualByState = useMemo(
    () =>
      form.statePricings.map((sp) => {
        const employees = sp.employees || (form.statePricings.length === 1 ? form.employeeCount : 0);
        const payroll = sp.annualPayroll ?? Math.max(employees, 0) * averageAnnualPayrollPerEmployee;
        const costRate = (sp.wcCostRate ?? 0) / 100;
        const sellingRate = (sp.wcSellingRate ?? 0) / 100;
        const cost = payroll * costRate;
        const selling = payroll * sellingRate;
        return {
          state: sp.state,
          classCode: sp.wcClassCode || 'N/A',
          payroll,
          cost,
          selling,
        };
      }),
    [form.statePricings, form.employeeCount]
  );
  const totalAnnualWcCost = useMemo(
    () => wcAnnualByState.reduce((sum, row) => sum + row.cost, 0),
    [wcAnnualByState]
  );
  const totalAnnualWcSelling = useMemo(
    () => wcAnnualByState.reduce((sum, row) => sum + row.selling, 0),
    [wcAnnualByState]
  );

  const payPeriodsPerYear = getPeriodsPerYear(selectedProspect?.pay_frequency);
  const checksPerMonth = payPeriodsPerYear / 12;

  const annualFromEmployeeFee = (enabled: boolean, rate: number, basis: FeeBasis) => {
    if (!enabled || !Number.isFinite(rate) || rate <= 0) return 0;
    if (basis === 'PEPC') return effectiveEmployeeCount * rate * payPeriodsPerYear;
    return effectiveEmployeeCount * rate * 12;
  };

  const adminAnnual =
    form.adminFeeMode === 'percent_of_gross'
      ? totalAnnualPayroll * (form.adminFeeRate / 100)
      : annualFromEmployeeFee(true, form.adminFeeRate, form.adminFeeBasis);
  const adminMonthly = adminAnnual / 12;

  const timekeepingAnnual = annualFromEmployeeFee(
    form.timekeepingFeeEnabled,
    form.timekeepingFeeRate,
    form.timekeepingFeeBasis,
  );
  const timekeepingMonthly = timekeepingAnnual / 12;

  const learningManagementSystemAnnual = annualFromEmployeeFee(
    form.learningManagementSystemFeeEnabled,
    form.learningManagementSystemFeeRate,
    form.learningManagementSystemFeeBasis,
  );
  const learningManagementSystemMonthly = learningManagementSystemAnnual / 12;

  const estimatedMonthlyAdminCost = adminMonthly + timekeepingMonthly + learningManagementSystemMonthly;
  const adminAnnualPerEmployee = effectiveEmployeeCount ? adminAnnual / effectiveEmployeeCount : 0;
  const wcProfitAnnual = totalAnnualWcSelling - totalAnnualWcCost;
  const wcMarginPct = totalAnnualWcSelling > 0 ? (wcProfitAnnual / totalAnnualWcSelling) * 100 : 0;
  const totalOtherFees = form.otherFees.reduce((sum, fee) => sum + (Number.isFinite(fee.amount) ? fee.amount : 0), 0);

  const validateForm = (): boolean => {
    if (!form.prospectId) {
      setError('Please select a prospect');
      return false;
    }
    if (!form.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (form.employeeCount < 1) {
      setError('Employee count must be at least 1');
      return false;
    }
    if (!form.statePricings.length) {
      setError('Please add at least one state for pricing');
      return false;
    }
    if (form.adminFeeRate < 0 || form.timekeepingFeeRate < 0 || form.learningManagementSystemFeeRate < 0) {
      setError('Admin fee cannot be negative');
      return false;
    }
    if (!form.services.health && !form.services.retirement401k && !form.services.supplemental && !form.services.otherCompanyPaid) {
      setError('Please select at least one benefit option');
      return false;
    }
    if (!form.managerId) {
      setError('Please select a manager for approval');
      return false;
    }
    return true;
  };

  const handleSendForApproval = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const primaryState = form.statePricings[0];
      const response = await fetch('/api/gf1/proposals/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: form.prospectId,
          organizationId: selectedProspect?.organization_id,
          prospectName: selectedProspect?.name || 'Unknown',
          companyName: form.companyName,
          employeeCount: form.employeeCount,
          state: primaryState?.state || 'CA',
          sutaRate: primaryState?.sutaRate ?? getSUTARate((primaryState?.state as any) || 'CA'),
          wcRateClass: primaryState?.wcClassCode || 'other',
          wcModFactor: 1.0,
          adminFeePerEmployee:
            effectiveEmployeeCount ? adminMonthly / effectiveEmployeeCount : 0,
          estimatedMonthlyAdminCost,
          estimatedSUTA: totalAnnualSUTA,
          estimatedWCPremium: totalAnnualWcSelling,
          services: {
            ...form.services,
            additionalServices: form.additionalServices,
          },
          customTagline: form.notesForApprover,
          managerId: form.managerId,
          managerEmail: form.managerEmail,
          managerName: form.managerName,
          pricingDetails: {
            statePricings: form.statePricings,
            adminFeeMode: form.adminFeeMode,
            adminFeeValue: form.adminFeeRate,
            checksPerMonth,
            totalAnnualPayroll,
            wcCostAnnual: totalAnnualWcCost,
            wcSellingAnnual: totalAnnualWcSelling,
            adminFeeEnabled: true,
            adminFeeRate: form.adminFeeRate,
            adminFeeBasis: form.adminFeeBasis,
            timekeepingFeeEnabled: form.timekeepingFeeEnabled,
            timekeepingFeeRate: form.timekeepingFeeRate,
            timekeepingFeeBasis: form.timekeepingFeeBasis,
            learningManagementSystemFeeEnabled: form.learningManagementSystemFeeEnabled,
            learningManagementSystemFeeRate: form.learningManagementSystemFeeRate,
            learningManagementSystemFeeBasis: form.learningManagementSystemFeeBasis,
            addons: [
              {
                id: 'learning_management_system',
                label: 'Learning Management System',
                enabled: form.learningManagementSystemFeeEnabled,
                pricing_model:
                  form.learningManagementSystemFeeBasis === 'PEPC'
                    ? 'per_employee_per_check'
                    : 'per_employee_per_month',
                amount_cents: Math.round(form.learningManagementSystemFeeRate * 100),
              },
            ],
            setupFees: form.setupFees,
            otherFees: form.otherFees,
            services: {
              ...form.services,
              additionalServices: form.additionalServices,
            },
            payFrequency: selectedProspect?.pay_frequency ?? null,
            notesForApprover: form.notesForApprover,
            employeeCount: form.employeeCount,
            estimatedMonthlyAdminCost,
            estimatedSUTA: totalAnnualSUTA,
            estimatedWCPremium: totalAnnualWcSelling,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send proposal for approval');
      }

      setSuccess(true);
      setSuccessMessage('Proposal sent to manager for approval!');
      setForm(INITIAL_FORM);
      setStep(1);

      if (data?.proposalId) {
        router.push(`/gf1/proposals/${data.proposalId}/slides`);
      } else {
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send proposal for approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const benefitOptions = [
    { id: 'health', label: 'Health Insurance', description: 'Medical, dental, and vision coverage' },
    { id: 'retirement401k', label: '401(k) Retirement Plan', description: 'Employer-sponsored retirement savings' },
    { id: 'supplemental', label: 'Supplemental Benefits', description: 'Life, disability, and accident insurance' },
    { id: 'otherCompanyPaid', label: 'Other Company Paid Benefits (GTL, STD/LTD, etc.)', description: 'Additional employer-paid benefits' },
  ] as const;

  const addOnServices = [
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

  return (
    <div
      className={ProposalGeneratorStyles.container}
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        margin: '0',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {success && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #66B92E',
            background: 'rgba(102, 185, 46, 0.15)',
            color: '#66B92E',
            fontSize: '14px',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ marginRight: '6px' }}>✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #D65B4A',
            background: 'rgba(214, 91, 74, 0.15)',
            color: '#D65B4A',
            fontSize: '14px',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ marginRight: '6px' }}>⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className={ProposalGeneratorStyles.progressBar}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`${ProposalGeneratorStyles.progressStep} ${step >= s ? ProposalGeneratorStyles.active : ''}`}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Prospect & Company Information</h2>
          <p style={{ fontSize: '13px', color: '#738297', margin: '0 0 20px 0' }}>Select a prospect and enter company details</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="prospect-select" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                Prospect *
              </label>
              <select
                id="prospect-select"
                value={form.prospectId}
                onChange={(e) => handleFieldChange('prospectId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #3d4b5e',
                  borderRadius: '4px',
                  background: '#313D4E',
                  color: 'white',
                  cursor: !prospects || prospects.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: !prospects || prospects.length === 0 ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                disabled={!prospects || prospects.length === 0}
                aria-label="Select a prospect organization"
              >
                <option value="" style={{ background: '#313D4E', color: 'white' }}>
                  {prospects && prospects.length > 0 ? '-- Choose a prospect --' : 'No prospects available'}
                </option>
                {prospects &&
                  prospects.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#313D4E', color: 'white' }}>
                      {p.name}
                    </option>
                  ))}
              </select>
              {prospects && prospects.length > 0 && (
                <p style={{ fontSize: '12px', color: '#738297', margin: 0 }}>
                  {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="company-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                value={form.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="Enter company legal name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #3d4b5e',
                  borderRadius: '4px',
                  background: '#313D4E',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1C93ED';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28, 147, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#3d4b5e';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px' }}>
              <label htmlFor="employee-count" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                Total Employee Count *
              </label>
              <input
                id="employee-count"
                type="number"
                value={form.employeeCount}
                onChange={(e) => handleFieldChange('employeeCount', parseInt(e.target.value, 10) || 0)}
                min="1"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #3d4b5e',
                  borderRadius: '4px',
                  background: '#313D4E',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1C93ED';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(28, 147, 237, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#3d4b5e';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#1C93ED',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Pricing & Tax Configuration</h2>
          <p style={{ fontSize: '13px', color: '#738297', margin: '0 0 20px 0' }}>Add state-specific SUTA and WC rates, plus admin fees.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {form.statePricings.map((sp, idx) => (
              <div
                key={sp.id}
                style={{
                  border: '1px solid #3d4b5e',
                  borderRadius: '10px',
                  padding: '12px',
                  background: '#273142',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>State</label>
                    <select
                      value={sp.state}
                      onChange={(e) => handleStatePricingChange(sp.id, 'state', e.target.value)}
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    >
                      {US_STATES.map((st) => (
                        <option key={st.value} value={st.value} style={{ background: '#313D4E', color: 'white' }}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.statePricings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStateRow(sp.id)}
                      style={{
                        padding: '8px 10px',
                        background: 'transparent',
                        color: '#D65B4A',
                        border: '1px solid #3d4b5e',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        height: 'fit-content',
                        marginTop: '18px',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Employees in State</label>
                    <input
                      type="number"
                      min="0"
                      value={sp.employees}
                      onChange={(e) => handleStatePricingChange(sp.id, 'employees', parseInt(e.target.value, 10) || 0)}
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Annual Payroll (est.)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={sp.annualPayroll ?? ''}
                      onChange={(e) => handleStatePricingChange(sp.id, 'annualPayroll', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 250000"
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>SUTA Rate %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sp.sutaRate ?? ''}
                      onChange={(e) => handleStatePricingChange(sp.id, 'sutaRate', e.target.value ? parseFloat(e.target.value) : null)}
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>WC Class Code</label>
                    <input
                      type="text"
                      value={sp.wcClassCode}
                      onChange={(e) => handleStatePricingChange(sp.id, 'wcClassCode', e.target.value)}
                      placeholder="e.g., 8810"
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>WC Cost Rate %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sp.wcCostRate ?? ''}
                      onChange={(e) => handleStatePricingChange(sp.id, 'wcCostRate', e.target.value ? parseFloat(e.target.value) : null)}
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>WC Selling Rate %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sp.wcSellingRate ?? ''}
                      onChange={(e) => handleStatePricingChange(sp.id, 'wcSellingRate', e.target.value ? parseFloat(e.target.value) : null)}
                      style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {idx === form.statePricings.length - 1 && (
                  <button
                    type="button"
                    onClick={addStateRow}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '4px',
                      padding: '8px 10px',
                      background: '#1C93ED',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    + Add another state
                  </button>
                )}
              </div>
            ))}

            <div style={{ border: '1px solid #3d4b5e', borderRadius: '10px', padding: '12px', background: '#273142', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 10px', background: '#1f2937', borderRadius: '8px', border: '1px solid #3d4b5e' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Pay Frequency</span>
                <strong style={{ fontSize: '13px', color: 'white' }}>
                  {selectedProspect?.pay_frequency ? selectedProspect.pay_frequency.replace(/_/g, ' ') : 'Not set'}
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', padding: '8px 10px', background: '#1f2937', borderRadius: '8px', border: '1px solid #3d4b5e' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>WC Cost (annual)</span>
                <strong style={{ fontSize: '14px', color: 'white' }}>{formatCurrency(totalAnnualWcCost)}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', padding: '8px 10px', background: '#1f2937', borderRadius: '8px', border: '1px solid #3d4b5e' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>WC Selling (annual)</span>
                <strong style={{ fontSize: '14px', color: 'white' }}>{formatCurrency(totalAnnualWcSelling)}</strong>
              </div>

              <div style={{ gridColumn: '1 / -1', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '12px', background: '#1f2937', display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '12px', letterSpacing: '0.04em', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>
                  Fee Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 170px', gap: '10px', padding: '0 8px', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Fee Type</span>
                  <span>Basis</span>
                  <span>Rate</span>
                </div>

                {[
                  {
                    label: 'Admin Fee',
                    enabled: true,
                    basis: (form.adminFeeMode === 'percent_of_gross' ? 'PERCENT_OF_GROSS' : form.adminFeeBasis) as AdminFeeSelection,
                    rate: form.adminFeeRate,
                    ratePrefix: form.adminFeeMode === 'percent_of_gross' ? '' : '$',
                    rateSuffix: form.adminFeeMode === 'percent_of_gross' ? '%' : '',
                    lockEnabled: true,
                    basisOptions: [
                      { value: 'PEPC', label: 'Per Employee Per Check (PEPC)' },
                      { value: 'PEPM', label: 'Per Employee Per Month (PEPM)' },
                      { value: 'PERCENT_OF_GROSS', label: 'Percentage of Gross Wages' },
                    ] as Array<{ value: AdminFeeSelection; label: string }>,
                    onEnabledChange: undefined,
                    onBasisChange: (basis: AdminFeeSelection) => {
                      if (basis === 'PERCENT_OF_GROSS') {
                        setForm((prev) => ({
                          ...prev,
                          adminFeeEnabled: true,
                          adminFeeMode: 'percent_of_gross',
                        }));
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          adminFeeEnabled: true,
                          adminFeeMode: basis === 'PEPC' ? 'per_check' : 'per_month',
                          adminFeeBasis: basis,
                        }));
                      }
                      setError(null);
                    },
                    onRateChange: (rate: number) => handleFieldChange('adminFeeRate', rate),
                  },
                  {
                    label: 'Timekeeping Fee',
                    enabled: form.timekeepingFeeEnabled,
                    basis: form.timekeepingFeeBasis,
                    rate: form.timekeepingFeeRate,
                    ratePrefix: '$',
                    rateSuffix: '',
                    lockEnabled: false,
                    basisOptions: [
                      { value: 'PEPC', label: 'Per Employee Per Check (PEPC)' },
                      { value: 'PEPM', label: 'Per Employee Per Month (PEPM)' },
                    ] as Array<{ value: FeeBasis; label: string }>,
                    onEnabledChange: (checked: boolean) => handleFieldChange('timekeepingFeeEnabled', checked),
                    onBasisChange: (basis: FeeBasis) => handleFieldChange('timekeepingFeeBasis', basis),
                    onRateChange: (rate: number) => handleFieldChange('timekeepingFeeRate', rate),
                  },
                  {
                    label: 'LMS Fee',
                    enabled: form.learningManagementSystemFeeEnabled,
                    basis: form.learningManagementSystemFeeBasis,
                    rate: form.learningManagementSystemFeeRate,
                    ratePrefix: '$',
                    rateSuffix: '',
                    lockEnabled: false,
                    basisOptions: [
                      { value: 'PEPC', label: 'Per Employee Per Check (PEPC)' },
                      { value: 'PEPM', label: 'Per Employee Per Month (PEPM)' },
                    ] as Array<{ value: FeeBasis; label: string }>,
                    onEnabledChange: (checked: boolean) => handleFieldChange('learningManagementSystemFeeEnabled', checked),
                    onBasisChange: (basis: FeeBasis) => handleFieldChange('learningManagementSystemFeeBasis', basis),
                    onRateChange: (rate: number) => handleFieldChange('learningManagementSystemFeeRate', rate),
                  },
                ].map((fee) => (
                  <div key={fee.label} style={{ display: 'grid', gridTemplateColumns: '240px 1fr 170px', gap: '10px', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '10px', background: '#273142', alignItems: 'center' }}>
                    <label style={{ display: 'flex', justifySelf: 'start', alignItems: 'center', gap: '10px', color: 'white', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={fee.enabled}
                        onChange={(e) => fee.onEnabledChange?.(e.target.checked)}
                        disabled={fee.lockEnabled}
                      />
                      <span>{fee.label}</span>
                    </label>
                    <div>
                      <select
                        value={fee.basis}
                        onChange={(e) => fee.onBasisChange(e.target.value as AdminFeeSelection)}
                        disabled={!fee.enabled}
                        style={{ width: '100%', padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                      >
                        {fee.basisOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ position: 'relative' }}>
                        {fee.ratePrefix ? (
                          <span
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9CA3AF',
                              fontSize: '13px',
                              pointerEvents: 'none',
                            }}
                          >
                            {fee.ratePrefix}
                          </span>
                        ) : null}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={fee.rate}
                          onChange={(e) => fee.onRateChange(parseFloat(e.target.value) || 0)}
                          disabled={!fee.enabled}
                          placeholder="Rate"
                          style={{
                            width: '100%',
                            padding: fee.ratePrefix
                              ? fee.rateSuffix
                                ? '8px 26px 8px 24px'
                                : '8px 10px 8px 24px'
                              : fee.rateSuffix
                                ? '8px 26px 8px 10px'
                                : '8px 10px',
                            background: '#313D4E',
                            border: '1px solid #3d4b5e',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '13px',
                          }}
                        />
                        {fee.rateSuffix ? (
                          <span
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9CA3AF',
                              fontSize: '13px',
                              pointerEvents: 'none',
                            }}
                          >
                            {fee.rateSuffix}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Setup Fees (one-time)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.setupFees}
                  onChange={(e) => handleFieldChange('setupFees', parseFloat(e.target.value) || 0)}
                  style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Other Fees (one-time)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.otherFees.map((fee) => (
                    <div key={fee.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={fee.label}
                        onChange={(e) => updateOtherFee(fee.id, 'label', e.target.value)}
                        placeholder="Fee name"
                        style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fee.amount}
                        onChange={(e) => updateOtherFee(fee.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{ padding: '8px 10px', background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOtherFee(fee.id)}
                        style={{ padding: '6px 10px', background: 'transparent', color: '#D65B4A', border: '1px solid #3d4b5e', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOtherFee}
                    style={{ alignSelf: 'flex-start', padding: '8px 12px', background: '#1C93ED', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add another fee
                  </button>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #3d4b5e', borderRadius: '8px', padding: '12px', background: '#1f2937', color: 'white' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>Cost Summary (Annualized)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Admin Fees</span>
                  <strong>{formatCurrency(adminAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Timekeeping Fees</span>
                  <strong>{formatCurrency(timekeepingAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Admin per Employee (annual)</span>
                  <strong>{formatCurrency(adminAnnualPerEmployee)}</strong>
                </div>
                {sutaByState.map((entry) => (
                  <div key={entry.state} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>SUTA ({entry.state})</span>
                    <strong>{formatCurrency(entry.amount)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>LMS Fee</span>
                  <strong>{formatCurrency(learningManagementSystemAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Setup Fees</span>
                  <strong>{formatCurrency(form.setupFees)}</strong>
                </div>
                {form.otherFees.map((fee) => (
                  <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>{fee.label || 'Other Fee'}</span>
                    <strong>{formatCurrency(fee.amount)}</strong>
                  </div>
                ))}
                {wcAnnualByState.map((row, idx) => (
                  <div key={`${row.state}-${row.classCode}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>WC ({row.state} / {row.classCode})</span>
                    <strong>{`${formatCurrency(row.cost)} cost | ${formatCurrency(row.selling)} sell`}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp (selling)</span>
                  <strong>{formatCurrency(totalAnnualWcSelling)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp (cost)</span>
                  <strong>{formatCurrency(totalAnnualWcCost)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp Profit</span>
                  <strong>{formatCurrency(wcProfitAnnual)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #3d4b5e',
                background: '#273142',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#1C93ED',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Benefits Selection</h2>
          <p style={{ fontSize: '13px', color: '#738297', margin: '0 0 20px 0' }}>Choose the benefits to include in this proposal</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {benefitOptions.map((option) => (
              <label
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3d4b5e',
                  background: '#273142',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.services[option.id as keyof typeof form.services]}
                  onChange={(e) => {
                    const nextChecked = e.target.checked;
                    handleFieldChange('services', {
                      ...form.services,
                      [option.id]: nextChecked,
                    });
                    if (option.id === 'health') {
                      sendHealthCensusNotification(nextChecked);
                    }
                    if (option.id === 'retirement401k') {
                      sendRetirementNotification(nextChecked);
                    }
                  }}
                  style={{ margin: 0, width: '16px', height: '16px' }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.3 }}>{option.label}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #3d4b5e',
                background: '#273142',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#1C93ED',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Service Add-Ons</h2>
          <p style={{ fontSize: '13px', color: '#738297', margin: '0 0 20px 0' }}>Select additional services to include.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {addOnServices.map((service) => (
              <label
                key={service.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3d4b5e',
                  background: '#273142',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.additionalServices[service.id as keyof typeof form.additionalServices]}
                  onChange={(e) =>
                    handleFieldChange('additionalServices', {
                      ...form.additionalServices,
                      [service.id]: e.target.checked,
                    })
                  }
                  style={{ margin: 0, width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{service.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #3d4b5e',
                background: '#273142',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#1C93ED',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 4px 0' }}>Manager Approval</h2>
          <p style={{ fontSize: '13px', color: '#738297', margin: '0 0 20px 0' }}>Send this proposal to your manager for approval</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="manager-select" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                Approving Admin *
              </label>
              <select
                id="manager-select"
                value={form.managerId}
                onChange={(e) => {
                  const id = e.target.value;
                  const admin = admins.find((a) => a.user_id === id);
                  handleFieldChange('managerId', id);
                  handleFieldChange('managerEmail', admin?.email ?? '');
                  handleFieldChange('managerName', admin ? formatAdminName(admin) : '');
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #3d4b5e',
                  borderRadius: '4px',
                  background: '#313D4E',
                  color: 'white',
                }}
              >
                <option value="">-- Select an admin approver --</option>
                {admins.map((a) => (
                  <option key={a.user_id} value={a.user_id} style={{ background: '#313D4E', color: 'white' }}>
                    {formatAdminName(a)}
                  </option>
                ))}
              </select>
              {admins.length === 0 && (
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>No admin users found. Contact an administrator to set approvers.</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="tagline" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                Notes for approver (optional)
              </label>
              <textarea
                id="tagline"
                value={form.notesForApprover}
                onChange={(e) => handleFieldChange('notesForApprover', e.target.value)}
                placeholder="Add context, edge cases, or requests for the reviewer..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #3d4b5e',
                  borderRadius: '4px',
                  background: '#313D4E',
                  color: 'white',
                }}
              />
            </div>

            <div style={{ border: '1px solid #3d4b5e', borderRadius: '8px', padding: '12px', background: '#1f2937', color: 'white', display: 'grid', gap: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0' }}>Proposal Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '13px' }}>
                {[
                  ['Prospect', selectedProspect?.name || 'N/A'],
                  ['Company', form.companyName],
                  ['Employees', String(form.employeeCount)],
                  ['Pay Frequency', selectedProspect?.pay_frequency ? selectedProspect.pay_frequency.replace(/_/g, ' ') : 'Not set'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #3d4b5e', marginTop: '6px', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Admin Fees (annual)</span>
                  <strong>{formatCurrency(adminAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Admin Fee Basis</span>
                  <strong>
                    {form.adminFeeMode === 'percent_of_gross'
                      ? `${formatPercent(form.adminFeeRate)} of gross wages`
                      : form.adminFeeBasis === 'PEPC'
                        ? `${formatCurrency(form.adminFeeRate)} per employee per check`
                        : `${formatCurrency(form.adminFeeRate)} per employee per month`}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Timekeeping Fees (annual)</span>
                  <strong>{formatCurrency(timekeepingAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Timekeeping Fee Basis</span>
                  <strong>{form.timekeepingFeeBasis === 'PEPC' ? `${formatCurrency(form.timekeepingFeeRate)} per employee per check` : `${formatCurrency(form.timekeepingFeeRate)} per employee per month`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Admin per Employee (annual)</span>
                  <strong>{formatCurrency(adminAnnualPerEmployee)}</strong>
                </div>
                {sutaByState.map((entry) => (
                  <div key={entry.state} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>SUTA ({entry.state})</span>
                    <strong>{formatCurrency(entry.amount)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>LMS Fee</span>
                  <strong>{formatCurrency(learningManagementSystemAnnual)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Setup Fees</span>
                  <strong>{formatCurrency(form.setupFees)}</strong>
                </div>
                {form.otherFees.map((fee) => (
                  <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>{fee.label || 'Other Fee'}</span>
                    <strong>{formatCurrency(fee.amount)}</strong>
                  </div>
                ))}
                {wcAnnualByState.map((row, idx) => (
                  <div key={`${row.state}-${row.classCode}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                    <span>WC ({row.state} / {row.classCode})</span>
                    <strong>{`${formatCurrency(row.cost)} cost | ${formatCurrency(row.selling)} sell`}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp Selling (annual)</span>
                  <strong>{formatCurrency(totalAnnualWcSelling)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp Cost (annual)</span>
                  <strong>{formatCurrency(totalAnnualWcCost)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Workers&apos; Comp Profit</span>
                  <strong>{formatCurrency(wcProfitAnnual)}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #3d4b5e', marginTop: '6px', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Benefits</span>
                  <strong>
                    {[
                      form.services.health && 'Health',
                      form.services.retirement401k && '401(k)',
                      form.services.supplemental && 'Supplemental',
                      form.services.otherCompanyPaid && 'Other Company Paid Benefits',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 10px', background: '#111827', borderRadius: '6px' }}>
                  <span>Service Add-Ons</span>
                  <strong>
                    {addOnServices
                      .map((s) => form.additionalServices[s.id as keyof typeof form.additionalServices] && s.label)
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid #3d4b5e',
                background: '#273142',
                color: 'white',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSendForApproval}
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: 'none',
                background: isSubmitting ? '#6B7280' : '#10B981',
                color: 'white',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? 'Sending...' : '✓ Send for Approval'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
