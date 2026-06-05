'use client';

import { useState, useEffect } from 'react';
import { US_STATES, WC_RATES, getSUTARate, calculateEstimatedWCPremium, calculateEstimatedSUTA } from '@/lib/gf1/rates';
import ProposalGeneratorStyles from './ProposalGenerator.module.css';

export type Prospect = {
  id: string;
  name: string;
  organization_id?: string | null;
  organization_name: string;
  email: string | null;
  employee_count?: number | string | null;
  total_employees?: number | null;
};

export interface ProposalGeneratorClientProps {
  prospects: Prospect[];
  organizationId?: string;
}

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
  const display = option.display_name?.trim();
  if (display) return display;
  const preferred = option.name?.trim();
  if (preferred) return preferred;
  const first = option.first_name?.trim() ?? '';
  const last = option.last_name?.trim() ?? '';
  if (first || last) return `${first} ${last}`.trim();
  const fullName = option.full_name?.trim();
  if (fullName) return fullName;
  if (option.email) return option.email;
  return 'Admin reviewer';
}

export interface FormData {
  prospectId: string;
  companyName: string;
  employeeCount: number;
  state: string;
  sutaRateOverride: number | null;
  wcRateClass: string;
  wcModFactor: number;
  adminFeePerEmployee: number;
  services: {
    health: boolean;
    retirement401k: boolean;
    supplemental: boolean;
  };
  managerId: string;
  managerEmail: string;
  managerName: string;
  customTagline: string;
}

const INITIAL_FORM: FormData = {
  prospectId: '',
  companyName: '',
  employeeCount: 0,
  state: 'CA',
  sutaRateOverride: null,
  wcRateClass: 'office',
  wcModFactor: 1.0,
  adminFeePerEmployee: 15,
  services: {
    health: true,
    retirement401k: true,
    supplemental: false,
  },
  managerId: '',
  managerEmail: '',
  managerName: '',
  customTagline: '',
};

export function ProposalGeneratorClient({ prospects }: ProposalGeneratorClientProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [admins, setAdmins] = useState<AdminOption[]>([]);

  const sutaRate = form.sutaRateOverride ?? getSUTARate(form.state as any);
  const wcRates = WC_RATES[form.wcRateClass as keyof typeof WC_RATES] || WC_RATES.other;

  const estimatedMonthlyAdminCost = form.adminFeePerEmployee * form.employeeCount;
  const annualPayroll = form.employeeCount * 50000;
  const estimatedSUTA = calculateEstimatedSUTA(annualPayroll, form.state as any, form.employeeCount);
  const estimatedWCPremium = calculateEstimatedWCPremium(annualPayroll, form.wcRateClass as any, form.wcModFactor);

  const selectedProspect = prospects.find((p) => p.id === form.prospectId);

  useEffect(() => {
    if (!selectedProspect) return;

    const employeeCountFromProspect = selectedProspect.total_employees ?? selectedProspect.employee_count ?? null;
    const normalizedEmployeeCount =
      typeof employeeCountFromProspect === 'string'
        ? Number.parseInt(employeeCountFromProspect, 10)
        : employeeCountFromProspect;

    const companyNameFromProspect = selectedProspect.organization_name || selectedProspect.name || '';

    setForm((prev) => {
      const next = {
        ...prev,
        companyName: prev.companyName || companyNameFromProspect,
        employeeCount: Number.isFinite(normalizedEmployeeCount ?? NaN) ? (normalizedEmployeeCount as number) : prev.employeeCount,
      };
      if (
        next.companyName === prev.companyName &&
        next.employeeCount === prev.employeeCount
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedProspect]);

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setForm((prev) => {
      if (field === 'state') {
        return {
          ...prev,
          state: value,
          sutaRateOverride: null,
        };
      }
      return { ...prev, [field]: value };
    });
    setError(null);
  };

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
    if (!form.state) {
      setError('State is required');
      return false;
    }
    if (form.adminFeePerEmployee < 0) {
      setError('Admin fee cannot be negative');
      return false;
    }
    if (!form.services.health && !form.services.retirement401k && !form.services.supplemental) {
      setError('Please select at least one service');
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
      const response = await fetch('/api/gf1/proposals/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: form.prospectId,
          organizationId: selectedProspect?.organization_id ?? selectedProspect?.id ?? selectedProspect?.organization_name,
          prospectName: selectedProspect?.name || 'Unknown',
          companyName: form.companyName,
          employeeCount: form.employeeCount,
          state: form.state,
          sutaRate,
          wcRateClass: form.wcRateClass,
          wcModFactor: form.wcModFactor,
          adminFeePerEmployee: form.adminFeePerEmployee,
          estimatedMonthlyAdminCost,
          estimatedSUTA,
          estimatedWCPremium,
          services: form.services,
          customTagline: form.customTagline,
          managerId: form.managerId,
          managerEmail: form.managerEmail,
          managerName: form.managerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send proposal for approval');
      }

      setSuccess(true);
      setSuccessMessage(`Proposal sent to manager for approval!`);
      setForm(INITIAL_FORM);
      setStep(1);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send proposal for approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/gf1/admin-users');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setAdmins(Array.isArray(data) ? data : []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(Math.max(1, step - 1));
  };

  return (
    <div className={ProposalGeneratorStyles.container}>
      {/* Success Toast */}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className={ProposalGeneratorStyles.progressBar}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`${ProposalGeneratorStyles.progressStep} ${step >= s ? ProposalGeneratorStyles.active : ''}`}>
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Prospect & Company */}
      {step === 1 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 className="text-2xl font-bold text-neutral-900">Prospect & Company Information</h2>
          <p className={ProposalGeneratorStyles.subtitle}>Select a prospect and enter company details</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prospect-select" className="block text-sm font-semibold text-neutral-700">
                Prospect *
              </label>
              <select
                id="prospect-select"
                value={form.prospectId}
                onChange={(e) => handleFieldChange('prospectId', e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100"
                disabled={!prospects || prospects.length === 0}
                aria-label="Select a prospect organization"
              >
                <option value="">
                  {prospects && prospects.length > 0 ? '-- Choose a prospect --' : 'No prospects available'}
                </option>
                {prospects && prospects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {prospects && prospects.length > 0 && (
                <p className="text-xs text-neutral-500">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''} available</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="company-name" className="block text-sm font-semibold text-neutral-700">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                value={form.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="Enter company legal name"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="employee-count" className="block text-sm font-semibold text-neutral-700">
                  Employee Count *
                </label>
                <input
                  id="employee-count"
                  type="number"
                  value={form.employeeCount}
                  onChange={(e) => handleFieldChange('employeeCount', parseInt(e.target.value))}
                  min="1"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pricing */}
      {step === 2 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 className="text-2xl font-bold text-neutral-900">Pricing & Tax Configuration</h2>
          <p className={ProposalGeneratorStyles.subtitle}>Set up SUTA, workers' compensation, and admin fees</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="state-select" className="block text-sm font-semibold text-neutral-700">
                  State *
                </label>
                <select
                  id="state-select"
                  value={form.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {US_STATES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="suta-rate" className="block text-sm font-semibold text-neutral-700">
                  SUTA Rate % (Auto: {sutaRate.toFixed(2)}%)
                </label>
                <input
                  id="suta-rate"
                  type="number"
                  value={form.sutaRateOverride ?? sutaRate}
                  onChange={(e) => handleFieldChange('sutaRateOverride', e.target.value ? parseFloat(e.target.value) : null)}
                  step="0.01"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="wc-class" className="block text-sm font-semibold text-neutral-700">
                  Workers' Comp Class *
                </label>
                <select
                  id="wc-class"
                  value={form.wcRateClass}
                  onChange={(e) => handleFieldChange('wcRateClass', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {Object.entries(WC_RATES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} (~{val.typical.toFixed(2)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="wc-mod" className="block text-sm font-semibold text-neutral-700">
                  WC Modification Factor
                </label>
                <input
                  id="wc-mod"
                  type="number"
                  value={form.wcModFactor}
                  onChange={(e) => handleFieldChange('wcModFactor', parseFloat(e.target.value))}
                  step="0.01"
                  min="0.5"
                  max="2.0"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-fee" className="block text-sm font-semibold text-neutral-700">
                Admin Fee Per Employee *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-neutral-500">$</span>
                <input
                  id="admin-fee"
                  type="number"
                  value={form.adminFeePerEmployee}
                  onChange={(e) => handleFieldChange('adminFeePerEmployee', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-neutral-300 bg-white pl-7 pr-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <p className="text-xs text-neutral-500">
                Estimated Monthly: ${estimatedMonthlyAdminCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">Cost Summary</h3>
              <div className="mt-3 space-y-2 text-sm text-blue-800">
                <p>Monthly Admin Cost: <span className="font-semibold">${estimatedMonthlyAdminCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                <p>Annual SUTA: <span className="font-semibold">${estimatedSUTA.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                <p>Annual WC Premium: <span className="font-semibold">${estimatedWCPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrev}
              className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Services */}
      {step === 3 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 className="text-2xl font-bold text-neutral-900">Benefits Selection</h2>
          <p className={ProposalGeneratorStyles.subtitle}>Choose the services to include in this proposal</p>

          <div className="space-y-3">
            {[
              { id: 'health', label: 'Health Insurance', description: 'Medical, dental, and vision coverage' },
              { id: 'retirement401k', label: '401(k) Retirement Plan', description: 'Employer-sponsored retirement savings' },
              { id: 'supplemental', label: 'Supplemental Benefits', description: 'Life, disability, and accident insurance' },
            ].map((service) => (
              <label key={service.id} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.services[service.id as keyof typeof form.services]}
                  onChange={(e) => handleFieldChange('services', {
                    ...form.services,
                    [service.id]: e.target.checked,
                  })}
                  className="mt-1 h-4 w-4 rounded border-neutral-300"
                />
                <div>
                  <p className="font-semibold text-neutral-900">{service.label}</p>
                  <p className="text-xs text-neutral-600">{service.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrev}
              className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Manager Email & Review */}
      {step === 4 && (
        <div className={ProposalGeneratorStyles.formStep}>
          <h2 className="text-2xl font-bold text-neutral-900">Manager Approval</h2>
          <p className={ProposalGeneratorStyles.subtitle}>Send this proposal to your manager for approval</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="manager-select" className="block text-sm font-semibold text-neutral-700">
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
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Select an admin approver --</option>
                {admins.map((a) => (
                  <option key={a.user_id} value={a.user_id}>
                    {formatAdminName(a)}
                  </option>
                ))}
              </select>
              {admins.length === 0 && (
                <p className="text-xs text-neutral-500">No admin users found. Contact an administrator to set approvers.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="tagline" className="block text-sm font-semibold text-neutral-700">
                Custom Tagline (optional)
              </label>
              <textarea
                id="tagline"
                value={form.customTagline}
                onChange={(e) => handleFieldChange('customTagline', e.target.value)}
                placeholder="Add a personalized message for the prospect..."
                rows={3}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Proposal Summary */}
            <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-3">Proposal Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-600">Prospect</p>
                  <p className="font-semibold text-neutral-900">{selectedProspect?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-neutral-600">Company</p>
                  <p className="font-semibold text-neutral-900">{form.companyName}</p>
                </div>
                <div>
                  <p className="text-neutral-600">Employees</p>
                  <p className="font-semibold text-neutral-900">{form.employeeCount}</p>
                </div>
                <div>
                  <p className="text-neutral-600">Monthly Admin</p>
                  <p className="font-semibold text-neutral-900">${estimatedMonthlyAdminCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-neutral-600">Services</p>
                  <p className="font-semibold text-neutral-900">
                    {[
                      form.services.health && 'Health',
                      form.services.retirement401k && '401(k)',
                      form.services.supplemental && 'Supplemental',
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <button
              onClick={handlePrev}
              className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              ← Back
            </button>
            <button
              onClick={handleSendForApproval}
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Sending...
                </>
              ) : (
                '✓ Send for Approval'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
