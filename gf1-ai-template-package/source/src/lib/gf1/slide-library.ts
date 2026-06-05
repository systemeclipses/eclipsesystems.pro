// Thin re-export shim around the layout registry. The registry lives in the
// SlideBuilder feature folder so layout components and their field schemas stay
// colocated. This module exists for callers outside the feature (e.g. PDF
// generation, page-level imports) that just need the metadata + ordering.

import type {
  SlideCategory,
  SlideFieldValue,
  SlideLayoutId,
  SlideLayoutMeta,
} from './slide-types';
import {
  LAYOUT_LIST,
  LAYOUT_REGISTRY,
  getLayoutDefaults,
  getLayoutEntry,
} from '@/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts';

/** Default deck order matching the legacy 13-slide proposal template. */
export const DEFAULT_DECK_ORDER: SlideLayoutId[] = [
  'cover',
  'who_is_galactic',
  'how_it_works',
  'payroll',
  'hr_services',
  'workers_comp',
  'benefits',
  'benefits_enrollment',
  'onboarding',
  'employee_tools',
  'applicant_tracking',
  'lms_zywave',
  'lms_ethena',
  'timekeeping',
  'reporting',
  'multi_company_reporting',
  'retirement_401k',
  'executive_summary',
  'pricing',
  'closing',
];

export const SLIDE_LIBRARY: SlideLayoutMeta[] = LAYOUT_LIST.map((entry) => ({
  id: entry.id,
  title: entry.title,
  category: entry.category,
  iconEmoji: entry.iconEmoji,
  description: entry.description,
  fields: entry.fields,
}));

export const SLIDE_LIBRARY_BY_CATEGORY: Record<SlideCategory, SlideLayoutMeta[]> =
  SLIDE_LIBRARY.reduce(
    (acc, meta) => {
      (acc[meta.category] ??= []).push(meta);
      return acc;
    },
    {} as Record<SlideCategory, SlideLayoutMeta[]>,
  );

export function getLayoutById(id: SlideLayoutId): SlideLayoutMeta | undefined {
  const entry = getLayoutEntry(id);
  if (!entry) return undefined;
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    iconEmoji: entry.iconEmoji,
    description: entry.description,
    fields: entry.fields,
  };
}

export { LAYOUT_REGISTRY, LAYOUT_LIST, getLayoutEntry, getLayoutDefaults };

export function getLayoutDefaultData(id: SlideLayoutId): Record<string, SlideFieldValue> {
  return getLayoutDefaults(id);
}
