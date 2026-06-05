"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../organizations/OrganizationsTable.module.css';
import {
  CONTACT_CHANNEL_OPTIONS,
  FOLLOW_UP_TYPE_OPTIONS,
} from '@/lib/gf1/opportunity-follow-ups';
import type {
  ContactChannel,
  FollowUpType,
} from '@/lib/gf1/opportunity-follow-ups';
import type { OpportunityRow } from './page';

interface Props {
  opportunities: OpportunityRow[];
}

type SortOption = 'alphabetical' | 'last-contacted-newest' | 'last-contacted-oldest' | 'recently-added';
type ContactFormState = {
  channel: ContactChannel;
  followUpType: FollowUpType;
  notes: string;
  followUpAt: string;
  gotResponse: boolean;
  responseNotes: string;
};

const createInitialFormState = (): ContactFormState => ({
  channel: 'phone',
  followUpType: 'phone',
  notes: '',
  followUpAt: '',
  gotResponse: false,
  responseNotes: '',
});

export function OpportunitiesTable({ opportunities }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('recently-added');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ContactFormState>(createInitialFormState);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [convertPickerOpen, setConvertPickerOpen] = useState(false);
  const [convertSearch, setConvertSearch] = useState('');
  const router = useRouter();
  const dialHref = (value: string) => `tel:${value.replace(/[^\d+]/g, '')}`;
  const mailHref = (value: string, orgName?: string | null, contactName?: string | null) => {
    const subject = `Quick intro — Galactic 365`;
    const body = [
      `Hi ${contactName ?? 'there'},`,
      '',
      `I’m reaching out from Galactic 365. We’re a full-service PEO helping ${orgName ?? 'growing teams'} handle payroll, HR, benefits, and compliance with fewer headaches.`,
      '',
      'A few ways we help:',
      '• Payroll processing, tax filings, and compliance support',
      '• Benefits administration with broader plan access',
      '• HR support, onboarding, and employee management tools',
      '',
      'Would you be open to a quick 15-minute intro call next week to see if this is a fit?',
      '',
      'Best,',
      'Galactic 365',
    ].join('\n');
    return `mailto:${value.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const activeOpportunity = useMemo(
    () => opportunities.find((org) => org.id === activeId) ?? null,
    [opportunities, activeId]
  );

  const buildLeadUrl = (org: OpportunityRow) => {
    const params = new URLSearchParams();
    if (org.organization_name) params.set('legal_name', org.organization_name);
    if (org.primary_contact_name) params.set('contact_name', org.primary_contact_name);
    if (org.primary_contact_email) params.set('contact_email', org.primary_contact_email);
    if (org.primary_contact_phone) params.set('contact_phone', org.primary_contact_phone);
    return `/gf1/leads/new?${params.toString()}`;
  };

  const openForm = (id: string) => {
    setActiveId(id);
    setFormError(null);
    setFormState(createInitialFormState());
  };

  const closeForm = () => {
    setActiveId(null);
    setFormError(null);
  };

  const openNotes = (id: string, currentNotes: string | null) => {
    setNotesId(id);
    setNotesDraft(currentNotes ?? '');
    setNotesError(null);
  };

  const closeNotes = () => {
    setNotesId(null);
    setNotesError(null);
  };

  const saveNotes = async (opportunityId: string) => {
    setNotesSaving(true);
    setNotesError(null);
    try {
      const res = await fetch('/api/gf1/opportunities/update-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          notes: notesDraft,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Unable to save notes.');
      }
      setNotesId(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save notes.';
      setNotesError(message);
    } finally {
      setNotesSaving(false);
    }
  };

  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/gf1/opportunities/log-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: activeId,
          channel: formState.channel,
          followUpType: formState.followUpType,
          notes: formState.notes,
          followUpAt: formState.followUpAt || null,
          gotResponse: formState.gotResponse,
          responseNotes: formState.responseNotes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Unable to log contact.');
      }
      setActiveId(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to log contact.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelChange = (nextChannel: ContactChannel) => {
    setFormState((prev) => ({
      ...prev,
      channel: nextChannel,
      followUpType: prev.followUpType === prev.channel ? (nextChannel as FollowUpType) : prev.followUpType,
    }));
  };

  const filteredAndSorted = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const result = searchTerm
      ? opportunities.filter((org) => {
          const fields = [
            org.organization_name,
            org.industry,
            org.estimated_employees?.toString(),
            org.primary_contact_name,
            org.primary_contact_email,
            org.primary_contact_phone,
            org.source,
            org.notes,
          ];
          return fields.some((value) => value?.toLowerCase().includes(searchTerm));
        })
      : [...opportunities];

    result.sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical': {
          const nameA = (a.organization_name ?? '').toLowerCase();
          const nameB = (b.organization_name ?? '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'last-contacted-newest': {
          const aTime = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
          const bTime = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
          return bTime - aTime;
        }
        case 'last-contacted-oldest': {
          const aTime = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }
        case 'recently-added':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [opportunities, search, sortBy]);

  return (
    <div className={styles.projects}>
      <div className={styles['projects-inner']}>
        <header className={styles['projects-header']}>
          <div>
            <div className={styles.title}>Opportunities</div>
            <div className={styles.count}>| {filteredAndSorted.length} Opportunities</div>
          </div>

          <div className={styles.filters}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organization or contact"
              className={`${styles.filterSelect} ${styles.searchInput}`}
              style={{ minWidth: '320px' }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={styles.filterSelect}
            >
              <option value="alphabetical">A-Z</option>
              <option value="recently-added">Date Added: Newest to Oldest</option>
              <option value="last-contacted-newest">Last Contacted: Newest to Oldest</option>
              <option value="last-contacted-oldest">Last Contacted: Oldest to Newest</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setConvertPickerOpen(true);
                setConvertSearch('');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 24px',
                borderRadius: '6px',
                border: '1px solid rgba(153, 198, 255, 0.35)',
                background: 'linear-gradient(135deg, rgba(61, 130, 255, 0.24), rgba(61, 130, 255, 0.12))',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '38px',
                minWidth: '220px',
              }}
            >
              <i className="fas fa-user-plus" style={{ fontSize: '12px' }}></i>
              <span>Convert to suspect</span>
            </button>
          </div>
        </header>
        <table className={`${styles['projects-table']} ${styles.compactTable}`}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Industry</th>
              <th>Estimated Employees</th>
              <th>Primary Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Notes</th>
              <th>Last Contacted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#738297' }}>
                  No opportunities found.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className={styles['org-name-link']}>
                      <div className={styles['org-name-text']}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: 'white', margin: 0 }}>
                          {org.organization_name ?? 'Untitled'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p>{org.industry ?? '-'}</p>
                  </td>
                  <td>
                    <p>{org.estimated_employees ?? '-'}</p>
                  </td>
                  <td>
                    <p style={{ color: 'white', fontSize: '14px' }}>{org.primary_contact_name ?? '-'}</p>
                  </td>
                  <td>
                    {org.primary_contact_phone ? (
                      <div className={styles.phoneCell}>
                        <span className={styles.phoneLink}>{org.primary_contact_phone}</span>
                        <a href={dialHref(org.primary_contact_phone)} className={styles.callIcon} aria-label="Call">
                          <i className="fas fa-phone" aria-hidden="true"></i>
                        </a>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {org.primary_contact_email ? (
                      <a
                        href={mailHref(org.primary_contact_email, org.organization_name, org.primary_contact_name)}
                        className={`${styles.actionLink} ${styles.emailLink}`}
                      >
                        {org.primary_contact_email}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {org.notes ? (
                      <div className={styles.notesCell}>
                        <button
                          type="button"
                          className={styles.notesButton}
                          onClick={() => (notesId === org.id ? closeNotes() : openNotes(org.id, org.notes))}
                          aria-label="View notes"
                        >
                          <i className="fas fa-clipboard-list" aria-hidden="true"></i>
                        </button>
                        {notesId === org.id && (
                          <>
                            <div className={styles.notesOverlay} onClick={closeNotes} />
                            <div
                              className={styles.notesPopover}
                              role="dialog"
                              aria-modal="true"
                              aria-label="Notes"
                            >
                              <div className={styles.notesPopoverHeader}>
                                <span>Notes</span>
                                <button type="button" className={styles.notesClose} onClick={closeNotes}>
                                  Close
                                </button>
                              </div>
                              <textarea
                                className={styles.notesTextarea}
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={8}
                                placeholder="Add notes..."
                              />
                              {notesError && <div className={styles.notesError}>{notesError}</div>}
                              <div className={styles.notesActions}>
                                <button type="button" className={styles.secondaryButton} onClick={closeNotes}>
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className={styles.primaryButton}
                                  onClick={() => saveNotes(org.id)}
                                  disabled={notesSaving}
                                >
                                  {notesSaving ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className={styles.notesCell}>
                        <button
                          type="button"
                          className={styles.notesButton}
                          onClick={() => openNotes(org.id, '')}
                          aria-label="Add notes"
                        >
                          <i className="fas fa-clipboard-list" aria-hidden="true"></i>
                        </button>
                        {notesId === org.id && (
                          <>
                            <div className={styles.notesOverlay} onClick={closeNotes} />
                            <div
                              className={styles.notesPopover}
                              role="dialog"
                              aria-modal="true"
                              aria-label="Notes"
                            >
                              <div className={styles.notesPopoverHeader}>
                                <span>Notes</span>
                                <button type="button" className={styles.notesClose} onClick={closeNotes}>
                                  Close
                                </button>
                              </div>
                              <textarea
                                className={styles.notesTextarea}
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={8}
                                placeholder="Add notes..."
                              />
                              {notesError && <div className={styles.notesError}>{notesError}</div>}
                              <div className={styles.notesActions}>
                                <button type="button" className={styles.secondaryButton} onClick={closeNotes}>
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className={styles.primaryButton}
                                  onClick={() => saveNotes(org.id)}
                                  disabled={notesSaving}
                                >
                                  {notesSaving ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <p>{org.last_contacted_at ? new Date(org.last_contacted_at).toLocaleDateString() : '-'}</p>
                  </td>
                  <td>
                    <button type="button" className={styles.logButton} onClick={() => openForm(org.id)}>
                      Log contact
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {convertPickerOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
            }}
            onClick={() => setConvertPickerOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Convert opportunity to suspect"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '520px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '80vh',
              background: '#1e2a3a',
              border: '1px solid #313D4E',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #313D4E',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>Convert to suspect</div>
                <div style={{ color: '#738297', fontSize: '13px', marginTop: '2px' }}>
                  Pick the opportunity you want to turn into a suspect
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertPickerOpen(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3d4b5e',
                  background: 'transparent',
                  color: '#738297',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: '16px 24px 12px 24px' }}>
              <input
                autoFocus
                value={convertSearch}
                onChange={(e) => setConvertSearch(e.target.value)}
                placeholder="Search organization or contact"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #3d4b5e',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: '0 12px 16px 12px', flex: 1 }}>
              {(() => {
                const term = convertSearch.trim().toLowerCase();
                const options = term
                  ? opportunities.filter((org) =>
                      [org.organization_name, org.primary_contact_name, org.primary_contact_email]
                        .some((v) => v?.toLowerCase().includes(term))
                    )
                  : opportunities;
                if (options.length === 0) {
                  return (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#738297', fontSize: '13px' }}>
                      No opportunities match.
                    </div>
                  );
                }
                return options.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setConvertPickerOpen(false);
                      router.push(buildLeadUrl(org));
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid transparent',
                      background: 'transparent',
                      color: 'white',
                      cursor: 'pointer',
                      marginBottom: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(61, 130, 255, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(153, 198, 255, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {org.organization_name ?? 'Untitled'}
                    </div>
                    <div style={{ color: '#a8b5c7', fontSize: '12px', marginTop: '2px' }}>
                      {org.primary_contact_name ?? '—'}
                      {org.primary_contact_email ? ` · ${org.primary_contact_email}` : ''}
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        </>
      )}
      {activeId && (
        <>
          <div className={styles.contactFormOverlay} onClick={closeForm} />
          <div className={styles.contactFormModal} role="dialog" aria-modal="true" aria-label="Log contact">
            <div className={styles.contactFormModalHeader}>
              <span>
                Log contact
                {opportunities.find((org) => org.id === activeId)?.organization_name
                  ? ` • ${opportunities.find((org) => org.id === activeId)?.organization_name}`
                  : ''}
              </span>
              <button type="button" className={styles.contactFormClose} onClick={closeForm}>
                Close
              </button>
            </div>
            <form onSubmit={submitContact}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span className={styles.formLabel}>Outreach channel</span>
                  <select
                    value={formState.channel}
                    onChange={(e) => handleChannelChange(e.target.value as ContactChannel)}
                    className={styles.formInput}
                  >
                    {CONTACT_CHANNEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>Follow-up type</span>
                  <select
                    value={formState.followUpType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, followUpType: e.target.value as FollowUpType }))}
                    className={styles.formInput}
                  >
                    {FOLLOW_UP_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>Follow-up date</span>
                  <input
                    type="datetime-local"
                    value={formState.followUpAt}
                    onChange={(e) => setFormState((prev) => ({ ...prev, followUpAt: e.target.value }))}
                    className={styles.formInput}
                  />
                </label>

                <label className={styles.formField}>
                  <span className={styles.formLabel}>Notes</span>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="Summary of the call or outreach"
                  />
                </label>

                <label className={styles.formFieldCheckboxSingle}>
                  <input
                    type="checkbox"
                    checked={formState.gotResponse}
                    onChange={(e) => setFormState((prev) => ({ ...prev, gotResponse: e.target.checked }))}
                  />
                  <span>Received Response?</span>
                </label>

              </div>

              {formError && <div className={styles.formError}>{formError}</div>}

              <div className={styles.formActions}>
                {activeOpportunity && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => router.push(buildLeadUrl(activeOpportunity))}
                  >
                    Convert to suspect
                  </button>
                )}
                <button type="button" className={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save contact'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
