import { parseNoteBody } from '@/lib/support/noteAttachments';
import { toAttachmentDownloadUrl } from '@/lib/support/attachmentLinks';

type SupportTicketReceiptParams = {
  requesterName: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
};

type SupportInboxTicketParams = {
  ticketId: string;
  requesterName: string;
  requesterEmail: string | null;
  category: string;
  priority: string;
  subject: string;
  description: string;
  relevantLinks: string | null;
  attachmentUrls: string[] | null;
  baseUrl?: string;
};

type SupportInboxMessageParams = {
  ticketId: string;
  requesterName: string;
  subject: string;
  body: string;
  baseUrl?: string;
};

type SupportUpdateParams = {
  requesterName: string | null;
  ticketId: string;
  ticketSubject: string;
  message: string;
  ticketUrl: string;
};

type SupportClosedParams = {
  requesterName: string | null;
  ticketId: string;
  ticketSubject: string;
  message?: string | null;
  baseUrl?: string;
};

type SupportClosedInternalParams = {
  ticketId: string;
  ticketSubject: string;
  requesterName: string | null;
  requesterEmail: string | null;
  message?: string | null;
  baseUrl?: string;
};

type SupportIdeaAdminParams = {
  ideaId: string;
  requesterName: string;
  requesterEmail: string | null;
  idea: string;
  baseUrl?: string;
};

type InviteUserParams = {
  recipientName: string;
  inviteUrl: string;
};

type ProposalApprovalParams = {
  clientName: string;
  approverName?: string;
  amount?: string;
  terms?: string;
  approvalUrl: string;
};

type ProposalApprovedParams = {
  repName: string;
  organizationName: string;
  dashboardUrl: string;
};

type ProspectIntakeParams = {
  organizationName: string;
  intakeUrl: string;
  recipientName?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
};

type ProposalRejectionParams = {
  recipientName?: string;
  organizationName: string;
  rejectionNotes?: string | null;
  proposalUrl: string;
};

type HealthCensusInterestParams = {
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
};

type HealthCensusBenefitsHeadsUpParams = {
  salespersonName: string;
  organizationName: string;
};

type RetirementInterestParams = {
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
};

type RetirementQuestionnaireCompletedParams = {
  recipientName?: string;
  organizationName: string;
  prospectName?: string | null;
  pdfUrl: string;
};

type RetirementQuestionnaireInviteParams = {
  recipientName?: string;
  organizationName: string;
  questionnaireUrl: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
};

type AgreementSignatureRequestParams = {
  recipientName: string;
  organizationName: string;
  signingUrl: string;
  senderName?: string | null;
};

type Gf1RenewalReminderParams = {
  recipientName?: string;
  companyName: string;
  renewalDueDate: string;
  daysBeforeDue: number;
};

type DashboardTodoReminderParams = {
  recipientName?: string;
  todoSubject: string;
  dueDate: string;
  daysBeforeDue: number;
};

type DashboardCalendarEventReminderParams = {
  recipientName?: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  minutesBeforeStart: number;
};

type AccountApprovedParams = {
  approverEmail: string;
  appUrl: string;
  senderName: string;
  recipientName: string;
};

function formatPhoneNumber(value?: string) {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function buildSupportTicketReceiptEmail(params: SupportTicketReceiptParams) {
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>365 Emails</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} .r0-o { border-style: solid !important; margin: 0 !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 100% !important } .r3-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r4-o { border-style: solid !important; width: 100% !important } .r5-i { padding-left: 0px !important; padding-right: 0px !important } .r6-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r7-c { box-sizing: border-box !important; text-align: left !important; valign: top !important; width: 100% !important } .r8-o { border-style: solid !important; margin: 0 !important; width: 100% !important } .r9-i { padding-bottom: 9px !important; padding-top: 9px !important; padding-left: 0px !important; padding-right: 0px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } .nl2go-default-textstyle { color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #ffffff; font-family: Poppins, Arial, sans-serif; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } a, a:link { color: #0092ff; text-decoration: underline } .default-heading1 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 36px; font-weight: 400; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 32px; font-weight: 400; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 24px; font-weight: 400; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 18px; font-weight: 400; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--></head><body bgcolor="#ffffff" text="#3b3f44" link="#0092ff" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="left" class="r0-o" style="table-layout: fixed; width: 600px; margin: 0;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r2-o" style="table-layout: fixed; width: 100%;"><tr><th width="100%" valign="top" class="r3-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r4-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r5-i"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r6-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;"><span style="font-family: Poppins;">Hello ${params.requesterName},</span></p><p style="margin: 0;"><br></p><p style="margin: 0;"><span style="font-family: Poppins;">Thanks for reaching out! Your ticket has been successfully submitted.&nbsp;</span></p><p style="margin: 0;"><br></p><p style="margin: 0;"><span style="font-family: Poppins;">The Projects team is reviewing your request and will get back to you soon.&nbsp;</span></p><p style="margin: 0;"><br></p><p style="margin: 0;"><span style="font-family: Poppins;">Kick back and float a while, the Projects team has the controls!</span></p><p style="margin: 0;"><br></p><p style="margin: 0;"><span style="font-family: Poppins;">Thanks,</span></p><p style="margin: 0;"><span style="font-family: Poppins;">Projects</span></p></div> </td> </tr><tr><td class="r7-c" align="left" style="padding-left: 0px; padding-right: 0px;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="220" class="r8-o" style="table-layout: fixed; width: 220px; margin: 0;"><tr><td class="r9-i" style="font-size: 0px; line-height: 0px; padding-bottom: 9px; padding-top: 9px; padding-left: 0px; padding-right: 0px;"> <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;"></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></body></html>
  `;

  return {
    subject: `We received your ticket! - ${params.subject}`,
    html,
    text: `Ticket ${params.ticketId} received. Subject: ${params.subject}`,
  };
}

export function buildSupportInboxTicketEmail(params: SupportInboxTicketParams) {
  const baseUrl = params.baseUrl ?? '';
  const attachmentList =
    params.attachmentUrls && params.attachmentUrls.length > 0
      ? params.attachmentUrls
          .map(
            (url) =>
              `<a href="${toAttachmentDownloadUrl(url, { baseUrl })}" style="color:#005791;text-decoration:underline;">Download attachment</a>`
          )
          .join('<br />')
      : 'none';
  const html = `
    <p>A new ticket has been submitted.</p>
    <p style="margin: 6px 0 0;"></p>
    <ul>
      <li><strong>Subject:</strong> ${params.subject}</li>
      <li><strong>Requester:</strong> ${params.requesterName} (${params.requesterEmail ?? 'n/a'})</li>
      <li><strong>Category:</strong> ${params.category}</li>
      <li><strong>Priority:</strong> ${params.priority}</li>
      <li><strong>Attachments:</strong> ${attachmentList}</li>
      <li><strong>Relevant links:</strong> ${params.relevantLinks ?? 'none'}</li>
    </ul>
    <p style="margin: 6px 0 0;"></p>
    <p>${params.description.replace(/\n/g, '<br />')}</p>
    <p style="margin: 12px 0 0;">
      <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo">
    </p>
  `;

  return {
    subject: `New support ticket: ${params.subject}`,
    html,
    text: `Ticket ${params.ticketId} from ${params.requesterName}. Subject: ${params.subject}. Priority: ${params.priority}.`,
  };
}

export function buildSupportInboxMessageEmail(params: SupportInboxMessageParams) {
  const parsed = parseNoteBody(params.body ?? '');
  const messageHtml = parsed.text ? parsed.text.replace(/\n/g, '<br />') : '';
  const baseUrl = params.baseUrl ?? '';
  const attachmentLinks =
    parsed.attachments.length > 0
      ? parsed.attachments
          .map(
            (attachment, index) =>
              `<a href="${toAttachmentDownloadUrl(attachment.url, { baseUrl, name: attachment.name })}" style="color:#005791;text-decoration:underline;">Download attachment${parsed.attachments.length > 1 ? ` ${index + 1}` : ''}</a>`
          )
          .join('<br />')
      : '';
  const attachmentBlock = attachmentLinks
    ? `<div style="height: 12px; line-height: 12px;">&nbsp;</div>${attachmentLinks}`
    : '';
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>365 Emails</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} .r0-o { border-style: solid !important; margin: 0 !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 100% !important } .r3-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r4-o { border-style: solid !important; width: 100% !important } .r5-i { padding-left: 0px !important; padding-right: 0px !important } .r6-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r7-c { box-sizing: border-box !important; text-align: left !important; valign: top !important; width: 100% !important } .r8-o { border-style: solid !important; margin: 0 !important; width: 100% !important } .r9-i { padding-bottom: 9px !important; padding-top: 9px !important; padding-left: 0px !important; padding-right: 0px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } .nl2go-default-textstyle { color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #ffffff; font-family: Poppins, Arial, sans-serif; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } a, a:link { color: #0092ff; text-decoration: underline } .default-heading1 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 36px; font-weight: 400; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 32px; font-weight: 400; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 24px; font-weight: 400; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 18px; font-weight: 400; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--></head><body bgcolor="#ffffff" text="#3b3f44" link="#0092ff" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="left" class="r0-o" style="table-layout: fixed; width: 600px; margin: 0;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r2-o" style="table-layout: fixed; width: 100%;"><tr><th width="100%" valign="top" class="r3-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r4-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r5-i"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r6-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">${params.requesterName} added a message to ticket - ${params.subject}.</span></p><p style="margin: 0;"><br></p><p style="margin: 0;">${messageHtml}${attachmentBlock}</p></div> </td> </tr><tr><td class="r7-c" align="left" style="padding-left: 0px; padding-right: 0px;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="220" class="r8-o" style="table-layout: fixed; width: 220px; margin: 0;"><tr><td class="r9-i" style="font-size: 0px; line-height: 0px; padding-bottom: 9px; padding-top: 9px; padding-left: 0px; padding-right: 0px;"> <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;"></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></body></html>
  `;

  return {
    subject: `New message on support ticket (${params.subject})`,
    html,
    text: `New message on ticket ${params.ticketId}: ${params.subject}

${parsed.text || params.body}

${parsed.attachments.length > 0 ? `Attachments: ${parsed.attachments.map((item) => toAttachmentDownloadUrl(item.url, { baseUrl, name: item.name })).join(', ')}` : ''}`,
  };
}

export function buildSupportUpdateEmail(params: SupportUpdateParams) {
  const parsed = parseNoteBody(params.message ?? '');
  const messageHtml = parsed.text ? parsed.text.replace(/\n/g, '<br />') : '';
  const baseUrl = (() => {
    try {
      return new URL(params.ticketUrl).origin;
    } catch {
      return '';
    }
  })();
  const attachmentButtons =
    parsed.attachments.length > 0
      ? parsed.attachments
          .map(
            (attachment, index) =>
              `<a href="${toAttachmentDownloadUrl(attachment.url, { baseUrl, name: attachment.name })}" style="background:#005791;color:#ffffff;padding:6px 10px;border-radius:6px;text-decoration:none;font-weight:600;font-size:12px;display:inline-block;">View attachment${parsed.attachments.length > 1 ? ` ${index + 1}` : ''}</a>`
          )
          .join('<br /><br />')
      : '';
  const attachmentBlock = attachmentButtons
    ? `<div style="height: 6px; line-height: 6px;">&nbsp;</div>${attachmentButtons}`
    : '';
  const ticketButton = params.ticketUrl
    ? `<div style="height: 16px; line-height: 16px;">&nbsp;</div>
       <a href="${params.ticketUrl}" style="background:#005791;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">View ticket</a>`
    : '';
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>365 Emails</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} .r0-o { border-style: solid !important; margin: 0 !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 100% !important } .r3-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r4-o { border-style: solid !important; width: 100% !important } .r5-i { padding-left: 0px !important; padding-right: 0px !important } .r6-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r7-c { box-sizing: border-box !important; text-align: left !important; valign: top !important; width: 100% !important } .r8-o { border-style: solid !important; margin: 0 !important; width: 100% !important } .r9-i { padding-bottom: 9px !important; padding-top: 9px !important; padding-left: 0px !important; padding-right: 0px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } .nl2go-default-textstyle { color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #ffffff; font-family: Poppins, Arial, sans-serif; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } a, a:link { color: #0092ff; text-decoration: underline } .default-heading1 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 36px; font-weight: 400; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 32px; font-weight: 400; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 24px; font-weight: 400; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 18px; font-weight: 400; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--></head><body bgcolor="#ffffff" text="#3b3f44" link="#0092ff" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="left" class="r0-o" style="table-layout: fixed; width: 600px; margin: 0;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r2-o" style="table-layout: fixed; width: 100%;"><tr><th width="100%" valign="top" class="r3-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r4-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r5-i"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r6-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Hello ${params.requesterName ?? 'there'},</span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;"><br></span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">The Projects Team added a message to your ticket (${params.ticketSubject}).</span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;"><br></span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">${messageHtml}${attachmentBlock}${ticketButton}<br><br>Thanks,</span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Projects</span></p></div> </td> </tr><tr><td class="r7-c" align="left" style="padding-left: 0px; padding-right: 0px;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="220" class="r8-o" style="table-layout: fixed; width: 220px; margin: 0;"><tr><td class="r9-i" style="font-size: 0px; line-height: 0px; padding-bottom: 9px; padding-top: 9px; padding-left: 0px; padding-right: 0px;"> <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;"></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></body></html>
  `;

  return {
    subject: `Update on your support ticket`,
    html,
    text: `Update on your ticket (${params.ticketId}): ${params.ticketSubject}

${parsed.text || params.message}

${parsed.attachments.length > 0 ? `Attachments: ${parsed.attachments.map((item) => toAttachmentDownloadUrl(item.url, { baseUrl, name: item.name })).join(', ')}` : ''}
${params.ticketUrl ? `\nView ticket: ${params.ticketUrl}` : ''}`,
  };
}

export function buildSupportClosedEmail(params: SupportClosedParams) {
  const parsed = parseNoteBody(params.message ?? '');
  const messageHtml = parsed.text ? parsed.text.replace(/\n/g, '<br />') : '';
  const baseUrl = params.baseUrl ?? '';
  const attachmentLinks =
    parsed.attachments.length > 0
      ? parsed.attachments
          .map(
            (attachment, index) =>
              `<a href="${toAttachmentDownloadUrl(attachment.url, { baseUrl, name: attachment.name })}" style="color:#005791;text-decoration:underline;">Download attachment${parsed.attachments.length > 1 ? ` ${index + 1}` : ''}</a>`
          )
          .join('<br />')
      : '';
  const attachmentBlock = attachmentLinks
    ? `<div style="height: 12px; line-height: 12px;">&nbsp;</div>${attachmentLinks}`
    : '';
  const noteBlock = messageHtml
    ? `<p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">${messageHtml}${attachmentBlock}</span></p><p style="margin: 0;"><br></p>`
    : '';
  const supportUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/support` : '';
  const ticketButton = supportUrl
    ? `<div style="height: 16px; line-height: 16px;">&nbsp;</div>
       <a href="${supportUrl}" style="background:#005791;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">View support portal</a>`
    : '';
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>365 Emails</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} .r0-o { border-style: solid !important; margin: 0 !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-o { border-style: solid !important; margin: 0 auto 0 auto !important; width: 100% !important } .r3-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r4-o { border-style: solid !important; width: 100% !important } .r5-i { padding-left: 0px !important; padding-right: 0px !important } .r6-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r7-c { box-sizing: border-box !important; text-align: left !important; valign: top !important; width: 100% !important } .r8-o { border-style: solid !important; margin: 0 !important; width: 100% !important } .r9-i { padding-bottom: 9px !important; padding-top: 9px !important; padding-left: 0px !important; padding-right: 0px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } .nl2go-default-textstyle { color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #ffffff; font-family: Poppins, Arial, sans-serif; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } a, a:link { color: #0092ff; text-decoration: underline } .default-heading1 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 36px; font-weight: 400; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 32px; font-weight: 400; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 24px; font-weight: 400; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: Poppins, Arial, sans-serif; font-size: 18px; font-weight: 400; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--></head><body bgcolor="#ffffff" text="#3b3f44" link="#0092ff" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="left" class="r0-o" style="table-layout: fixed; width: 600px; margin: 0;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="center" class="r2-o" style="table-layout: fixed; width: 100%;"><tr><th width="100%" valign="top" class="r3-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r4-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r5-i"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r6-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: Poppins, Arial, sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Hello ${params.requesterName ?? 'there'},</span></p><p style="margin: 0;"><br></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Your support ticket (${params.ticketSubject}) has been closed.</span></p><p style="margin: 0;"><br></p>${noteBlock}${ticketButton}<p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Thanks,</span></p><p style="margin: 0;"><span style="font-family: Poppins, Arial, sans-serif;">Projects</span></p></div> </td> </tr><tr><td class="r7-c" align="left" style="padding-left: 0px; padding-right: 0px;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="220" class="r8-o" style="table-layout: fixed; width: 220px; margin: 0;"><tr><td class="r9-i" style="font-size: 0px; line-height: 0px; padding-bottom: 9px; padding-top: 9px; padding-left: 0px; padding-right: 0px;"> <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;"></td> </tr></table></td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></body></html>
  `;

  return {
    subject: `Your support ticket has been closed`,
    html,
    text: `Your support ticket (${params.ticketId}) has been closed. Subject: ${params.ticketSubject}

${parsed.text ? `${parsed.text}\n\n` : ''}${parsed.attachments.length > 0 ? `Attachments: ${parsed.attachments.map((item) => toAttachmentDownloadUrl(item.url, { baseUrl, name: item.name })).join(', ')}` : ''}${supportUrl ? `\nView support portal: ${supportUrl}` : ''}`,
  };
}

export function buildSupportClosedInternalEmail(params: SupportClosedInternalParams) {
  const parsed = parseNoteBody(params.message ?? '');
  const messageHtml = parsed.text ? parsed.text.replace(/\n/g, '<br />') : '';
  const baseUrl = params.baseUrl ?? '';
  const adminUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/admin/support` : '/admin/support';
  const attachmentLinks =
    parsed.attachments.length > 0
      ? parsed.attachments
          .map(
            (attachment, index) =>
              `<a href="${toAttachmentDownloadUrl(attachment.url, { baseUrl, name: attachment.name })}" style="color:#005791;text-decoration:underline;">Download attachment${parsed.attachments.length > 1 ? ` ${index + 1}` : ''}</a>`
          )
          .join('<br />')
      : '';
  const attachmentBlock = attachmentLinks
    ? `<div style="height: 12px; line-height: 12px;">&nbsp;</div>${attachmentLinks}`
    : '';
  const noteBlock = messageHtml
    ? `<p style="margin: 0 0 6px;"><strong>Closing note:</strong></p><p style="margin: 0;">${messageHtml}${attachmentBlock}</p>`
    : '';

  const html = `
    <p>Support ticket closed.</p>
    <ul>
      <li><strong>Subject:</strong> ${params.ticketSubject}</li>
      <li><strong>Ticket ID:</strong> ${params.ticketId}</li>
      <li><strong>Requester:</strong> ${params.requesterName ?? 'n/a'} (${params.requesterEmail ?? 'n/a'})</li>
      <li><strong>Admin link:</strong> <a href="${adminUrl}">${adminUrl}</a></li>
    </ul>
    ${noteBlock}
  `;

  return {
    subject: `Support ticket closed: ${params.ticketSubject}`,
    html,
    text: `Support ticket closed. Ticket ${params.ticketId} - ${params.ticketSubject}.
Requester: ${params.requesterName ?? 'n/a'} (${params.requesterEmail ?? 'n/a'}).
Admin: ${adminUrl}.

${parsed.text ? `${parsed.text}\n\n` : ''}${parsed.attachments.length > 0 ? `Attachments: ${parsed.attachments.map((item) => toAttachmentDownloadUrl(item.url, { baseUrl, name: item.name })).join(', ')}` : ''}`,
  };
}

export function buildSupportIdeaAdminEmail(params: SupportIdeaAdminParams) {
  const baseUrl = params.baseUrl ?? '';
  const supportUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/support` : '/support';
  const ideaText = params.idea.replace(/\n/g, '<br />');
  const html = `
    <p>A new support idea was submitted.</p>
    <ul>
      <li><strong>Idea ID:</strong> ${params.ideaId}</li>
      <li><strong>Requester:</strong> ${params.requesterName} (${params.requesterEmail ?? 'n/a'})</li>
      <li><strong>Support portal:</strong> <a href="${supportUrl}">${supportUrl}</a></li>
    </ul>
    <p><strong>Idea:</strong></p>
    <p>${ideaText}</p>
  `;

  return {
    subject: `New support idea submitted`,
    html,
    text: `New support idea submitted.
Idea ID: ${params.ideaId}
Requester: ${params.requesterName} (${params.requesterEmail ?? 'n/a'})
Support portal: ${supportUrl}

Idea:
${params.idea}`,
  };
}

export function buildInviteUserEmail(params: InviteUserParams) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName},</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      You have been invited to access Galactic 365. Use the link below to create an account.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 16px 0 0;">
      <a href="${params.inviteUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Create an account
      </a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Thanks,</p>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Projects</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>

  `;

  return {
    subject: 'You have been invited to Galactic 365',
    html,
  };
}

export function buildProposalApprovalEmail(params: ProposalApprovalParams) {
  const approverLine = params.approverName
    ? `<p style="font-family: Poppins, Arial, sans-serif; color: #111827; margin: 0 0 12px;">
        Approver: <strong>${params.approverName}</strong>
      </p>`
    : '';
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.approverName ?? 'there'},</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      A new proposal for <strong>${params.clientName}</strong> is ready for your review.
    </p>
    ${approverLine}
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    ${params.amount
      ? `<p style="font-family: Poppins, Arial, sans-serif; color: #111827; margin: 0 0 12px;">
          Estimated Admin Cost: <strong>${params.amount}</strong>
        </p>`
      : ''}
    ${
      params.terms
        ? `<p style="font-family: Poppins, Arial, sans-serif; color: #4b5563; margin: 0 0 16px;">
            ${params.terms}
          </p>
          <div style="height: 16px; line-height: 16px;">&nbsp;</div>`
        : ''
    }
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0 0 32px;">
      <a href="${params.approvalUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Review and approve
      </a>
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin: 0;">
      <tr>
        <td style="font-family: Poppins, Arial, sans-serif; font-weight: 800; letter-spacing: -0.01em; color: #0b1f3b; font-size: 18px; line-height: 1;">
          <img
            src="https://api.iconify.design/fa6-solid/cloud-arrow-up.svg?color=%230b1f3b"
            width="24"
            height="24"
            style="display: inline-block; vertical-align: middle;"
            alt="Galforce"
          >
          <span style="display: inline-block; vertical-align: middle; position: relative; top: 1px;">GALFORCE</span>
        </td>
      </tr>
    </table>

  `;

  return {
    subject: `Proposal approval needed for ${params.clientName}`,
    html,
  };
}

export function buildProposalApprovedNotificationEmail(params: ProposalApprovedParams) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hi ${params.repName},</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Good news - your proposal for <strong>${params.organizationName}</strong> has been approved!
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 16px 0;">
      <a href="${params.dashboardUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        View proposal
      </a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Proposal approved for ${params.organizationName}`,
    html,
  };
}

export function buildProspectIntakeEmail(params: ProspectIntakeParams) {
  const formattedSenderPhone =
    formatPhoneNumber(params.senderPhone) ?? params.senderPhone ?? '[SALES REP PHONE NUMBER]';
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="format-detection" content="telephone=no"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>365 Emails</title><style type="text/css" emogrify="no">#outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } table td { border-collapse: collapse; mso-line-height-rule: exactly; } .editable.image { font-size: 0 !important; line-height: 0 !important; } .nl2go_preheader { display: none !important; mso-hide:all !important; mso-line-height-rule: exactly; visibility: hidden !important; line-height: 0px !important; font-size: 0px !important; } body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; } img { outline:none; text-decoration:none; -ms-interpolation-mode: bicubic; } a img { border:none; } table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; } th { font-weight: normal; text-align: left; } *[class="gmail-fix"] { display: none !important; } </style><style type="text/css" emogrify="no"> @media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} } </style><style type="text/css" emogrify="no">@media (max-width: 600px) { .gmx-killpill { content: ' \\03D1';} .r0-o { border-style: solid !important; margin: 0 !important; width: 320px !important } .r1-i { background-color: #ffffff !important } .r2-c { box-sizing: border-box !important; text-align: center !important; valign: top !important; width: 100% !important } .r3-o { border-style: solid !important; margin: 0 !important; width: 100% !important } .r4-i { padding-bottom: 20px !important; padding-left: 15px !important; padding-right: 15px !important; padding-top: 20px !important } .r5-c { box-sizing: border-box !important; display: block !important; valign: top !important; width: 100% !important } .r6-o { border-style: solid !important; width: 100% !important } .r7-i { padding-left: 0px !important; padding-right: 0px !important } .r8-c { box-sizing: border-box !important; padding-bottom: 15px !important; padding-top: 15px !important; text-align: left !important; valign: top !important; width: 100% !important } .r9-o { border-style: solid !important; margin: 0 auto 0 0 !important; width: 100% !important } .r10-i { padding-bottom: 9px !important; padding-top: 9px !important } body { -webkit-text-size-adjust: none } .nl2go-responsive-hide { display: none } .nl2go-body-table { min-width: unset !important } .mobshow { height: auto !important; overflow: visible !important; max-height: unset !important; visibility: visible !important } .resp-table { display: inline-table !important } .magic-resp { display: table-cell !important } } </style><style type="text/css">p, h1, h2, h3, h4, ol, ul, li { margin: 0; } .nl2go-default-textstyle { color: #3b3f44; font-family: arial,helvetica,sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word } .default-button { color: #ffffff; font-family: arial,helvetica,sans-serif; font-size: 16px; font-style: normal; font-weight: normal; line-height: 1.15; text-decoration: none; word-break: break-word } a, a:link { color: #0092ff; text-decoration: underline } .default-heading1 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 36px; font-weight: 400; word-break: break-word } .default-heading2 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 32px; font-weight: 400; word-break: break-word } .default-heading3 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 24px; font-weight: 400; word-break: break-word } .default-heading4 { color: #1F2D3D; font-family: arial,helvetica,sans-serif; font-size: 18px; font-weight: 400; word-break: break-word } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; } .no-show-for-you { border: none; display: none; float: none; font-size: 0; height: 0; line-height: 0; max-height: 0; mso-hide: all; overflow: hidden; table-layout: fixed; visibility: hidden; width: 0; } </style><!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml><![endif]--></head><body bgcolor="#ffffff" text="#3b3f44" link="#0092ff" yahoo="fix" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" class="nl2go-body-table" width="100%" style="background-color: #ffffff; width: 100%;"><tr><td> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="600" align="left" class="r0-o" style="table-layout: fixed; width: 600px;"><tr><td valign="top" class="r1-i" style="background-color: #ffffff;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="left" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><td class="r4-i" style="padding-bottom: 20px; padding-top: 20px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" class="r6-o" style="table-layout: fixed; width: 100%;"><tr><td valign="top" class="r7-i" style="padding-left: 15px; padding-right: 15px;"> <table width="100%" cellspacing="0" cellpadding="0" border="0" role="presentation"><tr><td class="r8-c nl2go-default-textstyle" align="left" style="color: #3b3f44; font-family: arial,helvetica,sans-serif; font-size: 16px; line-height: 1.5; word-break: break-word; padding-bottom: 15px; padding-top: 15px; text-align: left; valign: top;"> <div><p style="margin: 0;"><span style="font-family: Poppins;"> Hello ${params.recipientName ?? 'there'},</span></p><p style="margin: 0;"><span style="font-family: Poppins;">&nbsp;</span></p><div id="isPasted" style="font-style: normal; font-weight: 400;"><p class="default" style="margin: 0;"><span style="font-family: Poppins;">Thank you so much for considering <strong>Galactic</strong> for your PEO needs, we truly appreciate the opportunity to support your business. Our team is dedicated to delivering a smooth, reliable, and stress‑free experience from day one, and we’re excited to learn more about how we can help your organization thrive.</span></p><p class="default" style="margin: 0;"><span style="font-family: Poppins;"><br></span></p><p class="default" style="margin: 0;"><span style="font-family: Poppins;">To get started, we’ve put together a quick <strong>Prospect Information Intake Form</strong>. It helps us gather the core details we need to tailor our services precisely to your business.</span></p><p class="default" style="margin: 0;"><span style="font-family: Poppins;"><br></span></p><p class="default" style="margin: 0;"><span style="font-family: Poppins;"><a href="${params.intakeUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Complete Prospect Intake Form</a></span></p><p class="default" style="margin: 0;"><span style="font-family: Poppins;"><br></span></p><div id="isPasted" style="font-style: normal; font-weight: 400;"><span style="font-family: Poppins;">If you have any questions while filling it out, feel free to reach out at any time.&nbsp;</span></div><div style="height: 16px; line-height: 16px;">&nbsp;</div><div id="isPasted" style="font-style: normal; font-weight: 400;"><span style="font-family: Poppins;">We look forward to learning more about your business and exploring how we can support your growth.</span></div><div id="isPasted" style="font-style: normal; font-weight: 400;"><span style="font-family: Poppins;">&nbsp;</span></div><p style="margin: 0;"><span style="font-family: Poppins;">Thanks,</span></p><p style="margin: 0;"><span style="font-family: Poppins;"><br></span></p><p style="margin: 0;"><span style="font-family: Poppins;">${params.senderName ?? 'Sales Rep'}</span></p><p style="margin: 0;"><span style="font-family: Poppins;">${formattedSenderPhone}</span></p><p style="margin: 0;"><span style="font-family: Poppins;">${params.senderEmail ?? "[SALES REP EMAIL]"}</span></p></div></div> </td> </tr></table></td> </tr></table></th> </tr></table></td> </tr></table><table cellspacing="0" cellpadding="0" border="0" role="presentation" width="100%" align="left" class="r3-o" style="table-layout: fixed; width: 100%;"><tr><th width="100%" valign="top" class="r5-c" style="font-weight: normal;"> <table cellspacing="0" cellpadding="0" border="0" role="presentation" width="220" align="left" class="r9-o" style="table-layout: fixed; width: 220px;"><tr><td class="r10-i" style="font-size: 0px; line-height: 0px; padding-bottom: 9px; padding-top: 9px;"> <img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px;"></td> </tr></table></th> </tr></table></td> </tr></table></td> </tr></table></body></html>
  `;

  return {
    subject: `Prospect information form for ${params.organizationName}`,
    html,
  };
}

export function buildGf1RenewalReminderEmail(params: Gf1RenewalReminderParams) {
  const dueDate = new Date(`${params.renewalDueDate}T00:00:00Z`);
  const formattedDueDate = Number.isNaN(dueDate.getTime())
    ? params.renewalDueDate
    : dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const dayLabel = params.daysBeforeDue === 1 ? '1 day' : `${params.daysBeforeDue} days`;
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      This is a w/c renewal reminder for <strong>${params.companyName}</strong>.
    </p>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      The renewal is due in <strong>${dayLabel}</strong> on <strong>${formattedDueDate}</strong>.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      If this renewal has already been completed, please mark it as completed in GF1 Renewals.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `W/C Renewal Reminder: ${params.companyName} due in ${dayLabel}`,
    html,
    text: `W/C renewal reminder: ${params.companyName} is due in ${dayLabel} on ${formattedDueDate}.`,
  };
}

export function buildDashboardTodoReminderEmail(params: DashboardTodoReminderParams) {
  const dueDate = new Date(`${params.dueDate}T00:00:00Z`);
  const formattedDueDate = Number.isNaN(dueDate.getTime())
    ? params.dueDate
    : dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const dayLabel = params.daysBeforeDue === 1 ? '1 day' : `${params.daysBeforeDue} days`;
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      This is a to-do reminder for <strong>${params.todoSubject}</strong>.
    </p>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      The task is due in <strong>${dayLabel}</strong> on <strong>${formattedDueDate}</strong>.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      If this task has already been completed, mark it complete in your dashboard to stop reminders.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `To-Do Reminder: ${params.todoSubject} due in ${dayLabel}`,
    html,
    text: `To-do reminder: ${params.todoSubject} is due in ${dayLabel} on ${formattedDueDate}.`,
  };
}

export function buildDashboardCalendarEventReminderEmail(params: DashboardCalendarEventReminderParams) {
  const eventDateTime = new Date(`${params.eventDate}T${params.eventTime}:00`);
  const formattedDate = Number.isNaN(eventDateTime.getTime())
    ? params.eventDate
    : eventDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const formattedTime = Number.isNaN(eventDateTime.getTime())
    ? params.eventTime
    : eventDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

  const minuteLabel =
    params.minutesBeforeStart === 1 ? '1 minute' : `${params.minutesBeforeStart} minutes`;

  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Friendly reminder: <strong>${params.eventName}</strong> starts in <strong>${minuteLabel}</strong>.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      <strong>Date:</strong> ${formattedDate}<br />
      <strong>Time:</strong> ${formattedTime}
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Calendar Reminder: ${params.eventName} starts in ${minuteLabel}`,
    html,
    text: `Calendar reminder: ${params.eventName} starts in ${minuteLabel} on ${formattedDate} at ${formattedTime}.`,
  };
}

export function buildProposalRejectionEmail(params: ProposalRejectionParams) {
  const notesBlock = params.rejectionNotes
    ? `<p style="font-family: Poppins, Arial, sans-serif; color: #111827; margin: 16px 0 0;">
        Reviewer notes:<br />
        <span style="color:#4b5563;">${params.rejectionNotes}</span>
      </p>
      <div style="height: 16px; line-height: 16px;">&nbsp;</div>`
    : '';

  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Your proposal for <strong>${params.organizationName}</strong> was denied and needs updates.
    </p>
    ${notesBlock}
    <div style="height: 24px; line-height: 24px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0;">
      <a href="${params.proposalUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
        Review proposal
      </a>
    </p>
    <div style="height: 24px; line-height: 24px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Proposal needs updates for ${params.organizationName}`,
    html,
  };
}

export function buildHealthCensusBenefitsHeadsUpEmail(
  params: HealthCensusBenefitsHeadsUpParams
) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hi Benefits Team,</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Quick heads up: <strong>${params.salespersonName}</strong> is bringing on a new client,
      <strong>${params.organizationName}</strong>, who is interested in health coverage.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      A completed health census from ${params.salespersonName} will land in your inbox shortly so
      you can start prepping options. Feel free to reach out to them with any questions in the
      meantime.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Thanks,<br />
      Galactic
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Heads up: ${params.organizationName} is interested in health coverage`,
    html,
  };
}

export function buildHealthCensusInterestEmail(params: HealthCensusInterestParams) {
  const prospectLine = params.prospectName
    ? `A new prospective client, <strong>${params.prospectName}</strong>,`
    : 'A new prospective client';
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      ${prospectLine} under <strong>${params.organizationName}</strong> has requested Health Insurance coverage.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Please complete the attached Health Census to move this prospect forward.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Health Census needed for ${params.organizationName}`,
    html,
  };
}

export function buildRetirementInterestEmail(params: RetirementInterestParams) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      <strong>${params.organizationName}</strong>, a new prospective client, is interested in a 401(k) plan.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Be expecting a filled questionnaire via email shortly.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `401(k) interest from ${params.organizationName}`,
    html,
  };
}

export function buildRetirementQuestionnaireCompletedEmail(
  params: RetirementQuestionnaireCompletedParams
) {
  const prospectLine = params.prospectName
    ? `<strong>${params.prospectName}</strong> from <strong>${params.organizationName}</strong>`
    : `<strong>${params.organizationName}</strong>`;
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      ${prospectLine} has completed the 401(k) plan questionnaire.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Click below to view the filled questionnaire.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0;">
      <a href="${params.pdfUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
        View Questionnaire PDF
      </a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `401(k) questionnaire completed by ${params.organizationName}`,
    html,
  };
}

export function buildRetirementQuestionnaireInviteEmail(
  params: RetirementQuestionnaireInviteParams
) {
  const signOff = [
    'Thanks,',
    params.senderName ?? 'Galactic',
    params.senderEmail,
    params.senderPhone,
  ]
    .filter(Boolean)
    .join('<br />');
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName ?? 'there'},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      We're glad to hear <strong>${params.organizationName}</strong> is interested in Galactic's 401(k) plan!
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Please fill out our short questionnaire at the link below. Once you submit it, our team will be notified and
      we'll be in touch with next steps.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0;">
      <a href="${params.questionnaireUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
        Open Questionnaire
      </a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Let us know if you have any questions in the meantime. Happy to help.
    </p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      ${signOff}
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `401(k) Plan Questionnaire for ${params.organizationName}`,
    html,
  };
}

export function buildAgreementSignatureRequestEmail(params: AgreementSignatureRequestParams) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName},</p>
    <div style="height: 12px; line-height: 12px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      A billing agreement for <strong>${params.organizationName}</strong> is ready for your signature.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0;">
      <a href="${params.signingUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
        Review & Sign Agreement
      </a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      If you have questions, reply to this email and we will assist.
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">
      Thanks,<br />
      ${params.senderName ?? 'Galactic'}
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: `Signature requested: ${params.organizationName} billing agreement`,
    html,
  };
}

export function buildAccountApprovedEmail(params: AccountApprovedParams) {
  const html = `
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Hello ${params.recipientName},</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Your account has been approved by the Projects Team. You can now sign in using the link below!</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; margin: 0;">
      <a href="${params.appUrl}" style="background:#005791;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Sign in</a>
    </p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Thanks,</p>
    <p style="font-family: Poppins, Arial, sans-serif; color: #111827;">Projects Team</p>
    <div style="height: 16px; line-height: 16px;">&nbsp;</div>
    <p style="margin: 0;"><img src="https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png" width="160" border="0" style="display: block; width: 160px; margin-left: -12px;" alt="Galactic logo"></p>
  `;

  return {
    subject: 'Your account has been approved',
    html,
  };
}

