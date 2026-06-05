import type { ComponentType } from 'react';
import type {
  SalesContext,
  SlideFieldDef,
  SlideFieldValue,
  SlideLayoutId,
} from '@/lib/gf1/slide-types';
import { CoverLayout, COVER_FIELDS } from './CoverLayout';
import { ExecutiveSummaryLayout, EXECUTIVE_SUMMARY_FIELDS } from './ExecutiveSummaryLayout';
import { WhoIsGalacticLayout, WHO_IS_GALACTIC_FIELDS } from './WhoIsGalacticLayout';
import { HowItWorksLayout, HOW_IT_WORKS_FIELDS } from './HowItWorksLayout';
import { PayrollLayout, PAYROLL_FIELDS } from './PayrollLayout';
import { HRServicesLayout, HR_SERVICES_FIELDS } from './HRServicesLayout';
import { WorkersCompLayout, WORKERS_COMP_FIELDS } from './WorkersCompLayout';
import { BenefitsLayout, BENEFITS_FIELDS } from './BenefitsLayout';
import { BenefitsEnrollmentLayout, BENEFITS_ENROLLMENT_FIELDS } from './BenefitsEnrollmentLayout';
import { OnboardingLayout, ONBOARDING_FIELDS } from './OnboardingLayout';
import { EmployeeToolsLayout, EMPLOYEE_TOOLS_FIELDS } from './EmployeeToolsLayout';
import { ApplicantTrackingLayout, APPLICANT_TRACKING_FIELDS } from './ApplicantTrackingLayout';
import { LMSLayout, LMS_ZYWAVE_FIELDS, LMS_ETHENA_FIELDS } from './LMSLayout';
import { TimekeepingLayout, TIMEKEEPING_FIELDS } from './TimekeepingLayout';
import { ReportingLayout, REPORTING_FIELDS } from './ReportingLayout';
import { MultiCompanyLayout, MULTI_COMPANY_FIELDS } from './MultiCompanyLayout';
import { RetirementLayout, RETIREMENT_FIELDS } from './RetirementLayout';
import { PricingLayout, PRICING_FIELDS } from './PricingLayout';
import { ClosingLayout, CLOSING_FIELDS } from './ClosingLayout';

export type LayoutDeckInfo = {
  layoutIds: SlideLayoutId[];
};

export type LayoutComponent = ComponentType<{
  data: Record<string, SlideFieldValue>;
  ctx?: SalesContext;
  renderMode?: 'preview' | 'export';
  deck?: LayoutDeckInfo;
}>;

export type LayoutEntry = {
  id: SlideLayoutId;
  title: string;
  iconEmoji: string;
  description: string;
  category: 'standard' | 'hr_compliance_risk' | 'payroll_burden' | 'employee_retention' | 'cost_visibility';
  fields: SlideFieldDef[];
  Component: LayoutComponent;
};

export const LAYOUT_REGISTRY: Record<SlideLayoutId, LayoutEntry> = {
  cover: {
    id: 'cover',
    title: 'Cover',
    iconEmoji: '🌌',
    description: 'Title card with org name, sales rep, and date.',
    category: 'standard',
    fields: COVER_FIELDS,
    Component: CoverLayout,
  },
  executive_summary: {
    id: 'executive_summary',
    title: 'Executive Summary',
    iconEmoji: '📑',
    description: 'Auto-generated recap of every section of the proposal.',
    category: 'cost_visibility',
    fields: EXECUTIVE_SUMMARY_FIELDS,
    Component: ExecutiveSummaryLayout,
  },
  who_is_galactic: {
    id: 'who_is_galactic',
    title: 'Who is Galactic?',
    iconEmoji: '🏢',
    description: 'PEO overview with founding story and core values.',
    category: 'standard',
    fields: WHO_IS_GALACTIC_FIELDS,
    Component: WhoIsGalacticLayout,
  },
  how_it_works: {
    id: 'how_it_works',
    title: 'How Does It Work?',
    iconEmoji: '🤝',
    description: 'Explains the PEO co-employer relationship.',
    category: 'standard',
    fields: HOW_IT_WORKS_FIELDS,
    Component: HowItWorksLayout,
  },
  payroll: {
    id: 'payroll',
    title: 'Payroll Administration',
    iconEmoji: '💵',
    description: 'Payroll processing, tax filing, and employee access.',
    category: 'payroll_burden',
    fields: PAYROLL_FIELDS,
    Component: PayrollLayout,
  },
  hr_services: {
    id: 'hr_services',
    title: 'HR Services & Compliance',
    iconEmoji: '📋',
    description: 'HR compliance, EPLI, FMLA/ADA, and handbook support.',
    category: 'hr_compliance_risk',
    fields: HR_SERVICES_FIELDS,
    Component: HRServicesLayout,
  },
  workers_comp: {
    id: 'workers_comp',
    title: "Workers' Compensation",
    iconEmoji: '🦺',
    description: "Pay-as-you-go premiums, claims management, and audit coordination.",
    category: 'hr_compliance_risk',
    fields: WORKERS_COMP_FIELDS,
    Component: WorkersCompLayout,
  },
  benefits: {
    id: 'benefits',
    title: 'Benefits',
    iconEmoji: '🩺',
    description: 'Group health, dental, vision, voluntary, and Section 125.',
    category: 'employee_retention',
    fields: BENEFITS_FIELDS,
    Component: BenefitsLayout,
  },
  benefits_enrollment: {
    id: 'benefits_enrollment',
    title: 'Benefits Enrollment',
    iconEmoji: '✅',
    description: 'Self-service enrollment experience.',
    category: 'employee_retention',
    fields: BENEFITS_ENROLLMENT_FIELDS,
    Component: BenefitsEnrollmentLayout,
  },
  onboarding: {
    id: 'onboarding',
    title: 'Paperless Onboarding',
    iconEmoji: '📝',
    description: 'Digital new-hire workflows and document tracking.',
    category: 'payroll_burden',
    fields: ONBOARDING_FIELDS,
    Component: OnboardingLayout,
  },
  employee_tools: {
    id: 'employee_tools',
    title: 'Employee Portal',
    iconEmoji: '📱',
    description: '24/7 employee self-service for pay, benefits, and PTO.',
    category: 'payroll_burden',
    fields: EMPLOYEE_TOOLS_FIELDS,
    Component: EmployeeToolsLayout,
  },
  applicant_tracking: {
    id: 'applicant_tracking',
    title: 'Applicant Tracking System',
    iconEmoji: '🎯',
    description: 'Automated job posting, candidate scoring, and resume keyword matching.',
    category: 'employee_retention',
    fields: APPLICANT_TRACKING_FIELDS,
    Component: ApplicantTrackingLayout,
  },
  lms_zywave: {
    id: 'lms_zywave',
    title: 'LMS — Zywave',
    iconEmoji: '🎓',
    description: 'Deep HR & compliance training library with course library and tracking.',
    category: 'employee_retention',
    fields: LMS_ZYWAVE_FIELDS,
    Component: LMSLayout,
  },
  lms_ethena: {
    id: 'lms_ethena',
    title: 'LMS — Ethena',
    iconEmoji: '🎬',
    description: 'Modern bite-sized compliance training employees actually finish.',
    category: 'employee_retention',
    fields: LMS_ETHENA_FIELDS,
    Component: LMSLayout,
  },
  timekeeping: {
    id: 'timekeeping',
    title: 'Time & Attendance',
    iconEmoji: '⏱️',
    description: 'Clocks, mobile, geofencing, and labor allocation.',
    category: 'payroll_burden',
    fields: TIMEKEEPING_FIELDS,
    Component: TimekeepingLayout,
  },
  reporting: {
    id: 'reporting',
    title: 'Reporting',
    iconEmoji: '📊',
    description: 'Real-time dashboards, ad-hoc reports, and GL integration.',
    category: 'payroll_burden',
    fields: REPORTING_FIELDS,
    Component: ReportingLayout,
  },
  multi_company_reporting: {
    id: 'multi_company_reporting',
    title: 'Multi-Company',
    iconEmoji: '🏢',
    description: 'Manage multiple FEINs with consolidated and entity-level reporting.',
    category: 'payroll_burden',
    fields: MULTI_COMPANY_FIELDS,
    Component: MultiCompanyLayout,
  },
  retirement_401k: {
    id: 'retirement_401k',
    title: '401(k) Retirement Plans',
    iconEmoji: '🏦',
    description: 'Member benefits and plan compliance with VOYA.',
    category: 'employee_retention',
    fields: RETIREMENT_FIELDS,
    Component: RetirementLayout,
  },
  pricing: {
    id: 'pricing',
    title: 'Pricing Proposal',
    iconEmoji: '💼',
    description: 'Live pricing pulled from this proposal\u2019s data.',
    category: 'cost_visibility',
    fields: PRICING_FIELDS,
    Component: PricingLayout,
  },
  closing: {
    id: 'closing',
    title: 'Thank You',
    iconEmoji: '🤝',
    description: 'Closing slide with contact info.',
    category: 'standard',
    fields: CLOSING_FIELDS,
    Component: ClosingLayout,
  },
};

export const LAYOUT_LIST: LayoutEntry[] = Object.values(LAYOUT_REGISTRY);

export function getLayoutEntry(id: SlideLayoutId): LayoutEntry | undefined {
  return LAYOUT_REGISTRY[id];
}

/** Returns a Record of just the default values for each field (used for token resolution fallback). */
export function getLayoutDefaults(id: SlideLayoutId): Record<string, SlideFieldValue> {
  const entry = LAYOUT_REGISTRY[id];
  if (!entry) return {};
  const out: Record<string, SlideFieldValue> = {};
  for (const f of entry.fields) {
    if (f.kind === 'list' || f.kind === 'checklist' || f.kind === 'pricing_rows') {
      out[f.key] = f.defaultList ?? [];
    } else {
      out[f.key] = f.defaultValue ?? '';
    }
  }
  return out;
}
