import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { holidays, memberships, ptoBalances, ptoCategories, ptoRequests } from "@/src/db/schema";

export type ValidationIssue = {
  code: string;
  severity: "error" | "warning" | "info";
  field?: string;
  message: string;
  details?: Record<string, unknown>;
  overridable?: boolean;
};

export type PtoRequestValidationInput = {
  categoryId?: string;
  category_id?: string;
  startsAt?: string | Date;
  start?: string | Date;
  endsAt?: string | Date;
  end?: string | Date;
  hours?: string | number;
  employeeNote?: string | null;
  note?: string | null;
  acknowledgeWarnings?: string[];
  acknowledge_warnings?: string[];
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  computed: {
    hours_requested: number;
    balance_before: number;
    balance_after: number;
    business_days: number;
    affected_dates: string[];
  };
};

type NormalizedInput = {
  categoryId: string;
  startsAt: Date;
  endsAt: Date;
  hours: number;
  employeeNote: string | null;
};

function parseDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeInput(input: PtoRequestValidationInput): { value: Partial<NormalizedInput>; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const categoryId = input.categoryId ?? input.category_id ?? "";
  const startsAt = parseDate(input.startsAt ?? input.start);
  const endsAt = parseDate(input.endsAt ?? input.end);
  const hours = input.hours === undefined || input.hours === "" ? NaN : Number(input.hours);
  const employeeNote = typeof input.employeeNote === "string" ? input.employeeNote : typeof input.note === "string" ? input.note : null;

  if (!categoryId) issues.push({ code: "CATEGORY_REQUIRED", severity: "error", field: "categoryId", message: "Please select a category for your time off." });
  if (!startsAt) issues.push({ code: "START_REQUIRED", severity: "error", field: "startsAt", message: "Please enter a start date and time." });
  if (!endsAt) issues.push({ code: "END_REQUIRED", severity: "error", field: "endsAt", message: "Please enter an end date and time." });
  if (startsAt && endsAt && endsAt <= startsAt) issues.push({ code: "END_BEFORE_START", severity: "error", field: "endsAt", message: "End time must be after start time." });
  if (!Number.isFinite(hours) || hours <= 0) issues.push({ code: "HOURS_INVALID", severity: "error", field: "hours", message: "Hours must be greater than zero." });
  if (Number.isFinite(hours) && hours > 999) issues.push({ code: "HOURS_UNREASONABLE", severity: "error", field: "hours", message: "Hours exceeds maximum allowed (999). Please check your request." });
  if (employeeNote && employeeNote.length > 1000) issues.push({ code: "NOTE_TOO_LONG", severity: "error", field: "employeeNote", message: "Note is too long (maximum 1000 characters)." });

  return { value: { categoryId, startsAt: startsAt ?? undefined, endsAt: endsAt ?? undefined, hours, employeeNote }, issues };
}

function buildResult(issues: ValidationIssue[], computed: ValidationResult["computed"]): ValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const info = issues.filter((issue) => issue.severity === "info");
  return { valid: errors.length === 0, issues, errors, warnings, info, computed };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function availableHours(balance: typeof ptoBalances.$inferSelect | undefined) {
  if (!balance) return 0;
  return Number(balance.accruedHours) + Number(balance.adjustedHours) - Number(balance.usedHours) - Number(balance.pendingHours);
}

function affectedDates(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function hasBlackoutOverlap(rawBlackout: string, affected: Set<string>) {
  if (!rawBlackout) return false;
  if (affected.has(rawBlackout.slice(0, 10))) return true;
  const [start, end] = rawBlackout.split(/[/:|,]/).map((part) => part.trim()).filter(Boolean);
  if (!start || !end) return false;
  return [...affected].some((date) => date >= start.slice(0, 10) && date <= end.slice(0, 10));
}

function accrualMethod(rule: unknown) {
  if (!rule || typeof rule !== "object") return "none";
  const value = rule as Record<string, unknown>;
  return String(value.method ?? value.type ?? "none");
}

export async function validatePtoRequest(input: PtoRequestValidationInput, context: {
  organizationId: string;
  membershipId: string;
  isAdminActing?: boolean;
  existingRequestId?: string;
}): Promise<ValidationResult> {
  const normalized = normalizeInput(input);
  const computed: ValidationResult["computed"] = {
    hours_requested: Number.isFinite(Number(input.hours)) ? Number(input.hours) : 0,
    balance_before: 0,
    balance_after: 0,
    business_days: 0,
    affected_dates: []
  };

  if (normalized.issues.some((issue) => issue.severity === "error")) return buildResult(normalized.issues, computed);

  const request = normalized.value as NormalizedInput;
  computed.hours_requested = request.hours;
  const dates = affectedDates(request.startsAt, request.endsAt);
  computed.affected_dates = dates.map(dateKey);
  computed.business_days = dates.filter((date) => date.getDay() !== 0 && date.getDay() !== 6).length;

  const [member, category, balance, existingRequests, holidayRows] = await Promise.all([
    db.select().from(memberships).where(and(eq(memberships.id, context.membershipId), eq(memberships.organizationId, context.organizationId), isNull(memberships.deletedAt))).limit(1),
    db.select().from(ptoCategories).where(and(eq(ptoCategories.id, request.categoryId), eq(ptoCategories.organizationId, context.organizationId), isNull(ptoCategories.deletedAt))).limit(1),
    db.select().from(ptoBalances).where(and(eq(ptoBalances.membershipId, context.membershipId), eq(ptoBalances.categoryId, request.categoryId))).limit(1),
    db.select().from(ptoRequests).where(and(eq(ptoRequests.organizationId, context.organizationId), eq(ptoRequests.membershipId, context.membershipId), inArray(ptoRequests.status, ["pending", "approved"]), isNull(ptoRequests.deletedAt))),
    db.select().from(holidays).where(and(eq(holidays.organizationId, context.organizationId), isNull(holidays.deletedAt)))
  ]);

  const issues: ValidationIssue[] = [...normalized.issues];
  const employee = member[0];
  const ptoCategory = category[0];
  const ptoBalance = balance[0];

  if (!employee) issues.push({ code: "EMPLOYEE_NOT_FOUND", severity: "error", message: "Employee record could not be found." });
  if (!ptoCategory) {
    issues.push({ code: "CATEGORY_NOT_FOUND", severity: "error", field: "categoryId", message: "Selected category does not exist." });
    return buildResult(issues, computed);
  }

  const now = new Date();
  if (request.endsAt < now && !context.isAdminActing) {
    issues.push({ code: "REQUEST_IN_PAST", severity: "error", field: "startsAt", message: "Cannot request time off for past dates. Contact your manager to log historical time off." });
  }

  const twoYearsOut = new Date(now);
  twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2);
  if (request.startsAt > twoYearsOut) {
    issues.push({ code: "REQUEST_TOO_FAR_FUTURE", severity: "warning", field: "startsAt", message: "Requests more than 2 years in advance may be subject to policy changes.", overridable: true });
  }

  const overlapping = existingRequests.filter((existing) => existing.id !== context.existingRequestId && existing.startsAt < request.endsAt && existing.endsAt > request.startsAt);
  if (overlapping.length) {
    issues.push({
      code: "OVERLAPPING_REQUEST",
      severity: "error",
      field: "startsAt",
      message: `This overlaps with ${overlapping.length} existing request${overlapping.length === 1 ? "" : "s"}.`,
      details: { overlapping_requests: overlapping.map((item) => ({ id: item.id, startsAt: item.startsAt, endsAt: item.endsAt, status: item.status, categoryId: item.categoryId })) }
    });
  }

  if (ptoCategory.noticeDays > 0) {
    const daysUntilStart = Math.ceil((request.startsAt.getTime() - now.getTime()) / 86_400_000);
    if (daysUntilStart < ptoCategory.noticeDays) {
      issues.push({
        code: "INSUFFICIENT_NOTICE",
        severity: "error",
        field: "startsAt",
        message: `${ptoCategory.name} requires at least ${ptoCategory.noticeDays} days' notice. This request is ${Math.max(0, daysUntilStart)} days out.`,
        details: { required_days: ptoCategory.noticeDays, actual_days: daysUntilStart }
      });
    }
  }

  if (ptoCategory.probationApplies && employee?.probationEndsAt && request.startsAt < employee.probationEndsAt) {
    issues.push({
      code: "IN_PROBATION",
      severity: "error",
      field: "startsAt",
      message: `${ptoCategory.name} can be used after your probation period ends on ${dateKey(employee.probationEndsAt)}.`,
      details: { probation_end: dateKey(employee.probationEndsAt) }
    });
  }

  const affected = new Set(computed.affected_dates);
  const blackouts = Array.isArray(ptoCategory.blackoutDates) ? ptoCategory.blackoutDates : [];
  for (const blackout of blackouts) {
    if (hasBlackoutOverlap(String(blackout), affected)) {
      issues.push({ code: "BLACKOUT_DATE", severity: "error", field: "startsAt", message: `${ptoCategory.name} is not available during a blackout date in this range.`, details: { blackout } });
    }
  }

  if (ptoCategory.weeklyMaxHours && request.hours > Number(ptoCategory.weeklyMaxHours)) {
    issues.push({
      code: "EXCEEDS_WEEKLY_CAP",
      severity: "error",
      field: "hours",
      message: `${ptoCategory.name} is limited to ${Number(ptoCategory.weeklyMaxHours).toFixed(2)} hours per week.`,
      details: { max_allowed: Number(ptoCategory.weeklyMaxHours), requested: request.hours }
    });
  }

  const holidayMatches = holidayRows.filter((holiday) => affected.has(dateKey(holiday.date)));
  if (holidayMatches.length) {
    computed.business_days = Math.max(0, computed.business_days - holidayMatches.filter((holiday) => holiday.date.getDay() !== 0 && holiday.date.getDay() !== 6).length);
    issues.push({
      code: "CONTAINS_HOLIDAY",
      severity: "info",
      message: `Your request includes ${holidayMatches.length} holiday${holidayMatches.length === 1 ? "" : "s"}: ${holidayMatches.map((holiday) => holiday.name).join(", ")}. Confirm your PTO hours are correct.`,
      details: { holidays: holidayMatches.map((holiday) => ({ date: dateKey(holiday.date), name: holiday.name })) }
    });
  }

  if (!ptoCategory.isPaid) {
    issues.push({ code: "UNPAID_CATEGORY", severity: "info", message: `${ptoCategory.name} is unpaid. These hours will not be paid but will count as approved time off.` });
    computed.balance_before = 0;
    computed.balance_after = 0;
  } else {
    const available = availableHours(ptoBalance);
    computed.balance_before = available;
    computed.balance_after = available - request.hours;

    if (accrualMethod(ptoCategory.accrualRule) === "none" && available <= 0 && !ptoCategory.negativeBalanceAllowed) {
      issues.push({ code: "NO_BALANCE_GRANT_ONLY", severity: "error", field: "hours", message: `${ptoCategory.name} must be granted by an administrator before it can be used. Contact your manager.` });
    } else if (request.hours > available) {
      const shortfall = request.hours - available;
      if (!ptoCategory.negativeBalanceAllowed) {
        issues.push({
          code: "INSUFFICIENT_BALANCE",
          severity: "error",
          field: "hours",
          message: `You're requesting ${request.hours.toFixed(2)}h of ${ptoCategory.name} but only have ${available.toFixed(2)}h available, short ${shortfall.toFixed(2)}h.`,
          details: { requested: request.hours, available, shortfall }
        });
      } else {
        issues.push({
          code: "NEGATIVE_BALANCE_WARNING",
          severity: "warning",
          field: "hours",
          message: `This request will put your ${ptoCategory.name} balance at ${computed.balance_after.toFixed(2)}h. Future accruals will go toward paying this back.`,
          details: { requested: request.hours, available, balance_after: computed.balance_after },
          overridable: true
        });
      }
    } else if (computed.balance_after < 8) {
      issues.push({ code: "LOW_BALANCE_AFTER", severity: "info", message: `After this request you'll have ${computed.balance_after.toFixed(1)}h of ${ptoCategory.name} remaining.` });
    }
  }

  if (computed.business_days > 10) {
    issues.push({ code: "EXTENDED_LEAVE", severity: "info", message: `This is a ${computed.business_days}-business-day request. Extended leave may require additional approvals or coverage planning.` });
  }

  if (context.isAdminActing) {
    const overridable = new Set(["INSUFFICIENT_NOTICE", "IN_PROBATION", "BLACKOUT_DATE", "EXCEEDS_WEEKLY_CAP", "INSUFFICIENT_BALANCE", "REQUEST_IN_PAST", "NO_BALANCE_GRANT_ONLY"]);
    return buildResult(issues.map((issue) => overridable.has(issue.code) ? { ...issue, severity: "warning", overridable: true } : issue), computed);
  }

  return buildResult(issues, computed);
}

export function normalizePtoRequestForCreate(input: PtoRequestValidationInput): NormalizedInput {
  const normalized = normalizeInput(input);
  if (normalized.issues.some((issue) => issue.severity === "error")) throw new Error("Invalid PTO request input.");
  return normalized.value as NormalizedInput;
}
