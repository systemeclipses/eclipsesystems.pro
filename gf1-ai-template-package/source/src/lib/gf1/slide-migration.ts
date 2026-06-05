// Best-effort migration of legacy v1 `slides_json` payloads (Tiptap-based) into
// the v2 layout-based shape. Legacy text content is dropped; titles are
// preserved when we can map a v1 templateId to a v2 layoutId. Anything we
// can't map gets discarded — the seed deck regenerates on next view.

import type {
  ProposalSlide,
  ProposalSlidesPayload,
  SlideLayoutId,
} from './slide-types';
import { SLIDES_PAYLOAD_VERSION } from './slide-types';

const LEGACY_TEMPLATE_TO_LAYOUT: Record<string, SlideLayoutId> = {
  standard_cover: 'cover',
  standard_about_peo: 'who_is_galactic',
  standard_about_us: 'who_is_galactic',
  standard_how_we_work: 'how_it_works',
  what_is_a_peo: 'how_it_works',
  payroll_core_services: 'payroll',
  payroll_services: 'payroll',
  hr_compliance_support: 'hr_services',
  benefits_overview: 'benefits',
  benefits_enrollment: 'benefits_enrollment',
  onboarding: 'onboarding',
  paperless_onboarding: 'onboarding',
  employee_portal: 'employee_tools',
  timekeeping: 'timekeeping',
  advanced_reporting: 'reporting',
  multi_company_reporting: 'multi_company_reporting',
  retention_401k: 'retirement_401k',
  standard_pricing_summary: 'pricing',
  standard_closing: 'closing',
};

function makeInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `slide-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function isV2Payload(input: unknown): input is ProposalSlidesPayload {
  if (!input || typeof input !== 'object') return false;
  const obj = input as Record<string, unknown>;
  return obj.version === SLIDES_PAYLOAD_VERSION && Array.isArray(obj.slides);
}

export function migrateLegacySlides(input: unknown): ProposalSlide[] {
  if (!input || typeof input !== 'object') return [];

  const obj = input as Record<string, unknown>;
  const slides = Array.isArray(obj.slides) ? (obj.slides as Array<Record<string, unknown>>) : null;
  if (!slides) return [];

  const migrated: ProposalSlide[] = [];
  for (const raw of slides) {
    if (!raw || typeof raw !== 'object') continue;

    // Already v2-shaped slide?
    if (typeof raw.layoutId === 'string' && LAYOUT_ID_SET.has(raw.layoutId)) {
      const rawTitle = typeof raw.title === 'string' ? raw.title : '';
      let layoutId = raw.layoutId as SlideLayoutId;
      // Backfill fix: older decks collapsed `multi_company_reporting` into `reporting`
      // during migration. If we see a slide that kept the multi-company title but got
      // saved with the generic reporting layoutId, restore the dedicated layout so it
      // renders the right slide on first load.
      if (layoutId === 'reporting' && /multi.?company/i.test(rawTitle)) {
        layoutId = 'multi_company_reporting';
      }
      migrated.push({
        instanceId: typeof raw.instanceId === 'string' ? raw.instanceId : makeInstanceId(),
        layoutId,
        title: rawTitle,
        data:
          raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
            ? (raw.data as ProposalSlide['data'])
            : {},
        order: typeof raw.order === 'number' ? raw.order : migrated.length,
        visible: typeof raw.visible === 'boolean' ? raw.visible : true,
      });
      continue;
    }

    // Legacy v1 slide → map by templateId
    const legacyTemplateId = typeof raw.templateId === 'string' ? raw.templateId : null;
    const layoutId = legacyTemplateId ? LEGACY_TEMPLATE_TO_LAYOUT[legacyTemplateId] : undefined;
    if (!layoutId) continue;

    migrated.push({
      instanceId: typeof raw.instanceId === 'string' ? raw.instanceId : makeInstanceId(),
      layoutId,
      title: typeof raw.title === 'string' ? raw.title : '',
      data: {},
      order: typeof raw.order === 'number' ? raw.order : migrated.length,
      visible: typeof raw.visible === 'boolean' ? raw.visible : true,
    });
  }

  return migrated.map((slide, i) => ({ ...slide, order: i }));
}

const LAYOUT_ID_SET = new Set<string>([
  'cover',
  'executive_summary',
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
  'pricing',
  'closing',
]);
