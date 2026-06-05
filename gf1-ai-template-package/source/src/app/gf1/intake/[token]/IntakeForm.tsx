'use client';

import { useMemo, useState, useActionState, useEffect } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import type { Gf1ContactRecord, Gf1OrganizationProfile, Gf1Worksite } from '@/lib/gf1/types';
import { submitIntakeAction, type IntakeSubmitState } from './actions';
import ProposalGeneratorStyles from '../../../(protected)/gf1/proposals/_components/ProposalGenerator.module.css';

type ContactDraft = {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  is_primary: boolean;
};

type CompanyAddressState = {
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

type Props = {
  token: string;
  organization: Gf1OrganizationProfile;
  contacts: Gf1ContactRecord[];
  worksites: Gf1Worksite[];
};

const STEP_LABELS = ['Company', 'Contacts', 'Worksites', 'Employees', 'Compliance', 'Tax IDs', 'Files'];
const TOTAL_STEPS = STEP_LABELS.length;

const COMPLIANCE_FLAGS = [
  { name: 'bankruptcy_flag', label: 'Has bankruptcy history' },
  { name: 'lawsuits_flag', label: 'Open lawsuits' },
  { name: 'controlled_group_flag', label: 'Part of a controlled group' },
  { name: 'multi_state_flag', label: 'Operates in multiple states' },
  { name: 'local_taxes_flag', label: 'Subject to local payroll taxes' },
  { name: 'regular_commissions_or_bonuses_flag', label: 'Regular commissions or bonuses' },
  { name: 'has_remote_employees_flag', label: 'Remote employees' },
  { name: 'has_1099s_flag', label: 'Pays 1099 contractors' },
  { name: 'employees_live_vs_work_state_flag', label: 'Employees live in different states than they work' },
  { name: 'offers_health_flag', label: 'Offers health benefits today' },
  { name: 'offers_dental_flag', label: 'Offers dental' },
  { name: 'offers_vision_flag', label: 'Offers vision' },
  { name: 'pto_tracking_needed_flag', label: 'Needs PTO tracking' },
  { name: 'has_retirement_plan_flag', label: 'Has retirement plan' },
  { name: 'wants_galactic_retirement_flag', label: 'Interested in Galactic 401(k)' },
  { name: 'gl_import_needed_flag', label: 'Needs GL import' },
  { name: 'large_employer_aca_flag', label: 'Large employer for ACA' },
  { name: 'labor_posters_needed_flag', label: 'Needs labor posters' },
  { name: 'timekeeping_needed_flag', label: 'Needs timekeeping' },
  { name: 'background_checks_needed_flag', label: 'Needs background checks' },
  { name: 'drug_screenings_needed_flag', label: 'Needs drug screenings' },
  { name: 'wants_wotc_flag', label: 'Interested in WOTC' },
  { name: 'ats_needed_flag', label: 'Needs ATS' },
  { name: 'additional_reporting_needed_flag', label: 'Requests additional reporting' },
] as const;

const PAY_SCHEDULES: Record<string, Array<{ id: string; label: string }>> = {
  weekly: [
    { id: 'W1PE3B',   label: 'Weekly Paid Monday - Period Ends Friday Before' },
    { id: 'W2PE5B',   label: 'Weekly Paid Tuesday - Period Ends Friday Before' },
    { id: 'W2PE6B',   label: 'Weekly Paid Tuesday - Period Ends Saturday Before' },
    { id: 'W2PE7B',   label: 'Weekly Paid Tuesday - Period Ends Sunday Before' },
    { id: 'W3PE4B',   label: 'Weekly Paid Wednesday - Period Ends Thursday Before' },
    { id: 'W3PE5B',   label: 'Weekly Paid Wednesday - Period Ends Friday Before' },
    { id: 'W3PE6B',   label: 'Weekly Paid Wednesday - Period Ends Saturday Before' },
    { id: 'W3PE7B',   label: 'Weekly Paid Wednesday - Period Ends Sunday Before' },
    { id: 'W4PE23B',  label: 'Weekly Paid Thursday - Period Ends Two Wednesdays Before' },
    { id: 'W4PE3B',   label: 'Weekly Paid Thursday - Period Ends Monday Before' },
    { id: 'W4PE4B',   label: 'Weekly Paid Thursday - Period Ends Sunday Before' },
    { id: 'W4PE6B',   label: 'Weekly Paid Thursday - Period Ends Saturday Before' },
    { id: 'W5PE0B',   label: 'Weekly Paid Friday - Period Ends Friday Same Day' },
    { id: 'W5PE27B',  label: 'Weekly Paid Friday - Period Ends 2 Sundays Before' },
    { id: 'W5PE2B',   label: 'Weekly Paid Friday - Period Ends Tuesday Before' },
    { id: 'W5PE3',    label: 'Weekly Paid Friday - Period Ends Wednesday' },
    { id: 'W5PE4',    label: 'Weekly Paid Friday - Period Ends Thursday' },
    { id: 'W5PE4B',   label: 'Weekly Paid Friday - Period Ends Thursday Before' },
    { id: 'W5PE5B',   label: 'Weekly Paid Friday - Period Ends Friday Before' },
    { id: 'W5PE6B',   label: 'Weekly Paid Friday - Period Ends Saturday Before' },
    { id: 'W5PE7B',   label: 'Weekly Paid Friday - Period Ends Sunday Before' },
  ],
  semimonthly: [
    { id: 'S15EOMPE1227',    label: 'Semi-Monthly Paid 15th & EOM - Period Ends 12th & 27th' },
    { id: 'S15EOMPE14EOM',   label: 'Semi-Monthly Paid 15th & EOM - Period Ends 14th & EOM' },
    { id: 'S15EOMPE15THEOM', label: 'Semi-Monthly Paid 15th & EOM - Period Ends EOM & 15th' },
    { id: 'S15EOMPE217',     label: 'Semi-Monthly Paid 15th & EOM - Period Ends 2nd & 17th' },
    { id: 'S15EOMPE2610',    label: 'Semi-Monthly Paid 15th & EOM - Period Ends 26th & 10th' },
    { id: 'S1EOMPE1025',     label: 'Semi-Monthly Paid 1st & 15th - Period Ends 10th & 25th' },
    { id: 'S218',            label: 'Semi-Monthly Paid 2nd & 18th - Period Ends Same Day' },
    { id: 'S318',            label: 'Semi-Monthly Paid 3rd & 18th - Period Ends 15th & EOM' },
    { id: 'S520',            label: 'Semi-Monthly Paid 5th & 20th - Period Ends 15th & EOM' },
    { id: 'S520-312',        label: 'Semi-Monthly Paid 1st & 3rd Friday - Period Ends 2 Days Before' },
    { id: 'SM521',           label: 'Semi-Monthly Paid 15th & 21st - Period Ends 15th & EOM' },
  ],
  biweekly: [
    { id: 'W1PE3B',   label: 'Biweekly Paid Monday - Period Ends Friday Before' },
    { id: 'W2PE5B',   label: 'Biweekly Paid Tuesday - Period Ends Friday Before' },
    { id: 'W2PE6B',   label: 'Biweekly Paid Tuesday - Period Ends Saturday Before' },
    { id: 'W2PE7B',   label: 'Biweekly Paid Tuesday - Period Ends Sunday Before' },
    { id: 'W3PE4B',   label: 'Biweekly Paid Wednesday - Period Ends Thursday Before' },
    { id: 'W3PE5B',   label: 'Biweekly Paid Wednesday - Period Ends Friday Before' },
    { id: 'W3PE6B',   label: 'Biweekly Paid Wednesday - Period Ends Saturday Before' },
    { id: 'W3PE7B',   label: 'Biweekly Paid Wednesday - Period Ends Sunday Before' },
    { id: 'W4PE23B',  label: 'Biweekly Paid Thursday - Period Ends Two Wednesdays Before' },
    { id: 'W4PE3B',   label: 'Biweekly Paid Thursday - Period Ends Monday Before' },
    { id: 'W4PE4B',   label: 'Biweekly Paid Thursday - Period Ends Sunday Before' },
    { id: 'W4PE6B',   label: 'Biweekly Paid Thursday - Period Ends Saturday Before' },
    { id: 'W5PE0B',   label: 'Biweekly Paid Friday - Period Ends Friday Same Day' },
    { id: 'W5PE27B',  label: 'Biweekly Paid Friday - Period Ends 2 Sundays Before' },
    { id: 'W5PE2B',   label: 'Biweekly Paid Friday - Period Ends Tuesday Before' },
    { id: 'W5PE3',    label: 'Biweekly Paid Friday - Period Ends Wednesday' },
    { id: 'W5PE4',    label: 'Biweekly Paid Friday - Period Ends Thursday' },
    { id: 'W5PE4B',   label: 'Biweekly Paid Friday - Period Ends Thursday Before' },
    { id: 'W5PE5B',   label: 'Biweekly Paid Friday - Period Ends Friday Before' },
    { id: 'W5PE6B',   label: 'Biweekly Paid Friday - Period Ends Saturday Before' },
    { id: 'W5PE7B',   label: 'Biweekly Paid Friday - Period Ends Sunday Before' },
  ],
  monthly: [
    { id: 'M10EOM',     label: 'Monthly Paid 10th - Period Ends EOM' },
    { id: 'M1EOM',      label: 'Monthly Paid 1st - Period Ends EOM' },
    { id: 'M1PEOM',     label: 'Monthly Paid 1st - Period Ends End of Prior Month' },
    { id: 'M28EOM',     label: 'Monthly Paid 28th - Period Ends EOM' },
    { id: 'M2EOM',      label: 'Monthly Paid 2nd - Period Ends EOM' },
    { id: 'M30EOM',     label: 'Monthly Paid 30th - Period Ends End of Prior Month' },
    { id: 'M5EOM',      label: 'Monthly Paid 5th - Period Ends End of Prior Month' },
    { id: 'M8EOM',      label: 'Monthly Paid 8th - Period Ends EOM' },
    { id: 'MEOMEOM',    label: 'Monthly Paid EOM - Period Ends EOM' },
    { id: 'MEOMPE16',   label: 'Monthly Paid End of Month - Period Ends on 16th of Month' },
    { id: 'MEOMPEOM',   label: 'Monthly Paid End of Month - Period Ends End of Next Month' },
    { id: 'MON15EOM',   label: 'Monthly Paid 15th - Period Ends EOM' },
    { id: 'MPEOM7',     label: 'Monthly Paid 7th - Period Ends EOM' },
  ],
  other: [
    { id: 'PSANNUAL',  label: 'One Time Annual Payroll' },
    { id: 'QUARTER',   label: 'Quarterly' },
  ],
};

const SCHEDULE_NOTES: Record<string, string> = {
  // Weekly – Monday
  'weekly:W1PE3B':    'Weekly, paid Monday. Period ends Friday before pay date.',
  'biweekly:W1PE3B':  'Biweekly, paid Monday. Period ends Friday before pay date.',
  // Weekly – Tuesday
  'weekly:W2PE5B':    'Weekly, paid Tuesday. Period ends Friday before pay date.',
  'weekly:W2PE6B':    'Weekly, paid Tuesday. Period ends Saturday before pay date.',
  'weekly:W2PE7B':    'Weekly, paid Tuesday. Period ends Sunday before pay date.',
  'biweekly:W2PE5B':  'Biweekly, paid Tuesday. Period ends Friday before pay date.',
  'biweekly:W2PE6B':  'Biweekly, paid Tuesday. Period ends Saturday before pay date.',
  'biweekly:W2PE7B':  'Biweekly, paid Tuesday. Period ends Sunday before pay date.',
  // Weekly – Wednesday
  'weekly:W3PE4B':    'Weekly, paid Wednesday. Period ends Thursday before pay date.',
  'weekly:W3PE5B':    'Weekly, paid Wednesday. Period ends Friday before pay date.',
  'weekly:W3PE6B':    'Weekly, paid Wednesday. Period ends Saturday before pay date.',
  'weekly:W3PE7B':    'Weekly, paid Wednesday. Period ends Sunday before pay date.',
  'biweekly:W3PE4B':  'Biweekly, paid Wednesday. Period ends Thursday before pay date.',
  'biweekly:W3PE5B':  'Biweekly, paid Wednesday. Period ends Friday before pay date.',
  'biweekly:W3PE6B':  'Biweekly, paid Wednesday. Period ends Saturday before pay date.',
  'biweekly:W3PE7B':  'Biweekly, paid Wednesday. Period ends Sunday before pay date.',
  // Weekly – Thursday
  'weekly:W4PE23B':   'Weekly, paid Thursday. Period ends two Wednesdays before pay date.',
  'weekly:W4PE3B':    'Weekly, paid Thursday. Period ends Monday before pay date.',
  'weekly:W4PE4B':    'Weekly, paid Thursday. Period ends Sunday before pay date.',
  'weekly:W4PE6B':    'Weekly, paid Thursday. Period ends Saturday before pay date.',
  'biweekly:W4PE23B': 'Biweekly, paid Thursday. Period ends two Wednesdays before pay date.',
  'biweekly:W4PE3B':  'Biweekly, paid Thursday. Period ends Monday before pay date.',
  'biweekly:W4PE4B':  'Biweekly, paid Thursday. Period ends Sunday before pay date.',
  'biweekly:W4PE6B':  'Biweekly, paid Thursday. Period ends Saturday before pay date.',
  // Weekly – Friday
  'weekly:W5PE0B':    'Weekly, paid Friday. Period ends same day as pay date.',
  'weekly:W5PE27B':   'Weekly, paid Friday. Period ends two Sundays before pay date.',
  'weekly:W5PE2B':    'Weekly, paid Friday. Period ends Tuesday before pay date.',
  'weekly:W5PE3':     'Weekly, paid Friday. Period ends Wednesday of pay week.',
  'weekly:W5PE4':     'Weekly, paid Friday. Period ends Thursday of pay week.',
  'weekly:W5PE4B':    'Weekly, paid Friday. Period ends Thursday before pay date.',
  'weekly:W5PE5B':    'Weekly, paid Friday. Period ends Friday before pay date.',
  'weekly:W5PE6B':    'Weekly, paid Friday. Period ends Saturday before pay date.',
  'weekly:W5PE7B':    'Weekly, paid Friday. Period ends Sunday before pay date.',
  'biweekly:W5PE0B':  'Biweekly, paid Friday. Period ends same day as pay date.',
  'biweekly:W5PE27B': 'Biweekly, paid Friday. Period ends two Sundays before pay date.',
  'biweekly:W5PE2B':  'Biweekly, paid Friday. Period ends Tuesday before pay date.',
  'biweekly:W5PE3':   'Biweekly, paid Friday. Period ends Wednesday of pay week.',
  'biweekly:W5PE4':   'Biweekly, paid Friday. Period ends Thursday of pay week.',
  'biweekly:W5PE4B':  'Biweekly, paid Friday. Period ends Thursday before pay date.',
  'biweekly:W5PE5B':  'Biweekly, paid Friday. Period ends Friday before pay date.',
  'biweekly:W5PE6B':  'Biweekly, paid Friday. Period ends Saturday before pay date.',
  'biweekly:W5PE7B':  'Biweekly, paid Friday. Period ends Sunday before pay date.',
  // Semi-monthly
  'semimonthly:S15EOMPE1227':    'Semi-monthly, paid 15th & EOM. Period ends 12th & 27th.',
  'semimonthly:S15EOMPE14EOM':   'Semi-monthly, paid 15th & EOM. Period ends 14th & EOM.',
  'semimonthly:S15EOMPE15THEOM': 'Semi-monthly, paid 15th & EOM. Period ends EOM & 15th.',
  'semimonthly:S15EOMPE217':     'Semi-monthly, paid 15th & EOM. Period ends 2nd & 17th.',
  'semimonthly:S15EOMPE2610':    'Semi-monthly, paid 15th & EOM. Period ends 26th & 10th.',
  'semimonthly:S1EOMPE1025':     'Semi-monthly, paid 1st & 15th. Period ends 10th & 25th.',
  'semimonthly:S218':            'Semi-monthly, paid 2nd & 18th. Period ends same day.',
  'semimonthly:S318':            'Semi-monthly, paid 3rd & 18th. Period ends 15th & EOM.',
  'semimonthly:S520':            'Semi-monthly, paid 5th & 20th. Period ends 15th & EOM.',
  'semimonthly:S520-312':        'Semi-monthly, paid 1st & 3rd Friday. Period ends 2 days before pay date.',
  'semimonthly:SM521':           'Semi-monthly, paid 15th & 21st. Period ends 15th & EOM.',
  // Monthly
  'monthly:M10EOM':   'Monthly, paid 10th. Period ends EOM.',
  'monthly:M1EOM':    'Monthly, paid 1st. Period ends EOM.',
  'monthly:M1PEOM':   'Monthly, paid 1st. Period ends end of prior month.',
  'monthly:M28EOM':   'Monthly, paid 28th. Period ends EOM.',
  'monthly:M2EOM':    'Monthly, paid 2nd. Period ends EOM.',
  'monthly:M30EOM':   'Monthly, paid 30th. Period ends end of prior month.',
  'monthly:M5EOM':    'Monthly, paid 5th. Period ends end of prior month.',
  'monthly:M8EOM':    'Monthly, paid 8th. Period ends EOM.',
  'monthly:MEOMEOM':  'Monthly, paid EOM. Period ends EOM.',
  'monthly:MEOMPE16': 'Monthly, paid EOM. Period ends 16th of month.',
  'monthly:MEOMPEOM': 'Monthly, paid EOM. Period ends EOM of next month.',
  'monthly:MON15EOM': 'Monthly, paid 15th. Period ends EOM.',
  'monthly:MPEOM7':   'Monthly, paid 7th. Period ends EOM.',
  // Other
  'other:PSANNUAL': 'One-time annual payroll.',
  'other:QUARTER':  'Quarterly payroll.',
};

const PAYROLL_SUBMISSION_OPTIONS = [
  'Client Entry',
  'Galactic Entry',
  'Spreadsheet',
  'Call in',
  'Auto Hours',
] as const;

const PREFERRED_PAYMENT_OPTIONS = ['ACH', 'Wire Transfer'] as const;

const FORM_BACKGROUND = '#1b2438';
const CARD_BACKGROUND = FORM_BACKGROUND;

const DARK_INPUT_STYLE: CSSProperties = {
  backgroundColor: CARD_BACKGROUND,
  borderColor: '#2f3d57',
  color: '#f5f8ff',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
};

const DARK_CARD_STYLE = {
  backgroundColor: CARD_BACKGROUND,
  borderColor: 'rgba(255,255,255,0.08)',
};

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

// Days before the pay date that the period ends, keyed by schedule ID
const SCHEDULE_PERIOD_END_OFFSET: Record<string, number> = {
  // Monday pay
  W1PE3B: 3,   // Fri before Mon
  // Tuesday pay
  W2PE5B: 4,   // Fri before Tue
  W2PE6B: 3,   // Sat before Tue
  W2PE7B: 2,   // Sun before Tue
  // Wednesday pay
  W3PE4B: 6,   // Thu before Wed (prev week)
  W3PE5B: 5,   // Fri before Wed
  W3PE6B: 4,   // Sat before Wed
  W3PE7B: 3,   // Sun before Wed
  // Thursday pay
  W4PE23B: 8,  // Two Wednesdays before Thu
  W4PE3B: 3,   // Mon before Thu
  W4PE4B: 4,   // Sun before Thu
  W4PE6B: 5,   // Sat before Thu
  // Friday pay
  W5PE0B: 0,   // Same day
  W5PE2B: 3,   // Tue before Fri
  W5PE3: 2,    // Wed same week
  W5PE4: 1,    // Thu same week
  W5PE4B: 8,   // Thu prev week
  W5PE5B: 7,   // Fri prev week
  W5PE6B: 6,   // Sat prev week
  W5PE7B: 5,   // Sun prev week
  W5PE27B: 12, // Two Sundays before Fri
  // Semi-monthly (offset from pay date to period end)
  S15EOMPE1227:    3,   // Pay 15th → end 12th (3 days before)
  S15EOMPE14EOM:   1,   // Pay 15th → end 14th (1 day before)
  S15EOMPE15THEOM: 0,   // Period ends same as pay date
  S15EOMPE217:     13,  // Pay 15th → end 2nd (13 days before)
  S15EOMPE2610:    5,   // Pay 15th → end 10th (5 days before)
  S1EOMPE1025:     5,   // Pay 15th → end 10th (5 days before)
  S218:            0,   // Period ends same day
  S318:            3,   // Pay 3rd → end 15th prev month (~16 days) approx 3
  S520:            5,   // Pay 5th → end 15th prev month
  'S520-312':      2,   // Period ends 2 days before pay date
  SM521:           0,   // Period ends same day
  // Monthly
  M10EOM:   10,  // Pay 10th, period ends last day of prior month (~10 days before)
  M1EOM:    1,   // Pay 1st, period ends EOM of prior month
  M1PEOM:   1,
  M28EOM:   0,
  M2EOM:    2,
  M30EOM:   0,
  M5EOM:    5,
  M8EOM:    8,
  MEOMEOM:  0,
  MEOMPE16: 15, // Pay EOM, period ends 16th (EOM - 15 approx)
  MEOMPEOM: 0,
  MON15EOM: 15, // Pay 15th, period ends EOM of prior month
  MPEOM7:   7,
};

function getNextPayDates(anchorDateStr: string, frequency: string, count = 10): Date[] {
  const anchor = new Date(anchorDateStr + 'T12:00:00');
  if (isNaN(anchor.getTime())) return [];
  const results: Date[] = [];

  if (frequency === 'weekly') {
    const cur = new Date(anchor);
    for (let i = 0; i < count; i++) {
      results.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else if (frequency === 'biweekly') {
    const cur = new Date(anchor);
    for (let i = 0; i < count; i++) {
      results.push(new Date(cur));
      cur.setDate(cur.getDate() + 14);
    }
  } else if (frequency === 'semimonthly') {
    const anchorDay = anchor.getDate();
    const firstDay = anchorDay <= 15 ? anchorDay : anchorDay - 15;
    const secondDay = anchorDay <= 15 ? anchorDay + 15 : anchorDay;
    let year = anchor.getFullYear();
    let month = anchor.getMonth();
    while (results.length < count) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const d1 = new Date(year, month, Math.min(firstDay, lastDay), 12);
      const d2 = new Date(year, month, Math.min(secondDay, lastDay), 12);
      if (d1 >= anchor && results.length < count) results.push(d1);
      if (d2 >= anchor && results.length < count) results.push(d2);
      month++;
      if (month > 11) { month = 0; year++; }
    }
  } else if (frequency === 'monthly') {
    let year = anchor.getFullYear();
    let month = anchor.getMonth();
    const day = anchor.getDate();
    for (let i = 0; i < count; i++) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      results.push(new Date(year, month, Math.min(day, lastDay), 12));
      month++;
      if (month > 11) { month = 0; year++; }
    }
  }

  return results.slice(0, count);
}

function formatPayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function calcPeriodDates(payDateStr: string, frequency: string, scheduleId?: string): { start: string; end: string } {
  const payDate = new Date(payDateStr + 'T12:00:00');

  // Determine period end by subtracting offset from pay date
  const offset = scheduleId != null && scheduleId in SCHEDULE_PERIOD_END_OFFSET
    ? SCHEDULE_PERIOD_END_OFFSET[scheduleId]
    : 0;
  const end = new Date(payDate);
  end.setDate(payDate.getDate() - offset);

  // Determine period start based on frequency and period end
  let start: Date;
  if (frequency === 'weekly') {
    start = new Date(end);
    start.setDate(end.getDate() - 6);
  } else if (frequency === 'biweekly') {
    start = new Date(end);
    start.setDate(end.getDate() - 13);
  } else if (frequency === 'semimonthly') {
    start = end.getDate() <= 15
      ? new Date(end.getFullYear(), end.getMonth(), 1, 12)
      : new Date(end.getFullYear(), end.getMonth(), 16, 12);
  } else if (frequency === 'monthly') {
    // Period start = first day of prior month
    const priorMonth = end.getMonth() === 0 ? 11 : end.getMonth() - 1;
    const priorYear = end.getMonth() === 0 ? end.getFullYear() - 1 : end.getFullYear();
    start = new Date(priorYear, priorMonth, 1, 12);
  } else {
    start = new Date(end);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function IntakeForm({ token, organization, contacts, worksites }: Props) {
  const [step, setStep] = useState(1);
  const initialCompanyAddress: CompanyAddressState = {
    street: (organization as any).address_line1 ?? organization.address_street ?? '',
    city: (organization as any).city ?? organization.address_city ?? '',
    state: (organization as any).state ?? organization.address_state ?? '',
    zip: (organization as any).postal_code ?? organization.address_zip ?? '',
    county: (organization as any).address_county ?? '',
  };
  const [companyAddress, setCompanyAddress] = useState<CompanyAddressState>(initialCompanyAddress);
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>(() => {
    const initial = contacts.length
      ? contacts
      : [{ full_name: organization.legal_name || '', email: '', phone: '', title: '', is_primary: true }];

    return initial.map((contact, idx) => ({
      full_name: contact.full_name ?? '',
      title: contact.title ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      is_primary: contact.is_primary ?? idx === 0,
    }));
  });
  const [worksiteDrafts, setWorksiteDrafts] = useState(() =>
    (worksites.length
      ? worksites
      : [initialCompanyAddress]
    ).map((site) => ({
      street: site.street ?? '',
      city: site.city ?? '',
      state: site.state ?? '',
      zip: site.zip ?? '',
      county: site.county ?? '',
    }))
  );
  const [autoFillPrimaryWorksite, setAutoFillPrimaryWorksite] = useState(() => worksites.length === 0);
  const [otherBenefits, setOtherBenefits] = useState<OtherBenefitsState>(() =>
    parseOtherBenefitPlans(organization.other_benefit_plans ?? '')
  );
  const [totalEmployees, setTotalEmployees] = useState(String(organization.total_employees ?? ''));
  const [fullTimeEmployees, setFullTimeEmployees] = useState(String(organization.full_time_employees ?? ''));
  const [partTimeEmployees, setPartTimeEmployees] = useState(String(organization.part_time_employees ?? ''));
  const [commissionOnlyEmployees, setCommissionOnlyEmployees] = useState(String(organization.commission_only_employees ?? ''));
  const [empCountError, setEmpCountError] = useState('');

  const [payFrequency, setPayFrequency] = useState(organization.pay_frequency ?? 'biweekly');
  const [paySchedule, setPaySchedule] = useState((organization as any).pay_schedule_id ?? '');
  const [payAnchorDate, setPayAnchorDate] = useState('');
  const [selectedNextPayDate, setSelectedNextPayDate] = useState('');
  const [firstPeriodStart, setFirstPeriodStart] = useState(organization.first_period_start ?? '');
  const [firstPeriodEnd, setFirstPeriodEnd] = useState(organization.first_period_end ?? '');
  const [payScheduleNotes, setPayScheduleNotes] = useState((organization.pay_schedule_json as any)?.notes ?? '');

  const initialState: IntakeSubmitState = { success: false };
  const [state, formAction] = useActionState(submitIntakeAction.bind(null, token), initialState);

  const contactsJson = useMemo(() => JSON.stringify(contactDrafts), [contactDrafts]);
  const worksitesJson = useMemo(() => JSON.stringify(worksiteDrafts), [worksiteDrafts]);

  useEffect(() => {
    if (!autoFillPrimaryWorksite) return;
    setWorksiteDrafts((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[0] = {
        ...next[0],
        street: companyAddress.street,
        city: companyAddress.city,
        state: companyAddress.state,
        zip: companyAddress.zip,
        county: companyAddress.county,
      };
      return next;
    });
  }, [autoFillPrimaryWorksite, companyAddress]);

  useEffect(() => {
    if (!selectedNextPayDate || payFrequency === 'other') return;
    const { start, end } = calcPeriodDates(selectedNextPayDate, payFrequency, paySchedule || undefined);
    setFirstPeriodStart(start);
    setFirstPeriodEnd(end);
  }, [selectedNextPayDate, payFrequency, paySchedule]);

  useEffect(() => {
    if (!paySchedule) return;
    const note = SCHEDULE_NOTES[`${payFrequency}:${paySchedule}`];
    if (note) setPayScheduleNotes(note);
  }, [paySchedule, payFrequency]);

  const updateOtherBenefits = (patch: Partial<OtherBenefitsState>) => {
    setOtherBenefits((prev) => ({ ...prev, ...patch }));
  };

  function updateContact(index: number, field: keyof (typeof contactDrafts)[number], value: string | boolean) {
    setContactDrafts((prev) =>
      prev.map((entry, idx) =>
        idx === index
          ? { ...entry, [field]: value }
          : entry
      )
    );
  }

  function updateWorksite(index: number, field: keyof (typeof worksiteDrafts)[number], value: string) {
    if (index === 0) setAutoFillPrimaryWorksite(false);
    setWorksiteDrafts((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry)));
  }

  function addContact() {
    setContactDrafts((prev) => [...prev, { full_name: '', title: '', email: '', phone: '', is_primary: false }]);
  }

  function removeContact(index: number) {
    setContactDrafts((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (!next.length) {
        return [{ full_name: '', title: '', email: '', phone: '', is_primary: true }];
      }
      if (!next.some((entry) => entry.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  }

  function addWorksite() {
    setWorksiteDrafts((prev) => [
      ...prev,
      {
        street: companyAddress.street,
        city: companyAddress.city,
        state: companyAddress.state,
        zip: companyAddress.zip,
        county: companyAddress.county,
      },
    ]);
  }

  const goNext = () => {
    if (step === 4) {
      const total = parseInt(totalEmployees) || 0;
      const ft = parseInt(fullTimeEmployees) || 0;
      const pt = parseInt(partTimeEmployees) || 0;
      const co = parseInt(commissionOnlyEmployees) || 0;
      const hasBreakdown = ft || pt || co;
      if (total && hasBreakdown && ft + pt + co !== total) {
        setEmpCountError(
          `Full-time (${ft}) + Part-time (${pt}) + Commission only (${co}) = ${ft + pt + co}, but Total employees is ${total}. Please make sure they add up.`
        );
        return;
      }
      setEmpCountError('');
    }
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div
      className={ProposalGeneratorStyles.container}
      style={{ maxWidth: '1200px', minWidth: '1080px' }}
    >
      <div
        style={{
          background: FORM_BACKGROUND,
          borderRadius: '18px',
          padding: '32px 72px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <form action={formAction} encType="multipart/form-data">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/7f657327-251a-46bb-a2a6-31b6e7d2e7db/Logo.png"
              alt="Galactic 365"
              style={{ height: '120px', objectFit: 'contain' }}
            />
          </div>
        <input type="hidden" name="contacts_json" value={contactsJson} />
        <input type="hidden" name="worksites_json" value={worksitesJson} />
        <input type="hidden" name="other_benefit_plans" value={serializeOtherBenefitPlans(otherBenefits)} />

        {state?.error && <div className={ProposalGeneratorStyles.error}>{state.error}</div>}
        {state?.success && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(90, 224, 138, 0.45)',
              background: 'rgba(21, 83, 63, 0.75)',
              color: '#4ADE80',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <div style={{ fontSize: '16px', letterSpacing: '0.02em' }}>Submitted Successfully</div>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(234, 255, 245, 0.85)' }}>
                Thanks! Your intake details are on their way to the Galactic team.
              </p>
            </div>
          </div>
        )}

        <div
          className={ProposalGeneratorStyles.progressBar}
          style={{
            ['--progress-fill' as string]: `${(step - 1) / (TOTAL_STEPS - 1)}`,
          } as CSSProperties}
        >
          {STEP_LABELS.map((_, idx) => (
            <div
              key={idx}
              className={`${ProposalGeneratorStyles.progressStep} ${step >= idx + 1 ? ProposalGeneratorStyles.active : ''}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 1}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Company Overview</h2>
            <p className={ProposalGeneratorStyles.subtitle}>Share basic details so we can start modeling.</p>

            <Field name="legal_name" label="Legal name" defaultValue={organization.legal_name ?? ''} required />
            <Field name="dba_name" label="DBA / Trade name" defaultValue={organization.dba_name ?? ''} />

            <div className={ProposalGeneratorStyles.row}>
              <Field name="website" label="Website" defaultValue={organization.website ?? ''} />
              <Field name="naics_code" label="NAICS code" defaultValue={organization.naics_code ?? ''} />
            </div>
            <Field name="company_type" label="Company type" defaultValue={organization.company_type ?? ''} />

            <Field
              name="description_of_operations"
              label="Description of operations"
              defaultValue={organization.description_of_operations ?? ''}
              textarea
            />

            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="address_street"
                label="Street"
                value={companyAddress.street}
                onChange={(value) => setCompanyAddress((prev) => ({ ...prev, street: value }))}
              />
              <Field
                name="address_city"
                label="City"
                value={companyAddress.city}
                onChange={(value) => setCompanyAddress((prev) => ({ ...prev, city: value }))}
              />
            </div>
            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="address_state"
                label="State"
                value={companyAddress.state}
                onChange={(value) => setCompanyAddress((prev) => ({ ...prev, state: value }))}
              />
              <Field
                name="address_zip"
                label="ZIP"
                value={companyAddress.zip}
                onChange={(value) => setCompanyAddress((prev) => ({ ...prev, zip: value }))}
              />
            </div>
            <Field
              name="address_county"
              label="County"
              value={companyAddress.county}
              onChange={(value) => setCompanyAddress((prev) => ({ ...prev, county: value }))}
            />

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 2}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Contacts</h2>
            <p className={ProposalGeneratorStyles.subtitle}>Add anyone we should involve in payroll, HR, or decisions.</p>

            <div
              className={ProposalGeneratorStyles.servicesGrid}
              style={{ gridTemplateColumns: '1fr', gap: '20px' }}
            >
              {contactDrafts.map((contact, idx) => (
                <div
                  key={idx}
                  style={{ width: '100%', position: 'relative' }}
                >
                  <div className={ProposalGeneratorStyles.serviceLabel}>
                    <div className={ProposalGeneratorStyles.row}>
                      <Field
                        name={`contact_${idx}_full_name`}
                        label="Full name"
                        value={contact.full_name}
                        onChange={(value) => updateContact(idx, 'full_name', value)}
                      />
                      <Field
                        name={`contact_${idx}_title`}
                        label="Title"
                        value={contact.title}
                        onChange={(value) => updateContact(idx, 'title', value)}
                      />
                    </div>
                    <div className={ProposalGeneratorStyles.row}>
                      <Field
                        name={`contact_${idx}_email`}
                        label="Email"
                        type="email"
                        value={contact.email}
                        onChange={(value) => updateContact(idx, 'email', value)}
                      />
                      <Field
                        name={`contact_${idx}_phone`}
                        label="Phone"
                        value={contact.phone}
                        onChange={(value) => updateContact(idx, 'phone', value)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '15px',
                          color: '#f5f8ff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={contact.is_primary}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const checked = event.target.checked;
                            setContactDrafts((prev) =>
                              prev.map((entry, entryIdx) => ({
                                ...entry,
                                is_primary: entryIdx === idx ? checked : false,
                              }))
                            );
                          }}
                          style={{ accentColor: '#005791' }}
                        />
                        Primary contact
                      </label>
                      {contactDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          style={{
                            background: '#EF4444',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={addContact}>
              + Add contact
            </button>

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 3}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Worksites</h2>
            <p className={ProposalGeneratorStyles.subtitle}>List every location so we can scope requirements.</p>

            <div className={ProposalGeneratorStyles.servicesGrid}>
              {worksiteDrafts.map((site, idx) => (
                <div
                  key={idx}
                  style={{ width: '100%' }}
                >
                  <div className={ProposalGeneratorStyles.serviceLabel}>
                    <div className={ProposalGeneratorStyles.row}>
                      <Field
                        name={`worksite_${idx}_street`}
                        label="Street"
                        value={site.street}
                        onChange={(value) => updateWorksite(idx, 'street', value)}
                      />
                      <Field
                        name={`worksite_${idx}_city`}
                        label="City"
                        value={site.city}
                        onChange={(value) => updateWorksite(idx, 'city', value)}
                      />
                    </div>
                    <div className={ProposalGeneratorStyles.row}>
                      <Field
                        name={`worksite_${idx}_state`}
                        label="State"
                        value={site.state}
                        onChange={(value) => updateWorksite(idx, 'state', value)}
                      />
                      <Field
                        name={`worksite_${idx}_zip`}
                        label="ZIP"
                        value={site.zip}
                        onChange={(value) => updateWorksite(idx, 'zip', value)}
                      />
                    </div>
                    <Field
                      name={`worksite_${idx}_county`}
                      label="County"
                      value={site.county}
                      onChange={(value) => updateWorksite(idx, 'county', value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={addWorksite}>
              + Add worksite
            </button>

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 4}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Employees & payroll</h2>
            <p className={ProposalGeneratorStyles.subtitle}>These numbers drive the initial pricing model.</p>

            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="total_employees"
                label="Total employees"
                type="number"
                value={totalEmployees}
                onChange={(v) => { setTotalEmployees(v); setEmpCountError(''); }}
              />
              <Field
                name="full_time_employees"
                label="Full-time"
                type="number"
                value={fullTimeEmployees}
                onChange={(v) => { setFullTimeEmployees(v); setEmpCountError(''); }}
              />
            </div>
            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="part_time_employees"
                label="Part-time"
                type="number"
                value={partTimeEmployees}
                onChange={(v) => { setPartTimeEmployees(v); setEmpCountError(''); }}
              />
              <Field
                name="commission_only_employees"
                label="Commission only"
                type="number"
                value={commissionOnlyEmployees}
                onChange={(v) => { setCommissionOnlyEmployees(v); setEmpCountError(''); }}
              />
            </div>
            {empCountError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '4px',
              }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#f87171', flexShrink: 0 }} />
                {empCountError}
              </div>
            )}
            <div className={ProposalGeneratorStyles.row}>
              <div className={ProposalGeneratorStyles.formGroup}>
                <label htmlFor="pay_frequency" style={{ color: '#f5f8ff' }}>
                  Pay frequency
                </label>
                <select
                  id="pay_frequency"
                  name="pay_frequency"
                  value={payFrequency}
                  onChange={(e) => { setPayFrequency(e.target.value); setPaySchedule(''); setPayAnchorDate(''); setSelectedNextPayDate(''); }}
                  className={ProposalGeneratorStyles.select}
                  style={{ ...DARK_INPUT_STYLE, color: '#f5f8ff', background: CARD_BACKGROUND }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="semimonthly">Semi-monthly</option>
                  <option value="monthly">Monthly</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={ProposalGeneratorStyles.formGroup}>
                <label htmlFor="pay_schedule_id" style={{ color: PAY_SCHEDULES[payFrequency]?.length ? '#f5f8ff' : '#738297' }}>
                  Pay schedule
                </label>
                <select
                  id="pay_schedule_id"
                  name="pay_schedule_id"
                  value={paySchedule}
                  onChange={(e) => setPaySchedule(e.target.value)}
                  disabled={!PAY_SCHEDULES[payFrequency]?.length}
                  className={ProposalGeneratorStyles.select}
                  style={{
                    ...DARK_INPUT_STYLE,
                    color: PAY_SCHEDULES[payFrequency]?.length ? '#f5f8ff' : '#738297',
                    backgroundColor: CARD_BACKGROUND,
                    opacity: PAY_SCHEDULES[payFrequency]?.length ? 1 : 0.5,
                    cursor: PAY_SCHEDULES[payFrequency]?.length ? 'pointer' : 'not-allowed',
                  }}
                >
                  <option value="">Select pay schedule</option>
                  {(PAY_SCHEDULES[payFrequency] ?? []).map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Field
              name="pay_schedule_notes"
              label="Describe pay schedule"
              value={payScheduleNotes}
              onChange={setPayScheduleNotes}
              textarea
            />

            {/* Pay Date */}
            {payFrequency !== 'other' && (
              <div className={ProposalGeneratorStyles.row}>
                <div className={ProposalGeneratorStyles.formGroup}>
                  <label htmlFor="pay_anchor_date" style={{ color: '#f5f8ff' }}>Next pay date</label>
                  <input
                    id="pay_anchor_date"
                    name="pay_anchor_date"
                    type="date"
                    value={payAnchorDate}
                    onChange={(e) => { setPayAnchorDate(e.target.value); setSelectedNextPayDate(''); }}
                    className={ProposalGeneratorStyles.input}
                    style={{ ...DARK_INPUT_STYLE, colorScheme: 'dark' }}
                  />
                </div>
                <div className={ProposalGeneratorStyles.formGroup}>
                  <label htmlFor="next_pay_date" style={{ color: payAnchorDate ? '#f5f8ff' : '#738297' }}>
                    First pay date with Galactic
                  </label>
                  <select
                    id="next_pay_date"
                    name="next_pay_date"
                    value={selectedNextPayDate}
                    onChange={(e) => setSelectedNextPayDate(e.target.value)}
                    disabled={!payAnchorDate}
                    className={ProposalGeneratorStyles.select}
                    style={{
                      ...DARK_INPUT_STYLE,
                      backgroundColor: CARD_BACKGROUND,
                      color: payAnchorDate ? '#f5f8ff' : '#738297',
                      opacity: payAnchorDate ? 1 : 0.5,
                      cursor: payAnchorDate ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <option value="">Select first pay date with Galactic</option>
                    {getNextPayDates(payAnchorDate, payFrequency).map((date, i) => {
                      const val = date.toISOString().slice(0, 10);
                      return (
                        <option key={i} value={val}>{formatPayDate(date)}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {(() => {
              const periodReady = !!(payAnchorDate && selectedNextPayDate);
              return (
                <div className={ProposalGeneratorStyles.row}>
                  <div className={ProposalGeneratorStyles.formGroup}>
                    <label style={{ color: periodReady ? '#f5f8ff' : '#738297' }}>First period start</label>
                    <input
                      name="first_period_start"
                      type="date"
                      value={firstPeriodStart}
                      onChange={(e) => setFirstPeriodStart(e.target.value)}
                      disabled={!periodReady}
                      className={ProposalGeneratorStyles.input}
                      style={{
                        ...DARK_INPUT_STYLE,
                        colorScheme: 'dark',
                        opacity: periodReady ? 1 : 0.45,
                        cursor: periodReady ? 'auto' : 'not-allowed',
                      }}
                    />
                  </div>
                  <div className={ProposalGeneratorStyles.formGroup}>
                    <label style={{ color: periodReady ? '#f5f8ff' : '#738297' }}>First period end</label>
                    <input
                      name="first_period_end"
                      type="date"
                      value={firstPeriodEnd}
                      onChange={(e) => setFirstPeriodEnd(e.target.value)}
                      disabled={!periodReady}
                      className={ProposalGeneratorStyles.input}
                      style={{
                        ...DARK_INPUT_STYLE,
                        colorScheme: 'dark',
                        opacity: periodReady ? 1 : 0.45,
                        cursor: periodReady ? 'auto' : 'not-allowed',
                      }}
                    />
                  </div>
                </div>
              );
            })()}
            <div className={ProposalGeneratorStyles.row}>
              <div className={ProposalGeneratorStyles.formGroup}>
                <label htmlFor="payroll_submission_method" style={{ color: '#f5f8ff' }}>
                  Payroll submission method
                </label>
                <select
                  id="payroll_submission_method"
                  name="payroll_submission_method"
                  defaultValue={organization.payroll_submission_method ?? ''}
                  className={ProposalGeneratorStyles.select}
                  style={{ ...DARK_INPUT_STYLE, color: '#f5f8ff', background: CARD_BACKGROUND }}
                >
                  <option value="">Select</option>
                  {PAYROLL_SUBMISSION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className={ProposalGeneratorStyles.formGroup}>
                <label htmlFor="preferred_payment_method" style={{ color: '#f5f8ff' }}>
                  Preferred payment method
                </label>
                <select
                  id="preferred_payment_method"
                  name="preferred_payment_method"
                  defaultValue={(organization as any).preferred_payment_method ?? ''}
                  className={ProposalGeneratorStyles.select}
                  style={{ ...DARK_INPUT_STYLE, color: '#f5f8ff', background: CARD_BACKGROUND }}
                >
                  <option value="">Select</option>
                  {PREFERRED_PAYMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 5}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Compliance & benefits</h2>
            <p className={ProposalGeneratorStyles.subtitle}>Flags help us line up the right services.</p>

            {(() => {
              const half = Math.ceil(COMPLIANCE_FLAGS.length / 2);
              const columns = [
                COMPLIANCE_FLAGS.slice(0, half),
                COMPLIANCE_FLAGS.slice(half),
              ];

              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '20px',
                    marginBottom: '36px',
                  }}
                >
                  {columns.map((column, columnIdx) => (
                    <div key={`compliance-column-${columnIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {column.map((flag) => (
                        <label
                          key={flag.name}
                          className={ProposalGeneratorStyles.serviceCheckbox}
                          style={DARK_CARD_STYLE}
                        >
                          <input
                            type="checkbox"
                            name={flag.name}
                            defaultChecked={Boolean((organization as any)[flag.name])}
                          />
                          <div className={ProposalGeneratorStyles.serviceLabel}>
                            <strong style={{ color: '#f5f8ff' }}>{flag.label}</strong>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            <Field
              name="remote_states"
              label="Remote states (comma separated)"
              defaultValue={(organization.remote_states as string[] | null)?.join(', ') ?? ''}
            />
            <div className={ProposalGeneratorStyles.formGroup}>
              <label style={{ color: '#f5f8ff', marginBottom: '-8px' }}>Other benefit plans</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  marginTop: '12px',
                }}
              >
                {[
                  { key: 'companyPaidGtl', label: 'Company Paid GTL (Group Term Life)', checked: otherBenefits.companyPaidGtl, onChange: (v: boolean) => updateOtherBenefits({ companyPaidGtl: v }) },
                  { key: 'companyPaidLtd', label: 'Company Paid LTD', checked: otherBenefits.companyPaidLtd, onChange: (v: boolean) => updateOtherBenefits({ companyPaidLtd: v }) },
                  { key: 'companyPaidStd', label: 'Company Paid STD', checked: otherBenefits.companyPaidStd, onChange: (v: boolean) => updateOtherBenefits({ companyPaidStd: v }) },
                  { key: 'keepOwnMedical', label: 'Keep Own Medical Coverage', checked: otherBenefits.keepOwnMedical, onChange: (v: boolean) => updateOtherBenefits({ keepOwnMedical: v }) },
                  {
                    key: 'keepOtherPlans', label: 'Keep Other Plans', checked: otherBenefits.keepOtherPlans,
                    onChange: (v: boolean) => updateOtherBenefits({ keepOtherPlans: v, otherPlanNames: v ? otherBenefits.otherPlanNames : '' }),
                  },
                ].map(({ key, label, checked, onChange }) => (
                  <label
                    key={key}
                    style={{
                      ...DARK_CARD_STYLE,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      border: '2px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChange(e.target.checked)}
                      style={{ width: '20px', height: '20px', flexShrink: 0, cursor: 'pointer', accentColor: '#3d82ff', margin: 0 }}
                    />
                    <strong style={{ color: '#f5f8ff', fontSize: '15px', marginLeft: '6px', flex: 1 }}>{label}</strong>
                  </label>
                ))}
              </div>
              {(otherBenefits.companyPaidGtl || otherBenefits.companyPaidLtd || otherBenefits.companyPaidStd) && (
                <p style={{ marginTop: '10px', color: '#cbd5f5', fontSize: '13px' }}>
                  Census required for company-paid life or disability plans.
                </p>
              )}
              {otherBenefits.keepOtherPlans && (
                <input
                  type="text"
                  className={ProposalGeneratorStyles.input}
                  style={{ ...DARK_INPUT_STYLE, marginTop: '12px' }}
                  placeholder="List other plans to keep (e.g., Vision, Dental)"
                  value={otherBenefits.otherPlanNames}
                  onChange={(e) => updateOtherBenefits({ otherPlanNames: e.target.value })}
                />
              )}
            </div>
            <Field
              name="wc_states_list"
              label="States needing W/C (comma separated)"
              defaultValue={
                Array.isArray(organization.wc_states_json)
                  ? (organization.wc_states_json as string[]).join(', ')
                  : ''
              }
            />

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 6}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Tax IDs & ownership</h2>
            <p className={ProposalGeneratorStyles.subtitle}>Capture federal IDs and ownership percentages.</p>

            <div className={ProposalGeneratorStyles.row}>
              <Field name="fein" label="Primary FEIN" defaultValue={organization.fein ?? ''} />
              <Field
                name="additional_feins"
                label="Additional FEINs (comma separated)"
                defaultValue={(organization.additional_feins as string[] | null)?.join(', ') ?? ''}
              />
            </div>
            <Field
              name="owners_list"
              label="Owners (one per line: Name - %)"
              textarea
              defaultValue={
                Array.isArray(organization.owners_json)
                  ? (organization.owners_json as any[])
                      .map((owner) => `${owner.name ?? ''}${owner.percent ? ` - ${owner.percent}%` : ''}`.trim())
                      .join('\n')
                  : ''
              }
            />

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="button" className={ProposalGeneratorStyles.primaryBtn} onClick={goNext}>
                Next <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>→</span>
              </button>
            </div>
        </div>

        <div className={ProposalGeneratorStyles.formStep} hidden={step !== 7}>
            <h2 style={{ color: '#f5f8ff', fontSize: '42px', marginTop: '-12px' }}>Files & extras</h2>
            <p className={ProposalGeneratorStyles.subtitle}>Upload anything else we should review.</p>

            <div className={ProposalGeneratorStyles.row}>
              <Field
                name="current_payroll_provider"
                label="Current payroll provider"
                defaultValue={organization.current_payroll_provider ?? ''}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignSelf: 'flex-start',
                  marginTop: '0px',
                }}
              >
                <Field
                  name="logo"
                  label="Upload logo"
                  type="file"
                  accept="image/*"
                  labelStyle={{
                    marginBottom: '-4px',
                    display: 'inline-flex',
                    marginLeft: '16px',
                  }}
                />
              </div>
            </div>
            <Field
              name="additional_details"
              label="Additional details"
              defaultValue={organization.additional_details ?? ''}
              textarea
            />

            <div className={ProposalGeneratorStyles.formActions}>
              <button type="button" className={ProposalGeneratorStyles.secondaryBtn} onClick={goPrev}>
                <span style={{ fontWeight: 900, WebkitTextStroke: '0.8px currentColor' }}>←</span> Back
              </button>
              <button type="submit" className={ProposalGeneratorStyles.primaryBtn}>
                Submit intake
              </button>
            </div>
        </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (value: string) => void;
  required?: boolean;
  type?: string;
  textarea?: boolean;
  labelStyle?: CSSProperties;
  accept?: string;
};

function Field({
  name,
  label,
  defaultValue,
  value,
  onChange,
  required,
  type = 'text',
  textarea,
  labelStyle,
  accept,
}: FieldProps) {
  const handleChange = onChange
    ? (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)
    : undefined;

  const commonProps: any = {
    id: name,
    name,
    required,
    className: ProposalGeneratorStyles.input,
    onChange: handleChange,
  };

  if (type !== 'file') {
    if (value !== undefined) commonProps.value = value;
    if (defaultValue !== undefined) commonProps.defaultValue = defaultValue;
  } else if (defaultValue) {
    commonProps['data-default-value'] = defaultValue;
  }

  return (
    <div className={ProposalGeneratorStyles.formGroup}>
      <label htmlFor={name} style={{ color: '#f5f8ff', ...labelStyle }}>
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
            ...(type === 'file'
              ? {
                  fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#f5f8ff',
                  border: 'none',
                  boxShadow: 'none',
                  marginTop: '-4px',
                }
              : {}),
          }}
          accept={accept}
        />
      )}
    </div>
  );
}
