"use client";

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  Gf1AddonPricingModel,
  Gf1BillingModel,
  Gf1FeeBasis,
  Gf1PayFrequency,
  Gf1ProposalAddon,
  Gf1ProposalRecord,
} from '@/lib/gf1/types';
import { calculatePricing, MIN_BASE_PRICE_PER_EMPLOYEE, normalizeBasePrice } from '@/lib/gf1/pricing';
import ServiceSelectionChecklist, { type ServiceSelections } from './ServiceSelectionChecklist';
import styles from './ProposalPricingEditor.module.css';

export type ProposalPricingForm = {
  basePricePerEmployeePerYear: number;
  minimumPricePerEmployeePerYear: number;
  payFrequency: Gf1PayFrequency;
  modeledEmployeeCount: number;
  billingModel: Gf1BillingModel;
  percentOfGross: number | null;
  flatAdminFeePerEmployeePerPeriod: number | null;
  notesForInternal: string;
  notesForProspect: string;
  services: ServiceSelections;
  wcCost: number | null;
  wcSellingPrice: number | null;
  adminFeeEnabled: boolean;
  adminFeeRate: number | null;
  adminFeeBasis: Gf1FeeBasis;
  timekeepingFeeEnabled: boolean;
  timekeepingFeeRate: number | null;
  timekeepingFeeBasis: Gf1FeeBasis;
  addons: ProposalPricingAddon[];
};

type Props = {
  proposal: Partial<Gf1ProposalRecord>;
  defaultPayFrequency: Gf1PayFrequency;
  defaultHeadcount: number;
  onSave: (values: ProposalPricingForm) => Promise<void>;
  onSubmitForApproval?: (values: ProposalPricingForm) => Promise<void>;
  saving?: boolean;
  variant?: 'default' | 'gf1';
};

export type ProposalPricingAddon = {
  id: string;
  label: string;
  enabled: boolean;
  pricingModel: Gf1AddonPricingModel;
  amount: number;
};

const DEFAULT_ADDONS: ProposalPricingAddon[] = [
  {
    id: 'drug_testing',
    label: 'Drug Testing',
    enabled: false,
    pricingModel: 'per_employee_per_check',
    amount: 0,
  },
  {
    id: 'background_checks',
    label: 'Background Checks',
    enabled: false,
    pricingModel: 'per_employee_per_check',
    amount: 0,
  },
  {
    id: 'learning_management_system',
    label: 'Learning Management System',
    enabled: false,
    pricingModel: 'per_employee_per_month',
    amount: 0,
  },
];

const CHECKS_PER_MONTH: Record<Gf1PayFrequency, number> = {
  weekly: 4.333,
  biweekly: 2.167,
  semimonthly: 2,
  monthly: 1,
  other: 1,
};

const centsToDollars = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value / 100 : null;

function normalizeAddons(addons: Gf1ProposalAddon[] | null | undefined): ProposalPricingAddon[] {
  const catalog = DEFAULT_ADDONS.map((addon) => ({ ...addon }));
  if (!Array.isArray(addons)) return catalog;
  const map = new Map<string, ProposalPricingAddon>();
  catalog.forEach((addon) => map.set(addon.id, addon));
  addons.forEach((addon) => {
    if (!addon?.id) return;
    const existing = map.get(addon.id);
    map.set(addon.id, {
      id: addon.id,
      label: addon.label ?? existing?.label ?? addon.id,
      enabled: Boolean(addon.enabled),
      pricingModel: (addon.pricing_model ?? existing?.pricingModel ?? 'flat_monthly') as Gf1AddonPricingModel,
      amount: typeof addon.amount_cents === 'number' ? addon.amount_cents / 100 : existing?.amount ?? 0,
    });
  });
  return Array.from(map.values());
}

function estimateAddonMonthly(
  addon: ProposalPricingAddon,
  employeeCount: number,
  checksPerMonth: number
) {
  if (!addon.enabled || !addon.amount) return 0;
  switch (addon.pricingModel) {
    case 'flat_monthly':
      return addon.amount;
    case 'per_employee_per_month':
      return addon.amount * employeeCount;
    case 'per_employee_per_check':
      return addon.amount * employeeCount * checksPerMonth;
    default:
      return 0;
  }
}

const INPUT =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-neutral-100 disabled:text-neutral-500';

export default function ProposalPricingEditor({
  proposal,
  defaultPayFrequency,
  defaultHeadcount,
  onSave,
  onSubmitForApproval,
  saving,
  variant = 'default',
}: Props) {
  const [wcClientPreview, setWcClientPreview] = useState(false);
  const form = useForm<ProposalPricingForm>({
    defaultValues: {
      basePricePerEmployeePerYear: normalizeBasePrice(proposal.base_price_per_employee_per_year ?? MIN_BASE_PRICE_PER_EMPLOYEE),
      minimumPricePerEmployeePerYear: proposal.minimum_price_per_employee_per_year ?? MIN_BASE_PRICE_PER_EMPLOYEE,
      payFrequency: (proposal.billing_model ? defaultPayFrequency : defaultPayFrequency) as Gf1PayFrequency,
      modeledEmployeeCount: proposal.modeled_employee_count ?? defaultHeadcount ?? 0,
      billingModel: (proposal.billing_model ?? 'flat_per_employee') as Gf1BillingModel,
      percentOfGross: proposal.percent_of_gross ?? null,
      flatAdminFeePerEmployeePerPeriod: proposal.flat_admin_fee_per_employee_per_period ?? null,
      notesForInternal: proposal.notes_for_internal ?? '',
      notesForProspect: proposal.notes_for_prospect ?? '',
      services: (proposal.services_json as ServiceSelections) ?? {},
      wcCost: centsToDollars((proposal as any).wc_cost_cents ?? null),
      wcSellingPrice: centsToDollars((proposal as any).wc_selling_price_cents ?? null),
      adminFeeEnabled: Boolean((proposal as any).admin_fee_enabled ?? false),
      adminFeeRate: centsToDollars((proposal as any).admin_fee_rate_cents ?? null),
      adminFeeBasis: ((proposal as any).admin_fee_basis ?? 'PEPM') as Gf1FeeBasis,
      timekeepingFeeEnabled: Boolean((proposal as any).timekeeping_fee_enabled ?? false),
      timekeepingFeeRate: centsToDollars((proposal as any).timekeeping_fee_rate_cents ?? null),
      timekeepingFeeBasis: ((proposal as any).timekeeping_fee_basis ?? 'PEPM') as Gf1FeeBasis,
      addons: normalizeAddons((proposal as any).addons_json ?? null),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchValues = form.watch();
  const pricing = useMemo(
    () =>
      calculatePricing({
        headcount: watchValues.modeledEmployeeCount || 0,
        payFrequency: watchValues.payFrequency,
        basePricePerEmployeePerYear: normalizeBasePrice(watchValues.basePricePerEmployeePerYear),
        billingModel: watchValues.billingModel,
      }),
    [
      watchValues.basePricePerEmployeePerYear,
      watchValues.billingModel,
      watchValues.modeledEmployeeCount,
      watchValues.payFrequency,
    ]
  );

  async function handleSave(values: ProposalPricingForm, nextStatus?: 'pending_approval') {
    const payload = {
      ...values,
      basePricePerEmployeePerYear: normalizeBasePrice(values.basePricePerEmployeePerYear),
    };
    if (nextStatus === 'pending_approval' && onSubmitForApproval) {
      await onSubmitForApproval(payload);
    } else {
      await onSave(payload);
    }
  }

  const useGf1 = variant === 'gf1';
  const formClass = useGf1 ? styles.gf1Form : 'space-y-6';
  const cardClass = useGf1 ? styles.gf1Card : 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm';
  const labelClass = useGf1 ? styles.gf1Label : 'text-sm font-medium text-neutral-800';
  const inputClass = useGf1 ? styles.gf1Input : INPUT;
  const badgeClass = useGf1 ? styles.gf1Metric : 'rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700';
  const sectionTitle = useGf1 ? styles.gf1SectionTitle : 'text-lg font-semibold text-neutral-900';
  const helperText = useGf1 ? styles.gf1Helper : 'text-xs text-neutral-500';
  const buttonRow = useGf1 ? styles.gf1ButtonRow : 'flex flex-wrap items-center gap-3';
  const saveButtonClass = useGf1
    ? styles.gf1PrimaryButton
    : 'rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
  const submitButtonClass = useGf1
    ? styles.gf1SecondaryButton
    : 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
  const servicesWrapper = useGf1 ? styles.gf1Services : 'mt-4';
  const checksPerMonth = CHECKS_PER_MONTH[watchValues.payFrequency] ?? 1;
  const addonMonthlyTotal = (watchValues.addons ?? []).reduce(
    (sum, addon) => sum + estimateAddonMonthly(addon, watchValues.modeledEmployeeCount || 0, checksPerMonth),
    0,
  );

  return (
    <form className={formClass} onSubmit={form.handleSubmit((values) => handleSave(values))}>
      <section className={cardClass}>
        <div className={useGf1 ? styles.gf1CardHeader : 'flex items-center justify-between'}>
          <div>
            <p className={useGf1 ? styles.gf1Eyebrow : 'text-xs font-semibold uppercase text-neutral-400'}>Pricing</p>
            <h2 className={sectionTitle}>Model the deal</h2>
            <p className={useGf1 ? styles.gf1Subtext : 'text-sm text-neutral-600'}>
              Adjust the base annual price (min ${MIN_BASE_PRICE_PER_EMPLOYEE}) to keep guardrails consistent.
            </p>
          </div>
          <div className={badgeClass}>Annual target: ${pricing.annualAdminTarget.toLocaleString()}</div>
        </div>

        <div className={useGf1 ? styles.gf1Grid : 'mt-4 grid gap-4 md:grid-cols-3'}>
          <div>
            <label className={labelClass}>Base price / EE / year</label>
            <input
              type="number"
              step="25"
              min={MIN_BASE_PRICE_PER_EMPLOYEE}
              className={inputClass}
              {...form.register('basePricePerEmployeePerYear', { valueAsNumber: true, min: MIN_BASE_PRICE_PER_EMPLOYEE })}
            />
          </div>
          <div>
            <label className={labelClass}>Modeled employee count</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              {...form.register('modeledEmployeeCount', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className={labelClass}>Pay frequency</label>
            <select className={inputClass} {...form.register('payFrequency')}>
              {['weekly', 'biweekly', 'semimonthly', 'monthly', 'other'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={useGf1 ? styles.gf1Grid : 'mt-4 grid gap-4 md:grid-cols-2'}>
          <div>
            <label className={labelClass}>Billing model</label>
            <select className={inputClass} {...form.register('billingModel')}>
              <option value="flat_per_employee">Flat per employee per pay period</option>
              <option value="percent_of_gross">% of gross wages</option>
            </select>
          </div>
          {watchValues.billingModel === 'percent_of_gross' ? (
            <div>
              <label className={labelClass}>Percent of gross (suggested shown)</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                {...form.register('percentOfGross', { valueAsNumber: true })}
              />
              <p className={helperText}>Suggested: {(pricing.percentOfGross ?? 0) * 100}%</p>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Flat admin fee / EE / period</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                {...form.register('flatAdminFeePerEmployeePerPeriod', { valueAsNumber: true })}
              />
              <p className={helperText}>
                Suggested: ${pricing.flatPerEmployeePerPeriod?.toLocaleString() ?? 0} per employee per period
              </p>
            </div>
          )}
        </div>

        <div className={useGf1 ? styles.gf1Grid : 'mt-6 grid gap-4 md:grid-cols-2'}>
          <div>
            <label className={labelClass}>Internal notes</label>
            <textarea rows={4} className={inputClass} {...form.register('notesForInternal')} />
          </div>
          <div>
            <label className={labelClass}>Prospect-facing notes</label>
            <textarea rows={4} className={inputClass} {...form.register('notesForProspect')} />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className={useGf1 ? styles.gf1CardHeader : 'flex items-center justify-between'}>
          <div>
            <p className={useGf1 ? styles.gf1Eyebrow : 'text-xs font-semibold uppercase text-neutral-400'}>Fees</p>
            <h3 className={sectionTitle}>Workers&apos; Compensation</h3>
            <p className={useGf1 ? styles.gf1Subtext : 'text-sm text-neutral-600'}>
              Internal cost stays hidden on client preview.
            </p>
          </div>
          <label className={useGf1 ? styles.gf1Helper : 'text-xs text-neutral-500'} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={wcClientPreview}
              onChange={(event) => setWcClientPreview(event.target.checked)}
            />
            Client preview
          </label>
        </div>
        <div className={useGf1 ? styles.gf1Grid : 'mt-4 grid gap-4 md:grid-cols-2'}>
          {!wcClientPreview && (
            <div>
              <label className={labelClass}>WC Cost (internal)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputClass}
                {...form.register('wcCost', { valueAsNumber: true })}
              />
            </div>
          )}
          <div>
            <label className={labelClass}>WC Selling Price (client-facing, annual)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
              {...form.register('wcSellingPrice', { valueAsNumber: true })}
            />
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className={useGf1 ? styles.gf1CardHeader : 'flex items-center justify-between'}>
          <div>
            <p className={useGf1 ? styles.gf1Eyebrow : 'text-xs font-semibold uppercase text-neutral-400'}>Fees</p>
            <h3 className={sectionTitle}>Admin &amp; Timekeeping Fees</h3>
            <p className={useGf1 ? styles.gf1Subtext : 'text-sm text-neutral-600'}>
              Basis is per employee per check (PEPC) or per employee per month (PEPM).
            </p>
          </div>
          <div className={badgeClass}>Checks/month: {checksPerMonth.toFixed(3)}</div>
        </div>
        <div className={useGf1 ? styles.gf1Grid : 'mt-4 grid gap-4 md:grid-cols-2'}>
          <div>
            <label className={labelClass}>Admin fee enabled</label>
            <label className={helperText} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="checkbox" {...form.register('adminFeeEnabled')} />
              Enable admin fee line item
            </label>
          </div>
          <div>
            <label className={labelClass}>Admin fee basis</label>
            <select className={inputClass} {...form.register('adminFeeBasis')} disabled={!watchValues.adminFeeEnabled}>
              <option value="PEPM">Per employee per month (PEPM)</option>
              <option value="PEPC">Per employee per check (PEPC)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Admin fee rate ($)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
              {...form.register('adminFeeRate', { valueAsNumber: true })}
              disabled={!watchValues.adminFeeEnabled}
            />
          </div>
          <div>
            <label className={labelClass}>Timekeeping fee enabled</label>
            <label className={helperText} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="checkbox" {...form.register('timekeepingFeeEnabled')} />
              Enable timekeeping fee line item
            </label>
          </div>
          <div>
            <label className={labelClass}>Timekeeping fee basis</label>
            <select className={inputClass} {...form.register('timekeepingFeeBasis')} disabled={!watchValues.timekeepingFeeEnabled}>
              <option value="PEPM">Per employee per month (PEPM)</option>
              <option value="PEPC">Per employee per check (PEPC)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Timekeeping fee rate ($)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
              {...form.register('timekeepingFeeRate', { valueAsNumber: true })}
              disabled={!watchValues.timekeepingFeeEnabled}
            />
          </div>
        </div>
        <p className={helperText}>
          Monthly totals use modeled employee count and pay frequency ({watchValues.payFrequency}).
        </p>
      </section>

      <section className={cardClass}>
        <div className={useGf1 ? styles.gf1CardHeader : 'flex items-center justify-between'}>
          <div>
            <p className={useGf1 ? styles.gf1Eyebrow : 'text-xs font-semibold uppercase text-neutral-400'}>Add-ons</p>
            <h3 className={sectionTitle}>Optional service add-ons</h3>
            <p className={useGf1 ? styles.gf1Subtext : 'text-sm text-neutral-600'}>
              Enable and price add-ons to include in the client proposal.
            </p>
          </div>
          <div className={badgeClass}>Monthly add-ons: ${addonMonthlyTotal.toFixed(2)}</div>
        </div>
        <div className={useGf1 ? styles.gf1Grid : 'mt-4 grid gap-4 md:grid-cols-2'}>
          {(watchValues.addons ?? []).map((addon, index) => (
            <div key={addon.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={labelClass} style={{ marginBottom: 0 }}>{addon.label}</label>
                <input
                  type="checkbox"
                  checked={addon.enabled}
                  onChange={(event) => {
                    const next = [...(watchValues.addons ?? [])];
                    next[index] = { ...addon, enabled: event.target.checked };
                    form.setValue('addons', next, { shouldDirty: true });
                  }}
                />
              </div>
              <select
                className={inputClass}
                value={addon.pricingModel}
                onChange={(event) => {
                  const next = [...(watchValues.addons ?? [])];
                  next[index] = { ...addon, pricingModel: event.target.value as Gf1AddonPricingModel };
                  form.setValue('addons', next, { shouldDirty: true });
                }}
                disabled={!addon.enabled}
              >
                <option value="flat_monthly">Flat monthly</option>
                <option value="per_employee_per_month">Per employee per month</option>
                <option value="per_employee_per_check">Per employee per check</option>
              </select>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputClass}
                value={addon.amount ?? 0}
                onChange={(event) => {
                  const next = [...(watchValues.addons ?? [])];
                  next[index] = { ...addon, amount: event.target.value ? parseFloat(event.target.value) : 0 };
                  form.setValue('addons', next, { shouldDirty: true });
                }}
                disabled={!addon.enabled}
              />
              <p className={helperText}>
                Est. monthly: ${estimateAddonMonthly(addon, watchValues.modeledEmployeeCount || 0, checksPerMonth).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <div className={useGf1 ? styles.gf1CardHeader : 'flex items-center justify-between'}>
          <div>
            <p className={useGf1 ? styles.gf1Eyebrow : 'text-xs font-semibold uppercase text-neutral-400'}>Services</p>
            <h3 className={sectionTitle}>Include in proposal</h3>
          </div>
        </div>
        <div className={servicesWrapper}>
          <ServiceSelectionChecklist
            value={watchValues.services ?? {}}
            onChange={(next) => form.setValue('services', next, { shouldDirty: true })}
            variant={variant}
          />
        </div>
      </section>

      <div className={buttonRow}>
        <button type="submit" disabled={saving} className={saveButtonClass}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        {onSubmitForApproval && (
          <button
            type="button"
            disabled={saving}
            onClick={form.handleSubmit((values) => handleSave(values, 'pending_approval'))}
            className={submitButtonClass}
          >
            {saving ? 'Submitting…' : 'Submit for approval'}
          </button>
        )}
        {!useGf1 && (
          <span className="text-sm text-neutral-500">
            Annual target recalculates live based on headcount and base price. Adjust defaults in `lib/gf1/pricing.ts`.
          </span>
        )}
        {useGf1 && (
          <p className={styles.gf1Footnote}>
            Annual target updates instantly based on the fields above.
          </p>
        )}
      </div>
    </form>
  );
}
