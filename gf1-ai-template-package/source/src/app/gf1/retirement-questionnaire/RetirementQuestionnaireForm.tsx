'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';
import ProposalGeneratorStyles from '../../(protected)/gf1/proposals/_components/ProposalGenerator.module.css';

type YesNo = boolean | null;
type Vesting = 'immediate' | '5-year' | '6-year' | '3-year' | null;
type Entry = 'month' | 'quarter' | null;

type Officer = { name: string; title: string; percent: string };

type FormState = {
  companyName: string;
  prospectName: string;

  interestedInJoining: YesNo;
  estimatedDateOfAdoption: string;
  offersRetirementPlan: YesNo;
  planType: string;
  existingPlanTrustee: string;
  planNumber: string;
  planAssets: string;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
  datePlanEstablished: string;

  fiscalYearEnd: string;
  officers: Officer[];

  serviceRequirement: string;
  ageRequirement: string;
  grandfatheredEligibilityDate: string;
  entryDate: Entry;

  matchDetails: string;
  vesting: Vesting;
  threeYearVestingYear1: string;
  threeYearVestingYear2: string;
};

const baseInitialState: FormState = {
  companyName: '',
  prospectName: '',
  interestedInJoining: null,
  estimatedDateOfAdoption: '',
  offersRetirementPlan: null,
  planType: '',
  existingPlanTrustee: '',
  planNumber: '',
  planAssets: '',
  providerName: '',
  providerPhone: '',
  providerEmail: '',
  datePlanEstablished: '',
  fiscalYearEnd: '',
  officers: [
    { name: '', title: '', percent: '' },
    { name: '', title: '', percent: '' },
    { name: '', title: '', percent: '' },
  ],
  serviceRequirement: '',
  ageRequirement: '',
  grandfatheredEligibilityDate: '',
  entryDate: null,
  matchDetails: '',
  vesting: null,
  threeYearVestingYear1: '',
  threeYearVestingYear2: '',
};

const STEP_LABELS = [
  'Current Plan',
  'Company Information',
  'Eligibility & Participation',
  'Employer Contributions',
];
const TOTAL_STEPS = STEP_LABELS.length;

const FORM_BACKGROUND = '#1b2438';
const CARD_BACKGROUND = FORM_BACKGROUND;

const DARK_INPUT_STYLE: CSSProperties = {
  background: CARD_BACKGROUND,
  borderColor: '#2f3d57',
  color: '#f5f8ff',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
};

const DARK_SELECT_STYLE: CSSProperties = {
  backgroundColor: CARD_BACKGROUND,
  borderColor: '#2f3d57',
  color: '#f5f8ff',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
};

type Props = {
  orgId?: string | null;
  initialCompanyName?: string;
  initialProspectName?: string;
  initialInterestedInJoining?: YesNo;
  initialOffersRetirementPlan?: YesNo;
  alreadySubmitted?: boolean;
};

export default function RetirementQuestionnaireForm({
  orgId = null,
  initialCompanyName = '',
  initialProspectName = '',
  initialInterestedInJoining = null,
  initialOffersRetirementPlan = null,
  alreadySubmitted = false,
}: Props) {
  const [form, setForm] = useState<FormState>(() => ({
    ...baseInitialState,
    companyName: initialCompanyName,
    prospectName: initialProspectName,
    interestedInJoining: initialInterestedInJoining,
    offersRetirementPlan: initialOffersRetirementPlan,
  }));
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    alreadySubmitted ? 'success' : 'idle'
  );
  const [message, setMessage] = useState<string | null>(null);

  const storageKey = orgId ? `retirement-questionnaire-submitted:${orgId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === '1') {
        setStatus('success');
      }
    } catch {}
  }, [storageKey]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateOfficer = (index: number, field: keyof Officer, value: string) => {
    setForm((prev) => {
      const officers = prev.officers.slice();
      officers[index] = { ...officers[index], [field]: value };
      return { ...prev, officers };
    });
  };

  const goNext = () => {
    if (step === 1 && !form.companyName.trim()) {
      setStatus('error');
      setMessage('Company name is required before continuing.');
      return;
    }
    setStatus('idle');
    setMessage(null);
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStatus('idle');
    setMessage(null);
    setStep((prev) => Math.max(prev - 1, 1));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSubmit() {
    if (!form.companyName.trim()) {
      setStatus('error');
      setMessage('Company name is required.');
      return;
    }
    setStatus('submitting');
    setMessage(null);
    try {
      const res = await fetch('/api/gf1/proposals/retirement-questionnaire-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, orgId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Submission failed.');
      }
      setStatus('success');
      setMessage('Thanks! We received your questionnaire. Our team will follow up with next steps.');
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, '1');
        } catch {}
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('submitted', '1');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Submission failed.');
    }
  }

  return (
    <div className={ProposalGeneratorStyles.container} style={{ maxWidth: '1200px', minWidth: '1080px' }}>
      <div
        style={{
          background: FORM_BACKGROUND,
          borderRadius: '18px',
          padding: '32px 72px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/7f657327-251a-46bb-a2a6-31b6e7d2e7db/Logo.png"
            alt="Galactic 365"
            style={{ height: '120px', objectFit: 'contain' }}
          />
        </div>

        {status === 'error' && message && (
          <div className={ProposalGeneratorStyles.error}>{message}</div>
        )}

        {status === 'success' ? (
          <div
            style={{
              padding: '0 24px 24px',
              textAlign: 'center',
              color: '#f5f8ff',
            }}
          >
            <h2 style={{ fontSize: '36px', margin: '0 0 12px', color: '#f5f8ff' }}>
              Thanks for submitting!
            </h2>
            <p
              style={{
                margin: '0 auto',
                maxWidth: '520px',
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(234, 255, 245, 0.78)',
              }}
            >
              Our team will be in contact if any additional information is needed. You can safely
              close this window.
            </p>
          </div>
        ) : (
        <>
        <div
          className={ProposalGeneratorStyles.progressBar}
          style={{
            ['--progress-fill' as string]: `${(step - 1) / (TOTAL_STEPS - 1)}`,
          } as CSSProperties}
        >
          {STEP_LABELS.map((_, idx) => (
            <div
              key={idx}
              className={`${ProposalGeneratorStyles.progressStep} ${
                step >= idx + 1 ? ProposalGeneratorStyles.active : ''
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Step 1: Current Plan */}
        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 1}>
          <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Current Plan</h2>
          <p className={ProposalGeneratorStyles.subtitle}>
            Tell us about your existing retirement plan (if any).
          </p>

          <div className={ProposalGeneratorStyles.row}>
            <Field
              name="companyName"
              label="Company name"
              required
              value={form.companyName}
              onChange={(v) => update('companyName', v)}
            />
            <Field
              name="prospectName"
              label="Your name"
              value={form.prospectName}
              onChange={(v) => update('prospectName', v)}
            />
          </div>

          <div className={ProposalGeneratorStyles.row}>
            <YesNoField
              label="Are you interested in joining Galactic's Retirement Plan?"
              value={form.interestedInJoining}
              onChange={(v) => update('interestedInJoining', v)}
            />
            <Field
              name="estimatedDateOfAdoption"
              label="If so, estimated date of adoption"
              value={form.estimatedDateOfAdoption}
              onChange={(v) => update('estimatedDateOfAdoption', v)}
            />
          </div>

          <div className={ProposalGeneratorStyles.row}>
            <YesNoField
              label="Do you currently offer a Retirement Plan?"
              value={form.offersRetirementPlan}
              onChange={(v) => update('offersRetirementPlan', v)}
            />
            <Field
              name="planType"
              label="If so, what type of plan? (401k, 403b, IRA...)"
              value={form.planType}
              onChange={(v) => update('planType', v)}
            />
          </div>

          <div className={ProposalGeneratorStyles.row}>
            <Field
              name="existingPlanTrustee"
              label="Existing plan trustee"
              value={form.existingPlanTrustee}
              onChange={(v) => update('existingPlanTrustee', v)}
            />
            <Field
              name="planNumber"
              label="Plan number"
              value={form.planNumber}
              onChange={(v) => update('planNumber', v)}
            />
          </div>

          <Field
            name="planAssets"
            label="Current plan assets"
            value={form.planAssets}
            onChange={(v) => update('planAssets', v)}
          />

          <div className={ProposalGeneratorStyles.row}>
            <Field
              name="providerName"
              label="Provider contact name"
              value={form.providerName}
              onChange={(v) => update('providerName', v)}
            />
            <Field
              name="providerPhone"
              label="Provider contact phone"
              value={form.providerPhone}
              onChange={(v) => update('providerPhone', v)}
            />
          </div>

          <div className={ProposalGeneratorStyles.row}>
            <Field
              name="providerEmail"
              label="Provider contact email"
              type="email"
              value={form.providerEmail}
              onChange={(v) => update('providerEmail', v)}
            />
            <Field
              name="datePlanEstablished"
              label="Date plan was established"
              value={form.datePlanEstablished}
              onChange={(v) => update('datePlanEstablished', v)}
            />
          </div>

          <div className={ProposalGeneratorStyles.formActions}>
            <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
              Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
            </button>
          </div>
        </div>

        {/* Step 2: Company Information */}
        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 2}>
          <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Company Information</h2>
          <p className={ProposalGeneratorStyles.subtitle}>
            Helps us identify principal owners and the plan year.
          </p>

          <Field
            name="fiscalYearEnd"
            label="Fiscal year end"
            type="date"
            value={form.fiscalYearEnd}
            onChange={(v) => update('fiscalYearEnd', v)}
          />

          <div className={ProposalGeneratorStyles.formGroup}>
            <label style={{ color: '#f5f8ff' }}>Principal corporate officers</label>
            <div style={{ display: 'grid', gap: '12px' }}>
              {form.officers.map((officer, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.4fr 80px',
                    gap: '12px',
                  }}
                >
                  <input
                    placeholder={`Name ${i + 1}`}
                    value={officer.name}
                    onChange={(e) => updateOfficer(i, 'name', e.target.value)}
                    className={ProposalGeneratorStyles.input}
                    style={DARK_INPUT_STYLE}
                  />
                  <input
                    placeholder="Title"
                    value={officer.title}
                    onChange={(e) => updateOfficer(i, 'title', e.target.value)}
                    className={ProposalGeneratorStyles.input}
                    style={DARK_INPUT_STYLE}
                  />
                  <input
                    placeholder="%"
                    value={officer.percent}
                    onChange={(e) => updateOfficer(i, 'percent', e.target.value)}
                    className={ProposalGeneratorStyles.input}
                    style={DARK_INPUT_STYLE}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={ProposalGeneratorStyles.formActions}>
            <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
              ← Back
            </button>
            <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
              Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
            </button>
          </div>
        </div>

        {/* Step 3: Eligibility & Participation */}
        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 3}>
          <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Eligibility & Participation</h2>
          <p className={ProposalGeneratorStyles.subtitle}>
            When and how do employees qualify to participate?
          </p>

          <Field
            name="serviceRequirement"
            label="Service requirement (typically 12 consecutive months or at least 500 hours)"
            value={form.serviceRequirement}
            onChange={(v) => update('serviceRequirement', v)}
          />
          <Field
            name="ageRequirement"
            label="Age requirement (typically 21, may not exceed age 21)"
            value={form.ageRequirement}
            onChange={(v) => update('ageRequirement', v)}
          />
          <Field
            name="grandfatheredEligibilityDate"
            label="Grandfathered eligibility (waive min. age and service for active employees as of this date)"
            value={form.grandfatheredEligibilityDate}
            onChange={(v) => update('grandfatheredEligibilityDate', v)}
          />

          <SelectField
            label="Entry date after meeting eligibility"
            value={form.entryDate ?? ''}
            onChange={(v) => update('entryDate', (v || null) as Entry)}
            options={[
              { value: '', label: 'Select...' },
              { value: 'month', label: '1st of Month (most common)' },
              { value: 'quarter', label: '1st of Quarter' },
            ]}
          />

          <div className={ProposalGeneratorStyles.formActions}>
            <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
              ← Back
            </button>
            <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
              Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
            </button>
          </div>
        </div>

        {/* Step 4: Employer Contributions */}
        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 4}>
          <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Employer Contributions</h2>
          <p className={ProposalGeneratorStyles.subtitle}>
            Match formula and vesting schedule for matching and non-matching contributions.
          </p>

          <Field
            name="matchDetails"
            label="Match details"
            textarea
            value={form.matchDetails}
            onChange={(v) => update('matchDetails', v)}
          />
          <p
            style={{
              color: 'rgba(245, 248, 255, 0.55)',
              fontSize: '12px',
              marginTop: '-12px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            Safe Harbor Match: 100% of participant&apos;s elective contributions for each payroll period that do not
            exceed 3% of compensation, plus 50% of contributions that do not exceed 5% of compensation. Enhanced Safe
            Harbor: 100% of contributions that do not exceed 4% of compensation.
          </p>

          <SelectField
            label="Vesting for matching & non-matching contributions (6-year graded is most common)"
            value={form.vesting ?? ''}
            onChange={(v) => update('vesting', (v || null) as Vesting)}
            options={[
              { value: '', label: 'Select...' },
              { value: 'immediate', label: 'Immediate' },
              { value: '5-year', label: '5-year graded (20% first year)' },
              { value: '6-year', label: '6-year graded (0% first year, 20% per year thereafter)' },
              { value: '3-year', label: '3-year graded (complete blanks in ascending order)' },
            ]}
          />

          {form.vesting === '3-year' && (
            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="threeYearVestingYear1"
                label="Year 1 vested %"
                value={form.threeYearVestingYear1}
                onChange={(v) => update('threeYearVestingYear1', v)}
              />
              <Field
                name="threeYearVestingYear2"
                label="Year 2 vested %"
                value={form.threeYearVestingYear2}
                onChange={(v) => update('threeYearVestingYear2', v)}
              />
            </div>
          )}

          <div className={ProposalGeneratorStyles.formActions}>
            <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className={ProposalGeneratorStyles.primaryBtn}
            >
              {status === 'submitting' ? 'Sending...' : 'Submit Questionnaire'}
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  value?: string;
  onChange?: (next: string) => void;
  required?: boolean;
  type?: string;
  textarea?: boolean;
};

function Field({ name, label, value, onChange, required, type = 'text', textarea }: FieldProps) {
  const handleChange = onChange
    ? (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)
    : undefined;

  const commonProps = {
    id: name,
    name,
    required,
    className: ProposalGeneratorStyles.input,
    onChange: handleChange,
    value: value ?? '',
  };

  return (
    <div className={ProposalGeneratorStyles.formGroup}>
      <label htmlFor={name} style={{ color: '#f5f8ff' }}>
        {label}
      </label>
      {textarea ? (
        <textarea rows={4} {...commonProps} style={DARK_INPUT_STYLE} />
      ) : (
        <input
          type={type}
          {...commonProps}
          style={{
            ...DARK_INPUT_STYLE,
            ...(type === 'date' ? { colorScheme: 'dark' } : {}),
          }}
        />
      )}
    </div>
  );
}

type SelectOption = { value: string; label: string };

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
}) {
  return (
    <div className={ProposalGeneratorStyles.formGroup}>
      <label style={{ color: '#f5f8ff' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={ProposalGeneratorStyles.select}
        style={DARK_SELECT_STYLE}
      >
        {options.map((option) => (
          <option key={option.value || 'blank'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo;
  onChange: (next: YesNo) => void;
}) {
  const stringValue = value === true ? 'yes' : value === false ? 'no' : '';
  return (
    <SelectField
      label={label}
      value={stringValue}
      onChange={(next) =>
        onChange(next === 'yes' ? true : next === 'no' ? false : null)
      }
      options={[
        { value: '', label: 'Select...' },
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ]}
    />
  );
}
