"use client";

import styles from './ServiceSelectionChecklist.module.css';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export type ServiceSelections = Record<string, boolean>;

type Props = {
  value: ServiceSelections;
  onChange: (next: ServiceSelections) => void;
  variant?: 'default' | 'gf1';
};

export const SERVICE_OPTIONS: { id: string; title: string; blurb: string }[] = [
  { id: 'payroll', title: 'Payroll', blurb: 'Tax filings, direct deposit, deductions, gross-to-net.' },
  { id: 'hr_services', title: 'HR Services', blurb: 'Advice for managers, policies, investigations.' },
  { id: 'benefits_admin', title: 'Benefits Administration', blurb: 'Enrollments, deductions, carrier connections.' },
  { id: 'benefits_enrollment', title: 'Benefits Enrollment', blurb: 'Decision support and side-by-side plans.' },
  { id: 'onboarding', title: 'Electronic Onboarding', blurb: 'Paperless W-4/I-9, task lists, secure docs.' },
  { id: 'employee_portal', title: 'Employee Portal', blurb: 'Self-service, PTO, pay stubs, announcements.' },
  { id: 'timekeeping', title: 'Timekeeping', blurb: 'Intelligent clocks, geofencing, overtime rules.' },
  { id: 'reporting', title: 'Reporting', blurb: 'Templates plus ad hoc Data Retriever style reports.' },
  { id: 'retirement', title: '401k Plan', blurb: 'Galactic-sponsored plan with testing and filings.' },
];

export default function ServiceSelectionChecklist({ value, onChange, variant = 'default' }: Props) {
  function toggle(id: string) {
    onChange({ ...value, [id]: !value[id] });
  }

  const useGf1 = variant === 'gf1';
  const containerClass = useGf1 ? styles.gf1Grid : 'grid gap-3 md:grid-cols-2';
  const buttonBase = useGf1 ? styles.gf1Button : 'rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-200';
  const buttonActive = useGf1 ? styles.gf1ButtonActive : 'border-indigo-400 bg-indigo-50/60';
  const buttonInactive = useGf1 ? styles.gf1ButtonInactive : 'border-neutral-200 bg-white hover:border-neutral-300';
  const checkBase = useGf1
    ? styles.gf1Check
    : 'flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold';
  const checkActive = useGf1 ? styles.gf1CheckActive : 'border-indigo-500 bg-indigo-500 text-white';
  const checkInactive = useGf1 ? styles.gf1CheckInactive : 'border-neutral-300 text-transparent';
  const rowClass = useGf1 ? styles.gf1Row : 'flex items-center gap-3';
  const textStackClass = useGf1 ? styles.gf1TextStack : '';
  const titleClass = useGf1 ? styles.gf1Title : 'text-sm font-semibold text-neutral-900';
  const blurbClass = useGf1 ? styles.gf1Blurb : 'text-xs text-neutral-600';

  return (
    <div className={containerClass}>
      {SERVICE_OPTIONS.map((service) => {
        const checked = Boolean(value[service.id]);
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => toggle(service.id)}
            className={cx(buttonBase, checked ? buttonActive : buttonInactive)}
          >
            <div className={rowClass}>
              <span
                className={cx(checkBase, checked ? checkActive : checkInactive)}
              >
                ✓
              </span>
              <div className={textStackClass}>
                <div className={titleClass}>{service.title}</div>
                <p className={blurbClass}>{service.blurb}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
