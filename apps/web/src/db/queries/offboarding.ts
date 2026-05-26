import { and, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/src/db";
import {
  auditLog,
  employeeOffboardings,
  memberships,
  offboardingChecklistItems,
  offboardingEvents,
  offboardingFinalPayRecords,
  profiles,
  ptoBalances,
  ptoCategories,
  timeEntries
} from "@/src/db/schema";

type DepartureType = typeof employeeOffboardings.$inferSelect.departureType;

const defaultChecklist = [
  "Schedule exit interview",
  "Collect company property",
  "Document handover notes",
  "Notify team as appropriate",
  "Update site assignments",
  "Set access expiration",
  "Confirm forwarding contact info",
  "Send final pay information"
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function stateFinalPayDue(finalDay: Date, departureType: DepartureType, workState?: string | null) {
  if (workState?.toUpperCase() === "CA") {
    if (departureType.startsWith("involuntary")) return finalDay;
    if (departureType === "voluntary_immediate") return addDays(finalDay, 3);
  }
  return addDays(finalDay, 4);
}

export async function getOffboardingDashboard(organizationId: string) {
  const rows = await db
    .select({
      id: employeeOffboardings.id,
      state: employeeOffboardings.state,
      departureType: employeeOffboardings.departureType,
      finalDay: employeeOffboardings.finalDay,
      finalPayDueAt: employeeOffboardings.finalPayDueAt,
      accessEndsAt: employeeOffboardings.accessEndsAt,
      createdAt: employeeOffboardings.createdAt,
      employeeName: profiles.fullName,
      employeeEmail: profiles.email
    })
    .from(employeeOffboardings)
    .innerJoin(memberships, eq(memberships.id, employeeOffboardings.membershipId))
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(employeeOffboardings.organizationId, organizationId), isNull(employeeOffboardings.deletedAt)))
    .orderBy(desc(employeeOffboardings.createdAt));

  const now = new Date();
  const activeStates = ["scheduled", "active_offboarding", "finalizing"] as const;
  const active = rows.filter((row) => activeStates.includes(row.state as (typeof activeStates)[number]));
  const overdueFinalPay = rows.filter((row) => activeStates.includes(row.state as (typeof activeStates)[number]) && row.finalPayDueAt && row.finalPayDueAt < now);
  const dueThisWeek = rows.filter((row) => row.finalPayDueAt && row.finalPayDueAt >= now && row.finalPayDueAt <= addDays(now, 7));
  const archivingSoon = rows.filter((row) => row.accessEndsAt && row.accessEndsAt >= now && row.accessEndsAt <= addDays(now, 30));

  return {
    rows,
    stats: {
      active: active.length,
      overdueFinalPay: overdueFinalPay.length,
      dueThisWeek: dueThisWeek.length,
      archivingSoon: archivingSoon.length
    }
  };
}

export async function getOffboardingDetail(organizationId: string, offboardingId: string) {
  const [record] = await db
    .select({
      id: employeeOffboardings.id,
      state: employeeOffboardings.state,
      departureType: employeeOffboardings.departureType,
      initiatedByType: employeeOffboardings.initiatedByType,
      finalDay: employeeOffboardings.finalDay,
      effectiveDate: employeeOffboardings.effectiveDate,
      finalPayDueAt: employeeOffboardings.finalPayDueAt,
      accessEndsAt: employeeOffboardings.accessEndsAt,
      reasonPrivate: employeeOffboardings.reasonPrivate,
      noteToEmployee: employeeOffboardings.noteToEmployee,
      employeeName: profiles.fullName,
      employeeEmail: profiles.email,
      membershipId: memberships.id,
      payRateCents: memberships.payRateCents
    })
    .from(employeeOffboardings)
    .innerJoin(memberships, eq(memberships.id, employeeOffboardings.membershipId))
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(employeeOffboardings.id, offboardingId), eq(employeeOffboardings.organizationId, organizationId), isNull(employeeOffboardings.deletedAt)))
    .limit(1);

  if (!record) return null;

  const [checklist, finalPay, events] = await Promise.all([
    db.select().from(offboardingChecklistItems).where(eq(offboardingChecklistItems.offboardingId, offboardingId)).orderBy(offboardingChecklistItems.sortOrder),
    db.select().from(offboardingFinalPayRecords).where(eq(offboardingFinalPayRecords.offboardingId, offboardingId)).orderBy(desc(offboardingFinalPayRecords.createdAt)).limit(1),
    db.select().from(offboardingEvents).where(eq(offboardingEvents.offboardingId, offboardingId)).orderBy(desc(offboardingEvents.createdAt)).limit(20)
  ]);

  return { record, checklist, finalPay: finalPay[0] ?? null, events };
}

export async function initiateOffboarding(input: {
  organizationId: string;
  membershipId: string;
  actorMembershipId: string | null;
  departureType: DepartureType;
  finalDay: Date;
  effectiveDate?: Date;
  workState?: string | null;
  reasonPrivate?: string | null;
  noteToEmployee?: string | null;
  notifyEmployee?: boolean;
}) {
  const finalDay = new Date(input.finalDay);
  const effectiveDate = input.effectiveDate ?? finalDay;
  const finalPayDue = stateFinalPayDue(finalDay, input.departureType, input.workState);
  const immediate = effectiveDate <= new Date() || input.departureType !== "voluntary_notice";
  const state = immediate ? "active_offboarding" : "scheduled";
  const accessEndsAt = addDays(finalDay, 90);

  const [record] = await db.insert(employeeOffboardings).values({
    organizationId: input.organizationId,
    membershipId: input.membershipId,
    initiatedByMembershipId: input.actorMembershipId,
    departureType: input.departureType,
    initiatedByType: "admin",
    state,
    effectiveDate,
    finalDay,
    workState: input.workState ?? null,
    reasonPrivate: input.reasonPrivate ?? null,
    noteToEmployee: input.noteToEmployee ?? null,
    notifyEmployee: input.notifyEmployee ?? true,
    accessEndsAt,
    archiveAfter: accessEndsAt,
    finalPayDueAt: finalPayDue,
    retentionPolicy: { payroll_years: 7, post_departure_access_days: 90 }
  }).returning();

  await db.insert(offboardingChecklistItems).values(defaultChecklist.map((title, index) => ({
    organizationId: input.organizationId,
    offboardingId: record.id,
    title,
    category: index < 2 ? "people" : index < 5 ? "operations" : "access",
    dueAt: index === 7 ? finalPayDue : finalDay,
    sortOrder: index
  })));

  await db.insert(offboardingEvents).values({
    organizationId: input.organizationId,
    offboardingId: record.id,
    actorMembershipId: input.actorMembershipId,
    eventType: "offboarding.initiated",
    toState: state,
    message: `${input.departureType.replaceAll("_", " ")} offboarding initiated`,
    metadata: { final_day: finalDay.toISOString(), final_pay_due: finalPayDue.toISOString() }
  });

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.actorMembershipId,
    action: "employee.offboarding_initiated",
    targetType: "membership",
    targetId: input.membershipId,
    after: record
  });

  return record;
}

export async function completeChecklistItem(input: { organizationId: string; offboardingId: string; itemId: string; actorMembershipId: string | null; note?: string | null }) {
  const [item] = await db.update(offboardingChecklistItems).set({
    completedAt: new Date(),
    completedByMembershipId: input.actorMembershipId,
    note: input.note ?? null
  }).where(and(eq(offboardingChecklistItems.id, input.itemId), eq(offboardingChecklistItems.organizationId, input.organizationId))).returning();

  await db.insert(offboardingEvents).values({
    organizationId: input.organizationId,
    offboardingId: input.offboardingId,
    actorMembershipId: input.actorMembershipId,
    eventType: "checklist.completed",
    message: item?.title ?? "Checklist item completed"
  });
}

export async function generateFinalPay(input: { organizationId: string; offboardingId: string; actorMembershipId: string | null }) {
  const detail = await getOffboardingDetail(input.organizationId, input.offboardingId);
  if (!detail) throw new Error("Offboarding record not found.");
  const { record } = detail;
  const finalDayEnd = new Date(`${record.finalDay.toISOString().slice(0, 10)}T23:59:59`);

  const [hoursRow] = await db
    .select({
      seconds: sql<number>`coalesce(sum(${timeEntries.durationSeconds}), 0)`
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.organizationId, input.organizationId), eq(timeEntries.membershipId, record.membershipId), lte(timeEntries.startedAt, finalDayEnd), isNull(timeEntries.deletedAt)));

  const totalHours = Number(hoursRow?.seconds ?? 0) / 3600;
  const regularHours = Math.min(totalHours, 40);
  const overtimeHours = Math.max(0, totalHours - 40);
  const regularPayCents = Math.round(regularHours * record.payRateCents);
  const overtimePayCents = Math.round(overtimeHours * record.payRateCents * 1.5);

  const balances = await db
    .select({
      categoryName: ptoCategories.name,
      isPaid: ptoCategories.isPaid,
      accrued: ptoBalances.accruedHours,
      used: ptoBalances.usedHours,
      pending: ptoBalances.pendingHours,
      adjusted: ptoBalances.adjustedHours
    })
    .from(ptoBalances)
    .innerJoin(ptoCategories, eq(ptoCategories.id, ptoBalances.categoryId))
    .where(and(eq(ptoBalances.organizationId, input.organizationId), eq(ptoBalances.membershipId, record.membershipId)));

  const ptoPayouts = balances.map((balance) => {
    const available = Number(balance.accrued) + Number(balance.adjusted) - Number(balance.used) - Number(balance.pending);
    const payableHours = balance.isPaid && ["Vacation", "Personal"].includes(balance.categoryName) ? Math.max(0, available) : 0;
    return {
      category: balance.categoryName,
      hours: payableHours,
      amount_cents: Math.round(payableHours * record.payRateCents),
      note: payableHours > 0 ? "paid out by policy" : "not paid out by policy"
    };
  });
  const ptoPayoutCents = ptoPayouts.reduce((sum, payout) => sum + payout.amount_cents, 0);
  const totalCents = regularPayCents + overtimePayCents + ptoPayoutCents;
  const compliance = {
    required_pay_by: record.finalPayDueAt?.toISOString() ?? null,
    vacation_payout_reviewed: true,
    notes: record.finalPayDueAt && record.finalPayDueAt < new Date() ? "Final pay deadline is overdue." : "Final pay deadline is tracked."
  };

  const [payRecord] = await db.insert(offboardingFinalPayRecords).values({
    organizationId: input.organizationId,
    offboardingId: input.offboardingId,
    membershipId: record.membershipId,
    regularHours: regularHours.toFixed(2),
    overtimeHours: overtimeHours.toFixed(2),
    regularPayCents,
    overtimePayCents,
    ptoPayoutCents,
    totalCents,
    breakdown: { pto_payouts: ptoPayouts },
    compliance
  }).returning();

  await db.update(employeeOffboardings).set({
    state: "finalizing",
    finalPaySnapshot: { final_pay_record_id: payRecord.id, total_cents: totalCents, generated_at: new Date().toISOString() },
    updatedAt: new Date()
  }).where(eq(employeeOffboardings.id, input.offboardingId));

  await db.insert(offboardingEvents).values({
    organizationId: input.organizationId,
    offboardingId: input.offboardingId,
    actorMembershipId: input.actorMembershipId,
    eventType: "final_pay.generated",
    fromState: record.state,
    toState: "finalizing",
    message: `Final pay generated: ${(totalCents / 100).toFixed(2)}`,
    metadata: { total_cents: totalCents }
  });

  return payRecord;
}

export async function approveFinalPay(input: { organizationId: string; offboardingId: string; actorMembershipId: string | null }) {
  const detail = await getOffboardingDetail(input.organizationId, input.offboardingId);
  if (!detail?.finalPay) throw new Error("Generate final pay before approval.");

  await db.update(offboardingFinalPayRecords).set({
    status: "approved",
    approvedAt: new Date(),
    approvedByMembershipId: input.actorMembershipId
  }).where(eq(offboardingFinalPayRecords.id, detail.finalPay.id));

  await db.update(employeeOffboardings).set({
    state: "completed",
    finalPayApprovedAt: new Date(),
    finalPayApprovedByMembershipId: input.actorMembershipId,
    completedAt: new Date(),
    updatedAt: new Date()
  }).where(eq(employeeOffboardings.id, input.offboardingId));

  await db.update(memberships).set({ status: "offboarded" }).where(eq(memberships.id, detail.record.membershipId));

  await db.insert(offboardingEvents).values({
    organizationId: input.organizationId,
    offboardingId: input.offboardingId,
    actorMembershipId: input.actorMembershipId,
    eventType: "final_pay.approved",
    fromState: detail.record.state,
    toState: "completed",
    message: "Final pay approved and employee marked offboarded"
  });
}

export async function getEligibleOffboardingMembers(organizationId: string) {
  return db
    .select({
      id: memberships.id,
      role: memberships.role,
      payRateCents: memberships.payRateCents,
      name: profiles.fullName,
      email: profiles.email
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(and(eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt), inArray(memberships.status, ["active", "invited"])));
}
