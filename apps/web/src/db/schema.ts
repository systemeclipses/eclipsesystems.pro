import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image")
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});

export const passwordCredentials = pgTable("password_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token]
    })
  })
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  defaultOrganizationId: uuid("default_organization_id"),
  themePreference: text("theme_preference").$type<"light" | "dark" | "system">().notNull().default("light"),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull().default("team"),
  name: text("name").notNull(),
  slug: text("slug"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id),
  stripeCustomerId: text("stripe_customer_id"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    department: text("department"),
    managerMembershipId: uuid("manager_membership_id"),
    payRateCents: integer("pay_rate_cents").notNull().default(0),
    hireDate: date("hire_date", { mode: "date" }),
    probationEndsAt: date("probation_ends_at", { mode: "date" }),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { mode: "date" })
  },
  (membership) => ({
    organizationUserIdx: uniqueIndex("memberships_organization_user_idx").on(
      membership.organizationId,
      membership.userId
    )
  })
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  projectId: uuid("project_id"),
  description: text("description"),
  punchNote: text("punch_note"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  durationSeconds: integer("duration_seconds"),
  startedLocation: jsonb("started_location").$type<{ latitude: number; longitude: number; accuracy?: number | null; outsideGeofence?: boolean }>(),
  endedLocation: jsonb("ended_location").$type<{ latitude: number; longitude: number; accuracy?: number | null; outsideGeofence?: boolean }>(),
  deviceInfo: jsonb("device_info").$type<{ userAgent?: string | null; platform?: string | null; offline?: boolean }>(),
  reviewFlag: text("review_flag"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  lockedAt: timestamp("locked_at", { mode: "date" }),
  source: text("source").notNull().default("manual"),
  status: text("status").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  timeEntryId: uuid("time_entry_id"),
  state: text("state").$type<"CLOCKED_OUT" | "CLOCKED_IN" | "ON_BREAK" | "PENDING_REVIEW" | "LOCKED">().notNull().default("CLOCKED_IN"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  currentBreakStartedAt: timestamp("current_break_started_at", { mode: "date" }),
  flagReason: text("flag_reason"),
  autoClockedOutAt: timestamp("auto_clocked_out_at", { mode: "date" }),
  autoClockOutRunId: text("auto_clock_out_run_id"),
  siteId: uuid("site_id"),
  startPunchId: uuid("start_punch_id"),
  endPunchId: uuid("end_punch_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const punches = pgTable("punches", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  shiftId: uuid("shift_id"),
  requestId: text("request_id"),
  type: text("type").$type<"clock_in" | "clock_out" | "break_start" | "break_end" | "auto_clock_out" | "manager_correction" | "flag_for_review" | "resolve_flag">().notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
  location: jsonb("location").$type<{ latitude: number; longitude: number; accuracy?: number | null; outsideGeofence?: boolean }>(),
  siteId: uuid("site_id"),
  note: text("note"),
  deviceInfo: jsonb("device_info").$type<{ userAgent?: string | null; platform?: string | null; offline?: boolean }>(),
  previousState: text("previous_state"),
  newState: text("new_state"),
  flags: jsonb("flags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const payRateHistory = pgTable("pay_rate_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  effectiveDate: date("effective_date", { mode: "date" }).notNull(),
  rateCents: integer("rate_cents").notNull(),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const holidays = pgTable("holidays", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  date: date("date", { mode: "date" }).notNull(),
  name: text("name").notNull(),
  multiplierBasisPoints: integer("multiplier_basis_points").notNull().default(10000),
  isPaid: boolean("is_paid").notNull().default(true),
  nonWorkingPaid: boolean("non_working_paid").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const geofences = pgTable("geofences", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  radiusMeters: integer("radius_meters").notNull().default(100),
  outOfBoundsBehavior: text("out_of_bounds_behavior").$type<"block" | "warn">().notNull().default("block"),
  requireClockOutLocation: boolean("require_clock_out_location").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const geofenceAssignments = pgTable(
  "geofence_assignments",
  {
    geofenceId: uuid("geofence_id")
      .notNull()
      .references(() => geofences.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (assignment) => ({
    compoundKey: primaryKey({ columns: [assignment.geofenceId, assignment.membershipId] })
  })
);

export const payPeriods = pgTable("pay_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
  status: text("status").$type<"open" | "approved" | "locked">().notNull().default("open"),
  approvedByMembershipId: uuid("approved_by_membership_id"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  lockedAt: timestamp("locked_at", { mode: "date" })
});

export const ptoCategories = pgTable("pto_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  isPaid: boolean("is_paid").notNull().default(true),
  accrualRule: jsonb("accrual_rule").notNull().default({ type: "none" }),
  capHours: numeric("cap_hours", { precision: 8, scale: 2 }),
  carryoverRule: jsonb("carryover_rule").notNull().default({ type: "none" }),
  weeklyMaxHours: numeric("weekly_max_hours", { precision: 8, scale: 2 }),
  noticeDays: integer("notice_days").notNull().default(0),
  blackoutDates: jsonb("blackout_dates").$type<string[]>().notNull().default([]),
  probationApplies: boolean("probation_applies").notNull().default(false),
  negativeBalanceAllowed: boolean("negative_balance_allowed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const ptoBalances = pgTable(
  "pto_balances",
  {
    organizationId: uuid("organization_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => ptoCategories.id, { onDelete: "cascade" }),
    accruedHours: numeric("accrued_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    usedHours: numeric("used_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    pendingHours: numeric("pending_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    adjustedHours: numeric("adjusted_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (balance) => ({
    compoundKey: primaryKey({ columns: [balance.membershipId, balance.categoryId] })
  })
);

export const ptoAccrualEvents = pgTable(
  "pto_accrual_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => ptoCategories.id, { onDelete: "cascade" }),
    hoursRequested: numeric("hours_requested", { precision: 8, scale: 3 }).notNull(),
    hoursApplied: numeric("hours_applied", { precision: 8, scale: 3 }).notNull(),
    hoursLostToCap: numeric("hours_lost_to_cap", { precision: 8, scale: 3 }).notNull().default("0"),
    reason: text("reason").notNull(),
    source: jsonb("source").notNull().default({}),
    effectiveDate: timestamp("effective_date", { mode: "date" }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (event) => ({
    idempotencyIdx: uniqueIndex("pto_accrual_events_idempotency_idx").on(event.idempotencyKey)
  })
);

export const ptoRequests = pgTable("pto_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  categoryId: uuid("category_id").notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
  hours: numeric("hours", { precision: 8, scale: 2 }).notNull(),
  status: text("status").$type<"draft" | "pending" | "needs_revision" | "approved" | "denied" | "cancelled" | "revoked" | "completed">().notNull().default("pending"),
  employeeNote: text("employee_note"),
  managerNote: text("manager_note"),
  decidedByMembershipId: uuid("decided_by_membership_id"),
  decidedAt: timestamp("decided_at", { mode: "date" }),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  type: text("type").notNull(),
  params: jsonb("params").notNull().default({}),
  enabled: boolean("enabled").notNull().default(false),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  actorMembershipId: uuid("actor_membership_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const ptoApprovalTemplates = pgTable("pto_approval_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  scope: jsonb("scope").notNull().default({}),
  matchRules: jsonb("match_rules").notNull().default({}),
  action: text("action").$type<"auto_approve" | "auto_approve_notify" | "pre_screen">().notNull().default("pre_screen"),
  blockers: jsonb("blockers").notNull().default({}),
  enabled: boolean("enabled").notNull().default(false),
  createdByMembershipId: uuid("created_by_membership_id"),
  lastTriggeredAt: timestamp("last_triggered_at", { mode: "date" }),
  triggerCount: integer("trigger_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const ptoCoverageRules = pgTable("pto_coverage_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  daysOfWeek: jsonb("days_of_week").$type<number[]>().notNull().default([]),
  startsAtTime: text("starts_at_time"),
  endsAtTime: text("ends_at_time"),
  minimumRequired: integer("minimum_required").notNull().default(1),
  minimumPercent: integer("minimum_percent"),
  appliesTo: jsonb("applies_to").notNull().default({}),
  exclusions: jsonb("exclusions").notNull().default({}),
  severity: text("severity").$type<"soft" | "hard">().notNull().default("soft"),
  effectiveStart: date("effective_start", { mode: "date" }),
  effectiveEnd: date("effective_end", { mode: "date" }),
  enabled: boolean("enabled").notNull().default(false),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const ptoRequestMessages = pgTable("pto_request_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  requestId: uuid("request_id").notNull().references(() => ptoRequests.id, { onDelete: "cascade" }),
  senderMembershipId: uuid("sender_membership_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const ptoDecisionReactions = pgTable("pto_decision_reactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  requestId: uuid("request_id").notNull().references(() => ptoRequests.id, { onDelete: "cascade" }),
  actorMembershipId: uuid("actor_membership_id").notNull(),
  reaction: text("reaction"),
  message: text("message"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const ptoManagerInsights = pgTable("pto_manager_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id"),
  type: text("type").notNull(),
  severity: text("severity").notNull().default("info"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  details: jsonb("details").notNull().default({}),
  dismissedAt: timestamp("dismissed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { mode: "date" })
});

export const employeeOffboardings = pgTable("employee_offboardings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  initiatedByMembershipId: uuid("initiated_by_membership_id"),
  state: text("state").$type<"scheduled" | "active_offboarding" | "finalizing" | "completed" | "archived" | "rescinded" | "cancelled">().notNull().default("scheduled"),
  departureType: text("departure_type").$type<"voluntary_notice" | "voluntary_immediate" | "involuntary_for_cause" | "involuntary_without_cause" | "layoff" | "fixed_term_end" | "death" | "job_abandonment" | "retirement" | "other">().notNull(),
  initiatedByType: text("initiated_by_type").$type<"employee" | "manager" | "admin" | "system">().notNull().default("admin"),
  effectiveDate: date("effective_date", { mode: "date" }).notNull(),
  finalDay: date("final_day", { mode: "date" }).notNull(),
  workState: text("work_state"),
  reasonPrivate: text("reason_private"),
  noteToEmployee: text("note_to_employee"),
  notifyEmployee: boolean("notify_employee").notNull().default(true),
  accessEndsAt: timestamp("access_ends_at", { mode: "date" }),
  archiveAfter: date("archive_after", { mode: "date" }),
  finalPayDueAt: timestamp("final_pay_due_at", { mode: "date" }),
  finalPayApprovedAt: timestamp("final_pay_approved_at", { mode: "date" }),
  finalPayApprovedByMembershipId: uuid("final_pay_approved_by_membership_id"),
  finalPaySnapshot: jsonb("final_pay_snapshot").notNull().default({}),
  retentionPolicy: jsonb("retention_policy").notNull().default({ payroll_years: 7, post_departure_access_days: 90 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  archivedAt: timestamp("archived_at", { mode: "date" }),
  rescindedAt: timestamp("rescinded_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const offboardingChecklistItems = pgTable("offboarding_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  offboardingId: uuid("offboarding_id").notNull().references(() => employeeOffboardings.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  requiresNote: boolean("requires_note").notNull().default(false),
  required: boolean("required").notNull().default(true),
  dueAt: timestamp("due_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  completedByMembershipId: uuid("completed_by_membership_id"),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const offboardingFinalPayRecords = pgTable("offboarding_final_pay_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  offboardingId: uuid("offboarding_id").notNull().references(() => employeeOffboardings.id, { onDelete: "cascade" }),
  membershipId: uuid("membership_id").notNull(),
  regularHours: numeric("regular_hours", { precision: 8, scale: 2 }).notNull().default("0"),
  overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).notNull().default("0"),
  regularPayCents: integer("regular_pay_cents").notNull().default(0),
  overtimePayCents: integer("overtime_pay_cents").notNull().default(0),
  ptoPayoutCents: integer("pto_payout_cents").notNull().default(0),
  adjustmentCents: integer("adjustment_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  breakdown: jsonb("breakdown").notNull().default({}),
  compliance: jsonb("compliance").notNull().default({}),
  status: text("status").$type<"draft" | "approved" | "processed" | "voided">().notNull().default("draft"),
  approvedByMembershipId: uuid("approved_by_membership_id"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  processedAt: timestamp("processed_at", { mode: "date" }),
  payrollReference: text("payroll_reference"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const offboardingEvents = pgTable("offboarding_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  offboardingId: uuid("offboarding_id").notNull().references(() => employeeOffboardings.id, { onDelete: "cascade" }),
  actorMembershipId: uuid("actor_membership_id"),
  actorType: text("actor_type").notNull().default("user"),
  eventType: text("event_type").notNull(),
  fromState: text("from_state"),
  toState: text("to_state"),
  message: text("message"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionShifts = pgTable("mission_shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "set null" }),
  siteId: uuid("site_id"),
  roleName: text("role_name"),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
  breakMinutes: integer("break_minutes").notNull().default(0),
  paidBreak: boolean("paid_break").notNull().default(false),
  notes: text("notes"),
  status: text("status").$type<"draft" | "published" | "cancelled" | "completed" | "missed">().notNull().default("draft"),
  expectedPunchStatus: text("expected_punch_status").$type<"pending" | "clocked_in" | "worked" | "missed" | "modified">().notNull().default("pending"),
  createdByMembershipId: uuid("created_by_membership_id"),
  publishedAt: timestamp("published_at", { mode: "date" }),
  parentTemplateId: uuid("parent_template_id"),
  recurrenceRule: jsonb("recurrence_rule"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionOpenShiftClaims = pgTable("mission_open_shift_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  shiftId: uuid("shift_id").notNull().references(() => missionShifts.id, { onDelete: "cascade" }),
  claimantMembershipId: uuid("claimant_membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  status: text("status").$type<"pending" | "approved" | "denied" | "cancelled">().notNull().default("pending"),
  managerDecision: text("manager_decision"),
  decidedByMembershipId: uuid("decided_by_membership_id"),
  decidedAt: timestamp("decided_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionShiftSwaps = pgTable("mission_shift_swaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  originalShiftId: uuid("original_shift_id").notNull().references(() => missionShifts.id, { onDelete: "cascade" }),
  proposedShiftId: uuid("proposed_shift_id").references(() => missionShifts.id, { onDelete: "set null" }),
  swapType: text("swap_type").$type<"drop" | "swap">().notNull(),
  initiatorMembershipId: uuid("initiator_membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  targetMembershipId: uuid("target_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  status: text("status").$type<"pending" | "accepted" | "declined" | "approved" | "denied" | "cancelled">().notNull().default("pending"),
  reason: text("reason"),
  managerDecision: text("manager_decision"),
  decidedByMembershipId: uuid("decided_by_membership_id"),
  decidedAt: timestamp("decided_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionChannels = pgTable("mission_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  type: text("type").$type<"team" | "site" | "role" | "shift" | "project" | "dm" | "announcement" | "general">().notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  context: jsonb("context").notNull().default({}),
  createdByMembershipId: uuid("created_by_membership_id"),
  archivedAt: timestamp("archived_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionChannelMembers = pgTable(
  "mission_channel_members",
  {
    channelId: uuid("channel_id").notNull().references(() => missionChannels.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow()
  },
  (member) => ({ compoundKey: primaryKey({ columns: [member.channelId, member.membershipId] }) })
);

export const missionMessages = pgTable("mission_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  channelId: uuid("channel_id").notNull().references(() => missionChannels.id, { onDelete: "cascade" }),
  senderMembershipId: uuid("sender_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  attachments: jsonb("attachments").notNull().default([]),
  replyToMessageId: uuid("reply_to_message_id"),
  sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
  editedAt: timestamp("edited_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionTasks = pgTable("mission_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").$type<"low" | "normal" | "high" | "urgent">().notNull().default("normal"),
  assigneeMembershipId: uuid("assignee_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  assigneeRule: jsonb("assignee_rule").notNull().default({}),
  dueAt: timestamp("due_at", { mode: "date" }),
  dueBasis: text("due_basis"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  completedByMembershipId: uuid("completed_by_membership_id"),
  completionProof: jsonb("completion_proof").notNull().default({}),
  relatedShiftId: uuid("related_shift_id").references(() => missionShifts.id, { onDelete: "set null" }),
  relatedProjectId: uuid("related_project_id"),
  parentTemplateId: uuid("parent_template_id"),
  recurrenceRule: jsonb("recurrence_rule"),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionAnnouncements = pgTable("mission_announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  attachments: jsonb("attachments").notNull().default([]),
  audienceRule: jsonb("audience_rule").notNull().default({}),
  deliveryChannels: jsonb("delivery_channels").notNull().default(["in_app"]),
  requireAcknowledgment: boolean("require_acknowledgment").notNull().default(false),
  scheduledFor: timestamp("scheduled_for", { mode: "date" }),
  sentAt: timestamp("sent_at", { mode: "date" }),
  sentByMembershipId: uuid("sent_by_membership_id"),
  status: text("status").$type<"draft" | "scheduled" | "sent" | "archived">().notNull().default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionAnnouncementAcknowledgments = pgTable(
  "mission_announcement_acknowledgments",
  {
    announcementId: uuid("announcement_id").notNull().references(() => missionAnnouncements.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    acknowledgedAt: timestamp("acknowledged_at", { mode: "date" }).notNull().defaultNow()
  },
  (ack) => ({ compoundKey: primaryKey({ columns: [ack.announcementId, ack.membershipId] }) })
);

export const missionForms = pgTable("mission_forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull().default([]),
  routingRules: jsonb("routing_rules").notNull().default({}),
  version: integer("version").notNull().default(1),
  createdByMembershipId: uuid("created_by_membership_id"),
  archivedAt: timestamp("archived_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionFormSubmissions = pgTable("mission_form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  formId: uuid("form_id").notNull().references(() => missionForms.id, { onDelete: "cascade" }),
  submittedByMembershipId: uuid("submitted_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  data: jsonb("data").notNull().default({}),
  status: text("status").notNull().default("submitted"),
  locked: boolean("locked").notNull().default(true),
  signatureData: jsonb("signature_data"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().defaultNow()
});

export const missionSmsSubscriptions = pgTable("mission_sms_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  channelPreferences: jsonb("channel_preferences").notNull().default({}),
  provider: text("provider").notNull().default("twilio"),
  providerSid: text("provider_sid"),
  verified: boolean("verified").notNull().default(false),
  optedOut: boolean("opted_out").notNull().default(false),
  optedOutAt: timestamp("opted_out_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionAuditEvents = pgTable("mission_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  actorMembershipId: uuid("actor_membership_id"),
  eventType: text("event_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  plan: text("plan").notNull(),
  seats: integer("seats").notNull(),
  status: text("status").notNull(),
  billingInterval: text("billing_interval"),
  trialStart: timestamp("trial_start", { mode: "date" }),
  trialEnd: timestamp("trial_end", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const plans = pgTable("plans", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  annualPriceCents: integer("annual_price_cents").notNull(),
  minSeats: integer("min_seats").notNull().default(2),
  features: jsonb("features").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0)
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  number: text("number").notNull(),
  total: numeric("total"),
  status: text("status").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  status: text("status").notNull()
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false)
});
