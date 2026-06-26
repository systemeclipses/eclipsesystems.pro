import {
  boolean,
  date,
  index,
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
import { sql } from "drizzle-orm";
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
  isDemo: boolean("is_demo").notNull().default(false),
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

export const operationsPortalShifts = pgTable("operations_portal_shifts", {
  id: text("id").primaryKey().default(sql`'ops-shift-' || gen_random_uuid()::text`),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: text("employee_id"),
  swapWithEmployeeId: text("swap_with_employee_id"),
  day: text("day").notNull(),
  time: text("time").notNull(),
  site: text("site").notNull(),
  status: text("status").$type<"published" | "swap_requested" | "open">().notNull().default("published"),
  resolvedBy: text("resolved_by"),
  resolvedAt: text("resolved_at"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const operationsPortalTickets = pgTable(
  "operations_portal_tickets",
  {
    id: text("id").primaryKey().default(sql`'ops-ticket-' || gen_random_uuid()::text`),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    subject: text("subject").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<"open" | "waiting_on_staff" | "waiting_on_client" | "resolved" | "closed">().notNull().default("open"),
    priority: text("priority").$type<"low" | "normal" | "high">().notNull().default("normal"),
    category: text("category").$type<"HVAC" | "Electrical" | "Facilities" | "Billing" | "Access" | "Other">().notNull().default("Other"),
    dueDate: date("due_date", { mode: "date" }),
    tags: text("tags").array().notNull().default([]),
    assigneeId: text("assignee_id"),
    source: text("source").$type<"client" | "internal">().notNull().default("internal"),
    projectId: text("project_id"),
    invoiceId: text("invoice_id"),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    closedAt: timestamp("closed_at", { mode: "date" }),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" })
  },
  (ticket) => ({
    statusIdx: index("operations_portal_tickets_org_status_idx").on(ticket.organizationId, ticket.status, ticket.priority),
    assigneeIdx: index("operations_portal_tickets_assignee_idx").on(ticket.organizationId, ticket.assigneeId, ticket.status),
    clientIdx: index("operations_portal_tickets_client_idx").on(ticket.organizationId, ticket.clientId, ticket.status)
  })
);

export const operationsPortalTicketComments = pgTable(
  "operations_portal_ticket_comments",
  {
    id: text("id").primaryKey().default(sql`'ops-ticket-comment-' || gen_random_uuid()::text`),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull().references(() => operationsPortalTickets.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"internal_note" | "public_reply">().notNull().default("public_reply"),
    authorRole: text("author_role").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    mentions: text("mentions").array().notNull().default([]),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (comment) => ({
    ticketIdx: index("operations_portal_ticket_comments_ticket_idx").on(comment.organizationId, comment.ticketId, comment.createdAt)
  })
);

export const operationsPortalTicketAttachments = pgTable(
  "operations_portal_ticket_attachments",
  {
    id: text("id").primaryKey().default(sql`'ops-ticket-attachment-' || gen_random_uuid()::text`),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull().references(() => operationsPortalTickets.id, { onDelete: "cascade" }),
    commentId: text("comment_id").references(() => operationsPortalTicketComments.id, { onDelete: "set null" }),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (attachment) => ({
    ticketIdx: index("operations_portal_ticket_attachments_ticket_idx").on(attachment.organizationId, attachment.ticketId, attachment.createdAt)
  })
);

export const operationsPortalTicketEvents = pgTable(
  "operations_portal_ticket_events",
  {
    id: text("id").primaryKey().default(sql`'ops-ticket-event-' || gen_random_uuid()::text`),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id").notNull().references(() => operationsPortalTickets.id, { onDelete: "cascade" }),
    actorId: text("actor_id"),
    actorName: text("actor_name").notNull(),
    type: text("type").notNull(),
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (event) => ({
    ticketIdx: index("operations_portal_ticket_events_ticket_idx").on(event.organizationId, event.ticketId, event.createdAt)
  })
);

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

export const missionAvailability = pgTable("mission_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startsAtTime: text("starts_at_time"),
  endsAtTime: text("ends_at_time"),
  available: boolean("available").notNull().default(true),
  effectiveFrom: date("effective_from", { mode: "date" }),
  effectiveTo: date("effective_to", { mode: "date" }),
  notes: text("notes"),
  status: text("status").$type<"pending" | "approved" | "denied">().notNull().default("approved"),
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

export const missionShiftTemplates = pgTable("mission_shift_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  roleName: text("role_name"),
  siteId: uuid("site_id"),
  startsAtTime: text("starts_at_time").notNull(),
  endsAtTime: text("ends_at_time").notNull(),
  breakMinutes: integer("break_minutes").notNull().default(0),
  paidBreak: boolean("paid_break").notNull().default(false),
  defaultNotes: text("default_notes"),
  color: text("color"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionScheduleTemplates = pgTable("mission_schedule_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  templateData: jsonb("template_data").notNull().default({ shifts: [] }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionTaskTemplates = pgTable("mission_task_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority").$type<"low" | "normal" | "high" | "urgent">().notNull().default("normal"),
  requirePhoto: boolean("require_photo").notNull().default(false),
  requireNote: boolean("require_note").notNull().default(false),
  subtasks: jsonb("subtasks").notNull().default([]),
  assigneeRule: jsonb("assignee_rule").notNull().default({ type: "manual" }),
  recurrenceRule: jsonb("recurrence_rule"),
  dueRule: text("due_rule").notNull().default("fixed"),
  dueOffsetMinutes: integer("due_offset_minutes").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionSmsVerificationCodes = pgTable("mission_sms_verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  consumedAt: timestamp("consumed_at", { mode: "date" }),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionSmsMessages = pgTable("mission_sms_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "set null" }),
  direction: text("direction").$type<"in" | "out">().notNull(),
  phoneNumber: text("phone_number").notNull(),
  body: text("body").notNull(),
  channelId: uuid("channel_id").references(() => missionChannels.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => missionMessages.id, { onDelete: "set null" }),
  provider: text("provider").notNull().default("twilio"),
  providerSid: text("provider_sid"),
  providerStatus: text("provider_status"),
  sentAt: timestamp("sent_at", { mode: "date" }),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
  failedAt: timestamp("failed_at", { mode: "date" }),
  failureReason: text("failure_reason"),
  receivedAt: timestamp("received_at", { mode: "date" }),
  parsedCommand: text("parsed_command"),
  segmentCount: integer("segment_count"),
  costCents: numeric("cost_cents", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const missionSkills = pgTable("mission_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  requiresExpiration: boolean("requires_expiration").notNull().default(false),
  expirationWarningDays: integer("expiration_warning_days").notNull().default(30),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const missionMembershipSkills = pgTable("mission_membership_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => missionSkills.id, { onDelete: "cascade" }),
  certifiedAt: date("certified_at", { mode: "date" }),
  expiresAt: date("expires_at", { mode: "date" }),
  documentUrl: text("document_url"),
  verifiedByMembershipId: uuid("verified_by_membership_id"),
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const integrationConnections = pgTable("integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  providerId: text("provider_id").notNull(),
  providerCategory: text("provider_category").notNull(),
  displayName: text("display_name"),
  externalAccountId: text("external_account_id"),
  config: jsonb("config").notNull().default({}),
  state: text("state").$type<"active" | "paused" | "error" | "disconnected">().notNull().default("active"),
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at", { mode: "date" }),
  lastSyncAt: timestamp("last_sync_at", { mode: "date" }),
  lastHealthCheckAt: timestamp("last_health_check_at", { mode: "date" }),
  healthStatus: text("health_status"),
  connectedByMembershipId: uuid("connected_by_membership_id"),
  connectedAt: timestamp("connected_at", { mode: "date" }).notNull().defaultNow(),
  disconnectedAt: timestamp("disconnected_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const integrationCredentials = pgTable("integration_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").notNull().references(() => integrationConnections.id, { onDelete: "cascade" }),
  credentialType: text("credential_type").notNull(),
  encryptedData: text("encrypted_data").notNull(),
  encryptionKeyId: text("encryption_key_id").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  scopes: jsonb("scopes").notNull().default([]),
  lastRotatedAt: timestamp("last_rotated_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const integrationMappings = pgTable("integration_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  providerId: text("provider_id").notNull(),
  entityType: text("entity_type").notNull(),
  localId: uuid("local_id").notNull(),
  remoteId: text("remote_id").notNull(),
  remoteData: jsonb("remote_data").notNull().default({}),
  syncDirection: text("sync_direction").$type<"local_to_remote" | "remote_to_local" | "bidirectional">().notNull().default("bidirectional"),
  lastSyncedAt: timestamp("last_synced_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const payrollSubmissions = pgTable("payroll_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  payPeriodId: uuid("pay_period_id").references(() => payPeriods.id, { onDelete: "set null" }),
  providerId: text("provider_id").notNull(),
  submittedByMembershipId: uuid("submitted_by_membership_id"),
  state: text("state").$type<"queued" | "submitted" | "processed" | "failed" | "partial">().notNull().default("queued"),
  recordsCount: integer("records_count").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  providerReference: text("provider_reference"),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  errorMessage: text("error_message"),
  submittedAt: timestamp("submitted_at", { mode: "date" }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const webhookSubscriptions = pgTable("webhook_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  endpointUrl: text("endpoint_url").notNull(),
  eventTypes: jsonb("event_types").notNull().default([]),
  secretHash: text("secret_hash").notNull(),
  active: boolean("active").notNull().default(true),
  maxRetries: integer("max_retries").notNull().default(5),
  retryBackoffSeconds: integer("retry_backoff_seconds").notNull().default(30),
  lastDeliveredAt: timestamp("last_delivered_at", { mode: "date" }),
  lastFailedAt: timestamp("last_failed_at", { mode: "date" }),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id").notNull().references(() => webhookSubscriptions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventId: text("event_id").notNull(),
  payload: jsonb("payload").notNull().default({}),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at", { mode: "date" }),
  lastAttemptedAt: timestamp("last_attempted_at", { mode: "date" }),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  responseTimeMs: integer("response_time_ms"),
  state: text("state").$type<"pending" | "delivered" | "failed" | "abandoned">().notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { mode: "date" })
});

export const oauthApps = pgTable("oauth_apps", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  clientId: text("client_id").notNull(),
  clientSecretEncrypted: text("client_secret_encrypted").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  scopes: jsonb("scopes").notNull().default([]),
  enabled: boolean("enabled").notNull().default(true),
  displayName: text("display_name"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const notificationPreferences = pgTable("notification_preferences", {
  membershipId: uuid("membership_id").primaryKey().references(() => memberships.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull(),
  preferences: jsonb("preferences").notNull().default({}),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
  quietHoursStart: text("quiet_hours_start").notNull().default("21:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("07:00"),
  quietHoursTimezone: text("quiet_hours_timezone"),
  emergencyBypassQuietHours: boolean("emergency_bypass_quiet_hours").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull(),
  token: text("token").notNull(),
  platform: text("platform").$type<"ios" | "android" | "web">().notNull(),
  deviceId: text("device_id"),
  deviceName: text("device_name"),
  appVersion: text("app_version"),
  active: boolean("active").notNull().default(true),
  registeredAt: timestamp("registered_at", { mode: "date" }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }).notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at", { mode: "date" })
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: uuid("related_entity_id"),
  priority: text("priority").$type<"low" | "normal" | "high" | "emergency">().notNull().default("normal"),
  readAt: timestamp("read_at", { mode: "date" }),
  archivedAt: timestamp("archived_at", { mode: "date" }),
  deliveredVia: jsonb("delivered_via").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull(),
  scopes: jsonb("scopes").notNull().default([]),
  allowedIps: jsonb("allowed_ips").notNull().default([]),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(100),
  createdByMembershipId: uuid("created_by_membership_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
  revokedByMembershipId: uuid("revoked_by_membership_id")
});

export const jobRuns = pgTable("job_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id"),
  jobName: text("job_name").notNull(),
  state: text("state").$type<"queued" | "running" | "completed" | "failed" | "cancelled">().notNull().default("queued"),
  queuedAt: timestamp("queued_at", { mode: "date" }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  recordsProcessed: integer("records_processed").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").notNull().default({}),
  scheduledFor: timestamp("scheduled_for", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
});

export const productEntitlements = pgTable("product_entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  product: text("product").$type<"timekeeping" | "eclipse" | "mission_command" | "legal_addon">().notNull(),
  status: text("status").$type<"active" | "trial" | "expired" | "suspended">().notNull().default("active"),
  acquiredVia: text("acquired_via").$type<"individual" | "suite" | "trial" | "partner_bundle">().notNull().default("individual"),
  features: jsonb("features").notNull().default([]),
  trialEndsAt: timestamp("trial_ends_at", { mode: "date" }),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const membershipProductRoles = pgTable(
  "membership_product_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    product: text("product").$type<"timekeeping" | "eclipse" | "mission_command" | "suite" | "legal_addon">().notNull(),
    accessRole: text("access_role").$type<"employee" | "admin">().notNull(),
    grantedByMembershipId: uuid("granted_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at", { mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokedByMembershipId: uuid("revoked_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    revokeReason: text("revoke_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (role) => ({
    membershipProductIdx: uniqueIndex("membership_product_roles_membership_product_idx").on(role.membershipId, role.product),
    orgIdx: index("membership_product_roles_org_idx").on(role.organizationId, role.product, role.accessRole),
    membershipIdx: index("membership_product_roles_membership_idx").on(role.membershipId)
  })
);

export const billingPermissionGrants = pgTable(
  "billing_permission_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    permission: text("permission").$type<
      | "billing.view"
      | "billing.usage.view"
      | "billing.payment.update"
      | "billing.plan.modify"
      | "billing.cancel"
      | "billing.owner"
    >().notNull(),
    grantedByMembershipId: uuid("granted_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at", { mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokedByMembershipId: uuid("revoked_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    revokeReason: text("revoke_reason")
  },
  (grant) => ({
    membershipIdx: index("billing_permission_grants_membership_idx").on(grant.membershipId)
  })
);

export const permissionRoles = pgTable(
  "permission_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleKey: text("role_key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    kind: text("kind").$type<"built_in" | "custom">().notNull().default("custom"),
    baseRole: text("base_role").$type<"owner" | "admin" | "manager" | "team_lead" | "employee">(),
    color: text("color"),
    icon: text("icon"),
    defaultScopeType: text("default_scope_type").$type<"self" | "direct_reports" | "department" | "site" | "role" | "custom_group" | "all">().notNull().default("self"),
    defaultScopeConfig: jsonb("default_scope_config").notNull().default({}),
    createdByMembershipId: uuid("created_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" })
  },
  (role) => ({
    orgIdx: index("permission_roles_org_idx").on(role.organizationId, role.kind)
  })
);

export const permissionGrants = pgTable(
  "permission_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").references(() => permissionRoles.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    effect: text("effect").$type<"allow" | "deny">().notNull().default("allow"),
    scopeType: text("scope_type").$type<"self" | "direct_reports" | "department" | "site" | "role" | "custom_group" | "all">().notNull().default("self"),
    scopeConfig: jsonb("scope_config").notNull().default({}),
    reason: text("reason"),
    grantedByMembershipId: uuid("granted_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at", { mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokedByMembershipId: uuid("revoked_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    revokeReason: text("revoke_reason")
  },
  (grant) => ({
    roleIdx: index("permission_grants_role_idx").on(grant.roleId, grant.permission),
    membershipIdx: index("permission_grants_membership_idx").on(grant.membershipId, grant.permission),
    orgIdx: index("permission_grants_org_idx").on(grant.organizationId, grant.permission)
  })
);

export const permissionCustomGroups = pgTable("permission_custom_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdByMembershipId: uuid("created_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const permissionCustomGroupMembers = pgTable(
  "permission_custom_group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => permissionCustomGroups.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    addedByMembershipId: uuid("added_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow()
  },
  (member) => ({
    compoundKey: primaryKey({ columns: [member.groupId, member.membershipId] }),
    membershipIdx: index("permission_custom_group_members_membership_idx").on(member.membershipId)
  })
);

export const ownershipTransferRequests = pgTable(
  "ownership_transfer_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fromMembershipId: uuid("from_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    toMembershipId: uuid("to_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    reason: text("reason"),
    state: text("state").$type<"pending" | "accepted" | "declined" | "expired" | "cancelled">().notNull().default("pending"),
    requestedAt: timestamp("requested_at", { mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    decidedAt: timestamp("decided_at", { mode: "date" })
  },
  (request) => ({
    pendingIdx: index("ownership_transfer_requests_pending_idx").on(request.organizationId, request.expiresAt)
  })
);

export const securitySettings = pgTable("security_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  requireMfaForAdmins: boolean("require_mfa_for_admins").notNull().default(true),
  requireMfaForAll: boolean("require_mfa_for_all").notNull().default(false),
  enforceStrongPasswords: boolean("enforce_strong_passwords").notNull().default(true),
  blockNonUsSignins: boolean("block_non_us_signins").notNull().default(false),
  idleTimeoutDays: integer("idle_timeout_days").notNull().default(30),
  absoluteTimeoutDays: integer("absolute_timeout_days").notNull().default(90),
  ssoProvider: text("sso_provider"),
  ssoStatus: text("sso_status").$type<"not_configured" | "active" | "error" | "paused">().notNull().default("not_configured"),
  allowEmployeeDataExports: boolean("allow_employee_data_exports").notNull().default(true),
  notifySuspiciousSignins: boolean("notify_suspicious_signins").notNull().default(true),
  dataResidency: text("data_residency").notNull().default("US East"),
  logRetentionHotDays: integer("log_retention_hot_days").notNull().default(90),
  logRetentionColdYears: integer("log_retention_cold_years").notNull().default(7),
  updatedByMembershipId: uuid("updated_by_membership_id").references(() => memberships.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorMembershipId: uuid("actor_membership_id").references(() => memberships.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    severity: text("severity").$type<"info" | "warning" | "error" | "critical">().notNull().default("info"),
    outcome: text("outcome").$type<"success" | "failure" | "blocked" | "partial">().notNull().default("success"),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    traceId: text("trace_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata").notNull().default({}),
    hashPrevious: text("hash_previous"),
    hashCurrent: text("hash_current"),
    occurredAt: timestamp("occurred_at", { mode: "date" }).notNull().defaultNow()
  },
  (event) => ({
    orgTimeIdx: index("security_events_org_time_idx").on(event.organizationId, event.occurredAt),
    typeIdx: index("security_events_type_idx").on(event.organizationId, event.eventType, event.occurredAt),
    severityIdx: index("security_events_severity_idx").on(event.organizationId, event.severity, event.occurredAt)
  })
);

export const observabilityServiceChecks = pgTable(
  "observability_service_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceName: text("service_name").notNull(),
    environment: text("environment").notNull().default("production"),
    status: text("status").$type<"ok" | "degraded" | "down" | "maintenance">().notNull(),
    latencyP95Ms: integer("latency_p95_ms"),
    errorRateBasisPoints: integer("error_rate_basis_points"),
    saturationBasisPoints: integer("saturation_basis_points"),
    checkedAt: timestamp("checked_at", { mode: "date" }).notNull().defaultNow(),
    metadata: jsonb("metadata").notNull().default({})
  },
  (check) => ({
    serviceIdx: index("observability_service_checks_service_idx").on(check.serviceName, check.environment, check.checkedAt)
  })
);

export const observabilitySyntheticMonitors = pgTable(
  "observability_synthetic_monitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    serviceName: text("service_name").notNull(),
    cadenceMinutes: integer("cadence_minutes").notNull().default(5),
    status: text("status").$type<"passing" | "failing" | "paused">().notNull().default("passing"),
    lastRunAt: timestamp("last_run_at", { mode: "date" }),
    lastDurationMs: integer("last_duration_ms"),
    lastError: text("last_error"),
    runbookUrl: text("runbook_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (monitor) => ({
    statusIdx: index("observability_synthetic_monitors_status_idx").on(monitor.status, monitor.serviceName)
  })
);

export const observabilityIncidents = pgTable(
  "observability_incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    severity: text("severity").$type<"sev_0" | "sev_1" | "sev_2" | "sev_3" | "sev_4">().notNull(),
    status: text("status").$type<"investigating" | "identified" | "monitoring" | "resolved">().notNull().default("investigating"),
    affectedServices: text("affected_services").array().notNull().default([]),
    customerImpact: text("customer_impact"),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    runbookUrl: text("runbook_url"),
    postmortemUrl: text("postmortem_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (incident) => ({
    statusIdx: index("observability_incidents_status_idx").on(incident.status, incident.severity, incident.startedAt)
  })
);

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
  clientId: uuid("client_id"),
  number: text("number").notNull(),
  subtotal: numeric("subtotal").notNull().default("0"),
  taxRate: numeric("tax_rate").notNull().default("0"),
  taxAmount: numeric("tax_amount").notNull().default("0"),
  discountAmount: numeric("discount_amount").notNull().default("0"),
  total: numeric("total"),
  amountPaid: numeric("amount_paid").notNull().default("0"),
  status: text("status").notNull(),
  createdBy: uuid("created_by"),
  issueDate: date("issue_date").notNull().defaultNow(),
  dueDate: date("due_date"),
  notes: text("notes"),
  terms: text("terms"),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  description: text("description"),
  currency: text("currency").notNull().default("USD"),
  paypalInvoiceId: text("paypal_invoice_id"),
  paypalStatus: text("paypal_status"),
  paypalRecipientViewUrl: text("paypal_recipient_view_url"),
  paypalInvoicerViewUrl: text("paypal_invoicer_view_url"),
  paypalLastError: text("paypal_last_error"),
  sentAt: timestamp("sent_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
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

export const operationsLmsCourses = pgTable(
  "operations_lms_courses",
  {
    id: text("id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").$type<"safety" | "compliance" | "onboarding" | "software" | "soft skills" | "leadership">().notNull(),
    duration: text("duration").notNull(),
    recurrenceMonths: integer("recurrence_months"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" })
  },
  (course) => ({
    compoundKey: primaryKey({ columns: [course.organizationId, course.id] }),
    orgIdx: index("operations_lms_courses_org_idx").on(course.organizationId)
  })
);

export const operationsLmsLessons = pgTable(
  "operations_lms_lessons",
  {
    id: text("id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    position: integer("position").notNull().default(0)
  },
  (lesson) => ({
    compoundKey: primaryKey({ columns: [lesson.organizationId, lesson.id] }),
    courseIdx: index("operations_lms_lessons_course_idx").on(lesson.courseId, lesson.position)
  })
);

export const operationsLmsQuizzes = pgTable(
  "operations_lms_quizzes",
  {
    id: text("id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    courseId: text("course_id").notNull(),
    prompt: text("prompt").notNull(),
    correctAnswer: text("correct_answer").notNull().default("Acknowledge safe procedure"),
    questions: jsonb("questions").$type<Array<{ prompt: string; options: string[]; correctIndex: number; explanation: string }>>().notNull().default([]),
    passingScore: integer("passing_score").notNull().default(80)
  },
  (quiz) => ({
    compoundKey: primaryKey({ columns: [quiz.organizationId, quiz.id] })
  })
);

export const operationsLmsLearningPaths = pgTable(
  "operations_lms_learning_paths",
  {
    id: text("id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<"new_hire" | "role_based" | "promotion" | "compliance" | "manual">().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (path) => ({
    compoundKey: primaryKey({ columns: [path.organizationId, path.id] })
  })
);

export const operationsLmsLearningPathCourses = pgTable(
  "operations_lms_learning_path_courses",
  {
    pathId: text("path_id").notNull(),
    courseId: text("course_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    position: integer("position").notNull().default(0),
    required: boolean("required").notNull().default(true)
  },
  (pathCourse) => ({
    compoundKey: primaryKey({ columns: [pathCourse.organizationId, pathCourse.pathId, pathCourse.courseId] })
  })
);

export const operationsLmsAssignmentRules = pgTable(
  "operations_lms_assignment_rules",
  {
    id: text("id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    trigger: text("trigger").notNull(),
    pathId: text("path_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow()
  },
  (rule) => ({
    triggerIdx: uniqueIndex("operations_lms_assignment_rules_trigger_idx").on(rule.organizationId, rule.trigger, rule.pathId)
  })
);

export const operationsLmsEnrollments = pgTable(
  "operations_lms_enrollments",
  {
    id: text("id").primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    employeeId: text("employee_id").notNull(),
    courseId: text("course_id").notNull(),
    status: text("status").$type<"assigned" | "in_progress" | "complete" | "overdue" | "removed">().notNull().default("assigned"),
    reason: text("reason").$type<"new_hire" | "role_change" | "promotion" | "compliance" | "corrective" | "manual">().notNull().default("manual"),
    dueDate: date("due_date", { mode: "date" }),
    progress: integer("progress").notNull().default(0),
    currentLesson: integer("current_lesson").notNull().default(0),
    assignedBy: text("assigned_by"),
    completedAt: timestamp("completed_at", { mode: "date" }),
    certificateIssuedAt: timestamp("certificate_issued_at", { mode: "date" }),
    removedBy: text("removed_by"),
    removedAt: timestamp("removed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
  },
  (enrollment) => ({
    employeeIdx: index("operations_lms_enrollments_employee_idx").on(enrollment.organizationId, enrollment.employeeId, enrollment.status),
    uniqueCourseReason: uniqueIndex("operations_lms_enrollments_unique_reason_idx").on(enrollment.organizationId, enrollment.employeeId, enrollment.courseId, enrollment.reason)
  })
);
