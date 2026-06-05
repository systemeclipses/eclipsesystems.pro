"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./ActivityChecklist.module.css";
import {
  FOLLOW_UP_TYPE_OPTIONS,
  formatFollowUpType,
} from "@/lib/gf1/opportunity-follow-ups";
import type { FollowUpType } from "@/lib/gf1/opportunity-follow-ups";

type ActivityItem = {
  id: string;
  opportunityId: string;
  followUpAt: string;
  contactedAt: string;
  channel: string | null;
  followUpType: FollowUpType | null;
  opportunityNotes: string | null;
  notes: string | null;
  gotResponse: boolean;
  responseNotes: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  claimedBy: string | null;
  completedAt: string | null;
  completedBy: string | null;
};

type ActivityChecklistClientProps = {
  items: ActivityItem[];
  weekStart: string;
  prevWeekHref: string;
  nextWeekHref: string;
  opportunityOptions: ActivityOpportunityOption[];
  errorMessage?: string | null;
};

type ActivityOpportunityOption = {
  id: string;
  organizationName: string;
  contactName: string | null;
};

type SectionBucket = {
  overdue: ActivityItem[];
  thisWeek: ActivityItem[];
  nextWeek: ActivityItem[];
};
type FollowUpFilterValue = "all" | FollowUpType;
type AddActivityFormState = {
  opportunityId: string;
  followUpType: FollowUpType;
  followUpAt: string;
  notes: string;
};

const dialHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;
const mailHref = (value: string) => `mailto:${value.trim()}`;
const mapFollowUpTypeToChannel = (followUpType: FollowUpType): string | null => {
  switch (followUpType) {
    case "phone":
    case "email":
    case "text":
    case "linkedin":
    case "meeting":
    case "other":
      return followUpType;
    default:
      return null;
  }
};
const buildInitialFormState = (opportunityId: string): AddActivityFormState => ({
  opportunityId,
  followUpType: "phone",
  followUpAt: "",
  notes: "",
});

const formatDate = (value: Date | string, options?: Intl.DateTimeFormatOptions) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";
  return date.toLocaleDateString("en-US", options);
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const addDays = (value: Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildSections = (items: ActivityItem[], weekStart: Date): SectionBucket => {
  const overdue: ActivityItem[] = [];
  const thisWeek: ActivityItem[] = [];
  const nextWeek: ActivityItem[] = [];
  const weekStartMs = weekStart.getTime();
  const nextWeekStartMs = addDays(weekStart, 7).getTime();
  const rangeEndMs = addDays(weekStart, 14).getTime();

  items.forEach((item) => {
    const due = new Date(item.followUpAt);
    if (Number.isNaN(due.getTime())) return;
    const dueMs = due.getTime();
    if (dueMs < weekStartMs) {
      overdue.push(item);
    } else if (dueMs < nextWeekStartMs) {
      thisWeek.push(item);
    } else if (dueMs < rangeEndMs) {
      nextWeek.push(item);
    }
  });

  return { overdue, thisWeek, nextWeek };
};

export default function ActivityChecklistClient({
  items: initialItems,
  weekStart,
  prevWeekHref,
  nextWeekHref,
  opportunityOptions,
  errorMessage,
}: ActivityChecklistClientProps) {
  const router = useRouter();
  const weekCalendarRef = useRef<HTMLDivElement>(null);
  const completionAnimationTimersRef = useRef<Record<string, number>>({});
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilterValue>("all");
  const [savingIds, setSavingIds] = useState<Record<string, true>>({});
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Record<string, true>>({});
  const [openNotesItemId, setOpenNotesItemId] = useState<string | null>(null);
  const [opportunityNotesDraft, setOpportunityNotesDraft] = useState("");
  const [activityNotesDraft, setActivityNotesDraft] = useState("");
  const [activityResponseNotesDraft, setActivityResponseNotesDraft] = useState("");
  const [notesSaveError, setNotesSaveError] = useState<string | null>(null);
  const [notesSavingTarget, setNotesSavingTarget] = useState<"opportunity" | "activity" | null>(null);
  const [isWeekCalendarOpen, setIsWeekCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [addForm, setAddForm] = useState<AddActivityFormState>(() =>
    buildInitialFormState(opportunityOptions[0]?.id ?? "")
  );
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setItems(initialItems);
    setSavingIds({});
  }, [initialItems]);

  useEffect(
    () => () => {
      Object.values(completionAnimationTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      completionAnimationTimersRef.current = {};
    },
    []
  );

  useEffect(() => {
    if (!openNotesItemId) return;
    if (items.some((item) => item.id === openNotesItemId)) return;
    setOpenNotesItemId(null);
  }, [items, openNotesItemId]);

  useEffect(() => {
    if (!opportunityOptions.length) {
      setAddForm((prev) => (prev.opportunityId ? { ...prev, opportunityId: "" } : prev));
      return;
    }
    const exists = opportunityOptions.some((option) => option.id === addForm.opportunityId);
    if (!exists) {
      setAddForm((prev) => ({ ...prev, opportunityId: opportunityOptions[0].id }));
    }
  }, [addForm.opportunityId, opportunityOptions]);

  const weekStartDate = useMemo(() => {
    const date = new Date(weekStart);
    if (Number.isNaN(date.getTime())) return new Date();
    return date;
  }, [weekStart]);

  useEffect(() => {
    setCalendarMonth(new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1));
  }, [weekStartDate]);

  const formatWeekRange = (start: Date) => {
    const rangeEnd = addDays(start, 6);
    const startLabel = formatDate(start, { month: "long", day: "numeric", year: "numeric" });
    const endLabel = formatDate(rangeEnd, { month: "long", day: "numeric", year: "numeric" });
    return `${startLabel} - ${endLabel}`;
  };
  const formatWeekRangeButton = (start: Date) => {
    const rangeEnd = addDays(start, 6);
    const startLabel = formatDate(start, { month: "long", day: "numeric" });
    const endLabel = formatDate(rangeEnd, { month: "long", day: "numeric" });
    return `${startLabel} - ${endLabel}`;
  };

  const weekLabel = useMemo(() => {
    return formatWeekRange(weekStartDate);
  }, [weekStartDate]);

  const weekPickerValue = useMemo(() => toDateInputValue(weekStartDate), [weekStartDate]);
  const prevWeekLabel = useMemo(() => formatWeekRangeButton(addDays(weekStartDate, -7)), [weekStartDate]);
  const nextWeekLabel = useMemo(() => formatWeekRangeButton(addDays(weekStartDate, 7)), [weekStartDate]);
  const todayValue = useMemo(() => toDateInputValue(new Date()), []);
  const calendarMonthLabel = useMemo(
    () => calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [calendarMonth]
  );
  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const gridStart = addDays(monthStart, -monthStart.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [calendarMonth]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => followUpFilter === "all" || item.followUpType === followUpFilter),
    [followUpFilter, items]
  );

  const sections = useMemo(() => buildSections(visibleItems, weekStartDate), [visibleItems, weekStartDate]);
  const openNotesItem = useMemo(
    () => visibleItems.find((item) => item.id === openNotesItemId) ?? null,
    [openNotesItemId, visibleItems]
  );
  const now = useMemo(() => new Date(), []);
  const emptyLabel = "No follow-ups scheduled for this week.";

  const openAddActivityModal = () => {
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const closeAddActivityModal = () => {
    if (isAdding) return;
    setIsAddModalOpen(false);
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isAdding) return;
      setIsAddModalOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAddModalOpen, isAdding]);

  useEffect(() => {
    if (!isWeekCalendarOpen) return;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!weekCalendarRef.current?.contains(target)) {
        setIsWeekCalendarOpen(false);
      }
    };
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsWeekCalendarOpen(false);
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isWeekCalendarOpen]);

  useEffect(() => {
    if (!openNotesItemId || !openNotesItem) return;
    setOpportunityNotesDraft(openNotesItem.opportunityNotes ?? "");
    setActivityNotesDraft(openNotesItem.notes ?? "");
    setActivityResponseNotesDraft(openNotesItem.responseNotes ?? "");
    setNotesSaveError(null);
    setNotesSavingTarget(null);
  }, [openNotesItem, openNotesItemId]);

  useEffect(() => {
    if (!openNotesItemId) return;
    if (openNotesItem) return;
    setOpenNotesItemId(null);
  }, [openNotesItem, openNotesItemId]);

  useEffect(() => {
    if (!openNotesItemId) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenNotesItemId(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openNotesItemId]);

  const handleAddActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);

    if (!addForm.opportunityId) {
      setAddError("Select an opportunity.");
      return;
    }
    if (!addForm.followUpAt.trim()) {
      setAddError("Choose a follow-up due date/time.");
      return;
    }

    setIsAdding(true);
    try {
      const channel = mapFollowUpTypeToChannel(addForm.followUpType);
      const response = await fetch("/api/gf1/opportunities/log-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: addForm.opportunityId,
          channel,
          followUpType: addForm.followUpType,
          notes: addForm.notes.trim() || null,
          followUpAt: addForm.followUpAt,
          gotResponse: false,
          responseNotes: null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to add follow-up activity.");
      }

      setAddForm((prev) => ({ ...prev, followUpAt: "", notes: "" }));
      setIsAddModalOpen(false);
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Unable to add follow-up activity.");
    } finally {
      setIsAdding(false);
    }
  };

  const openWeekPicker = () => {
    setCalendarMonth(new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1));
    setIsWeekCalendarOpen((prev) => !prev);
  };

  const shiftCalendarMonth = (offset: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const selectWeekDate = (selectedDate: Date) => {
    setIsWeekCalendarOpen(false);
    router.push(`/gf1/activity?week=${toDateInputValue(selectedDate)}`);
  };

  const toggleNotesPopover = (itemId: string) => {
    setOpenNotesItemId((prev) => (prev === itemId ? null : itemId));
  };

  const closeNotesPopover = () => {
    setOpenNotesItemId(null);
    setNotesSaveError(null);
    setNotesSavingTarget(null);
  };

  const clearCompletionAnimation = (itemId: string) => {
    const timerId = completionAnimationTimersRef.current[itemId];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete completionAnimationTimersRef.current[itemId];
    }
    setRecentlyCompletedIds((prev) => {
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const startCompletionAnimation = (itemId: string) => {
    const existingTimer = completionAnimationTimersRef.current[itemId];
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }
    setRecentlyCompletedIds((prev) => ({ ...prev, [itemId]: true }));
    completionAnimationTimersRef.current[itemId] = window.setTimeout(() => {
      setRecentlyCompletedIds((prev) => {
        if (!prev[itemId]) return prev;
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      delete completionAnimationTimersRef.current[itemId];
    }, 900);
  };

  const saveOpportunityNotes = async () => {
    if (!openNotesItem) return;
    setNotesSavingTarget("opportunity");
    setNotesSaveError(null);
    try {
      const response = await fetch("/api/gf1/opportunities/update-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: openNotesItem.opportunityId,
          notes: opportunityNotesDraft,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to save opportunity notes.");
      }

      const normalized = opportunityNotesDraft.trim() || null;
      setItems((prev) =>
        prev.map((item) =>
          item.opportunityId === openNotesItem.opportunityId ? { ...item, opportunityNotes: normalized } : item
        )
      );
      setOpportunityNotesDraft(normalized ?? "");
    } catch (err) {
      setNotesSaveError(err instanceof Error ? err.message : "Unable to save opportunity notes.");
    } finally {
      setNotesSavingTarget(null);
    }
  };

  const saveActivityNotes = async () => {
    if (!openNotesItem) return;
    setNotesSavingTarget("activity");
    setNotesSaveError(null);
    try {
      const response = await fetch("/api/gf1/activity-checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: openNotesItem.id,
          notes: activityNotesDraft,
          response_notes: activityResponseNotesDraft,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "Unable to save activity notes.");
      }

      const normalizedNotes = activityNotesDraft.trim() || null;
      const normalizedResponseNotes = activityResponseNotesDraft.trim() || null;
      setItems((prev) =>
        prev.map((item) =>
          item.id === openNotesItem.id
            ? { ...item, notes: normalizedNotes, responseNotes: normalizedResponseNotes }
            : item
        )
      );
      setActivityNotesDraft(normalizedNotes ?? "");
      setActivityResponseNotesDraft(normalizedResponseNotes ?? "");
    } catch (err) {
      setNotesSaveError(err instanceof Error ? err.message : "Unable to save activity notes.");
    } finally {
      setNotesSavingTarget(null);
    }
  };

  const toggleCompleted = async (item: ActivityItem) => {
    if (savingIds[item.id]) return;
    const nextCompleted = !item.completedAt;
    const previousCompletedAt = item.completedAt;
    const previousCompletedBy = item.completedBy;
    const optimisticCompletedAt = nextCompleted ? new Date().toISOString() : null;
    if (nextCompleted) {
      startCompletionAnimation(item.id);
    } else {
      clearCompletionAnimation(item.id);
    }
    setSavingIds((prev) => ({ ...prev, [item.id]: true }));
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? {
              ...current,
              completedAt: optimisticCompletedAt,
              completedBy: nextCompleted ? previousCompletedBy : null,
            }
          : current
      )
    );

    try {
      const response = await fetch("/api/gf1/activity-checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_completed: nextCompleted }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { item?: { follow_up_completed_at?: string | null; follow_up_completed_by?: string | null } }
        | null;
      if (!response.ok) {
        throw new Error("Failed to update follow-up status");
      }

      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? {
                ...current,
                completedAt: payload?.item?.follow_up_completed_at ?? optimisticCompletedAt,
                completedBy: payload?.item?.follow_up_completed_by ?? previousCompletedBy,
              }
            : current
        )
      );
    } catch {
      if (nextCompleted) {
        clearCompletionAnimation(item.id);
      }
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? { ...current, completedAt: previousCompletedAt, completedBy: previousCompletedBy }
            : current
        )
      );
    } finally {
      setSavingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  const renderSection = (title: string, sectionItems: ActivityItem[], emptyLabel: string) => (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>{title}</div>
        <div className={styles.sectionCount}>{sectionItems.length} items</div>
      </div>
      {sectionItems.length === 0 ? (
        <div className={styles.empty}>{emptyLabel}</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.doneHeader}>Done</th>
                <th>Due</th>
                <th>Organization</th>
                <th>Contact</th>
                <th className={styles.notesHeader}>Notes</th>
                <th>Logged</th>
              </tr>
            </thead>
            <tbody>
              {[...sectionItems]
                .sort((a, b) => {
                  const aDone = Boolean(a.completedAt);
                  const bDone = Boolean(b.completedAt);
                  if (aDone !== bDone) return aDone ? 1 : -1;

                  const aDue = new Date(a.followUpAt).getTime();
                  const bDue = new Date(b.followUpAt).getTime();
                  const aDueValid = Number.isFinite(aDue);
                  const bDueValid = Number.isFinite(bDue);
                  if (aDueValid && bDueValid && aDue !== bDue) return aDue - bDue;
                  if (aDueValid !== bDueValid) return aDueValid ? -1 : 1;

                  const aLogged = new Date(a.contactedAt).getTime();
                  const bLogged = new Date(b.contactedAt).getTime();
                  const aLoggedValid = Number.isFinite(aLogged);
                  const bLoggedValid = Number.isFinite(bLogged);
                  if (aLoggedValid && bLoggedValid && aLogged !== bLogged) return aLogged - bLogged;
                  if (aLoggedValid !== bLoggedValid) return aLoggedValid ? -1 : 1;

                  return a.id.localeCompare(b.id);
                })
                .map((item) => {
                const due = new Date(item.followUpAt);
                const isCompleted = Boolean(item.completedAt);
                const isLate = !isCompleted && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
                const rowClassName = [
                  isCompleted ? styles.completedRow : "",
                  isLate ? styles.overdueRow : "",
                  recentlyCompletedIds[item.id] ? styles.justCompletedRow : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr
                    key={item.id}
                    className={rowClassName || undefined}
                  >
                    <td className={styles.doneCell}>
                      <label className={styles.doneToggle}>
                        <input
                          className={styles.doneToggleInput}
                          type="checkbox"
                          checked={isCompleted}
                          disabled={Boolean(savingIds[item.id])}
                          onChange={() => void toggleCompleted(item)}
                          aria-label={isCompleted ? "Mark follow-up as open" : "Mark follow-up as done"}
                        />
                        <span className={styles.doneToggleCircle} aria-hidden="true"></span>
                      </label>
                    </td>
                    <td>
                      <div className={styles.dueDate}>
                        {formatDate(item.followUpAt, { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className={styles.dueTime}>{formatTime(item.followUpAt)}</div>
                      <div className={styles.dueMeta}>
                        <span className={`${styles.channelTag} ${styles.typeTag}`}>
                          {formatFollowUpType(item.followUpType)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.orgName}>{item.organizationName ?? "Untitled opportunity"}</div>
                    </td>
                    <td>
                      <div className={styles.contactName}>{item.contactName ?? "No primary contact"}</div>
                      <div className={styles.contactMeta}>
                        {item.contactPhone ? (
                          <a className={styles.contactLink} href={dialHref(item.contactPhone)}>
                            {item.contactPhone}
                          </a>
                        ) : (
                          <span>-</span>
                        )}
                        {item.contactEmail ? (
                          <a className={styles.contactLink} href={mailHref(item.contactEmail)}>
                            {item.contactEmail}
                          </a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.notesCell}>
                      <button
                        type="button"
                        className={styles.notesButton}
                        onClick={() => toggleNotesPopover(item.id)}
                        aria-label="View notes"
                        aria-expanded={openNotesItemId === item.id}
                      >
                        <i className="fas fa-clipboard-list" aria-hidden="true"></i>
                      </button>
                    </td>
                    <td>
                      <div className={styles.loggedAt}>{formatDateTime(item.contactedAt)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.title}>Activity</div>
          <div className={styles.subtitle}>Weeks of {weekLabel}</div>
        </div>
        <div className={styles.headerMeta}>
          <button
            className={styles.addActivityTrigger}
            type="button"
            onClick={openAddActivityModal}
            disabled={opportunityOptions.length === 0}
          >
            Add activity
          </button>
          <div className={styles.headerControls}>
            <div className={styles.weekJumpWrap} ref={weekCalendarRef}>
              <button
                className={styles.weekJumpButton}
                type="button"
                onClick={openWeekPicker}
                aria-label="Open calendar to choose week"
                aria-haspopup="dialog"
                aria-expanded={isWeekCalendarOpen}
              >
                <svg
                  className={styles.weekJumpIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3.5" y="5" width="17" height="15" rx="2.5"></rect>
                  <path d="M7.5 3.5V7"></path>
                  <path d="M16.5 3.5V7"></path>
                  <path d="M3.5 10H20.5"></path>
                </svg>
              </button>
              {isWeekCalendarOpen && (
                <div className={styles.weekCalendarPopover} role="dialog" aria-label="Choose week date">
                  <div className={styles.weekCalendarHeader}>
                    <button
                      className={styles.weekCalendarNavButton}
                      type="button"
                      onClick={() => shiftCalendarMonth(-1)}
                      aria-label="Previous month"
                    >
                      <span className={`${styles.navArrow} ${styles.navArrowLeft}`} aria-hidden="true" />
                    </button>
                    <div className={styles.weekCalendarMonthLabel}>{calendarMonthLabel}</div>
                    <button
                      className={styles.weekCalendarNavButton}
                      type="button"
                      onClick={() => shiftCalendarMonth(1)}
                      aria-label="Next month"
                    >
                      <span className={`${styles.navArrow} ${styles.navArrowRight}`} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.weekCalendarWeekdays}>
                    {WEEKDAY_LABELS.map((label) => (
                      <span key={label} className={styles.weekCalendarWeekday}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className={styles.weekCalendarDays}>
                    {calendarDays.map((day) => {
                      const dayValue = toDateInputValue(day);
                      const isSelected = dayValue === weekPickerValue;
                      const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                      const isToday = dayValue === todayValue;
                      const dayClassName = [
                        styles.weekCalendarDayButton,
                        !isCurrentMonth ? styles.weekCalendarDayButtonMuted : "",
                        isToday ? styles.weekCalendarDayButtonToday : "",
                        isSelected ? styles.weekCalendarDayButtonSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <button
                          key={dayValue}
                          className={dayClassName}
                          type="button"
                          onClick={() => selectWeekDate(day)}
                          aria-label={day.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.weekNav}>
              <Link className={styles.navButton} href={prevWeekHref} aria-label="Previous week">
                <span className={`${styles.navArrow} ${styles.navArrowLeft}`} aria-hidden="true" />
                {prevWeekLabel}
              </Link>
              <Link className={styles.navButton} href={nextWeekHref} aria-label="Next week">
                {nextWeekLabel}
                <span className={`${styles.navArrow} ${styles.navArrowRight}`} aria-hidden="true" />
              </Link>
            </div>
            <label className={styles.viewFilter}>
              <select
                className={styles.viewSelect}
                value={followUpFilter}
                onChange={(event) => setFollowUpFilter(event.target.value as FollowUpFilterValue)}
                aria-label="Follow-up type filter"
              >
                <option value="all">All</option>
                {FOLLOW_UP_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      {isAddModalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeAddActivityModal}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-activity-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} id="add-activity-title">
                Add activity
              </h2>
              <button
                className={styles.modalClose}
                type="button"
                onClick={closeAddActivityModal}
                disabled={isAdding}
              >
                Close
              </button>
            </div>

            <section className={styles.addActivityForm}>
              <form className={styles.addActivityGrid} onSubmit={handleAddActivity}>
                <label className={styles.addField}>
                  <span className={styles.addLabel}>Opportunity</span>
                  <select
                    className={styles.addInput}
                    value={addForm.opportunityId}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, opportunityId: event.target.value }))
                    }
                    disabled={isAdding || opportunityOptions.length === 0}
                  >
                    {opportunityOptions.length === 0 ? (
                      <option value="">No opportunities available</option>
                    ) : (
                      opportunityOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.organizationName}
                          {option.contactName ? ` (${option.contactName})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className={styles.addField}>
                  <span className={styles.addLabel}>Follow-up type</span>
                  <select
                    className={styles.addInput}
                    value={addForm.followUpType}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        followUpType: event.target.value as FollowUpType,
                      }))
                    }
                    disabled={isAdding}
                  >
                    {FOLLOW_UP_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.addField}>
                  <span className={styles.addLabel}>Due</span>
                  <input
                    className={styles.addInput}
                    type="datetime-local"
                    value={addForm.followUpAt}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, followUpAt: event.target.value }))
                    }
                    disabled={isAdding}
                  />
                </label>

                <label className={`${styles.addField} ${styles.addFieldWide}`}>
                  <span className={styles.addLabel}>Notes</span>
                  <input
                    className={styles.addInput}
                    type="text"
                    value={addForm.notes}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Optional"
                    disabled={isAdding}
                  />
                </label>

                <div className={styles.addActions}>
                  <button
                    className={styles.addCancelButton}
                    type="button"
                    onClick={closeAddActivityModal}
                    disabled={isAdding}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.addButton}
                    type="submit"
                    disabled={isAdding || opportunityOptions.length === 0}
                  >
                    {isAdding ? "Adding..." : "Add activity"}
                  </button>
                </div>
              </form>
              {addError && <div className={styles.addError}>{addError}</div>}
            </section>
          </section>
        </div>
      )}

      {openNotesItem && (
        <>
          <div className={styles.notesOverlay} onClick={closeNotesPopover} />
          <section className={styles.notesPopover} role="dialog" aria-modal="true" aria-label="Activity notes">
            <div className={styles.notesPopoverHeader}>
              <span>Notes</span>
              <button type="button" className={styles.notesClose} onClick={closeNotesPopover}>
                Close
              </button>
            </div>
            {notesSaveError && <div className={styles.notesError}>{notesSaveError}</div>}
            <div className={styles.notesSection}>
              <div className={styles.notesSectionTitle}>Opportunity Notes</div>
              <textarea
                className={styles.notesTextarea}
                value={opportunityNotesDraft}
                onChange={(event) => setOpportunityNotesDraft(event.target.value)}
                rows={6}
                placeholder="No opportunity notes."
                disabled={notesSavingTarget !== null}
              />
              <div className={styles.notesActions}>
                <button
                  type="button"
                  className={styles.notesSaveButton}
                  onClick={saveOpportunityNotes}
                  disabled={notesSavingTarget !== null}
                >
                  {notesSavingTarget === "opportunity" ? "Saving..." : "Save opportunity notes"}
                </button>
              </div>
            </div>
            <div className={styles.notesSection}>
              <div className={styles.notesSectionTitle}>Activity Notes</div>
              <div className={styles.notesStack}>
                <div className={styles.notesGroup}>
                  <div className={styles.notesGroupLabel}>Logged note</div>
                  <textarea
                    className={styles.notesTextarea}
                    value={activityNotesDraft}
                    onChange={(event) => setActivityNotesDraft(event.target.value)}
                    rows={5}
                    placeholder="No activity notes."
                    disabled={notesSavingTarget !== null}
                  />
                </div>
                <div className={styles.notesGroup}>
                  <div className={styles.notesGroupLabel}>Response note</div>
                  <textarea
                    className={styles.notesTextarea}
                    value={activityResponseNotesDraft}
                    onChange={(event) => setActivityResponseNotesDraft(event.target.value)}
                    rows={4}
                    placeholder="No response notes."
                    disabled={notesSavingTarget !== null}
                  />
                </div>
              </div>
              <div className={styles.notesActions}>
                <button
                  type="button"
                  className={styles.notesSaveButton}
                  onClick={saveActivityNotes}
                  disabled={notesSavingTarget !== null}
                >
                  {notesSavingTarget === "activity" ? "Saving..." : "Save activity notes"}
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {errorMessage && <div className={styles.error}>Could not load activity: {errorMessage}</div>}

      {renderSection("This Week", sections.thisWeek, emptyLabel)}
    </div>
  );
}
