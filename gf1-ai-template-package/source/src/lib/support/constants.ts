export const SUPPORT_CATEGORIES = [
  'IT Support',
  'Equipment',
  'Prism Support',
  'Report Building',
  'Spreadsheet Support',
  'WC Assistance',
  'Benefit Summaries',
  'Other',
] as const;

export const SUPPORT_PRIORITIES = ['low', 'medium', 'high'] as const;
export const SUPPORT_TICKET_SOURCE = 'support_ticket';
export const SUPPORT_PROJECT_SOURCE = 'support_project';
export const SUPPORT_PROJECT_SUBJECT_PREFIX = '[PROJECT] ';
export const SUPPORT_PROJECT_STATUSES = ['open', 'in_progress', 'completed'] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];
export type SupportProjectStatus = (typeof SUPPORT_PROJECT_STATUSES)[number];

export const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
