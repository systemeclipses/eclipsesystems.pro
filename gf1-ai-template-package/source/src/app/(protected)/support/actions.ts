"use server";

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supaServer } from '@/lib/supabase/server';
import { supaAdmin } from '@/lib/supabase/admin';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_TICKET_SOURCE,
  type SupportCategory,
  type SupportPriority,
} from '@/lib/support/constants';
import {
  buildSupportInboxMessageEmail,
  buildSupportInboxTicketEmail,
  buildSupportIdeaAdminEmail,
  buildSupportTicketReceiptEmail,
} from '@/lib/email-templates';
import { serializeNoteBody } from '@/lib/support/noteAttachments';

const SUPPORT_BUCKET = 'support-attachments';
const SUPPORT_INBOXES = [
  'kat@galactic-inc.com',
  'garrett@galactic-inc.com',
  'john@galactic-inc.com',
];
const SUPPORT_INBOX_PRIMARY = SUPPORT_INBOXES[0];

export type CreateTicketState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  ticketId?: string;
};
export type CreateIdeaState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  ideaId?: string;
};

type Priority = SupportPriority;
type Category = SupportCategory;
type InsertPayload = Record<string, unknown>;
type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function isSchemaMismatchError(error: PostgrestLikeError) {
  const code = (error.code ?? '').toUpperCase();
  if (code === 'PGRST204' || code === '42703') return true;

  const text = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return (
    text.includes('schema cache') ||
    (text.includes('column') &&
      (text.includes('does not exist') || text.includes('could not find the')))
  );
}

function isRlsError(error: PostgrestLikeError) {
  const code = (error.code ?? '').toUpperCase();
  if (code === '42501') return true;

  const text = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return text.includes('row-level security') || text.includes('permission denied');
}

function isMissingRelationError(error: PostgrestLikeError) {
  const code = (error.code ?? '').toUpperCase();
  if (code === '42P01') return true;
  const text = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return text.includes('relation') && text.includes('does not exist');
}

function stripProjectPrefix(value: string) {
  return value.replace(/^\s*\[project\]\s*/i, '').trim();
}

async function insertSupportTicketWithFallback(
  client: SupabaseClient,
  payloadVariants: InsertPayload[]
) {
  let lastError: PostgrestLikeError | null = null;

  for (const payload of payloadVariants) {
    const { error } = await client.from('support_tickets').insert(payload);
    if (!error) return null;

    lastError = error;
    if (!isSchemaMismatchError(error)) {
      break;
    }
  }

  return lastError;
}

async function uploadAttachment(
  supabase: Awaited<ReturnType<typeof supaServer>>,
  userId: string,
  ticketId: string,
  file: File
) {
  await ensureSupportBucketExists();
  const adminClient = supaAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const storagePath = `${userId}/ticket-${ticketId}/${safeName}`;

  const { error: uploadError } = await adminClient.storage
    .from(SUPPORT_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = adminClient.storage.from(SUPPORT_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadMessageAttachment(
  supabase: Awaited<ReturnType<typeof supaServer>>,
  userId: string,
  ticketId: string,
  messageId: string,
  file: File
) {
  await ensureSupportBucketExists();
  const adminClient = supaAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const storagePath = `${userId}/ticket-${ticketId}/messages/${messageId}/${safeName}`;

  const { error: uploadError } = await adminClient.storage
    .from(SUPPORT_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = adminClient.storage.from(SUPPORT_BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, name: file.name };
}

async function ensureSupportBucketExists() {
  const adminClient = supaAdmin();
  const { data: bucket, error: bucketError } = await adminClient.storage.getBucket(SUPPORT_BUCKET);
  if (bucketError && !bucketError.message.toLowerCase().includes('not found')) {
    throw new Error(`Unable to check support attachments bucket: ${bucketError.message}`);
  }
  if (!bucket) {
    const { error } = await adminClient.storage.createBucket(SUPPORT_BUCKET, { public: true });
    if (error && !error.message.toLowerCase().includes('already exists')) {
      throw new Error(`Unable to initialize support attachments bucket: ${error.message}`);
    }
  }
}

type EmailPayload = {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  requesterName?: string;
};

async function sendBrevoEmail(payload: EmailPayload) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('Brevo API key is not configured');
  }

  const senderEmail = 'no-reply@galactic-inc.com';
  const senderName = 'Galactic Support Portal';

  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
  const toName =
    Array.isArray(payload.to) || !payload.requesterName ? undefined : payload.requesterName;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: toList.map((email) => ({ email, name: toName ?? email })),
      subject: payload.subject,
      htmlContent: payload.htmlContent,
      textContent: payload.textContent,
      replyTo: { email: SUPPORT_INBOX_PRIMARY, name: 'Galactic Support Portal' },
      tracking: { click: false, opens: false },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo error (${response.status}): ${body}`);
  }
}

export async function addSupportTicketMessage(formData: FormData) {
  const supabase = await supaServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Please sign in to send a message.');
  }

  const ticketId = (formData.get('ticket_id') as string | null)?.trim();
  const body = (formData.get('note') as string | null)?.trim();
  const attachment = formData.get('attachment');

  if (!ticketId || (!body && !(attachment instanceof File))) {
    throw new Error('Message or attachment is required.');
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, created_by, requester_name, requester_email, subject')
    .eq('id', ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    throw new Error('Ticket not found.');
  }

  if (ticket.created_by !== user.id) {
    throw new Error('Not authorized to update this ticket.');
  }

  let attachmentMeta: { url: string; name: string } | null = null;
  const noteId = crypto.randomUUID();
  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.size > 10 * 1024 * 1024) {
      throw new Error('Each attachment must be 10MB or less.');
    }
    attachmentMeta = await uploadMessageAttachment(supabase, user.id, ticketId, noteId, attachment);
  }

  const noteBody = serializeNoteBody(
    body ?? '',
    attachmentMeta ? [{ name: attachmentMeta.name, url: attachmentMeta.url }] : []
  );

  const { error: noteError } = await supabase.from('support_ticket_notes').insert({
    id: noteId,
    ticket_id: ticketId,
    body: noteBody,
    created_by: user.id,
  });

  if (noteError) {
    console.error('[support] user note insert failed', noteError);
    throw new Error('Failed to send message.');
  }

  const messageTemplate = buildSupportInboxMessageEmail({
    ticketId,
    requesterName: ticket.requester_name ?? 'Requester',
    subject: ticket.subject,
    body: noteBody,
    baseUrl:
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://galactic365.com',
  });

  await sendBrevoEmail({
    to: SUPPORT_INBOXES,
    requesterName: ticket.requester_name ?? user.email ?? 'Requester',
    subject: messageTemplate.subject,
    htmlContent: messageTemplate.html,
    textContent: messageTemplate.text,
  });

  revalidatePath('/support');
  revalidatePath(`/support/${ticketId}`);
  revalidatePath('/admin/support');
}

export async function createSupportTicket(
  _prevState: CreateTicketState,
  formData: FormData
): Promise<CreateTicketState> {
  const supabase = await supaServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: 'error', message: 'Please sign in to submit a ticket.' };
  }

  const ticketId = crypto.randomUUID();
  const requesterName = (formData.get('requester_name') as string | null)?.trim();
  const requesterEmailInput = (formData.get('requester_email') as string | null)?.trim();
  const requesterEmail = requesterEmailInput ? requesterEmailInput : null;
  const category = (formData.get('category') as Category | null) ?? 'Other';
  const priority = (formData.get('priority') as Priority | null) ?? 'medium';
  const rawSubject = (formData.get('subject') as string | null)?.trim();
  const subject = rawSubject ? stripProjectPrefix(rawSubject) : '';
  const description = (formData.get('description') as string | null)?.trim();
  const relevantLinks = (formData.get('relevant_links') as string | null)?.trim();
  const attachmentEntries = formData.getAll('attachment');
  const attachments = attachmentEntries.filter((item) => item instanceof File) as File[];

  if (!requesterName) {
    return { status: 'error', message: 'Requester name is required.' };
  }

  if (!subject?.trim()) {
    return { status: 'error', message: 'Subject is required.' };
  }

  if (!description) {
    return { status: 'error', message: 'Description is required.' };
  }

  if (!SUPPORT_CATEGORIES.includes(category)) {
    return { status: 'error', message: 'Invalid category selected.' };
  }

  if (!SUPPORT_PRIORITIES.includes(priority)) {
    return { status: 'error', message: 'Invalid priority selected.' };
  }

  const attachmentUrls: string[] = [];
  if (attachments.length > 10) {
    return { status: 'error', message: 'Please limit attachments to 10 files.' };
  }
  if (attachments.length > 0) {
    try {
      for (const file of attachments) {
        if (file.size > 10 * 1024 * 1024) {
          return { status: 'error', message: 'Each attachment must be 10MB or less.' };
        }
        const url = await uploadAttachment(supabase, user.id, ticketId, file);
        attachmentUrls.push(url);
      }
    } catch (error) {
      console.error('[support] attachment upload failed', error);
      return { status: 'error', message: 'Failed to upload attachment. Please try again.' };
    }
  }

  const corePayload: InsertPayload = {
    id: ticketId,
    created_by: user.id,
    requester_name: requesterName,
    requester_email: requesterEmail,
    category,
    priority,
    subject,
    description,
    relevant_links: relevantLinks || null,
  };
  const attachmentUrl = attachmentUrls[0] ?? null;
  const attachmentUrlArray = attachmentUrls.length > 0 ? attachmentUrls : null;

  // Support both old and newer support_tickets schemas while migrations roll out.
  const payloadVariants: InsertPayload[] = [
    {
      ...corePayload,
      attachment_url: attachmentUrl,
      attachment_urls: attachmentUrlArray,
      source: SUPPORT_TICKET_SOURCE,
    },
    { ...corePayload, attachment_url: attachmentUrl, source: SUPPORT_TICKET_SOURCE },
    { ...corePayload, attachment_urls: attachmentUrlArray, source: SUPPORT_TICKET_SOURCE },
    { ...corePayload, attachment_url: attachmentUrl, attachment_urls: attachmentUrlArray },
    { ...corePayload, attachment_url: attachmentUrl },
    { ...corePayload, attachment_urls: attachmentUrlArray },
    { ...corePayload, source: SUPPORT_TICKET_SOURCE },
    corePayload,
  ];

  let insertError = await insertSupportTicketWithFallback(supabase, payloadVariants);

  if (insertError && isRlsError(insertError)) {
    const adminClient = supaAdmin();
    insertError = await insertSupportTicketWithFallback(adminClient, payloadVariants);
  }

  if (insertError) {
    console.error('[support] ticket insert failed', insertError);
    return { status: 'error', message: 'Unable to save your ticket. Please try again.' };
  }

  const requesterTemplate = buildSupportTicketReceiptEmail({
    requesterName,
    ticketId,
    subject,
    category,
    priority,
    description,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://galactic365.com';

  try {
    if (requesterEmail) {
      await sendBrevoEmail({
        to: requesterEmail,
        requesterName,
        subject: requesterTemplate.subject,
        htmlContent: requesterTemplate.html,
        textContent: requesterTemplate.text,
      });
    }

    const inboxTemplate = buildSupportInboxTicketEmail({
      ticketId,
      requesterName,
      requesterEmail,
      category,
      priority,
      subject,
      description,
      relevantLinks: relevantLinks || null,
      attachmentUrls,
      baseUrl,
    });

    await sendBrevoEmail({
      to: SUPPORT_INBOXES,
      requesterName: 'Galactic Support Portal',
      subject: inboxTemplate.subject,
      htmlContent: inboxTemplate.html,
      textContent: inboxTemplate.text,
    });
  } catch (error) {
    console.error('[support] email send failed', error);
    return {
      status: 'error',
      message: 'Ticket saved, but email notifications failed. Please contact support.',
    };
  }

  revalidatePath('/support');
  return { status: 'success', ticketId };
}

export async function createSupportIdea(
  _prevState: CreateIdeaState,
  formData: FormData
): Promise<CreateIdeaState> {
  const supabase = await supaServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: 'error', message: 'Please sign in to submit an idea.' };
  }

  const ideaId = crypto.randomUUID();
  const requesterName = (formData.get('requester_name') as string | null)?.trim();
  const requesterEmailInput = (formData.get('requester_email') as string | null)?.trim();
  const requesterEmail = requesterEmailInput ? requesterEmailInput : null;
  const idea = (formData.get('description') as string | null)?.trim();

  if (!requesterName) {
    return { status: 'error', message: 'Requester name is required.' };
  }

  if (!idea) {
    return { status: 'error', message: 'Idea is required.' };
  }

  const payload = {
    id: ideaId,
    created_by: user.id,
    requester_name: requesterName,
    requester_email: requesterEmail,
    idea,
  };

  let { error } = await supabase.from('support_project_ideas').insert(payload);
  if (error && isMissingRelationError(error)) {
    return { status: 'error', message: 'Ideas are not available yet. Please try again later.' };
  }
  if (error && isRlsError(error)) {
    const adminClient = supaAdmin();
    const adminInsert = await adminClient.from('support_project_ideas').insert(payload);
    error = adminInsert.error;
  }

  if (error) {
    console.error('[support] idea insert failed', error);
    return { status: 'error', message: 'Unable to save your idea. Please try again.' };
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://galactic365.com';

    const ideaTemplate = buildSupportIdeaAdminEmail({
      ideaId,
      requesterName,
      requesterEmail,
      idea,
      baseUrl,
    });

    await sendBrevoEmail({
      to: SUPPORT_INBOXES,
      requesterName: 'Galactic Support Portal',
      subject: ideaTemplate.subject,
      htmlContent: ideaTemplate.html,
      textContent: ideaTemplate.text,
    });
  } catch (emailError) {
    console.error('[support] idea email send failed', emailError);
  }

  revalidatePath('/support');
  revalidatePath('/admin/support');
  return { status: 'success', ideaId };
}

export async function deleteSupportTicket(formData: FormData) {
  const supabase = await supaServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authorized');
  }

  const ticketId = (formData.get('ticket_id') as string | null)?.trim();
  if (!ticketId) throw new Error('Missing ticket id');

  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .eq('id', ticketId)
    .eq('created_by', user.id);

  if (error) {
    console.error('[support] delete failed', error);
    throw new Error('Failed to delete ticket');
  }

  revalidatePath('/support');
}
