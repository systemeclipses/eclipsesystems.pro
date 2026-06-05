"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { updateOrganizationAction } from '../[id]/updateOrganizationAction';
import { EmailComposeModal } from './EmailComposeModal';
import { DealLostModal } from './DealLostModal';
import ProspectIntakeActions from '../[id]/IntakeActions';
import RetirementQuestionnaireActions from '../[id]/RetirementQuestionnaireActions';
import styles from './OrganizationDetail.module.css';
import { toCSV, downloadFile } from '@/lib/gf1/reports-utils';
import { formatContactChannel, formatFollowUpType } from '@/lib/gf1/opportunity-follow-ups';
import { GF1_IMPLEMENTATION_STEPS } from '@/lib/gf1/implementation';

import type {
  Gf1ContactRecord,
  Gf1ImplementationChecklistStep,
  Gf1Organization,
  Gf1OrganizationProfile,
  Gf1ProposalRecord,
  Gf1Worksite,
  AssignableUser,
  ProfileRole,
} from '@/lib/gf1/types';

function cacheSafeLogoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.includes('/object/sign/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type OrganizationWithProspectFields = Gf1Organization &
  Partial<Gf1OrganizationProfile> & {
    pay_schedule_json?: { notes?: string } | null;
    wc_states_json?: string[] | Record<string, unknown> | null;
    remote_states?: string[] | null;
    additional_feins?: string[] | null;
    owners_json?: { name?: string; percent?: number }[] | null;
  };

type OrganizationProposal = Gf1ProposalRecord & {
  pricing_json?: Record<string, unknown> | null;
  pricing_summary?: Record<string, unknown> | null;
  approval_status?: string | null;
  approval_decided_at?: string | null;
  approval_decided_by?: string | null;
  manager_email?: string | null;
  services_snapshot?: Record<string, unknown> | null;
};

type OrganizationActivityItem = {
  id: string;
  opportunityId: string;
  eventType: 'contact' | 'intake_generated' | 'intake_sent';
  contactedAt: string;
  channel: string | null;
  followUpType: string | null;
  notes: string | null;
  followUpAt: string | null;
  gotResponse: boolean;
  responseNotes: string | null;
  contactedBy: string | null;
  contactedByName: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

const COMPLIANCE_FLAGS = [
  { key: 'bankruptcy_flag', label: 'Bankruptcy history' },
  { key: 'lawsuits_flag', label: 'Open lawsuits' },
  { key: 'controlled_group_flag', label: 'Controlled group' },
  { key: 'multi_state_flag', label: 'Operates in multiple states' },
  { key: 'local_taxes_flag', label: 'Subject to local payroll taxes' },
  { key: 'regular_commissions_or_bonuses_flag', label: 'Regular commissions/bonuses' },
  { key: 'has_remote_employees_flag', label: 'Remote employees' },
  { key: 'has_1099s_flag', label: 'Pays 1099 contractors' },
  { key: 'employees_live_vs_work_state_flag', label: 'Employees live vs work state differs' },
  { key: 'offers_health_flag', label: 'Offers health' },
  { key: 'offers_dental_flag', label: 'Offers dental' },
  { key: 'offers_vision_flag', label: 'Offers vision' },
  { key: 'pto_tracking_needed_flag', label: 'Needs PTO tracking' },
  { key: 'has_retirement_plan_flag', label: 'Has retirement plan' },
  { key: 'wants_galactic_retirement_flag', label: 'Interested in Galactic 401(k)' },
  { key: 'gl_import_needed_flag', label: 'Needs GL import' },
  { key: 'large_employer_aca_flag', label: 'Large employer for ACA' },
  { key: 'labor_posters_needed_flag', label: 'Needs labor posters' },
  { key: 'timekeeping_needed_flag', label: 'Needs timekeeping' },
  { key: 'background_checks_needed_flag', label: 'Needs background checks' },
  { key: 'drug_screenings_needed_flag', label: 'Needs drug screenings' },
  { key: 'wants_wotc_flag', label: 'Interested in WOTC' },
  { key: 'ats_needed_flag', label: 'Needs ATS' },
  { key: 'additional_reporting_needed_flag', label: 'Requests additional reporting' },
] as const;

type ComplianceKey = (typeof COMPLIANCE_FLAGS)[number]['key'];

type DealLossReport = {
  id: string;
  created_at: string;
  previous_status: string | null;
  primary_reason: string | null;
  competitor_name: string | null;
  return_probability: string | null;
  what_could_improve: string | null;
  additional_notes: string | null;
  pdf_url: string | null;
};

type OrganizationDetailProps = {
  organization: OrganizationWithProspectFields;
  contacts: Gf1ContactRecord[];
  worksites: Gf1Worksite[];
  proposals: OrganizationProposal[];
  activityItems: OrganizationActivityItem[];
  implementationChecklist: Gf1ImplementationChecklistStep[];
  assignees: AssignableUser[];
  role: ProfileRole | null;
  msConnected: boolean;
  dealLossReport: DealLossReport | null;
  retirementQuestionnairePdfUrl?: string | null;
};

type EditableOrgState = {
  status: string;
  sales_rep_name: string;
  assigned_sales_rep_id: string;
  commission_percent: string;
  legal_name: string;
  dba_name: string;
  industry: string;
  website: string;
  naics_code: string;
  company_type: string;
  description_of_operations: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  address_county: string;
  country: string;
  years_in_business: string;
  total_employees: string;
  full_time_employees: string;
  part_time_employees: string;
  commission_only_employees: string;
  pay_frequency: string;
  pay_frequency_other: string;
  payroll_submission_method: string;
  first_check_date: string;
  first_period_start: string;
  first_period_end: string;
  pay_schedule_notes: string;
  current_payroll_provider: string;
  fein: string;
  additional_feins: string;
  owners_list: string;
  remote_states: string;
  other_benefit_plans: string;
  wc_states_list: string;
  additional_details: string;
};

type ContactDraft = {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  is_primary: boolean;
};

type WorksiteDraft = {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
};

type OtherBenefitsState = {
  companyPaidGtl: boolean;
  companyPaidLtd: boolean;
  companyPaidStd: boolean;
  keepOwnMedical: boolean;
  keepOtherPlans: boolean;
  otherPlanNames: string;
};

function buildFormState(org: OrganizationWithProspectFields): EditableOrgState {
  const payScheduleNotes =
    typeof org.pay_schedule_json === 'object' && org.pay_schedule_json !== null
      ? (org.pay_schedule_json as any).notes ?? ''
      : '';

  const wcStatesList = Array.isArray(org.wc_states_json)
    ? (org.wc_states_json as string[]).join(', ')
    : '';

  return {
    status: org.status || 'lead',
    sales_rep_name: org.sales_rep_name || '',
    assigned_sales_rep_id: org.assigned_sales_rep_id || '',
    commission_percent: org.commission_percent?.toString() ?? '',
    legal_name: org.legal_name || '',
    dba_name: org.dba_name || '',
    industry: org.industry || '',
    website: org.website || '',
    naics_code: org.naics_code || '',
    company_type: org.company_type || '',
    description_of_operations: org.description_of_operations || '',
    address_line1: org.address_line1 || (org as any).address_street || '',
    address_line2: org.address_line2 || '',
    city: org.city || (org as any).address_city || '',
    state: org.state || (org as any).address_state || '',
    postal_code: org.postal_code || (org as any).address_zip || '',
    address_county: (org as any).address_county || '',
    country: org.country || 'United States',
    years_in_business: org.years_in_business?.toString() ?? '',
    total_employees: org.total_employees?.toString() ?? '',
    full_time_employees: org.full_time_employees?.toString() ?? '',
    part_time_employees: org.part_time_employees?.toString() ?? '',
    commission_only_employees: org.commission_only_employees?.toString() ?? '',
    pay_frequency: org.pay_frequency || '',
    pay_frequency_other: org.pay_frequency_other || '',
    payroll_submission_method: (org as any).payroll_submission_method || '',
    first_check_date: org.first_check_date || '',
    first_period_start: org.first_period_start || '',
    first_period_end: org.first_period_end || '',
    pay_schedule_notes: payScheduleNotes,
    current_payroll_provider: (org as any).current_payroll_provider || '',
    fein: (org as any).fein || '',
    additional_feins: Array.isArray((org as any).additional_feins)
      ? ((org as any).additional_feins as string[]).join(', ')
      : '',
    owners_list: formatOwnersList((org as any).owners_json),
    remote_states: formatCommaList((org as any).remote_states),
    other_benefit_plans: (org as any).other_benefit_plans || '',
    wc_states_list: wcStatesList,
    additional_details: (org as any).additional_details || '',
  };
}

function buildFlagState(org: OrganizationWithProspectFields): Record<ComplianceKey, boolean> {
  return COMPLIANCE_FLAGS.reduce(
    (acc, flag) => {
      acc[flag.key] = Boolean((org as any)[flag.key]);
      return acc;
    },
    {} as Record<ComplianceKey, boolean>
  );
}

function buildContactDrafts(
  org: OrganizationWithProspectFields,
  contacts: Gf1ContactRecord[]
): ContactDraft[] {
  const base = contacts?.length
    ? contacts
    : [
        {
          full_name: org.primary_contact_name ?? '',
          title: '',
          email: org.primary_contact_email ?? '',
          phone: (org as any).primary_contact_phone ?? '',
          is_primary: true,
        },
      ];

  return base.map((contact, idx) => ({
    full_name: contact.full_name ?? '',
    title: contact.title ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    is_primary: contact.is_primary ?? idx === 0,
  }));
}

function buildWorksiteDrafts(org: OrganizationWithProspectFields, worksites: Gf1Worksite[]): WorksiteDraft[] {
  const base = worksites?.length
    ? worksites
    : [
        {
          name: '',
          street: org.address_line1 ?? '',
          city: org.city ?? '',
          state: org.state ?? '',
          zip: org.postal_code ?? '',
          county: (org as any).address_county ?? '',
        },
      ];

  return base.map((site) => ({
    name: (site as any).name ?? '',
    street: site.street ?? '',
    city: site.city ?? '',
    state: site.state ?? '',
    zip: site.zip ?? '',
    county: site.county ?? '',
  }));
}

function formatOwnersList(owners?: { name?: string; percent?: number }[] | null) {
  if (!owners || !owners.length) return '';
  return owners
    .map((owner) => {
      const pieces = [];
      if (owner.name) pieces.push(owner.name);
      if (owner.percent !== undefined && owner.percent !== null) pieces.push(`${owner.percent}%`);
      return pieces.join(' - ');
    })
    .filter(Boolean)
    .join('\n');
}

function parseOwnersList(raw: string | null) {
  if (!raw) return null;
  const rows = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!rows.length) return null;

  return rows.map((line) => {
    const [namePart, percentPart] = line.split(/-|,/).map((piece) => piece.trim());
    const percent = percentPart ? Number(percentPart.replace('%', '')) : null;
    return { name: namePart, percent: Number.isFinite(percent) ? percent : null };
  });
}

function toNumberOrNull(value: string): number | null {
  if (!value || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNumber(value: number | null, min: number, max: number, fallback: number) {
  if (value === null || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function parseList(value: string): string[] | null {
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length ? entries : null;
}

function formatCommaList(list?: string[] | null) {
  return Array.isArray(list) ? list.join(', ') : '';
}

function parseOtherBenefitPlans(raw: string | null | undefined): OtherBenefitsState {
  const base: OtherBenefitsState = {
    companyPaidGtl: false,
    companyPaidLtd: false,
    companyPaidStd: false,
    keepOwnMedical: false,
    keepOtherPlans: false,
    otherPlanNames: '',
  };

  if (!raw) return base;
  const tokens = raw
    .split(/\n|;/)
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

  const otherNames: string[] = [];

  tokens.forEach((token) => {
    const lower = token.toLowerCase();
    if (lower.includes('gtl') || lower.includes('group term life')) {
      base.companyPaidGtl = true;
      return;
    }
    if (lower.includes('ltd') || lower.includes('long term disability')) {
      base.companyPaidLtd = true;
      return;
    }
    if (lower.includes('std') || lower.includes('short term disability')) {
      base.companyPaidStd = true;
      return;
    }
    if (lower.includes('keep') && lower.includes('medical')) {
      base.keepOwnMedical = true;
      return;
    }
    if (lower.includes('keep') && lower.includes('other')) {
      base.keepOtherPlans = true;
      const parts = token.split(':');
      if (parts.length > 1) {
        const remainder = parts.slice(1).join(':').trim();
        if (remainder) otherNames.push(remainder);
      }
      return;
    }
    if (lower.includes('other plan')) {
      base.keepOtherPlans = true;
      const parts = token.split(':');
      const remainder = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
      if (remainder) {
        otherNames.push(remainder);
      } else {
        otherNames.push(token);
      }
      return;
    }
    otherNames.push(token);
  });

  if (otherNames.length) {
    base.keepOtherPlans = true;
    base.otherPlanNames = otherNames.join(', ');
  }

  return base;
}

function serializeOtherBenefitPlans(state: OtherBenefitsState): string {
  const lines: string[] = [];
  if (state.companyPaidGtl) lines.push('Company Paid GTL (Group Term Life)');
  if (state.companyPaidLtd) lines.push('Company Paid LTD');
  if (state.companyPaidStd) lines.push('Company Paid STD');
  if (state.keepOwnMedical) lines.push('Keep Own Medical Coverage');
  if (state.keepOtherPlans) {
    const trimmed = state.otherPlanNames.trim();
    lines.push(trimmed ? `Keep Other Plans: ${trimmed}` : 'Keep Other Plans');
  }
  return lines.join('\n');
}

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Draft';
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatShortDate(value?: string | null) {
  if (!value) return 'â€"';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'â€"';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Ã¢â‚¬â€';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ã¢â‚¬â€';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const INDUSTRY_OPTIONS = [
  'Professional Services',
  'Healthcare',
  'Technology',
  'Finance',
  'Manufacturing',
  'Construction',
  'Retail',
  'Hospitality',
  'Transportation & Logistics',
  'Restaurants',
  'Nonprofit',
  'Housekeeping',
  'Real Estate',
  'Electrical, Plumbing & HVAC',
  'Media & Entertainment',
  'Agriculture',
  'Other',
] as const;

const PAYROLL_SUBMISSION_OPTIONS = [
  'Client Entry',
  'Galactic Entry',
  'Spreadsheet',
  'Call in',
  'Auto Hours',
] as const;

type SectionKey =
  | 'identity'
  | 'headquarters'
  | 'activity'
  | 'salesProgress'
  | 'worksites'
  | 'additional'
  | 'quickActions'
  | 'employees'
  | 'compliance'
  | 'tax'
  | 'prospect'
  | 'proposals'
  | 'contacts';

type OrganizationTabKey = 'overview' | 'people' | 'activity' | 'payroll' | 'pipeline';
type SalesProgressStage = 'lead' | 'prospect' | 'implementation';
type SalesProgressStep = {
  key: string;
  label: string;
  stage: SalesProgressStage;
  weight: number;
  completed: boolean;
};

export function OrganizationDetailClient({
  organization,
  contacts,
  worksites,
  proposals,
  activityItems,
  implementationChecklist,
  assignees,
  role,
  msConnected,
  dealLossReport: initialDealLossReport,
  retirementQuestionnairePdfUrl = null,
}: OrganizationDetailProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [form, setForm] = useState<EditableOrgState>(() => buildFormState(organization));
  const [flags, setFlags] = useState<Record<ComplianceKey, boolean>>(() => buildFlagState(organization));
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>(() => buildContactDrafts(organization, contacts));
  const [worksiteDrafts, setWorksiteDrafts] = useState<WorksiteDraft[]>(() => buildWorksiteDrafts(organization, worksites));
  const [saving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization.logo_url ?? null);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [otherBenefits, setOtherBenefits] = useState<OtherBenefitsState>(() =>
    parseOtherBenefitPlans(form.other_benefit_plans)
  );
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [salesProgressStageTab, setSalesProgressStageTab] = useState<SalesProgressStage>('lead');
  const [composeModal, setComposeModal] = useState<{ to: string; subject: string } | null>(null);
  const [showDealLostModal, setShowDealLostModal] = useState(false);
  const [dealLossReport, setDealLossReport] = useState<DealLossReport | null>(initialDealLossReport);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setDealLossReport(initialDealLossReport);
  }, [initialDealLossReport?.id]);

  const canonicalLegalName = form.legal_name || organization.legal_name || '';
  const primaryName =
    form.dba_name ||
    organization.dba_name ||
    canonicalLegalName ||
    organization.name ||
    'Untitled';
  const displayName = primaryName;
  const createdDate = useMemo(
    () =>
      new Date(organization.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [organization.created_at]
  );
  const closeDate = useMemo(() => formatShortDate(organization.client_won_at), [organization.client_won_at]);
  const goLiveDate = useMemo(
    () => formatShortDate((organization as { go_live_date?: string | null }).go_live_date),
    [organization]
  );

  const primaryContact = contactDrafts.find((c) => c.is_primary) ?? contactDrafts[0];
  const isAdmin = role === 'admin';
  const assignedRep = assignees.find((rep) => rep.id === form.assigned_sales_rep_id) ?? null;
  const salesRepName = assignedRep?.full_name?.trim() || form.sales_rep_name?.trim() || '';
  const implementationStepMap = useMemo(
    () =>
      new Map(
        implementationChecklist.map((step) => [
          step.step_key,
          { completed_at: step.completed_at, completed_by: step.completed_by },
        ])
      ),
    [implementationChecklist]
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const initials = getInitials(displayName);

  const getStatusColor = (status: string | null) => {
    if (!status) return '#738297';
    const normalized = status.toLowerCase();
    if (normalized === 'client') return 'var(--gf1-green)';
    if (normalized === 'prospect') return '#1C93ED';
    if (normalized === 'lead') return '#f59e0b';
    return '#738297';
  };

  const normalizedStatus = (form.status || '').toLowerCase();
  const isLead = normalizedStatus === 'lead';
  const isClient = normalizedStatus === 'client';
  const showFullDetails = !isLead;

  const tabOptions = useMemo(
    () =>
      [
        { key: 'overview', label: 'Overview' },
        { key: 'people', label: 'People & Locations' },
        { key: 'activity', label: 'Activity', count: activityItems.length > 0 ? activityItems.length : undefined },
        ...(!isLead ? [{ key: 'payroll', label: 'Payroll & Benefits' }] : []),
        { key: 'pipeline', label: 'Pipeline', count: proposals.length > 0 ? proposals.length : undefined },
      ] satisfies Array<{ key: OrganizationTabKey; label: string; count?: number }>,
    [activityItems.length, isLead, proposals.length]
  );

  const [activeTab, setActiveTab] = useState<OrganizationTabKey>('overview');
  const [viewedTabs, setViewedTabs] = useState<Set<OrganizationTabKey>>(new Set());
  const currentTab = tabOptions.some((tab) => tab.key === activeTab)
    ? activeTab
    : (tabOptions[0]?.key ?? 'overview');
  const activeTabIndex = Math.max(
    0,
    tabOptions.findIndex((tab) => tab.key === currentTab)
  );
  const tabVars = {
    ['--tab-count' as string]: tabOptions.length,
    ['--active-index' as string]: activeTabIndex,
  } as CSSProperties;
  const showRightColumn =
    currentTab === 'overview' ||
    currentTab === 'activity' ||
    currentTab === 'payroll' ||
    (currentTab === 'pipeline' && isLead) ||
    (currentTab === 'people' && !isLead);
  const isLeadPipelineLayout = currentTab === 'pipeline' && isLead;
  const primaryContactName = (primaryContact?.full_name || organization.primary_contact_name || '').trim();
  const primaryContactEmail = (primaryContact?.email || organization.primary_contact_email || '').trim();
  const primaryContactPhone = (
    primaryContact?.phone ||
    (organization as { primary_contact_phone?: string | null }).primary_contact_phone ||
    ''
  ).trim();
  const hasPrimaryContact = Boolean(primaryContactName && (primaryContactEmail || primaryContactPhone));
  const proposalStatuses = useMemo(() => proposals.map((proposal) => String(proposal.status || '').toLowerCase()), [proposals]);
  const salesProgressSteps = useMemo<SalesProgressStep[]>(() => {
    const hasOutreachLogged = isLead || activityItems.some((entry) => entry.eventType === 'contact');
    const hasFollowUpScheduled = isLead || activityItems.some((entry) => Boolean(entry.followUpAt));
    const hasIntakeActivity = activityItems.some(
      (entry) => entry.eventType === 'intake_generated' || entry.eventType === 'intake_sent'
    );
    const hasIntakeGenerated = hasIntakeActivity;
    const hasIntakeSent = hasIntakeActivity;
    const hasProspectStage = normalizedStatus === 'prospect' || normalizedStatus === 'client';
    const hasProposalCreated = proposals.length > 0;
    const hasProposalMeetingScheduled = activityItems.some((entry) => {
      if (!entry.followUpAt) return false;
      const followUpType = (entry.followUpType || '').trim().toLowerCase();
      const channel = (entry.channel || '').trim().toLowerCase();
      return followUpType === 'proposal' || followUpType === 'meeting' || channel === 'meeting';
    });
    const hasProposalShared = proposalStatuses.some((status) =>
      ['sent_to_prospect', 'sent_to_client', 'accepted'].includes(status)
    );
    const hasProposalApproved = proposalStatuses.some((status) =>
      ['approved', 'sent_to_client', 'accepted'].includes(status)
    );
    const implementationSteps = GF1_IMPLEMENTATION_STEPS.map((step) => ({
      key: step.key,
      stage: 'implementation' as const,
      label: step.label,
      weight: 10,
      completed: Boolean(implementationStepMap.get(step.key)?.completed_at),
    }));

    return [
      { key: 'primary_contact', stage: 'lead', label: 'Primary contact captured', weight: 10, completed: hasPrimaryContact },
      { key: 'first_outreach', stage: 'lead', label: 'First outreach logged', weight: 10, completed: hasOutreachLogged },
      { key: 'follow_up', stage: 'lead', label: 'Follow-up scheduled', weight: 10, completed: hasFollowUpScheduled },
      { key: 'intake_generated', stage: 'lead', label: 'Intake link generated', weight: 10, completed: hasIntakeGenerated },
      { key: 'intake_sent', stage: 'lead', label: 'Intake link sent', weight: 10, completed: hasIntakeSent },
      { key: 'prospect_stage', stage: 'prospect', label: 'Moved to prospect stage', weight: 10, completed: hasProspectStage },
      { key: 'proposal_meeting', stage: 'prospect', label: 'Proposal meeting scheduled', weight: 5, completed: hasProposalMeetingScheduled },
      { key: 'proposal_created', stage: 'prospect', label: 'Proposal created', weight: 10, completed: hasProposalCreated },
      { key: 'proposal_shared', stage: 'prospect', label: 'Proposal sent to prospect', weight: 10, completed: hasProposalShared },
      { key: 'proposal_approved', stage: 'prospect', label: 'Proposal approved', weight: 5, completed: hasProposalApproved },
      ...implementationSteps,
    ];
  }, [activityItems, hasPrimaryContact, implementationStepMap, isLead, normalizedStatus, proposalStatuses, proposals.length]);
  const salesProgressSections = useMemo(
    () =>
      (
        [
          { stage: 'lead', label: 'Suspect Stage' },
          { stage: 'prospect', label: 'Prospect Stage' },
          { stage: 'implementation', label: 'Implementation Stage' },
        ] as const
      ).map(({ stage, label }) => {
        const steps = salesProgressSteps.filter((step) => step.stage === stage);
        const completedWeight = steps.reduce((total, step) => (step.completed ? total + step.weight : total), 0);
        const totalWeight = steps.reduce((total, step) => total + step.weight, 0);
        const percent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
        const completedSteps = steps.filter((step) => step.completed).length;
        return {
          stage,
          label,
          steps,
          completedWeight,
          totalWeight,
          percent,
          completedSteps,
        };
      }),
    [salesProgressSteps]
  );
  const salesProgressCompletedWeight = useMemo(
    () => salesProgressSteps.reduce((total, step) => (step.completed ? total + step.weight : total), 0),
    [salesProgressSteps]
  );
  const salesProgressTotalWeight = useMemo(
    () => salesProgressSteps.reduce((total, step) => total + step.weight, 0),
    [salesProgressSteps]
  );
  const salesProgressPercent = salesProgressTotalWeight > 0 ? Math.round((salesProgressCompletedWeight / salesProgressTotalWeight) * 100) : 0;
  const salesProgressCompletedSteps = useMemo(
    () => salesProgressSteps.filter((step) => step.completed).length,
    [salesProgressSteps]
  );
  const activeSalesProgressSection = useMemo(
    () => salesProgressSections.find((section) => section.stage === salesProgressStageTab) ?? salesProgressSections[0],
    [salesProgressSections, salesProgressStageTab]
  );

  useEffect(() => {
    setOtherBenefits(parseOtherBenefitPlans(form.other_benefit_plans));
  }, [form.other_benefit_plans]);

  const updateOtherBenefits = (patch: Partial<OtherBenefitsState>) => {
    setOtherBenefits((prev) => {
      const next = { ...prev, ...patch };
      setForm((current) => ({
        ...current,
        other_benefit_plans: serializeOtherBenefitPlans(next),
      }));
      return next;
    });
  };

  const updateContact = (index: number, field: keyof ContactDraft, value: string | boolean) => {
    setContactDrafts((prev) =>
      prev.map((entry, idx) =>
        idx === index
          ? { ...entry, [field]: value }
          : field === 'is_primary' && value
            ? { ...entry, is_primary: false }
            : entry
      )
    );
  };

  const updateWorksite = (index: number, field: keyof WorksiteDraft, value: string) => {
    setWorksiteDrafts((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry)));
  };

  const openLogoPicker = () => {
    if (!isEditing || saving) return;
    setLogoMessage(null);
    logoInputRef.current?.click();
  };

  const handleLogoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLogoPicker();
    }
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !isEditing) return;

    setLogoStatus('uploading');
    setLogoMessage(null);

    const formData = new FormData();
    formData.append('organizationId', organization.id);
    formData.append('file', file);

    let response;
    try {
      response = await fetch('/api/gf1/organizations/upload-logo', {
        method: 'POST',
        body: formData,
      });
    } catch (networkError) {
      console.error('organization logo upload failed', networkError);
      setLogoStatus('error');
      setLogoMessage('Upload failed. Please try again.');
      return;
    }

    if (!response.ok) {
      let details = 'Upload failed. Please try again.';
      try {
        const payload = await response.json();
        if (payload?.error) details = payload.error;
      } catch {
        // ignore parsing
      }
      setLogoStatus('error');
      setLogoMessage(details);
      return;
    }

    const payload = (await response.json()) as { logoUrl?: string };
    if (!payload.logoUrl) {
      setLogoStatus('error');
      setLogoMessage('Upload succeeded but no logo URL returned.');
      return;
    }

    setLogoUrl(cacheSafeLogoUrl(payload.logoUrl));
    setLogoStatus('success');
    setLogoMessage('Logo updated.');
    setTimeout(() => setLogoMessage(null), 7000);
  };

  useEffect(() => {
    if (!organization.logo_url) return;
    setLogoUrl(cacheSafeLogoUrl(organization.logo_url));
  }, [organization.logo_url]);

  const handleSave = () => {
    setError(null);
    const cleanedContacts = (contactDrafts.length ? contactDrafts : [])
      .map((contact, index) => ({
        ...contact,
        is_primary: contact.is_primary ?? index === 0,
      }))
      .filter((contact) => contact.full_name || contact.email || contact.phone || contact.title);

    const normalizedContacts = cleanedContacts.length
      ? cleanedContacts
      : [
          {
            full_name: displayName,
            title: '',
            email: organization.primary_contact_email ?? '',
            phone: (organization as any).primary_contact_phone ?? '',
            is_primary: true,
          },
        ];

    const normalizedWorksites = (worksiteDrafts.length ? worksiteDrafts : [])
      .map((site) => ({ ...site }))
      .filter((site) => site.name || site.street || site.city || site.state || site.zip || site.county);

    const commissionPercent = clampNumber(toNumberOrNull(form.commission_percent), 0, 100, 10);

    const orgPayload: Record<string, any> = {
      status: form.status || null,
      sales_rep_name: salesRepName || null,
      legal_name: canonicalLegalName || null,
      dba_name: form.dba_name || null,
      industry: form.industry || null,
      trade_name: null,
      website: form.website || null,
      naics_code: form.naics_code || null,
      company_type: form.company_type || null,
      description_of_operations: form.description_of_operations || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      city: form.city || null,
      state: form.state || null,
      postal_code: form.postal_code || null,
      address_county: form.address_county || null,
      country: form.country || null,
      years_in_business: toNumberOrNull(form.years_in_business),
      total_employees: toNumberOrNull(form.total_employees),
      full_time_employees: toNumberOrNull(form.full_time_employees),
      part_time_employees: toNumberOrNull(form.part_time_employees),
      commission_only_employees: toNumberOrNull(form.commission_only_employees),
      pay_frequency: form.pay_frequency || null,
      pay_frequency_other: form.pay_frequency_other || null,
      payroll_submission_method: form.payroll_submission_method || null,
      first_check_date: form.first_check_date || null,
      first_period_start: form.first_period_start || null,
      first_period_end: form.first_period_end || null,
      pay_schedule_json: form.pay_schedule_notes ? { notes: form.pay_schedule_notes } : null,
      current_payroll_provider: form.current_payroll_provider || null,
      fein: form.fein || null,
      additional_feins: parseList(form.additional_feins),
      owners_json: parseOwnersList(form.owners_list),
      remote_states: parseList(form.remote_states),
      other_benefit_plans: form.other_benefit_plans || null,
      wc_states_json: parseList(form.wc_states_list),
      additional_details: form.additional_details || null,
    };

    if (isAdmin) {
      orgPayload.commission_percent = commissionPercent;
      orgPayload.assigned_sales_rep_id = form.assigned_sales_rep_id || null;
    }

    Object.entries(flags).forEach(([key, value]) => {
      orgPayload[key] = value;
    });

    const primaryContactForOrg = normalizedContacts.find((contact) => contact.is_primary) ?? normalizedContacts[0];
    if (primaryContactForOrg) {
      orgPayload.primary_contact_name = primaryContactForOrg.full_name || null;
      orgPayload.primary_contact_email = primaryContactForOrg.email || null;
      orgPayload.primary_contact_phone = primaryContactForOrg.phone || null;
    }

    startTransition(async () => {
      try {
        await updateOrganizationAction(organization.id, {
          organization: orgPayload,
          contacts: normalizedContacts,
          worksites: normalizedWorksites,
        });
        setIsEditing(true);
      } catch (err: any) {
        setError(err?.message || 'Failed to save changes');
      }
    });
  };

  const exportCsv = () => {
    const contactsSummary = contactDrafts
      .map((contact) => `${contact.full_name || 'Contact'}${contact.is_primary ? ' (Primary)' : ''}${contact.email ? ` - ${contact.email}` : ''}`)
      .filter(Boolean)
      .join(' | ');

    const worksitesSummary = worksiteDrafts
      .map((site) => {
        const location = [site.street, site.city, site.state, site.zip].filter(Boolean).join(', ');
        return site.name ? `${site.name}${location ? ` - ${location}` : ''}` : location;
      })
      .filter(Boolean)
      .join(' | ');

    const selectedFlags = COMPLIANCE_FLAGS.filter((flag) => flags[flag.key]).map((flag) => flag.label).join('; ');

    const row = {
      organizationName: displayName,
      status: form.status || '',
      salesRep: salesRepName,
      employees: form.total_employees || '',
      industry: form.industry || '',
      website: form.website || '',
      legalName: canonicalLegalName,
      dbaName: form.dba_name || '',
      naicsCode: form.naics_code || '',
      companyType: form.company_type || '',
      yearsInBusiness: form.years_in_business || '',
      descriptionOfOperations: form.description_of_operations || '',
      primaryContactName: primaryContact?.full_name || '',
      primaryContactEmail: primaryContact?.email || '',
      primaryContactPhone: primaryContact?.phone || '',
      contacts: contactsSummary,
      addressLine1: form.address_line1 || '',
      addressLine2: form.address_line2 || '',
      city: form.city || '',
      state: form.state || '',
      postalCode: form.postal_code || '',
      county: form.address_county || '',
      remoteStates: form.remote_states || '',
      worksites: worksitesSummary,
      totalEmployees: form.total_employees || '',
      fullTimeEmployees: form.full_time_employees || '',
      partTimeEmployees: form.part_time_employees || '',
      commissionOnlyEmployees: form.commission_only_employees || '',
      payFrequency: form.pay_frequency || '',
      payFrequencyOther: form.pay_frequency_other || '',
      payrollSubmissionMethod: form.payroll_submission_method || '',
      firstCheckDate: form.first_check_date || '',
      firstPeriodStart: form.first_period_start || '',
      firstPeriodEnd: form.first_period_end || '',
      payScheduleNotes: form.pay_schedule_notes || '',
      currentPayrollProvider: form.current_payroll_provider || '',
      complianceFlags: selectedFlags,
      otherBenefitPlans: form.other_benefit_plans || '',
      wcStates: form.wc_states_list || '',
      fein: form.fein || '',
      additionalFeins: form.additional_feins || '',
      owners: form.owners_list || '',
      additionalDetails: form.additional_details || '',
    };

    const columns: Array<[string, keyof typeof row]> = [
      ['Organization Name', 'organizationName'],
      ['Status', 'status'],
      ['Sales Rep', 'salesRep'],
      ['Employees', 'employees'],
      ['Industry', 'industry'],
      ['Website', 'website'],
      ['Legal Name', 'legalName'],
      ['DBA Name', 'dbaName'],
      ['NAICS Code', 'naicsCode'],
      ['Company Type', 'companyType'],
      ['Years in Business', 'yearsInBusiness'],
      ['Description of Operations', 'descriptionOfOperations'],
      ['Primary Contact', 'primaryContactName'],
      ['Primary Contact Email', 'primaryContactEmail'],
      ['Primary Contact Phone', 'primaryContactPhone'],
      ['All Contacts', 'contacts'],
      ['Address Line 1', 'addressLine1'],
      ['Address Line 2', 'addressLine2'],
      ['City', 'city'],
      ['State', 'state'],
      ['Postal Code', 'postalCode'],
      ['County', 'county'],
      ['Remote States', 'remoteStates'],
      ['Worksites', 'worksites'],
      ['Total Employees', 'totalEmployees'],
      ['Full-time Employees', 'fullTimeEmployees'],
      ['Part-time Employees', 'partTimeEmployees'],
      ['Commission-only Employees', 'commissionOnlyEmployees'],
      ['Pay Frequency', 'payFrequency'],
      ['Pay Frequency (Other)', 'payFrequencyOther'],
      ['Payroll Submission Method', 'payrollSubmissionMethod'],
      ['First Check Date', 'firstCheckDate'],
      ['First Period Start', 'firstPeriodStart'],
      ['First Period End', 'firstPeriodEnd'],
      ['Pay Schedule Notes', 'payScheduleNotes'],
      ['Current Payroll Provider', 'currentPayrollProvider'],
      ['Compliance Flags', 'complianceFlags'],
      ['Other Benefit Plans', 'otherBenefitPlans'],
      ['States needing W/C', 'wcStates'],
      ['FEIN', 'fein'],
      ['Additional FEINs', 'additionalFeins'],
      ['Owners', 'owners'],
      ['Additional Details', 'additionalDetails'],
    ];

    const csv = toCSV([row], columns);
    const safeName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    downloadFile(`${safeName || 'organization'}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const renderTextRow = (label: string, field: keyof EditableOrgState, options?: { type?: string; textarea?: boolean }) => (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>
        {isEditing ? (
          options?.textarea ? (
            <textarea
              className={`${styles.editInput} ${styles.textarea}`}
              value={form[field]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              rows={3}
              disabled={saving}
            />
          ) : (
            <input
              type={options?.type || 'text'}
              value={form[field]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              className={styles.editInput}
              disabled={saving}
            />
          )
        ) : (
          (form[field]?.trim() as string) || 'â€"'
        )}
      </span>
    </div>
  );

  const renderSection = (key: SectionKey, title: string, content: ReactNode) => {
    const sectionId = `org-section-${key}`;
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader} id={`${sectionId}-header`}>
          <h2 className={styles.cardTitle}>{title}</h2>
        </div>
        <div id={sectionId} className={styles.cardBody} aria-labelledby={`${sectionId}-header`}>
          {content}
        </div>
      </div>
    );
  };

  const renderContactsCard = () => (
    <>
      <div className={styles.contactList}>
        {contactDrafts.map((contact, idx) => (
          <div key={`contact-${idx}`} className={styles.listCard}>
            <div className={styles.listCardHeader}>
              <div className={styles.listCardTitle}>
                <span>{contact.full_name || `Contact ${idx + 1}`}</span>
                {contact.is_primary && <span className={styles.badge}>Primary</span>}
              </div>
              {isEditing && (
                <label className={styles.checkboxRow}>
                  <span>Primary Contact:</span>
                  <input
                    type="checkbox"
                    checked={contact.is_primary}
                    onChange={(e) => updateContact(idx, 'is_primary', e.target.checked)}
                    disabled={saving}
                  />
                </label>
              )}
              {isEditing && contactDrafts.length > 1 && (
                <button
                  type="button"
                  className={styles.smallGhostButton}
                  onClick={() => setContactDrafts((prev) => prev.filter((_, entryIdx) => entryIdx !== idx))}
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
            {isEditing ? (
              <div className={styles.inlineGrid}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={contact.full_name}
                  onChange={(e) => updateContact(idx, 'full_name', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={contact.title}
                  onChange={(e) => updateContact(idx, 'title', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => updateContact(idx, 'email', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={contact.phone}
                  onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
              </div>
            ) : (
              <div className={styles.detailStack}>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>Title:</span>
                  <span className={styles.detailValue}>{contact.title || 'â€"'}</span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className={styles.detailValueLink}>
                        {contact.email}
                      </a>
                    ) : (
                      'â€"'
                    )}
                  </span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{contact.phone || 'â€"'}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {isEditing && (
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={() =>
            setContactDrafts((prev) => [
              ...prev,
              { full_name: '', title: '', email: '', phone: '', is_primary: !prev.some((c) => c.is_primary) },
            ])
          }
          disabled={saving}
        >
          + Add contact
        </button>
      )}
    </>
  );

  const renderWorksitesCard = () => (
    <>
      <div className={styles.contactList}>
        {worksiteDrafts.map((site, idx) => (
          <div key={`worksite-${idx}`} className={styles.listCard}>
            <div className={styles.listCardHeader}>
              <div className={styles.listCardTitle}>{site.name || `Location ${idx + 1}`}</div>
              {isEditing && worksiteDrafts.length > 1 && (
                <button
                  type="button"
                  className={styles.smallGhostButton}
                  onClick={() => setWorksiteDrafts((prev) => prev.filter((_, entryIdx) => entryIdx !== idx))}
                  disabled={saving}
                >
                  Remove
                </button>
              )}
            </div>
            {isEditing ? (
              <div className={styles.inlineGrid}>
                <input
                  type="text"
                  placeholder="Worksite name"
                  value={site.name}
                  onChange={(e) => updateWorksite(idx, 'name', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="Street"
                  value={site.street}
                  onChange={(e) => updateWorksite(idx, 'street', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={site.city}
                  onChange={(e) => updateWorksite(idx, 'city', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={site.state}
                  onChange={(e) => updateWorksite(idx, 'state', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={site.zip}
                  onChange={(e) => updateWorksite(idx, 'zip', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
                <input
                  type="text"
                  placeholder="County"
                  value={site.county}
                  onChange={(e) => updateWorksite(idx, 'county', e.target.value)}
                  className={styles.editInput}
                  disabled={saving}
                />
              </div>
            ) : (
              <div className={styles.detailStack}>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>Street:</span>
                  <span className={styles.detailValue}>{site.street || 'Ã¢â‚¬â€'}</span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>City:</span>
                  <span className={styles.detailValue}>{site.city || 'Ã¢â‚¬â€'}</span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>State:</span>
                  <span className={styles.detailValue}>{site.state || 'Ã¢â‚¬â€'}</span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>ZIP:</span>
                  <span className={styles.detailValue}>{site.zip || 'Ã¢â‚¬â€'}</span>
                </div>
                <div className={`${styles.detailInline} ${styles.detailInlineTight}`}>
                  <span className={styles.detailLabel}>County:</span>
                  <span className={styles.detailValue}>{site.county || 'Ã¢â‚¬â€'}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {isEditing && (
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={() =>
            setWorksiteDrafts((prev) => [
              ...prev,
              { name: '', street: '', city: '', state: '', zip: '', county: '' },
            ])
          }
          disabled={saving}
        >
          + Add worksite
        </button>
      )}
    </>
  );

  const renderProposalsCard = () => (
    <>
      {proposals.length === 0 ? (
        <p className={styles.notesText}>No proposals yet.</p>
      ) : (
        <div className={styles.contactList}>
          {proposals.map((proposal) => (
            <div key={proposal.id} className={styles.listCard}>
              <div className={styles.listCardHeader}>
                <div className={styles.listCardTitle}>
                  <span>{`${displayName} Proposal`}</span>
                  <span className={styles.badge}>{formatStatus(proposal.status)}</span>
                </div>
                <Link href={`/gf1/proposals/${proposal.id}`} className={styles.smallGhostButton}>
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const dialHref = (value: string) => `tel:${value.replace(/[^\d+]/g, '')}`;
  const textHref = (value: string) => `sms:${value.replace(/[^\d+]/g, '')}`;
  const teamsMeetingHref = (email: string | null, orgName: string | null) => {
    const params = new URLSearchParams();
    params.set('subject', `Follow up - ${orgName || displayName || 'Organization'}`);
    if (email) params.set('attendees', email);
    return `https://teams.microsoft.com/l/meeting/new?${params.toString()}`;
  };

  const renderSalesProgressCard = () => (
    <div className={styles.salesProgressWidget}>
      <div className={styles.salesProgressHeaderRow}>
        <span className={styles.salesProgressPercent}>Progress</span>
      </div>
      <div className={styles.salesProgressBarTrack} aria-label="Sales process completion progress">
        <div className={styles.salesProgressBarFill} style={{ width: `${salesProgressPercent}%` }} />
      </div>
      <p className={styles.salesProgressHint}>
        {`${salesProgressCompletedSteps} of ${salesProgressSteps.length} milestones completed`}
      </p>
      <div className={styles.salesProgressTabs} role="tablist" aria-label="Sales progress stage tabs">
        {salesProgressSections.map((section) => {
          const isActive = activeSalesProgressSection?.stage === section.stage;
          const isCompleted = section.totalWeight > 0 && section.completedWeight >= section.totalWeight;
          return (
            <button
              key={section.stage}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.salesProgressTab} ${isActive ? styles.salesProgressTabActive : ''}`}
              onClick={() => setSalesProgressStageTab(section.stage)}
            >
              <span className={styles.salesProgressTabLabel}>
                <span>{section.label.replace(' Stage', '')}</span>
                {isCompleted ? (
                  <span className={styles.salesProgressTabDone} aria-label={`${section.label} completed`} title={`${section.label} completed`}>
                    ✓
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {activeSalesProgressSection && (
        <div className={styles.salesProgressList}>
          {activeSalesProgressSection.steps.map((step) => (
            <div
              key={step.key}
              className={`${styles.salesProgressItem} ${
                step.completed ? styles.salesProgressItemComplete : styles.salesProgressItemPending
              }`}
            >
              <span className={styles.salesProgressItemIcon} aria-hidden>
                {step.completed ? '✓' : '○'}
              </span>
              <span className={styles.salesProgressItemLabel}>{step.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivityContactWidget = () => (
    <div className={styles.activityContactWidget}>
      {contactDrafts.map((contact, idx) => {
        const email = contact.email || null;
        const phone = contact.phone || null;
        const name = contact.full_name || `Contact ${idx + 1}`;
        const mailSubject = `Following up — ${displayName}`;
        return (
          <div key={idx} className={styles.activityContactRow}>
            <div className={styles.activityContactWidgetNameRow}>
              <span className={styles.activityContactWidgetName}>{name}</span>
              {contact.is_primary && <span className={styles.badge}>Primary</span>}
            </div>
            <div className={styles.activityActionsRow}>
              {email ? (
                <a
                  className={styles.smallGhostButton}
                  href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(mailSubject)}`}
                >
                  Email
                </a>
              ) : (
                <span className={`${styles.smallGhostButton} ${styles.smallGhostButtonDisabled}`}>Email</span>
              )}
              <a
                className={styles.smallGhostButton}
                href={teamsMeetingHref(email, displayName)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Teams Meeting
              </a>
              {phone ? (
                <a className={styles.smallGhostButton} href={dialHref(phone)}>Call</a>
              ) : (
                <span className={`${styles.smallGhostButton} ${styles.smallGhostButtonDisabled}`}>Call</span>
              )}
              {phone ? (
                <a className={styles.smallGhostButton} href={textHref(phone)}>Text</a>
              ) : (
                <span className={`${styles.smallGhostButton} ${styles.smallGhostButtonDisabled}`}>Text</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderActivityCard = () => {
    const visibleActivityItems = activityItems.slice(0, 2);
    const hiddenActivityItems = activityItems.slice(2);
    const renderActivityEntry = (entry: OrganizationActivityItem) => {
      const contactName = entry.contactName || primaryContact?.full_name || organization.primary_contact_name || 'Primary contact';
      const activityLabel =
        entry.eventType === 'intake_sent'
          ? 'Prospect Form Sent'
          : entry.eventType === 'intake_generated'
            ? 'Intake Link Generated'
            : formatContactChannel(entry.channel);

      return (
        <div key={entry.id} className={styles.listCard}>
          <div className={styles.listCardHeader}>
            <div className={styles.listCardTitle}>
              <span>{activityLabel}</span>
              {entry.gotResponse && <span className={styles.badge}>Response</span>}
            </div>
            <div className={styles.activityTimestamp}>{formatDateTime(entry.contactedAt)}</div>
          </div>
          <div className={styles.activityMetaRow}>
            <span className={styles.activityMetaChip}>
              <span className={styles.activityMetaLabel}>Logged by</span>
              <span>{entry.contactedByName ?? 'System'}</span>
            </span>
            <span className={styles.activityMetaChip}>
              <span className={styles.activityMetaLabel}>Contact</span>
              <span>{contactName}</span>
            </span>
            {entry.followUpType && (
              <span className={styles.activityMetaChip}>
                <span className={styles.activityMetaLabel}>Follow-up</span>
                <span>{formatFollowUpType(entry.followUpType)}</span>
              </span>
            )}
            {entry.followUpAt && (
              <span className={styles.activityMetaChip}>
                <span className={styles.activityMetaLabel}>Due</span>
                <span>{formatDateTime(entry.followUpAt)}</span>
              </span>
            )}
          </div>
          {entry.notes && (
            <div className={styles.activityNotesBlock}>
              <div className={styles.activitySectionLabel}>Notes</div>
              <p className={styles.activityNotes}>{entry.notes}</p>
            </div>
          )}
          {entry.responseNotes && (
            <div className={styles.activityResponseBlock}>
              <div className={styles.activitySectionLabel}>Response Notes</div>
              <p className={styles.activityResponseNotes}>{entry.responseNotes}</p>
            </div>
          )}
        </div>
      );
    };

    return (
      <>
        {activityItems.length === 0 ? (
          <p className={styles.notesText}>No contact activity logged yet.</p>
        ) : (
          <div className={styles.contactList}>
            {visibleActivityItems.map(renderActivityEntry)}
            {hiddenActivityItems.length > 0 ? (
              <details className={styles.activityMore}>
                <summary className={styles.activityMoreSummary}>
                  <span>{`Show ${hiddenActivityItems.length} older activit${hiddenActivityItems.length === 1 ? 'y' : 'ies'}`}</span>
                </summary>
                <div className={styles.activityMoreList}>
                  {hiddenActivityItems.map(renderActivityEntry)}
                </div>
              </details>
            ) : null}
          </div>
        )}
      </>
    );
  };


  const taxSection = !isLead
    ? renderSection(
        'tax',
        'Tax IDs & Ownership',
        <div className={styles.detailsTable}>
          {renderTextRow('Primary FEIN', 'fein')}
          {renderTextRow('Additional FEINs', 'additional_feins')}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Owners (one per line)</span>
            <span className={styles.detailValue}>
              {isEditing ? (
                <textarea
                  className={`${styles.editInput} ${styles.textarea}`}
                  value={form.owners_list}
                  onChange={(e) => setForm((prev) => ({ ...prev, owners_list: e.target.value }))}
                  placeholder="Jane Doe - 60%"
                  rows={4}
                  disabled={saving}
                />
              ) : form.owners_list ? (
                <div className={styles.multiLineValue}>{form.owners_list}</div>
              ) : (
                'â€"'
              )}
            </span>
          </div>
        </div>
      )
    : null;

  return (
    <div className={styles.wrapper}>
      <EmailComposeModal
        isOpen={composeModal !== null}
        onClose={() => setComposeModal(null)}
        initialTo={composeModal?.to ?? ''}
        initialSubject={composeModal?.subject ?? ''}
        returnPath={pathname}
        isConnected={msConnected}
      />
      {showDealLostModal && (
        <DealLostModal
          organizationId={organization.id}
          organizationName={displayName}
          currentStatus={form.status}
          onClose={() => setShowDealLostModal(false)}
          onSuccess={() => {
            setShowDealLostModal(false);
            setForm((prev) => ({ ...prev, status: 'lead' }));
            router.refresh();
          }}
        />
      )}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div
              className={`${styles.orgLogo} ${isEditing ? styles.logoEditable : ''}`}
              role={isEditing ? 'button' : undefined}
              tabIndex={isEditing ? 0 : -1}
              aria-label={isEditing ? 'Change organization logo' : undefined}
              onClick={isEditing ? openLogoPicker : undefined}
              onKeyDown={handleLogoKeyDown}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={displayName} className={styles.orgLogoImg} />
              ) : (
                <div className={styles.logoFallback}>
                  <span className={styles.logoInitials}>{initials}</span>
                </div>
              )}
              {isEditing && (
                <div className={styles.logoOverlay}>{logoStatus === 'uploading' ? 'Uploading...' : 'Change photo'}</div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className={styles.logoInput}
              onChange={handleLogoChange}
            />
            {logoMessage && (
              <p
                className={`${styles.logoStatusMessage} ${
                  logoStatus === 'error' ? styles.logoStatusError : styles.logoStatusSuccess
                }`}
              >
                {logoMessage}
              </p>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.orgName}>{displayName}</h1>
            {canonicalLegalName && <p className={styles.legalNameSubtext}>{canonicalLegalName}</p>}
            <div className={styles.statusRow}>
              <div
                className={`${styles.statusBadge} ${isEditing ? styles.statusBadgeEditing : ''}`}
                style={{ color: getStatusColor(form.status) }}
              >
                {isEditing ? (
                  <span className={`${styles.statusSelectWrap} ${statusSelectOpen ? styles.statusSelectWrapOpen : ''}`}>
                    <select
                      className={styles.statusSelect}
                      value={form.status}
                      onMouseDown={() => setStatusSelectOpen((prev) => !prev)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Tab') setStatusSelectOpen(false);
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                          setStatusSelectOpen(true);
                        }
                      }}
                      onBlur={() => setStatusSelectOpen(false)}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, status: e.target.value }));
                        setStatusSelectOpen(false);
                      }}
                      disabled={saving}
                    >
                      <option value="lead">Suspect</option>
                      <option value="prospect">Prospect</option>
                      <option value="client">Client</option>
                    </select>
                  </span>
                ) : (
                  form.status || 'Unknown'
                )}
              </div>
              {!isLead && (
                <button
                  type="button"
                  className={styles.dealLostButton}
                  onClick={() => setShowDealLostModal(true)}
                  disabled={saving}
                >
                  <i className="fas fa-flag" />
                  <span>Deal Lost</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.quickActionsHeader}>
          <div className={`${styles.actionButtons} ${isClient ? styles.actionButtonsClient : !isLead ? styles.actionButtonsCompact : ''}`}>
            {isLead ? (
              <div className={`${styles.actionButton} ${styles.actionButtonDisabled}`}>
                <i className="fas fa-lock"></i>
                <div className={styles.actionButtonTextStack}>
                  <span>Generate Proposal</span>
                </div>
              </div>
            ) : (
              <Link href={`/gf1/proposals/new?org=${organization.id}`} className={styles.actionButton}>
                <i className="fas fa-file-alt"></i>
                <span>Generate Proposal</span>
              </Link>
            )}
            {!isClient ? (
              <div className={`${styles.actionButton} ${styles.actionButtonDisabled}`}>
                <i className="fas fa-lock"></i>
                <div className={styles.actionButtonTextStack}>
                  <span>YTD Commission Report</span>
                </div>
              </div>
            ) : (
              <Link href={`/gf1/reports/ytd-commission?org=${organization.id}`} className={styles.actionButton}>
                <i className="fas fa-chart-line"></i>
                <span>YTD Commission Report</span>
              </Link>
            )}
            <button onClick={exportCsv} className={styles.actionButton} type="button">
              <i className="fa-solid fa-file-csv"></i>
              <span>Export Organization Info</span>
            </button>
          </div>
        </div>

        <div className={styles.headerMeta}>
          <div className={styles.quickStats}>
            {organization.annual_admin_fees !== null && organization.annual_admin_fees !== undefined && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Annual Admin Fees</span>
                <span className={styles.statValue}>{formatCurrency(organization.annual_admin_fees)}</span>
              </div>
            )}
            {organization.annual_commission !== null && organization.annual_commission !== undefined && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Annual Commission</span>
                <span className={styles.statValue}>{formatCurrency(organization.annual_commission)}</span>
              </div>
            )}
            {salesRepName && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Sales Rep</span>
                <span className={styles.statValue}>{salesRepName}</span>
              </div>
            )}
            {isClient && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Close Date</span>
                <span className={styles.statValue}>{closeDate}</span>
              </div>
            )}
            {isClient && (organization as { go_live_date?: string | null }).go_live_date && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Go-Live Date</span>
                <span className={styles.statValue}>{goLiveDate}</span>
              </div>
            )}
            <div className={styles.stat}>
              <span className={styles.statLabel}>Date Added</span>
              <span className={styles.statValue}>{createdDate}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Employees</span>
              <span className={styles.statValue}>{form.total_employees || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabsWrap}>
        <div className={styles.tabs} role="tablist" aria-label="Organization details tabs" style={tabVars}>
          {tabOptions.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setViewedTabs((prev) => new Set([...prev, tab.key]));
                }}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && !viewedTabs.has(tab.key) && (
                  <span className={`${styles.tabCount} ${isActive ? styles.tabCountActive : ''}`}>{tab.count}</span>
                )}
              </button>
            );
          })}
          <span className={styles.tabGlider} aria-hidden />
        </div>
      </div>

      <div className={styles.mainContent}>
        {currentTab === 'activity' && (
          <div className={styles.fullWidthRow}>
            {renderActivityContactWidget()}
          </div>
        )}
        {(currentTab !== 'pipeline' || isLead) && (
          <div className={`${styles.leftColumn} ${isLeadPipelineLayout ? styles.equalHeightColumn : ''}`}>
          {currentTab === 'overview' &&
            renderSection(
              'identity',
              'Identity & Profile',
              <>
                {isLead && (
                  <div className={styles.leadNotice}>
                    <strong>Limited view:</strong> Full organization fields populate automatically after the prospect intake form is submitted.
                  </div>
                )}
                <div className={styles.detailsTable}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sales Rep</span>
                  <span className={styles.detailValue}>
                    {isEditing && isAdmin ? (
                      <select
                        value={form.assigned_sales_rep_id}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          const selected = assignees.find((user) => user.id === nextId);
                          setForm((prev) => ({
                            ...prev,
                            assigned_sales_rep_id: nextId,
                            sales_rep_name: selected?.full_name ?? '',
                          }));
                        }}
                        className={styles.editInput}
                        disabled={saving}
                      >
                        <option value="">Unassigned</option>
                        {assignees.map((user) => (
                          <option key={user.id} value={user.id || ''}>
                            {user.full_name || ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      salesRepName?.trim() || 'â€"'
                    )}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Commission %</span>
                  <span className={styles.detailValue}>
                    {isEditing && isAdmin ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form.commission_percent}
                        onChange={(e) => setForm((prev) => ({ ...prev, commission_percent: e.target.value }))}
                        className={styles.editInput}
                        disabled={saving}
                      />
                    ) : (
                      `${Number(organization.commission_percent ?? 0).toFixed(2)}%`
                    )}
                  </span>
                </div>
                {isClient && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Implementor</span>
                    <span className={styles.detailValue}>
                      {organization.implementation_owner_name?.trim() || 'Unassigned'}
                    </span>
                  </div>
                )}
                {showFullDetails && renderTextRow('Legal Name', 'legal_name')}
                {renderTextRow('DBA', 'dba_name')}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Website</span>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.website}
                        onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                        className={styles.editInput}
                        disabled={saving}
                      />
                    ) : form.website ? (
                      <a href={form.website} target="_blank" rel="noopener noreferrer" className={styles.detailValueLink}>
                        {form.website}
                      </a>
                    ) : (
                      'â€"'
                    )}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Industry</span>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <select
                        value={form.industry}
                        onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                        className={styles.editInput}
                        disabled={saving}
                      >
                        <option value="">Select</option>
                        {INDUSTRY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      form.industry || 'â€"'
                    )}
                  </span>
                </div>
                {showFullDetails && renderTextRow('NAICS Code', 'naics_code')}
                {showFullDetails && renderTextRow('Company Type', 'company_type')}
                {showFullDetails && renderTextRow('Years in Business', 'years_in_business', { type: 'number' })}
                {showFullDetails && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Description of Operations</span>
                    <span className={styles.detailValue}>
                      {isEditing ? (
                        <textarea
                          className={`${styles.editInput} ${styles.textarea}`}
                          value={form.description_of_operations}
                          onChange={(e) => setForm((prev) => ({ ...prev, description_of_operations: e.target.value }))}
                          rows={3}
                          disabled={saving}
                        />
                      ) : form.description_of_operations ? (
                        <div className={styles.multiLineValue}>{form.description_of_operations}</div>
                      ) : (
                        'â€"'
                      )}
                    </span>
                  </div>
                )}
                </div>
              </>
            )}

          {currentTab === 'people' && renderSection('contacts', 'Contacts', renderContactsCard())}

          {currentTab === 'people' &&
            !isLead &&
            renderSection(
              'additional',
              'Additional Details',
              <div className={`${styles.detailsTable} ${styles.detailLabelBrightGroup}`}>
                <div className={styles.detailRow} style={{ gridTemplateColumns: '1fr' }}>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <textarea
                        className={`${styles.editInput} ${styles.textarea}`}
                        value={form.additional_details}
                        onChange={(e) => setForm((prev) => ({ ...prev, additional_details: e.target.value }))}
                        rows={4}
                        disabled={saving}
                      />
                    ) : form.additional_details ? (
                      <div className={styles.multiLineValue}>{form.additional_details}</div>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                {organization.notes && !isEditing && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Internal Notes</span>
                    <span className={styles.detailValue}>
                      <div className={styles.multiLineValue}>{organization.notes}</div>
                    </span>
                  </div>
                )}
              </div>
            )}
            {currentTab === 'activity' && renderSection('activity', 'Activity', renderActivityCard())}
            {currentTab === 'payroll' && !isLead && taxSection}
            {currentTab === 'payroll' &&
              !isLead &&
              renderSection(
                'compliance',
                'Compliance & Benefits',
                <>
                  {isEditing ? (
                    <div className={styles.flagToggleGrid}>
                      {COMPLIANCE_FLAGS.map((flag) => {
                        const checked = Boolean(flags[flag.key]);
                        return (
                          <label
                            key={flag.key}
                            className={`${styles.flagToggle} ${checked ? styles.flagToggleActive : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setFlags((prev) => ({ ...prev, [flag.key]: e.target.checked }))}
                              disabled={saving}
                            />
                            <span>{flag.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.flagSummary}>
                      {COMPLIANCE_FLAGS.filter((flag) => Boolean(flags[flag.key])).length ? (
                        <div className={styles.pillRow}>
                          {COMPLIANCE_FLAGS.filter((flag) => Boolean(flags[flag.key])).map((flag) => (
                            <span key={flag.key} className={styles.pill}>
                              {flag.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.notesText}>No compliance or benefit flags selected.</p>
                      )}
                    </div>
                  )}
                  <hr className={styles.sectionDivider} />
                  <div className={styles.benefitSection}>
                  <span className={`${styles.detailLabel} ${styles.detailLabelBright}`}>Other Benefit Plans</span>
                    {isEditing ? (
                      <div className={styles.benefitStack}>
                        <div className={styles.benefitToggleTwoCol}>
                          <label className={`${styles.flagToggle} ${otherBenefits.companyPaidGtl ? styles.flagToggleActive : ''}`}>
                            <input
                              type="checkbox"
                              checked={otherBenefits.companyPaidGtl}
                              onChange={(e) => updateOtherBenefits({ companyPaidGtl: e.target.checked })}
                              disabled={saving}
                            />
                            <span>Company Paid GTL (Group Term Life)</span>
                          </label>
                          <label className={`${styles.flagToggle} ${otherBenefits.companyPaidLtd ? styles.flagToggleActive : ''}`}>
                            <input
                              type="checkbox"
                              checked={otherBenefits.companyPaidLtd}
                              onChange={(e) => updateOtherBenefits({ companyPaidLtd: e.target.checked })}
                              disabled={saving}
                            />
                            <span>Company Paid LTD</span>
                          </label>
                          <label className={`${styles.flagToggle} ${otherBenefits.companyPaidStd ? styles.flagToggleActive : ''}`}>
                            <input
                              type="checkbox"
                              checked={otherBenefits.companyPaidStd}
                              onChange={(e) => updateOtherBenefits({ companyPaidStd: e.target.checked })}
                              disabled={saving}
                            />
                            <span>Company Paid STD</span>
                          </label>
                          <label className={`${styles.flagToggle} ${otherBenefits.keepOwnMedical ? styles.flagToggleActive : ''}`}>
                            <input
                              type="checkbox"
                              checked={otherBenefits.keepOwnMedical}
                              onChange={(e) => updateOtherBenefits({ keepOwnMedical: e.target.checked })}
                              disabled={saving}
                            />
                            <span>Keep Own Medical Coverage</span>
                          </label>
                          <label className={`${styles.flagToggle} ${otherBenefits.keepOtherPlans ? styles.flagToggleActive : ''}`}>
                            <input
                              type="checkbox"
                              checked={otherBenefits.keepOtherPlans}
                              onChange={(e) => {
                                const nextChecked = e.target.checked;
                                updateOtherBenefits({
                                  keepOtherPlans: nextChecked,
                                  otherPlanNames: nextChecked ? otherBenefits.otherPlanNames : '',
                                });
                              }}
                              disabled={saving}
                            />
                            <span>Keep Other Plans</span>
                          </label>
                        </div>
                        {(otherBenefits.companyPaidGtl || otherBenefits.companyPaidLtd || otherBenefits.companyPaidStd) && (
                          <p className={styles.benefitNote}>
                            Census required for company-paid life or disability plans.
                          </p>
                        )}
                        {otherBenefits.keepOtherPlans && (
                          <input
                            type="text"
                            className={styles.editInput}
                            placeholder="List other plans to keep (e.g., Vision, Dental)"
                            value={otherBenefits.otherPlanNames}
                            onChange={(e) => updateOtherBenefits({ otherPlanNames: e.target.value })}
                            disabled={saving}
                          />
                        )}
                      </div>
                    ) : (
                      <div className={styles.pillRow}>
                        {[
                          otherBenefits.companyPaidGtl ? 'Company Paid GTL' : null,
                          otherBenefits.companyPaidLtd ? 'Company Paid LTD' : null,
                          otherBenefits.companyPaidStd ? 'Company Paid STD' : null,
                          otherBenefits.keepOwnMedical ? 'Keep Own Medical Coverage' : null,
                          otherBenefits.keepOtherPlans
                            ? otherBenefits.otherPlanNames.trim()
                              ? `Keep Other Plans: ${otherBenefits.otherPlanNames.trim()}`
                              : 'Keep Other Plans'
                            : null,
                        ]
                          .filter(Boolean)
                          .map((label) => (
                            <span key={label as string} className={styles.pill}>
                              {label}
                            </span>
                          ))}
                        {[
                          otherBenefits.companyPaidGtl,
                          otherBenefits.companyPaidLtd,
                          otherBenefits.companyPaidStd,
                          otherBenefits.keepOwnMedical,
                          otherBenefits.keepOtherPlans,
                        ].every((v) => !v) && '\u2014'}
                      </div>
                    )}
                  </div>
                  <div className={styles.detailsTable} style={{ marginTop: '12px' }}>
                    <div className={styles.detailRow}>
                      <span className={`${styles.detailLabel} ${styles.detailLabelBright}`}>Remote States</span>
                      <span className={styles.detailValue}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={form.remote_states}
                            onChange={(e) => setForm((prev) => ({ ...prev, remote_states: e.target.value }))}
                            className={styles.editInput}
                            placeholder="CA, AZ, TX"
                            disabled={saving}
                          />
                        ) : form.remote_states ? (
                          <div className={styles.pillRow}>
                            {form.remote_states
                              .split(',')
                              .map((entry) => entry.trim())
                              .filter(Boolean)
                              .map((entry, idx) => (
                                <span key={`${entry}-${idx}`} className={styles.pill}>
                                  {entry}
                                </span>
                              ))}
                          </div>
                        ) : (
                          'â€"'
                        )}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={`${styles.detailLabel} ${styles.detailLabelBright}`}>States needing W/C</span>
                      <span className={styles.detailValue}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={form.wc_states_list}
                            onChange={(e) => setForm((prev) => ({ ...prev, wc_states_list: e.target.value }))}
                            className={styles.editInput}
                            placeholder="CA, AZ, TX"
                            disabled={saving}
                          />
                        ) : form.wc_states_list ? (
                          <div className={styles.pillRow}>
                            {form.wc_states_list
                              .split(',')
                              .map((entry) => entry.trim())
                              .filter(Boolean)
                              .map((entry, idx) => (
                                <span key={`${entry}-${idx}`} className={styles.pill}>
                                  {entry}
                                </span>
                              ))}
                          </div>
                        ) : (
                          'â€"'
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}
            {currentTab === 'overview' && dealLossReport && (
              <div className={styles.dealLossWidget}>
                <div className={styles.dealLossWidgetHeader}>
                  <i className={`fas fa-flag ${styles.dealLossWidgetIcon}`} />
                  <span className={styles.dealLossWidgetTitle}>
                    Why We Lost {displayName}
                  </span>
                  <span className={styles.dealLossWidgetDate}>
                    {new Date(dealLossReport.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className={styles.dealLossWidgetBody}>
                  {dealLossReport.primary_reason && (
                    <div className={styles.dealLossRow}>
                      <span className={styles.dealLossRowLabel}>Primary Reason</span>
                      <span className={styles.dealLossRowValue}>{dealLossReport.primary_reason}</span>
                    </div>
                  )}
                  {dealLossReport.competitor_name && (
                    <div className={styles.dealLossRow}>
                      <span className={styles.dealLossRowLabel}>Competitor</span>
                      <span className={styles.dealLossRowValue}>{dealLossReport.competitor_name}</span>
                    </div>
                  )}
                  {dealLossReport.return_probability && (
                    <div className={styles.dealLossRow}>
                      <span className={styles.dealLossRowLabel}>Probability of Return</span>
                      <span className={styles.dealLossRowValue}>{dealLossReport.return_probability}</span>
                    </div>
                  )}
                  {dealLossReport.what_could_improve && (
                    <div className={styles.dealLossRow}>
                      <span className={styles.dealLossRowLabel}>What Could Have Been Done Differently</span>
                      <span className={styles.dealLossRowValue}>{dealLossReport.what_could_improve}</span>
                    </div>
                  )}
                  {dealLossReport.additional_notes && (
                    <div className={styles.dealLossRow}>
                      <span className={styles.dealLossRowLabel}>Additional Notes</span>
                      <span className={styles.dealLossRowValue}>{dealLossReport.additional_notes}</span>
                    </div>
                  )}
                  {dealLossReport.pdf_url && (
                    <div className={styles.dealLossActions}>
                      <a
                        href={dealLossReport.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.dealLossDownloadButton}
                      >
                        <i className="fas fa-file-pdf" />
                        <span>Download Report</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            {isLeadPipelineLayout && renderSection('proposals', 'Proposals', renderProposalsCard())}
          </div>
        )}

        {showRightColumn && (
          <div className={`${styles.rightColumn} ${isLeadPipelineLayout ? styles.equalHeightColumn : ''}`}>
          {currentTab === 'activity' && renderSection('salesProgress', 'Sales Progress', renderSalesProgressCard())}
          {currentTab === 'overview' &&
            renderSection(
              'headquarters',
              'Business Address',
              <div className={styles.detailsTable}>
                {renderTextRow('Address Line 1', 'address_line1')}
                {renderTextRow('Address Line 2', 'address_line2')}
                {renderTextRow('City', 'city')}
                {renderTextRow('State', 'state')}
                {renderTextRow('Postal Code', 'postal_code')}
                {renderTextRow('County', 'address_county')}
                {renderTextRow('Country', 'country')}
              </div>
            )}
          {currentTab === 'people' &&
            !isLead &&
            renderSection('worksites', 'Worksites', renderWorksitesCard())}
          {currentTab === 'payroll' &&
            !isLead &&
            renderSection(
              'employees',
              'Employees & Payroll',
              <div className={styles.detailsTable}>
                {renderTextRow('Total Employees', 'total_employees', { type: 'number' })}
                {renderTextRow('Full-time', 'full_time_employees', { type: 'number' })}
                {renderTextRow('Part-time', 'part_time_employees', { type: 'number' })}
                {renderTextRow('Commission-only', 'commission_only_employees', { type: 'number' })}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Pay Frequency</span>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <select
                        value={form.pay_frequency}
                        onChange={(e) => setForm((prev) => ({ ...prev, pay_frequency: e.target.value }))}
                        className={styles.editInput}
                        disabled={saving}
                      >
                        <option value="">Select</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="semimonthly">Semi-monthly</option>
                        <option value="monthly">Monthly</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      form.pay_frequency || 'â€"'
                    )}
                  </span>
                </div>
                {renderTextRow('Pay Frequency (Other)', 'pay_frequency_other')}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Payroll Submission Method</span>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <select
                        value={form.payroll_submission_method}
                        onChange={(e) => setForm((prev) => ({ ...prev, payroll_submission_method: e.target.value }))}
                        className={styles.editInput}
                        disabled={saving}
                      >
                        <option value="">Select</option>
                        {PAYROLL_SUBMISSION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      form.payroll_submission_method || 'â€"'
                    )}
                  </span>
                </div>
                {renderTextRow('First Check Date', 'first_check_date', { type: 'date' })}
                {renderTextRow('First Period Start', 'first_period_start', { type: 'date' })}
                {renderTextRow('First Period End', 'first_period_end', { type: 'date' })}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Pay Schedule Notes</span>
                  <span className={styles.detailValue}>
                    {isEditing ? (
                      <textarea
                        className={`${styles.editInput} ${styles.textarea}`}
                        value={form.pay_schedule_notes}
                        onChange={(e) => setForm((prev) => ({ ...prev, pay_schedule_notes: e.target.value }))}
                        rows={3}
                        disabled={saving}
                      />
                    ) : form.pay_schedule_notes ? (
                      <div className={styles.multiLineValue}>{form.pay_schedule_notes}</div>
                    ) : (
                      'â€"'
                    )}
                  </span>
                </div>
                {renderTextRow('Current Payroll Provider', 'current_payroll_provider')}
              </div>
            )}
          {currentTab === 'payroll' &&
            !isLead &&
            flags.wants_galactic_retirement_flag &&
            renderSection(
              'retirement-questionnaire',
              '401(k) Plan Questionnaire',
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.65)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {retirementQuestionnairePdfUrl
                    ? 'The 401(k) plan questionnaire has been completed for this prospect. View the filled PDF below.'
                    : "This prospect is interested in Galactic's 401(k) plan. Generate a link to the questionnaire or send it directly to the primary contact. Once submitted, you'll receive an email with the filled PDF attached."}
                </p>
                <RetirementQuestionnaireActions
                  organizationId={organization.id}
                  primaryContactEmail={primaryContact?.email ?? organization.primary_contact_email ?? null}
                  submittedPdfUrl={retirementQuestionnairePdfUrl}
                />
              </div>
            )}
          {currentTab === 'pipeline' &&
            isLead &&
            renderSection(
              'prospect',
              'Prospect Information Form',
              <div className={styles.prospectIntakeBlock}>
                <p className={styles.prospectIntakeText}>
                  Share the secure intake form with this suspect. Once they submit it, the organization will move into the prospect stage and all prospect data will stay synced here.
                </p>
                <ProspectIntakeActions
                  organizationId={organization.id}
                  primaryContactEmail={primaryContact?.email ?? organization.primary_contact_email ?? null}
                />
              </div>
            )}
          </div>
        )}

        {currentTab === 'pipeline' && !isLead && (
          <div className={styles.fullWidthRow}>{renderSection('proposals', 'Proposals', renderProposalsCard())}</div>
        )}
      </div>

      {currentTab !== 'activity' && currentTab !== 'pipeline' && (
        <>
          <div className={styles.bottomSaveBar}>
            <button onClick={handleSave} className={styles.actionButtonSave} disabled={saving} type="button">
              <i className="fas fa-save"></i>
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
        </>
      )}
    </div>
  );

}


