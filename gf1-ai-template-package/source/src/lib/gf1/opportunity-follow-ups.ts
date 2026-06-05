export const CONTACT_CHANNEL_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
] as const;

export type ContactChannel = (typeof CONTACT_CHANNEL_OPTIONS)[number]['value'];

export const FOLLOW_UP_TYPE_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'documents', label: 'Documents' },
  { value: 'other', label: 'Other' },
] as const;

export type FollowUpType = (typeof FOLLOW_UP_TYPE_OPTIONS)[number]['value'];

const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  phone: 'Phone',
  email: 'Email',
  text: 'Text',
  linkedin: 'LinkedIn',
  meeting: 'Meeting',
  other: 'Other',
};

const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  phone: 'Phone',
  email: 'Email',
  text: 'Text',
  linkedin: 'LinkedIn',
  meeting: 'Meeting',
  proposal: 'Proposal',
  documents: 'Documents',
  other: 'Other',
};

function normalizeToken(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return normalized || null;
}

export function normalizeContactChannel(value: string | null | undefined): ContactChannel | null {
  const normalized = normalizeToken(value);
  switch (normalized) {
    case 'phone':
    case 'email':
    case 'text':
    case 'linkedin':
    case 'meeting':
    case 'other':
      return normalized;
    case 'linked_in':
      return 'linkedin';
    default:
      return null;
  }
}

export function normalizeFollowUpType(value: string | null | undefined): FollowUpType | null {
  const normalized = normalizeToken(value);
  switch (normalized) {
    case 'phone':
    case 'email':
    case 'text':
    case 'linkedin':
    case 'meeting':
    case 'proposal':
    case 'documents':
    case 'other':
      return normalized;
    case 'linked_in':
      return 'linkedin';
    case 'document':
    case 'docs':
      return 'documents';
    default:
      return null;
  }
}

export function deriveFollowUpType({
  followUpType,
  channel,
  hasFollowUpAt = false,
}: {
  followUpType?: string | null;
  channel?: string | null;
  hasFollowUpAt?: boolean;
}): FollowUpType | null {
  const normalizedType = normalizeFollowUpType(followUpType);
  if (normalizedType) return normalizedType;

  const normalizedChannel = normalizeFollowUpType(channel);
  if (normalizedChannel) return normalizedChannel;

  return hasFollowUpAt ? 'other' : null;
}

export function formatContactChannel(value: string | null | undefined) {
  const normalized = normalizeContactChannel(value);
  return normalized ? CONTACT_CHANNEL_LABELS[normalized] : 'Other';
}

export function formatFollowUpType(value: string | null | undefined) {
  const normalized = normalizeFollowUpType(value);
  return normalized ? FOLLOW_UP_TYPE_LABELS[normalized] : 'Follow-up';
}
