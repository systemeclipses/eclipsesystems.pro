import {
  buildDashboardCalendarEventReminderEmail,
  buildInviteUserEmail,
  buildProposalApprovalEmail,
  buildProposalApprovedNotificationEmail,
  buildProspectIntakeEmail,
  buildProposalRejectionEmail,
  buildGf1RenewalReminderEmail,
  buildDashboardTodoReminderEmail,
  buildHealthCensusBenefitsHeadsUpEmail,
  buildHealthCensusInterestEmail,
  buildRetirementInterestEmail,
  buildRetirementQuestionnaireCompletedEmail,
  buildRetirementQuestionnaireInviteEmail,
  buildAgreementSignatureRequestEmail,
} from '@/lib/email-templates';

const DEFAULT_SENDER_EMAIL = 'no-reply@galactic-inc.com';
const DEFAULT_SENDER_NAME = 'Galactic';

type CcRecipient = { email: string; name?: string };
type BrevoAttachment = { name: string; content: string };

const buildCc = (cc?: string[] | CcRecipient[]) => {
  if (!cc || cc.length === 0) return undefined;
  return cc.map((entry) =>
    typeof entry === 'string' ? { email: entry } : { email: entry.email, name: entry.name }
  );
};

type SendApprovalParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  proposalId: string;
  proposalData: { client?: string; amount?: string; terms?: string };
  approvalUrl: string;
  approverName?: string;
};

function displayNameFromEmail(email: string) {
  const local = email.split('@')[0] || '';
  const withSpaces = local.replace(/[._-]+/g, ' ');
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase()) || email;
}

export async function sendApprovalEmail(params: SendApprovalParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const clientName = params.proposalData.client ?? 'your prospect';
  const approverName = params.approverName ?? displayNameFromEmail(params.to);
  const template = buildProposalApprovalEmail({
    clientName,
    approverName,
    amount: params.proposalData.amount,
    terms: params.proposalData.terms,
    approvalUrl: params.approvalUrl,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

type ProspectIntakeEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  organizationName: string;
  intakeUrl: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  recipientName?: string;
};

type ProposalRejectionEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  proposalId: string;
  organizationName: string;
  rejectionNotes?: string | null;
};

type HealthCensusInterestEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
  attachment?: BrevoAttachment;
};

type HealthCensusBenefitsHeadsUpEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  salespersonName: string;
  organizationName: string;
};

type RetirementInterestEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
};

type RetirementQuestionnaireCompletedEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
  pdfUrl: string;
};

type RetirementQuestionnaireInviteEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  organizationName: string;
  questionnaireUrl: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
};

type AgreementSignatureRequestEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  recipientName?: string;
  organizationName: string;
  signingUrl: string;
  senderName?: string | null;
};

type ProposalApprovalNotificationParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  proposalId: string;
  organizationName?: string;
  repName?: string;
  dashboardUrl: string;
};

type InviteUserEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  name?: string | null;
  inviteUrl: string;
};

type RenewalReminderEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  companyName: string;
  renewalDueDate: string;
  daysBeforeDue: number;
};

type DashboardTodoReminderEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  todoSubject: string;
  dueDate: string;
  daysBeforeDue: number;
};

type DashboardCalendarEventReminderEmailParams = {
  to: string;
  cc?: string[] | CcRecipient[];
  eventName: string;
  eventDate: string;
  eventTime: string;
  minutesBeforeStart: number;
};

export async function sendInviteUserEmail(params: InviteUserEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = 'Galactic Projects Team';

  const template = buildInviteUserEmail({
    recipientName: params.name ?? 'there',
    inviteUrl: params.inviteUrl,
  });

  const payload = {
    to: [{ email: params.to, name: params.name ?? undefined }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
    tracking: { click: false, opens: false },
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendProposalApprovedNotification(params: ProposalApprovalNotificationParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildProposalApprovedNotificationEmail({
    repName: params.repName ?? 'there',
    organizationName: params.organizationName ?? 'the prospect',
    dashboardUrl: params.dashboardUrl,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
    tracking: { click: false, opens: false },
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendProspectIntakeEmail(params: ProspectIntakeEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildProspectIntakeEmail({
    organizationName: params.organizationName,
    intakeUrl: params.intakeUrl,
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    senderPhone: params.senderPhone,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendProposalRejectionEmail(params: ProposalRejectionEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://galactic365.com';
  const proposalUrl = `${baseUrl.replace(/\/$/, '')}/gf1/proposals/${params.proposalId}`;

  const template = buildProposalRejectionEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    rejectionNotes: params.rejectionNotes ?? null,
    proposalUrl,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendGf1RenewalReminderEmail(params: RenewalReminderEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildGf1RenewalReminderEmail({
    recipientName: displayNameFromEmail(params.to),
    companyName: params.companyName,
    renewalDueDate: params.renewalDueDate,
    daysBeforeDue: params.daysBeforeDue,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendHealthCensusBenefitsHeadsUpEmail(
  params: HealthCensusBenefitsHeadsUpEmailParams
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const template = buildHealthCensusBenefitsHeadsUpEmail({
    salespersonName: params.salespersonName,
    organizationName: params.organizationName,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: DEFAULT_SENDER_EMAIL, name: DEFAULT_SENDER_NAME },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function sendHealthCensusInterestEmail(params: HealthCensusInterestEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildHealthCensusInterestEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    prospectName: params.prospectName ?? null,
  });

  const payload: Record<string, any> = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  if (params.attachment) {
    payload.attachment = [{ name: params.attachment.name, content: params.attachment.content }];
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendRetirementInterestEmail(params: RetirementInterestEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildRetirementInterestEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    prospectName: params.prospectName ?? null,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendRetirementQuestionnaireCompletedEmail(
  params: RetirementQuestionnaireCompletedEmailParams
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildRetirementQuestionnaireCompletedEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    prospectName: params.prospectName ?? null,
    pdfUrl: params.pdfUrl,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendRetirementQuestionnaireInviteEmail(
  params: RetirementQuestionnaireInviteEmailParams
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildRetirementQuestionnaireInviteEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    questionnaireUrl: params.questionnaireUrl,
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    senderPhone: params.senderPhone,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendAgreementSignatureRequestEmail(params: AgreementSignatureRequestEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = DEFAULT_SENDER_NAME;

  const template = buildAgreementSignatureRequestEmail({
    recipientName: params.recipientName ?? displayNameFromEmail(params.to),
    organizationName: params.organizationName,
    signingUrl: params.signingUrl,
    senderName: params.senderName ?? senderName,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendDashboardTodoReminderEmail(params: DashboardTodoReminderEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = 'Galactic 365';

  const template = buildDashboardTodoReminderEmail({
    recipientName: displayNameFromEmail(params.to),
    todoSubject: params.todoSubject,
    dueDate: params.dueDate,
    daysBeforeDue: params.daysBeforeDue,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendDashboardCalendarEventReminderEmail(
  params: DashboardCalendarEventReminderEmailParams
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const senderEmail = DEFAULT_SENDER_EMAIL;
  const senderName = 'Galactic 365';

  const template = buildDashboardCalendarEventReminderEmail({
    recipientName: displayNameFromEmail(params.to),
    eventName: params.eventName,
    eventDate: params.eventDate,
    eventTime: params.eventTime,
    minutesBeforeStart: params.minutesBeforeStart,
  });

  const payload = {
    to: [{ email: params.to }],
    ...(buildCc(params.cc) ? { cc: buildCc(params.cc) } : {}),
    sender: { email: senderEmail, name: senderName },
    subject: template.subject,
    htmlContent: template.html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}
