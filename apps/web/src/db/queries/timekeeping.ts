import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, holidays, memberships, profiles, ptoBalances, ptoCategories, ptoRequests, timeEntries } from "@/src/db/schema";
import { getMembershipForUser, getTimeEntrySeconds } from "./time-entries";
import type { TimekeepingSettings } from "./timekeeping-settings";
import type { ValidationResult } from "./pto-validation";
import { transitionPtoRequest } from "./pto-workflow";

export function formatHours(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

export async function ensureDefaultPtoCategories(organizationId: string) {
  const existing = await db.select({ id: ptoCategories.id }).from(ptoCategories).where(and(eq(ptoCategories.organizationId, organizationId), isNull(ptoCategories.deletedAt))).limit(1);
  if (existing.length) return;

  await db.insert(ptoCategories).values([
    { organizationId, name: "Vacation", isPaid: true, accrualRule: { type: "per_pay_period", hours: 3.2 }, noticeDays: 14, probationApplies: true, sortOrder: 10 },
    { organizationId, name: "Sick", isPaid: true, accrualRule: { type: "per_hour_worked", hours: 0.0334 }, noticeDays: 0, sortOrder: 20 },
    { organizationId, name: "Unpaid", isPaid: false, accrualRule: { type: "none" }, noticeDays: 0, sortOrder: 30 }
  ]);
}

export async function getTimekeepingOverview(userId: string, organizationId: string) {
  await ensureDefaultPtoCategories(organizationId);
  const membership = await getMembershipForUser(userId, organizationId);
  if (!membership) throw new Error("Membership required.");

  const entries = await db
    .select({
      id: timeEntries.id,
      description: timeEntries.description,
      punch_note: timeEntries.punchNote,
      started_at: timeEntries.startedAt,
      ended_at: timeEntries.endedAt,
      duration_seconds: timeEntries.durationSeconds,
      status: timeEntries.status,
      review_flag: timeEntries.reviewFlag
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.organizationId, organizationId), eq(timeEntries.membershipId, membership.id), isNull(timeEntries.deletedAt)))
    .orderBy(desc(timeEntries.startedAt))
    .limit(60);

  const running = entries.find((entry) => !entry.ended_at) ?? null;
  const categories = await db
    .select({
      id: ptoCategories.id,
      name: ptoCategories.name,
      is_paid: ptoCategories.isPaid,
      notice_days: ptoCategories.noticeDays,
      probation_applies: ptoCategories.probationApplies,
      negative_balance_allowed: ptoCategories.negativeBalanceAllowed,
      blackout_dates: ptoCategories.blackoutDates,
      accrued: ptoBalances.accruedHours,
      used: ptoBalances.usedHours,
      pending: ptoBalances.pendingHours,
      adjusted: ptoBalances.adjustedHours
    })
    .from(ptoCategories)
    .leftJoin(ptoBalances, and(eq(ptoBalances.categoryId, ptoCategories.id), eq(ptoBalances.membershipId, membership.id)))
    .where(and(eq(ptoCategories.organizationId, organizationId), isNull(ptoCategories.deletedAt)))
    .orderBy(ptoCategories.sortOrder);

  const requests = await db
    .select({
      id: ptoRequests.id,
      category_id: ptoRequests.categoryId,
      category_name: ptoCategories.name,
      starts_at: ptoRequests.startsAt,
      ends_at: ptoRequests.endsAt,
      hours: ptoRequests.hours,
      status: ptoRequests.status,
      employee_note: ptoRequests.employeeNote,
      manager_note: ptoRequests.managerNote,
      submitted_at: ptoRequests.submittedAt
    })
    .from(ptoRequests)
    .innerJoin(ptoCategories, eq(ptoCategories.id, ptoRequests.categoryId))
    .where(and(eq(ptoRequests.organizationId, organizationId), eq(ptoRequests.membershipId, membership.id), isNull(ptoRequests.deletedAt)))
    .orderBy(desc(ptoRequests.submittedAt))
    .limit(40);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const hasPtoToday = requests.some((request) => request.status === "approved" && request.starts_at < todayEnd && request.ends_at > todayStart);

  const totalSeconds = entries.reduce((sum, entry) => sum + getTimeEntrySeconds(entry), 0);
  const hours = totalSeconds / 3600;
  const overtimeHours = Math.max(0, hours - 40);
  const regularHours = Math.max(0, hours - overtimeHours);
  const regularRate = (membership.payRateCents ?? 0) / 100;
  const earnings = regularHours * regularRate + overtimeHours * regularRate * 1.5;

  return {
    membership,
    entries,
    running,
    categories,
    requests,
    hasPtoToday,
    summary: {
      regularHours,
      overtimeHours,
      totalHours: hours,
      earnings,
      payRateCents: membership.payRateCents ?? 0
    }
  };
}

export function getCurrentWeeklyPeriod(reference = new Date()) {
  const start = new Date(reference);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(-1);
  return { start, end };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dollars(cents: number) {
  return cents / 100;
}

export type CalculatedTimesheet = Awaited<ReturnType<typeof calculateTimesheetForMembership>>;

export async function calculateTimesheetForMembership(input: {
  organizationId: string;
  membershipId: string;
  periodStart?: Date;
  periodEnd?: Date;
  settings: TimekeepingSettings;
}) {
  const period = input.periodStart && input.periodEnd ? { start: input.periodStart, end: input.periodEnd } : getCurrentWeeklyPeriod();
  const [member] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      payRateCents: memberships.payRateCents,
      employee_name: profiles.fullName,
      employee_email: profiles.email,
      department: memberships.department
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, input.organizationId), isNull(memberships.deletedAt)))
    .limit(1);

  if (!member) throw new Error("Employee not found.");

  const punchRows = await db
    .select({
      id: timeEntries.id,
      description: timeEntries.description,
      punch_note: timeEntries.punchNote,
      started_at: timeEntries.startedAt,
      ended_at: timeEntries.endedAt,
      duration_seconds: timeEntries.durationSeconds,
      status: timeEntries.status,
      review_flag: timeEntries.reviewFlag
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.organizationId, input.organizationId), eq(timeEntries.membershipId, input.membershipId), isNull(timeEntries.deletedAt)))
    .orderBy(timeEntries.startedAt);

  const periodPunches = punchRows.filter((entry) => entry.started_at >= period.start && entry.started_at <= period.end);
  const ptoRows = await db
    .select({
      id: ptoRequests.id,
      category_name: ptoCategories.name,
      is_paid: ptoCategories.isPaid,
      starts_at: ptoRequests.startsAt,
      ends_at: ptoRequests.endsAt,
      hours: ptoRequests.hours,
      status: ptoRequests.status
    })
    .from(ptoRequests)
    .innerJoin(ptoCategories, eq(ptoCategories.id, ptoRequests.categoryId))
    .where(and(eq(ptoRequests.organizationId, input.organizationId), eq(ptoRequests.membershipId, input.membershipId), isNull(ptoRequests.deletedAt)));

  const periodPto = ptoRows.filter((request) => request.status === "approved" && request.starts_at <= period.end && request.ends_at >= period.start);
  const days = [];
  for (const cursor = new Date(period.start); cursor <= period.end; cursor.setDate(cursor.getDate() + 1)) {
    const current = new Date(cursor);
    const key = dayKey(current);
    const punches = periodPunches.filter((entry) => dayKey(entry.started_at) === key);
    const pto = periodPto.filter((request) => dayKey(request.starts_at) === key);
    const seconds = punches.reduce((sum, entry) => sum + getTimeEntrySeconds(entry), 0);
    const ptoHours = pto.reduce((sum, request) => sum + Number(request.hours), 0);
    const workedHours = seconds / 3600;
    const paidPtoHours = pto.filter((request) => request.is_paid).reduce((sum, request) => sum + Number(request.hours), 0);
    const pay = (workedHours + paidPtoHours) * dollars(member.payRateCents);
    days.push({
      date: key,
      hours: workedHours + ptoHours,
      pay,
      punches,
      breaks: [] as Array<{ start: string; end: string; paid: boolean }>,
      pto,
      holiday: null as null | { name: string; multiplier: number },
      status: punches.some((entry) => entry.review_flag) ? "flagged" : punches.length || pto.length ? "pending" : "open"
    });
  }

  const workedHours = periodPunches.reduce((sum, entry) => sum + getTimeEntrySeconds(entry), 0) / 3600;
  const overtimeThreshold = input.settings.payRules.overtimeBasis === "weekly" ? input.settings.payRules.overtimeThreshold : input.settings.payRules.standardWorkweekHours;
  const overtimeHours = Math.max(0, workedHours - overtimeThreshold);
  const regularHours = Math.max(0, workedHours - overtimeHours);
  const paidPtoHours = periodPto.filter((request) => request.is_paid).reduce((sum, request) => sum + Number(request.hours), 0);
  const rate = dollars(member.payRateCents);
  const regularPay = regularHours * rate;
  const overtimePay = overtimeHours * rate * input.settings.payRules.overtimeMultiplier;
  const ptoPay = paidPtoHours * rate;
  const holidayHours = 0;
  const holidayPay = 0;
  const flagged = periodPunches.some((entry) => entry.review_flag);
  const status = flagged ? "flagged" : period.end > new Date() ? "open" : "pending";

  return {
    employee: member,
    pay_period: { start: period.start, end: period.end, status },
    summary: {
      regular_hours: regularHours,
      regular_pay: regularPay,
      overtime_hours: overtimeHours,
      overtime_pay: overtimePay,
      holiday_hours: holidayHours,
      holiday_pay: holidayPay,
      pto_hours: paidPtoHours,
      pto_pay: ptoPay,
      total_hours: regularHours + overtimeHours + holidayHours + paidPtoHours,
      total_pay: regularPay + overtimePay + holidayPay + ptoPay
    },
    days,
    status,
    calculation_explanation: `${regularHours.toFixed(2)} regular hours x $${rate.toFixed(2)} + ${overtimeHours.toFixed(2)} overtime hours x $${rate.toFixed(2)} x ${input.settings.payRules.overtimeMultiplier} + ${paidPtoHours.toFixed(2)} PTO hours x $${rate.toFixed(2)}.`
  };
}

export async function getTeamTimesheets(input: { organizationId: string; settings: TimekeepingSettings }) {
  const members = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.organizationId, input.organizationId), isNull(memberships.deletedAt)));

  const timesheets = await Promise.all(members.map((member) => calculateTimesheetForMembership({ organizationId: input.organizationId, membershipId: member.id, settings: input.settings })));
  return {
    rows: timesheets.map((timesheet) => ({
      membership_id: timesheet.employee.id,
      employee_name: timesheet.employee.employee_name,
      employee_email: timesheet.employee.employee_email,
      department: timesheet.employee.department,
      regular_hours: timesheet.summary.regular_hours,
      overtime_hours: timesheet.summary.overtime_hours,
      holiday_hours: timesheet.summary.holiday_hours,
      pto_hours: timesheet.summary.pto_hours,
      total_hours: timesheet.summary.total_hours,
      total_pay: timesheet.summary.total_pay,
      status: timesheet.status
    })),
    insights: {
      pending: timesheets.filter((timesheet) => timesheet.status === "pending").length,
      flagged: timesheets.filter((timesheet) => timesheet.status === "flagged").length,
      approved: timesheets.filter((timesheet) => timesheet.status === "approved").length,
      overtimeHours: timesheets.reduce((sum, timesheet) => sum + timesheet.summary.overtime_hours, 0),
      laborCost: timesheets.reduce((sum, timesheet) => sum + timesheet.summary.total_pay, 0),
      currentlyClockedIn: 0
    }
  };
}

export async function getManagerTimekeepingQueue(organizationId: string) {
  const pendingRequests = await db
    .select({
      id: ptoRequests.id,
      employee_name: profiles.fullName,
      employee_email: profiles.email,
      category_name: ptoCategories.name,
      starts_at: ptoRequests.startsAt,
      ends_at: ptoRequests.endsAt,
      hours: ptoRequests.hours,
      employee_note: ptoRequests.employeeNote,
      submitted_at: ptoRequests.submittedAt
    })
    .from(ptoRequests)
    .innerJoin(memberships, eq(memberships.id, ptoRequests.membershipId))
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .innerJoin(ptoCategories, eq(ptoCategories.id, ptoRequests.categoryId))
    .where(and(eq(ptoRequests.organizationId, organizationId), eq(ptoRequests.status, "pending"), isNull(ptoRequests.deletedAt)))
    .orderBy(ptoRequests.submittedAt)
    .limit(25);

  const flaggedEntries = await db
    .select({
      id: timeEntries.id,
      employee_name: profiles.fullName,
      employee_email: profiles.email,
      started_at: timeEntries.startedAt,
      ended_at: timeEntries.endedAt,
      review_flag: timeEntries.reviewFlag,
      punch_note: timeEntries.punchNote
    })
    .from(timeEntries)
    .innerJoin(memberships, eq(memberships.id, timeEntries.membershipId))
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(timeEntries.organizationId, organizationId), isNotNull(timeEntries.reviewFlag), isNull(timeEntries.deletedAt)))
    .orderBy(desc(timeEntries.startedAt))
    .limit(25);

  return { pendingRequests, flaggedEntries };
}

export async function getAdminTimekeepingConfig(organizationId: string) {
  const categories = await db.select().from(ptoCategories).where(and(eq(ptoCategories.organizationId, organizationId), isNull(ptoCategories.deletedAt))).orderBy(ptoCategories.sortOrder);
  const holidayRows = await db.select().from(holidays).where(and(eq(holidays.organizationId, organizationId), isNull(holidays.deletedAt))).orderBy(holidays.date);
  return { categories, holidays: holidayRows };
}

export async function createPtoRequest(input: {
  organizationId: string;
  membershipId: string;
  categoryId: string;
  startsAt: Date;
  endsAt: Date;
  hours: string;
  employeeNote?: string | null;
  validation?: ValidationResult;
  acknowledgedWarnings?: string[];
}) {
  const [request] = await db
    .insert(ptoRequests)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      categoryId: input.categoryId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      hours: input.hours,
      employeeNote: input.employeeNote || null
    })
    .returning();

  await db
    .insert(ptoBalances)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      categoryId: input.categoryId,
      pendingHours: input.hours
    })
    .onConflictDoUpdate({
      target: [ptoBalances.membershipId, ptoBalances.categoryId],
      set: { pendingHours: sql`${ptoBalances.pendingHours} + ${input.hours}`, updatedAt: new Date() }
    });

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.membershipId,
    action: "pto.request_submitted",
    targetType: "pto_request",
    targetId: request.id,
    after: {
      request,
      validation: input.validation ? {
        computed: input.validation.computed,
        issueCodes: input.validation.issues.map((issue) => issue.code),
        acknowledgedWarnings: input.acknowledgedWarnings ?? []
      } : null
    }
  });

  return { request, validation: input.validation };
}

export async function updatePtoCategoryBalancePolicy(input: {
  organizationId: string;
  actorMembershipId: string | null;
  categoryId: string;
  negativeBalanceAllowed: boolean;
}) {
  const [before] = await db
    .select()
    .from(ptoCategories)
    .where(and(eq(ptoCategories.id, input.categoryId), eq(ptoCategories.organizationId, input.organizationId), isNull(ptoCategories.deletedAt)))
    .limit(1);
  if (!before) throw new Error("PTO category not found.");

  const [after] = await db
    .update(ptoCategories)
    .set({ negativeBalanceAllowed: input.negativeBalanceAllowed })
    .where(eq(ptoCategories.id, input.categoryId))
    .returning();

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.actorMembershipId,
    action: "pto.category_balance_policy_updated",
    targetType: "pto_category",
    targetId: input.categoryId,
    before: { negativeBalanceAllowed: before.negativeBalanceAllowed },
    after: { negativeBalanceAllowed: after.negativeBalanceAllowed }
  });

  return after;
}

export async function decidePtoRequest(input: {
  organizationId: string;
  actorMembershipId: string;
  requestId: string;
  status: "approved" | "denied";
  managerNote?: string | null;
  overrideValidationFailures?: boolean;
}) {
  const transition = await transitionPtoRequest(input.requestId, input.status === "approved" ? "APPROVE" : "DENY", {
    note: input.managerNote,
    overrideValidationFailures: input.overrideValidationFailures
  }, {
    organizationId: input.organizationId,
    actorMembershipId: input.actorMembershipId
  });

  return transition.request;
}
