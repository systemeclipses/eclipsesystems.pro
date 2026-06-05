"use client";

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { addSupportTicketMessage, createSupportIdea } from '../actions';
import { parseNoteBody } from '@/lib/support/noteAttachments';
import { toAttachmentDownloadUrl } from '@/lib/support/attachmentLinks';
import styles from './SupportDashboard.module.css';

type TicketListItem = {
  id: string;
  created_at: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  requester_name: string;
  requester_email: string | null;
};

type TicketNote = {
  id: string;
  ticket_id: string;
  body: string;
  status_after: string | null;
  created_at: string;
  created_by: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function SupportPortalClient({
  tickets,
  notes,
  userId,
  profileName,
  profileEmail,
}: {
  tickets: TicketListItem[];
  notes: TicketNote[];
  userId: string;
  profileName: string | null;
  profileEmail: string | null;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>('Open');
  const [sortOption, setSortOption] = useState<'Newest' | 'Oldest' | 'Priority'>('Newest');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoveredFilterControl, setHoveredFilterControl] = useState<number | null>(null);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(tickets[0]?.id ?? null);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isIdeaOpen, setIsIdeaOpen] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [ideaState, ideaAction, isIdeaPending] = useActionState(createSupportIdea, {
    status: 'idle',
  });
  const [activePasswordItem, setActivePasswordItem] = useState<null | {
    id: string;
    label: string;
    username?: string | null;
    password?: string | null;
    link?: string | null;
    notes?: string | null;
    locked?: boolean;
  }>(null);
  const [activeFaqItem, setActiveFaqItem] = useState<null | {
    id: string;
    label: string;
    body: string;
    actionLabel?: string;
    actionHref?: string;
  }>(null);
  const [activeUnemploymentItem, setActiveUnemploymentItem] = useState<null | {
    id: string;
    label: string;
    rows: Array<{
      state: string;
      abbrev: string;
      fein: string;
      sein: string;
      pin: string;
    }>;
    username?: string;
    usernameLabel?: string;
    password?: string;
    notes?: string;
    link?: string;
  }>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const sharedPasswords = useMemo(
    () => [
      {
        id: 'ups',
        label: 'UPS',
        username: 'galactic--ZY--inc',
        password: 'Welcome1028',
        link:
          'https://id.ups.com/u/login/identifier?state=hKFo2SBmczdIc2ZSbVo1cy0wMnUtVkhfS0VCWVBYYjlFdXo3WaFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFFOUGluS0l1NHVvc3FnaFVxbG5uWkdMV3dYaE9pSVpUo2NpZNkgaHdMRVROQnNxTWNzemtmRVA5RVNHaEZZMjI1YTlvZmM&ui_locales=en',
      },
      {
        id: 'maid2pay',
        label: 'Maid2Pay',
        username: 'john@galactic-inc.com',
        password: 'Galac71C@!',
        link: 'https://maid2pay.com/login',
        locked: true,
      },
      {
        id: '2mds',
        label: '2MDs Spreadsheets',
        password: '2MDs',
        notes:
          'To unlock the spreadsheets, hit the Review tab, choose Unprotect Sheet, then enter the password below.',
      },
    ],
    []
  );
  const faqs = useMemo(
    () => [
      {
        id: 'profile-update',
        label: 'How do I change my profile picture or display name?',
        body:
          'Open your Profile page from the top navigation. Update your display name and upload a new profile photo, then save the changes.',
      },
      {
        id: 'submit-ticket',
        label: 'How do I submit a support ticket?',
        body:
          'Use the “Submit New Ticket” button in Quick Actions. Fill out the form and hit Submit to send it to the support team.',
        actionLabel: 'Submit New Ticket',
        actionHref: '/support/new',
      },
    ],
    []
  );
  const unemploymentLogins = useMemo(
    () => [
      {
        id: 'sides',
        label: 'SIDES Login',
        link: 'https://uisides.org/sew/#/',
        rows: [
          { state: 'Alabama', abbrev: 'AL', fein: '630974457', sein: '0022257400', pin: 'Will be in the email' },
          { state: 'Arizona', abbrev: 'AZ', fein: '630974457', sein: '8570990000', pin: '20210303221913000' },
          { state: 'Colorado', abbrev: 'CO', fein: '630974457', sein: '922384002', pin: '42522842' },
          { state: 'Connecticut', abbrev: 'CT', fein: '630974457', sein: '—', pin: '—' },
          { state: 'Delaware', abbrev: 'DE', fein: '630974457', sein: '71978', pin: 'Will be in the email' },
          { state: 'Florida', abbrev: 'FL', fein: '630974457', sein: '2276722', pin: 'tmiCDh' },
          { state: 'Georgia', abbrev: 'GA', fein: '630974457', sein: '73323301', pin: 'G42522842' },
          { state: 'Illinois', abbrev: 'IL', fein: '630974457', sein: '4809696', pin: '323634623937' },
          { state: 'Kansas', abbrev: 'KS', fein: '630974457', sein: '501313', pin: '1192' },
          { state: 'Pennsylvania', abbrev: 'PA', fein: '630974457', sein: '7648680', pin: '95081746' },
          { state: 'South Carolina', abbrev: 'SC', fein: '475504412', sein: '615806', pin: '123456789' },
          { state: 'South Carolina', abbrev: 'SC', fein: '834451472', sein: '10033633', pin: '123456789' },
          { state: 'Tennessee', abbrev: 'TN', fein: '630974457', sein: '881780', pin: '1780' },
          { state: 'Tennessee', abbrev: 'TN', fein: '630974457', sein: '750828', pin: '0828' },
        ],
      },
      {
        id: 'fl-reconnect',
        label: 'Florida Reconnect Reemployment',
        username: 'EP02276722',
        usernameLabel: 'User ID',
        password: 'Galactic*1',
        notes: 'Use the credentials below to sign in to Florida Reconnect Reemployment.',
        link: 'https://employers.connect.myflorida.com/Employer/Core/Login.ASPX',
        rows: [],
      },
      {
        id: 'texas-twc',
        label: 'Texas Workforce Commission',
        username: 'galactictx',
        password: 'Payroll1028!',
        notes: 'Use the credentials below to sign in to Texas Workforce Commission.',
        link: 'https://apps.twc.texas.gov/EBS/security/logon.do',
        rows: [],
      },
    ],
    []
  );

  useEffect(() => {
    if (ideaState.status === 'success') {
      window.alert('Project idea submitted.');
      setIdeaText('');
      setIsIdeaOpen(false);
    }
    if (ideaState.status === 'error') {
      window.alert(ideaState.message ?? 'Unable to submit project idea. Please try again.');
    }
  }, [ideaState]);

  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(tickets.map((t) => t.status).filter(Boolean)));
    return ['All', ...unique];
  }, [tickets]);

  const closedTickets = useMemo(
    () => tickets.filter((ticket) => (ticket.status || '').toLowerCase() === 'closed'),
    [tickets]
  );

  const allTicketsForDisplay = useMemo(() => {
    let list = [...tickets];
    if (activeStatus !== 'All') {
      list = list.filter((t) => (t.status || '').toLowerCase() === activeStatus.toLowerCase());
    }
    if (sortOption === 'Newest') {
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else if (sortOption === 'Oldest') {
      list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    } else {
      const rank = (value: string) => {
        if (value === 'high') return 0;
        if (value === 'medium') return 1;
        if (value === 'low') return 2;
        return 99;
      };
      list.sort((a, b) => rank(a.priority) - rank(b.priority));
    }
    return list;
  }, [tickets, activeStatus, sortOption]);

  const selectedTicket =
    allTicketsForDisplay.find((ticket) => ticket.id === activeTicketId) ??
    allTicketsForDisplay[0] ??
    null;

  const selectedNotes = selectedTicket
    ? notes.filter((note) => note.ticket_id === selectedTicket.id)
    : [];

  const requesterName =
    selectedTicket?.requester_name ?? tickets[0]?.requester_name ?? 'crew member';
  const requesterEmail = selectedTicket?.requester_email ?? tickets[0]?.requester_email ?? '';
  const ideaRequesterName = profileName?.trim() || requesterName;
  const ideaRequesterEmail = profileEmail?.trim() || requesterEmail;
  const prismFoundationsVideos = [
    {
      id: 'accounting',
      label: 'Accounting',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/4635490898812561243/attend/1066122113364301916',
    },
    {
      id: 'benefits-administration',
      label: 'Benefits Administration',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/3441941340046977119/attend/7372069788287526490',
    },
    {
      id: 'benefits-enrollment',
      label: 'Benefits Enrollment',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/3765044926496974938/attend/3618655949432337246',
    },
    {
      id: 'clientspace',
      label: 'ClientSpace',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/5786079239747624797/attend/1291159158221253469',
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/5975179846562189660/attend/7859531671392240224',
    },
    {
      id: 'payroll',
      label: 'Payroll',
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/4047403910559058782/attend/3452050251010182485',
    },
    {
      id: 'workers-compensation',
      label: "Worker's Compensation",
      href: 'https://app.gotowebinar.com/unified/index.html#/webinar/7276549714570248794/attend/1869872809849974357',
    },
  ] as const;
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTicket || isSubmittingMessage) return;

    const attachment =
      fileInputRef.current?.files?.[0] ?? imageInputRef.current?.files?.[0] ?? null;
    if (!messageText.trim() && !attachment) return;

    setIsSubmittingMessage(true);
    try {
      const formData = new FormData();
      formData.append('ticket_id', selectedTicket.id);
      formData.append('note', messageText.trim());
      if (attachment) formData.append('attachment', attachment);

      await addSupportTicketMessage(formData);
      setMessageText('');
      setAttachmentName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
      window.location.reload();
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleCopy = async (value: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldId);
      window.setTimeout(() => setCopiedField((current) => (current === fieldId ? null : current)), 1400);
    } catch {
      alert('Unable to copy. Please copy manually.');
    }
  };

  return (
    <section className={styles.container}>
      <div className={`${styles.pagePill} badge`}>Welcome to the Support Portal — chart a course for help.</div>
      <div className={styles.header}>
        <img
          src="https://images.squarespace-cdn.com/content/v1/5cd9752df8135a1b11827874/9673bb13-892a-471b-8565-28f24ce3eef0/psp.png?format=1000w"
          alt="Projects Support Portal"
          className={styles.headerImg}
          style={{
            maxHeight: '650px',
            width: '900px',
            display: 'block',
            marginLeft: '250px',
            marginRight: '-20px',
            marginBottom: '-32px',
            paddingTop: '0',
            paddingBottom: '0',
            transform: 'translateX(0px)',
          }}
        />
      </div>
      <div className={styles.grid}>
        <div
          className={`${styles.card} ${hoveredCard === 'tickets' ? styles.cardHover : ''}`}
          onMouseEnter={() => setHoveredCard('tickets')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.subheader}>Tickets</div>
          <div className={styles.filterGroup}>
            <div
              className={styles.filterControl}
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              onMouseEnter={() => setHoveredFilterControl(0)}
              onMouseLeave={() => setHoveredFilterControl(null)}
            >
              <span
                className={`${styles.filterControlSpan} ${
                  hoveredFilterControl === 0 ? styles.filterControlSpanHover : ''
                }`}
              >
                {activeStatus} ({allTicketsForDisplay.length})
              </span>
              {filterOpen && (
                <div className={styles.filterDropdown}>
                  {statusOptions.map((opt) => (
                    <button
                      key={opt}
                      className={`${styles.filterDropdownButton} ${
                        opt === activeStatus ? styles.filterDropdownButtonActive : ''
                      }`}
                      onClick={() => {
                        setActiveStatus(opt);
                        setFilterOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className={styles.filterControl}
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              onMouseEnter={() => setHoveredFilterControl(1)}
              onMouseLeave={() => setHoveredFilterControl(null)}
            >
              <span
                className={`${styles.filterControlSpan} ${
                  hoveredFilterControl === 1 ? styles.filterControlSpanHover : ''
                }`}
              >
                Sort: {sortOption}
              </span>
              {sortOpen && (
                <div className={styles.filterDropdown}>
                  {(['Newest', 'Oldest', 'Priority'] as const).map((opt) => (
                    <button
                      key={opt}
                      className={`${styles.filterDropdownButton} ${
                        opt === sortOption ? styles.filterDropdownButtonActive : ''
                      }`}
                      onClick={() => {
                        setSortOption(opt);
                        setSortOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {allTicketsForDisplay.length > 0 ? (
              allTicketsForDisplay.map((ticket, idx) => (
                <button
                  type="button"
                  key={ticket.id}
                  className={`${styles.ticketItem} ${
                    hoveredTicketId === ticket.id ? styles.ticketItemHover : ''
                  } ${idx === allTicketsForDisplay.length - 1 ? styles.ticketItemLast : ''}`}
                  onMouseEnter={() => setHoveredTicketId(ticket.id)}
                  onMouseLeave={() => setHoveredTicketId(null)}
                  onClick={() => setActiveTicketId(ticket.id)}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 0 }}
                >
                  <div className={styles.ticketAvatar}>
                    {ticket.requester_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className={styles.ticketContent}>
                    <div className={styles.ticketTitle}>
                      {ticket.subject}
                      <span className={styles.ticketId}>#{ticket.id.slice(0, 6)}</span>
                    </div>
                    <div className={styles.ticketMeta}>
                      {ticket.requester_name} - {ticket.requester_email || 'No email'}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateP}>No tickets found.</p>
                <Link href="/support/new" className={styles.button} style={{ marginTop: 12 }}>
                  Create New Ticket
                </Link>
              </div>
            )}
          </div>
        </div>

        <div
          className={`${styles.card} ${styles.dialogCard} ${hoveredCard === 'dialog' ? styles.cardHover : ''}`}
          onMouseEnter={() => setHoveredCard('dialog')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.subheader}>Conversation</div>
          {selectedTicket ? (
            <>
              <div className={styles.conversationThread}>
                <div className={styles.chatMessageRight}>
                  <div className={styles.messageMetaRight}>
                    <span>{selectedTicket.requester_name}</span>
                    <span>{formatDateTime(selectedTicket.created_at)}</span>
                  </div>
                  <div className={styles.requesterBubble}>{selectedTicket.subject}</div>
                </div>

                {selectedNotes.map((note) => {
                  const parsed = parseNoteBody(note.body);
                  const isUser = note.created_by === userId;
                  if (!parsed.text && parsed.attachments.length === 0) {
                    return null;
                  }
                  return (
                    <div
                      key={note.id}
                      className={isUser ? styles.chatMessageRight : styles.chatMessageLeft}
                    >
                      <div className={isUser ? styles.messageMetaRight : styles.messageMetaLeft}>
                        <span>{isUser ? 'You' : 'Galactic Support'}</span>
                        <span>{formatDateTime(note.created_at)}</span>
                      </div>
                      <div className={isUser ? styles.requesterBubble : styles.adminBubble}>
                        {parsed.text ? <div>{parsed.text}</div> : null}
                        {parsed.attachments.map((attachment, index) => (
                          <div key={`${attachment.url}-${index}`} className={styles.attachmentRow}>
                            <span>{attachment.name}</span>
                            <a href={toAttachmentDownloadUrl(attachment.url, { name: attachment.name })} download target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className={styles.messageComposer}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={3}
                  placeholder="Type your message"
                  className={styles.formTextarea}
                  disabled={isSubmittingMessage}
                />
                {attachmentName ? (
                  <div className={styles.attachmentName}>Attachment: {attachmentName}</div>
                ) : null}
                <div className={styles.composerActions}>
                  <div className={styles.composerLeft}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach file"
                    >
                      <i className="fas fa-paperclip" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => imageInputRef.current?.click()}
                      aria-label="Attach image"
                    >
                      <i className="fas fa-image" aria-hidden="true"></i>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setAttachmentName(e.currentTarget.files?.[0]?.name ?? null)}
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAttachmentName(e.currentTarget.files?.[0]?.name ?? null)}
                    />
                  </div>
                  <button
                    type="submit"
                    className={styles.sendMessageButton}
                    disabled={isSubmittingMessage || (!messageText.trim() && !attachmentName)}
                  >
                    {isSubmittingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>

            </>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateP}>Select a ticket to view the conversation</p>
            </div>
          )}
        </div>

        <div
          className={`${styles.card} ${styles.quickActionsCard} ${hoveredCard === 'actions' ? styles.cardHover : ''}`}
          onMouseEnter={() => setHoveredCard('actions')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.subheader}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <Link href="/support/new" className={styles.button} style={{ marginTop: 0 }}>
              Submit New Ticket
            </Link>
            <button
              type="button"
              className={`${styles.button} ${styles.ideaQuickButton}`}
              style={{ marginTop: 0 }}
              onClick={() => setIsIdeaOpen(true)}
            >
              Launch a Project Idea
            </button>
            <a href="https://galactic365.com" target="_blank" rel="noopener" className={styles.button} style={{ marginTop: 0 }}>
              Go to Galactic 365
            </a>
          </div>
        </div>

        <div
          className={`${styles.card} ${hoveredCard === 'feedback' ? styles.cardHover : ''} ${styles.feedbackCard}`}
          onMouseEnter={() => setHoveredCard('feedback')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.subheader}>Feedback</div>
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const ticketId = (form.elements.namedItem('ticket_id') as HTMLSelectElement)?.value;
              const rating = (form.elements.namedItem('rating') as HTMLSelectElement)?.value;
              const comments = (form.elements.namedItem('comments') as HTMLTextAreaElement)?.value;
              try {
                const res = await fetch('/api/support/feedback', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ticket_id: ticketId, rating: Number(rating), comments }),
                });
                if (!res.ok) throw new Error('Failed to submit');
                alert('Thank you for your feedback!');
                form.reset();
              } catch {
                alert('Submission failed. Please try again.');
              }
            }}
          >
            <div className={styles.formField}>
              <label htmlFor="feedback-ticket" className={styles.formLabel}>
                Which ticket are you rating?
              </label>
              <select
                id="feedback-ticket"
                name="ticket_id"
                className={`${styles.formSelect} ${focusedInput === 'ticket' ? styles.formSelectFocus : ''}`}
                onFocus={() => setFocusedInput('ticket')}
                onBlur={() => setFocusedInput(null)}
                required
                disabled={closedTickets.length === 0}
              >
                <option value="">Select ticket...</option>
                {closedTickets.length === 0 ? (
                  <option value="" disabled>
                    No closed tickets yet
                  </option>
                ) : (
                  closedTickets.slice(0, 50).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.subject} #{t.id.slice(0, 6)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="feedback-rating" className={styles.formLabel}>
                Rate your experience:
              </label>
              <select
                id="feedback-rating"
                name="rating"
                className={`${styles.formSelect} ${focusedInput === 'rating' ? styles.formSelectFocus : ''}`}
                onFocus={() => setFocusedInput('rating')}
                onBlur={() => setFocusedInput(null)}
                required
              >
                <option value="">Select...</option>
                <option value="5">⭐️⭐️⭐️⭐️⭐️ Excellent</option>
                <option value="4">⭐️⭐️⭐️⭐️ Good</option>
                <option value="3">⭐️⭐️⭐️ Okay</option>
                <option value="2">⭐️⭐️ Needs Improvement</option>
                <option value="1">⭐️ Poor</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="feedback-comments" className={styles.formLabel}>
                Comments:
              </label>
              <textarea
                id="feedback-comments"
                name="comments"
                className={`${styles.formTextarea} ${focusedInput === 'comments' ? styles.formTextareaFocus : ''}`}
                placeholder="Let us know how we did..."
                onFocus={() => setFocusedInput('comments')}
                onBlur={() => setFocusedInput(null)}
              />
            </div>
            <button type="submit" className={`${styles.button} ${styles.feedbackSubmit}`} style={{ marginTop: 'auto' }}>
              Submit Feedback
            </button>
          </form>
        </div>

        <div className={`${styles.card} ${styles.kbCard}`}>
          <h3 className={styles.subheader}>Knowledge Base</h3>
          <div className={styles.kbBody}>
            <div className={styles.kbSection}>
              <div className={styles.kbTitle}>Prism Foundations Videos</div>
              <details className={styles.kbVideoDropdown}>
                <summary className={styles.kbVideoSummary}>Select a webinar</summary>
                <div className={styles.kbVideoMenu}>
                  {prismFoundationsVideos.map((video) => (
                    <a
                      key={video.id}
                      href={video.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.kbVideoMenuItem}
                    >
                      {video.label}
                    </a>
                  ))}
                </div>
              </details>
            </div>

            <div className={styles.kbSection}>
              <div className={styles.kbTitle}>Prism Demo</div>
              <div className={styles.kbLinks}>
                <a
                  href="https://gal-demo.prismhr.com/gal.demo/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, rgba(61, 130, 255, 0.2), rgba(61, 130, 255, 0.1))',
                    border: '1px solid rgba(153, 198, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#99c6ff',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    letterSpacing: '0.2px',
                  }}
                >
                  <i className="fas fa-desktop" />
                  Prism Demo Environment
                </a>
                <a
                  href="https://scheduler.zoom.us/f/97_krwx6"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, rgba(61, 130, 255, 0.2), rgba(61, 130, 255, 0.1))',
                    border: '1px solid rgba(153, 198, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#99c6ff',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    letterSpacing: '0.2px',
                  }}
                >
                  <i className="fas fa-calendar-alt" />
                  Schedule a Demo with Prism
                </a>
              </div>
            </div>

            <div className={styles.kbSection}>
              <div className={styles.kbTitle}>Shared Passwords</div>
              <div className={styles.kbLinks}>
                {sharedPasswords.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.kbLinkButton} ${item.locked ? styles.kbLinkButtonLocked : ''}`}
                    onClick={() => {
                      if (item.locked) return;
                      setActivePasswordItem(item);
                      setShowPassword(false);
                      setCopiedField(null);
                    }}
                    disabled={item.locked}
                  >
                    - {item.label}
                    {item.locked ? (
                      <span className={styles.kbLockIcon} aria-hidden="true">
                        <i className="fas fa-lock" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.kbSection}>
              <div className={styles.kbTitle}>Unemployment Logins</div>
              <div className={styles.kbLinks}>
                {unemploymentLogins.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.kbLinkButton}
                    onClick={() => setActiveUnemploymentItem(item)}
                  >
                    - {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isIdeaOpen ? (
        <div className={styles.ideaOverlay} role="dialog" aria-modal="true">
          <div className={styles.ideaModal}>
            <div className={styles.ideaHeader}>
              <div>
                <div className={styles.ideaTitle}>Share a project idea</div>
                <div className={styles.ideaName}>From: {ideaRequesterName}</div>
              </div>
              <button
                type="button"
                className={styles.ideaClose}
                onClick={() => setIsIdeaOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form
              action={(formData: FormData) => {
                const rawIdea = (formData.get('description') as string | null)?.trim() ?? '';
                if (!rawIdea) return;
                if (!formData.get('requester_name')) formData.set('requester_name', ideaRequesterName);
                if (!formData.get('requester_email')) formData.set('requester_email', ideaRequesterEmail);
                return ideaAction(formData);
              }}
              className={styles.ideaForm}
            >
              <label className={styles.ideaLabel} htmlFor="project-idea">
                What is your project idea?
              </label>
              <textarea
                id="project-idea"
                name="description"
                rows={5}
                className={styles.ideaTextarea}
                placeholder="Describe the project idea..."
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                required
                disabled={isIdeaPending}
              />
              <button
                type="submit"
                className={`${styles.button} ${styles.ideaSubmit} ${styles.ideaQuickButton}`}
                disabled={isIdeaPending || !ideaText.trim()}
              >
                {isIdeaPending ? 'Submitting...' : 'Submit idea'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {activePasswordItem ? (
        <div className={styles.kbOverlay} role="dialog" aria-modal="true">
          <div className={styles.kbModal}>
            <div className={styles.kbModalHeader}>
              <div>
                <div className={styles.kbModalTitle}>{activePasswordItem.label}</div>
                {activePasswordItem.link ? (
                  <a
                    href={activePasswordItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.kbModalLink}
                  >
                    {activePasswordItem.label} Login
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.kbModalClose}
                onClick={() => setActivePasswordItem(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {activePasswordItem.notes ? (
              <p className={styles.kbModalNotes}>{activePasswordItem.notes}</p>
            ) : null}
            <div className={styles.kbModalFields}>
              {activePasswordItem.username ? (
                <div className={styles.kbFieldRow}>
                  <div>
                    <div className={styles.kbFieldLabel}>Username</div>
                    <div className={styles.kbFieldValue}>{activePasswordItem.username}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.kbFieldButton}
                    onClick={() => handleCopy(activePasswordItem.username ?? '', 'username')}
                  >
                    {copiedField === 'username' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ) : null}
              {activePasswordItem.password ? (
                <div className={styles.kbFieldRow}>
                  <div>
                    <div className={styles.kbFieldLabel}>Password</div>
                    <div className={styles.kbFieldValue}>
                      {showPassword ? activePasswordItem.password : '••••••••'}
                    </div>
                  </div>
                  <div className={styles.kbFieldActions}>
                    <button
                      type="button"
                      className={styles.kbFieldButton}
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? 'Hide' : 'Reveal'}
                    </button>
                    <button
                      type="button"
                      className={styles.kbFieldButton}
                      onClick={() => handleCopy(activePasswordItem.password ?? '', 'password')}
                    >
                      {copiedField === 'password' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {activeFaqItem ? (
        <div className={styles.kbOverlay} role="dialog" aria-modal="true">
          <div className={styles.kbModal}>
            <div className={styles.kbModalHeader}>
              <div className={styles.kbModalTitle}>{activeFaqItem.label}</div>
              <button
                type="button"
                className={styles.kbModalClose}
                onClick={() => setActiveFaqItem(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className={styles.kbModalNotes}>{activeFaqItem.body}</p>
            {activeFaqItem.actionLabel && activeFaqItem.actionHref ? (
              <div className={styles.kbModalActions}>
                <Link
                  href={activeFaqItem.actionHref}
                  className={`${styles.button} ${styles.kbModalButton}`}
                  onClick={() => setActiveFaqItem(null)}
                >
                  {activeFaqItem.actionLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeUnemploymentItem ? (
        <div className={styles.kbOverlay} role="dialog" aria-modal="true">
          <div className={`${styles.kbModal} ${styles.kbModalWide}`}>
            <div className={styles.kbModalHeader}>
              <div>
                <div className={styles.kbModalTitle}>{activeUnemploymentItem.label}</div>
                {activeUnemploymentItem.link ? (
                  <a
                    href={activeUnemploymentItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.kbModalLink}
                  >
                    Login Link
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.kbModalClose}
                onClick={() => setActiveUnemploymentItem(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {activeUnemploymentItem.notes ? (
              <p className={styles.kbModalNotes}>{activeUnemploymentItem.notes}</p>
            ) : null}
            {activeUnemploymentItem.username || activeUnemploymentItem.password ? (
              <div className={styles.kbModalFields}>
                {activeUnemploymentItem.username ? (
                  <div className={styles.kbFieldRow}>
                    <div>
                      <div className={styles.kbFieldLabel}>
                        {activeUnemploymentItem.usernameLabel ?? 'Username'}
                      </div>
                      <div className={styles.kbFieldValue}>{activeUnemploymentItem.username}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.kbFieldButton}
                      onClick={() => handleCopy(activeUnemploymentItem.username ?? '', 'unemployment-username')}
                    >
                      {copiedField === 'unemployment-username' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ) : null}
                {activeUnemploymentItem.password ? (
                  <div className={styles.kbFieldRow}>
                    <div>
                      <div className={styles.kbFieldLabel}>Password</div>
                      <div className={styles.kbFieldValue}>
                        {showPassword ? activeUnemploymentItem.password : '••••••••'}
                      </div>
                    </div>
                    <div className={styles.kbFieldActions}>
                      <button
                        type="button"
                        className={styles.kbFieldButton}
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        type="button"
                        className={styles.kbFieldButton}
                        onClick={() => handleCopy(activeUnemploymentItem.password ?? '', 'unemployment-password')}
                      >
                        {copiedField === 'unemployment-password' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {activeUnemploymentItem.rows.length > 0 ? (
              <div className={styles.kbTableWrap}>
                <table className={styles.kbTable}>
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Abbr</th>
                      <th>FEIN</th>
                      <th>SEIN</th>
                      <th>PIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUnemploymentItem.rows.map((row, index) => (
                      <tr key={`${row.state}-${row.sein}-${index}`}>
                        <td>{row.state}</td>
                        <td>{row.abbrev}</td>
                        <td>{row.fein}</td>
                        <td>{row.sein}</td>
                        <td>{row.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
