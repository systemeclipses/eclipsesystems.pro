import { and, eq, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, memberships, ptoBalances, ptoRequests } from "@/src/db/schema";
import { validatePtoRequest, type ValidationResult } from "./pto-validation";

export type PtoRequestState = "draft" | "pending" | "needs_revision" | "approved" | "denied" | "cancelled" | "revoked" | "completed";
export type PtoRequestEvent = "SUBMIT" | "APPROVE" | "DENY" | "SEND_BACK" | "RESUBMIT" | "CANCEL" | "REVOKE" | "AUTO_COMPLETE" | "AUTO_DENY";

type TransitionPayload = {
  note?: string | null;
  reason?: string | null;
  overrideValidationFailures?: boolean;
};

type TransitionContext = {
  organizationId: string;
  actorMembershipId: string | null;
  actorRole?: string | null;
};

const TRANSITIONS: Record<PtoRequestState, Partial<Record<PtoRequestEvent, PtoRequestState>>> = {
  draft: { SUBMIT: "pending", CANCEL: "cancelled" },
  pending: { APPROVE: "approved", DENY: "denied", SEND_BACK: "needs_revision", CANCEL: "cancelled", AUTO_DENY: "denied" },
  needs_revision: { RESUBMIT: "pending", CANCEL: "cancelled" },
  approved: { CANCEL: "cancelled", REVOKE: "revoked", AUTO_COMPLETE: "completed" },
  denied: {},
  cancelled: {},
  revoked: {},
  completed: {}
};

function isAdmin(role?: string | null) {
  return role === "superuser" || role === "owner" || role === "admin";
}

function isManager(role?: string | null) {
  return isAdmin(role) || role === "manager";
}

function numeric(value: string | number) {
  return Number(value).toFixed(2);
}

async function getActorRole(actorMembershipId: string | null, organizationId: string) {
  if (!actorMembershipId) return null;
  const [actor] = await db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.id, actorMembershipId), eq(memberships.organizationId, organizationId))).limit(1);
  return actor?.role ?? null;
}

async function checkPermission(event: PtoRequestEvent, request: typeof ptoRequests.$inferSelect, context: TransitionContext) {
  const actorRole = context.actorRole ?? await getActorRole(context.actorMembershipId, context.organizationId);
  const actorIsEmployee = context.actorMembershipId === request.membershipId;

  if (event === "AUTO_COMPLETE" || event === "AUTO_DENY") return context.actorMembershipId === null ? null : "system_only_event";
  if (event === "SUBMIT" || event === "RESUBMIT") return actorIsEmployee || isAdmin(actorRole) ? null : "only_employee_or_admin_can_submit";
  if (event === "CANCEL") {
    if (actorIsEmployee && request.status === "approved" && new Date() >= request.startsAt) return "cannot_cancel_after_start";
    return actorIsEmployee || isAdmin(actorRole) ? null : "only_employee_or_admin_can_cancel";
  }
  if (event === "APPROVE" || event === "DENY" || event === "SEND_BACK") {
    if (actorIsEmployee) return "cannot_decide_own_request";
    return isManager(actorRole) ? null : "not_authorized_manager";
  }
  if (event === "REVOKE") {
    if (actorIsEmployee) return "cannot_revoke_own_request";
    return isManager(actorRole) ? null : "not_authorized_to_revoke";
  }
  return null;
}

async function runGuards(event: PtoRequestEvent, request: typeof ptoRequests.$inferSelect, payload: TransitionPayload, context: TransitionContext) {
  if (event === "SEND_BACK" && !payload.note?.trim()) return { allowed: false, reason: "send_back_requires_note" };
  if (event === "REVOKE") {
    if (!payload.reason?.trim() && !payload.note?.trim()) return { allowed: false, reason: "revoke_requires_reason" };
    if (new Date() >= request.startsAt) return { allowed: false, reason: "cannot_revoke_after_start" };
  }

  if (event === "APPROVE" || event === "SUBMIT" || event === "RESUBMIT") {
    const validation = await validatePtoRequest({
      categoryId: request.categoryId,
      startsAt: request.startsAt,
      endsAt: request.endsAt,
      hours: request.hours,
      employeeNote: request.employeeNote
    }, { organizationId: context.organizationId, membershipId: request.membershipId, existingRequestId: request.id });

    if (!validation.valid && !(event === "APPROVE" && payload.overrideValidationFailures)) {
      return { allowed: false, reason: event === "APPROVE" ? "conditions_changed_since_submission" : "validation_failed", validation };
    }
    return { allowed: true, validation };
  }

  return { allowed: true, validation: null as ValidationResult | null };
}

async function adjustBalance(request: typeof ptoRequests.$inferSelect, patch: { pending?: number; used?: number }) {
  await db
    .insert(ptoBalances)
    .values({
      organizationId: request.organizationId,
      membershipId: request.membershipId,
      categoryId: request.categoryId,
      pendingHours: numeric(patch.pending ?? 0),
      usedHours: numeric(patch.used ?? 0)
    })
    .onConflictDoUpdate({
      target: [ptoBalances.membershipId, ptoBalances.categoryId],
      set: {
        pendingHours: sql`greatest(${ptoBalances.pendingHours} + ${numeric(patch.pending ?? 0)}, 0)`,
        usedHours: sql`greatest(${ptoBalances.usedHours} + ${numeric(patch.used ?? 0)}, 0)`,
        updatedAt: new Date()
      }
    });
}

async function runSideEffects(event: PtoRequestEvent, previous: typeof ptoRequests.$inferSelect, next: typeof ptoRequests.$inferSelect) {
  const hours = Number(previous.hours);
  if (event === "SUBMIT" || event === "RESUBMIT") await adjustBalance(next, { pending: hours });
  if (event === "APPROVE") await adjustBalance(next, { pending: -hours, used: hours });
  if (event === "DENY" || event === "SEND_BACK" || event === "AUTO_DENY") await adjustBalance(next, { pending: -hours });
  if (event === "CANCEL" && previous.status === "pending") await adjustBalance(next, { pending: -hours });
  if (event === "CANCEL" && previous.status === "approved") await adjustBalance(next, { used: -hours });
  if (event === "REVOKE") await adjustBalance(next, { used: -hours });
}

export async function transitionPtoRequest(requestId: string, event: PtoRequestEvent, payload: TransitionPayload, context: TransitionContext) {
  const [before] = await db.select().from(ptoRequests).where(and(eq(ptoRequests.id, requestId), eq(ptoRequests.organizationId, context.organizationId))).limit(1);
  if (!before) throw new Error("PTO request not found.");

  const currentState = before.status as PtoRequestState;
  const nextState = TRANSITIONS[currentState]?.[event];
  if (!nextState) throw new Error(`Cannot ${event} a PTO request in state ${currentState}.`);

  const permissionReason = await checkPermission(event, before, context);
  if (permissionReason) throw new Error(permissionReason);

  const guard = await runGuards(event, before, payload, context);
  if (!guard.allowed) {
    const error = new Error(guard.reason);
    Object.assign(error, { validation: guard.validation });
    throw error;
  }

  const isDecision = event === "APPROVE" || event === "DENY" || event === "SEND_BACK" || event === "REVOKE" || event === "AUTO_DENY";
  const [after] = await db
    .update(ptoRequests)
    .set({
      status: nextState,
      managerNote: payload.note ?? before.managerNote,
      decidedByMembershipId: isDecision ? context.actorMembershipId : before.decidedByMembershipId,
      decidedAt: isDecision || nextState === "cancelled" || nextState === "completed" ? new Date() : before.decidedAt
    })
    .where(eq(ptoRequests.id, requestId))
    .returning();

  await runSideEffects(event, before, after);

  await db.insert(auditLog).values({
    organizationId: context.organizationId,
    actorMembershipId: context.actorMembershipId,
    action: `pto.workflow.${event.toLowerCase()}`,
    targetType: "pto_request",
    targetId: requestId,
    before: { request: before, state: currentState },
    after: { request: after, state: nextState, validation: guard.validation },
    reason: payload.reason || payload.note || null
  });

  return { request: after, state: nextState, validation: guard.validation };
}

export async function bulkApprovePtoRequests(input: { organizationId: string; actorMembershipId: string; actorRole?: string | null; requestIds: string[]; note?: string | null }) {
  const results = await Promise.allSettled(input.requestIds.map((id) => transitionPtoRequest(id, "APPROVE", { note: input.note ?? null }, input)));
  return {
    succeeded: results.filter((result) => result.status === "fulfilled").length,
    failed: results.flatMap((result, index) => result.status === "rejected" ? [{ id: input.requestIds[index], reason: result.reason instanceof Error ? result.reason.message : "Unable to approve." }] : [])
  };
}
