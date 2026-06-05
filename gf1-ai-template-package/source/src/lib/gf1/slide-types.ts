// Structured slide schema for the Galactic proposal deck.
// Every slide is a fully native React layout (no PNG backgrounds). Each layout
// declares a typed list of editable fields; user values stored in `data` always
// take precedence, otherwise the field's `defaultValue` (resolved via the token
// system in slide-tokens.ts) is used.

export type SlideCategory =
  | 'standard'
  | 'hr_compliance_risk'
  | 'payroll_burden'
  | 'employee_retention'
  | 'cost_visibility';

export const CATEGORY_LABELS: Record<SlideCategory, string> = {
  standard: 'Standard',
  hr_compliance_risk: 'HR & Compliance',
  payroll_burden: 'Payroll',
  employee_retention: 'Benefits & Retention',
  cost_visibility: 'Pricing',
};

export const CATEGORY_COLORS: Record<SlideCategory, string> = {
  standard: '#005c99',
  hr_compliance_risk: '#e85d4a',
  payroll_burden: '#f59e0b',
  employee_retention: '#10b981',
  cost_visibility: '#8b5cf6',
};

export const CATEGORY_ORDER: SlideCategory[] = [
  'standard',
  'payroll_burden',
  'hr_compliance_risk',
  'employee_retention',
  'cost_visibility',
];

export type SlideFieldKind = 'text' | 'multiline' | 'list' | 'checklist' | 'image_url' | 'pricing_rows';

export type SlideFieldDef = {
  key: string;
  label: string;
  kind: SlideFieldKind;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  defaultList?: string[];
  subtitled?: boolean;
};

export type SlideLayoutId =
  | 'cover'
  | 'executive_summary'
  | 'who_is_galactic'
  | 'how_it_works'
  | 'payroll'
  | 'hr_services'
  | 'workers_comp'
  | 'benefits'
  | 'benefits_enrollment'
  | 'onboarding'
  | 'employee_tools'
  | 'applicant_tracking'
  | 'lms_zywave'
  | 'lms_ethena'
  | 'timekeeping'
  | 'reporting'
  | 'multi_company_reporting'
  | 'retirement_401k'
  | 'pricing'
  | 'closing';

export type SlideLayoutMeta = {
  id: SlideLayoutId;
  title: string;
  category: SlideCategory;
  iconEmoji: string;
  description?: string;
  fields: SlideFieldDef[];
};

export type SlideFieldValue = string | string[];

export type ProposalSlide = {
  instanceId: string;
  layoutId: SlideLayoutId;
  title: string;
  data: Record<string, SlideFieldValue>;
  order: number;
  visible: boolean;
};

export const SLIDES_PAYLOAD_VERSION = 2 as const;

export type ProposalSlidesPayload = {
  version: typeof SLIDES_PAYLOAD_VERSION;
  slides: ProposalSlide[];
};

// Sales context piped into every slide for token resolution + dynamic content.
// Keys here are stable contracts for token strings ({{org.name}}, etc).
export type SalesContext = {
  org: {
    name: string;
    legalName: string | null;
    industry: string | null;
    employees: number | null;
    payFrequencyLabel: string | null;
    contactName: string | null;
    contactEmail: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    location: string | null;
    logoUrl: string | null;
    salesRep: string | null;
  };
  pricing: {
    employeeCount: number | null;
    adminFeeFormatted: string;
    adminFeeBasisLabel: string;
    timekeepingFeeFormatted: string | null;
    lmsFeeFormatted: string | null;
    setupFeeFormatted: string | null;
    payrollVolumeFormatted: string | null;
    statePricings: Array<{
      state: string;
      sutaRate: number | null;
      wcClassCode: string;
      wcSellingRate: number | null;
      wcCostRate: number | null;
    }>;
    oneTimeFees: Array<{ label: string; amount: number }>;
    ficaRate: number;
    futaRate: number;
  };
  date: {
    full: string;
    monthYear: string;
    iso: string;
  };
};
