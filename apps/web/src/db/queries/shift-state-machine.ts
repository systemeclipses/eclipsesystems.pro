import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, punches, shifts, timeEntries } from "@/src/db/schema";
import { getAssignedGeofences, type PunchDevice, type PunchLocation } from "./time-entries";
import { runPerHourAccrualsForShift } from "./pto-accrual";

export type ShiftState = "CLOCKED_OUT" | "CLOCKED_IN" | "ON_BREAK" | "PENDING_REVIEW" | "LOCKED";
export type PunchEvent = "CLOCK_IN" | "CLOCK_OUT" | "START_BREAK" | "END_BREAK" | "AUTO_CLOCK_OUT" | "MANAGER_CORRECTION" | "FLAG_FOR_REVIEW" | "RESOLVE_FLAG" | "LOCK_PAY_PERIOD" | "UNLOCK_PAY_PERIOD";

type PunchPayload = {
  userId: string;
  organizationId: string;
  membershipId: string;
  timestamp?: Date;
  location?: PunchLocation | null;
  siteId?: string | null;
  note?: string | null;
  deviceInfo?: PunchDevice | null;
  requestId?: string | null;
  reason?: string | null;
  actorType?: "user" | "manager" | "admin" | "system";
  flagReason?: string | null;
};

const TRANSITIONS: Record<ShiftState, Partial<Record<PunchEvent, ShiftState>>> = {
  CLOCKED_OUT: {
    CLOCK_IN: "CLOCKED_IN",
    MANAGER_CORRECTION: "CLOCKED_OUT",
    FLAG_FOR_REVIEW: "PENDING_REVIEW",
    LOCK_PAY_PERIOD: "LOCKED"
  },
  CLOCKED_IN: {
    CLOCK_OUT: "CLOCKED_OUT",
    START_BREAK: "ON_BREAK",
    AUTO_CLOCK_OUT: "PENDING_REVIEW",
    MANAGER_CORRECTION: "CLOCKED_IN",
    FLAG_FOR_REVIEW: "PENDING_REVIEW"
  },
  ON_BREAK: {
    END_BREAK: "CLOCKED_IN",
    CLOCK_OUT: "CLOCKED_OUT",
    AUTO_CLOCK_OUT: "PENDING_REVIEW",
    MANAGER_CORRECTION: "ON_BREAK",
    FLAG_FOR_REVIEW: "PENDING_REVIEW"
  },
  PENDING_REVIEW: {
    RESOLVE_FLAG: "CLOCKED_OUT",
    MANAGER_CORRECTION: "PENDING_REVIEW",
    LOCK_PAY_PERIOD: "LOCKED"
  },
  LOCKED: {
    UNLOCK_PAY_PERIOD: "CLOCKED_OUT"
  }
};

function eventToPunchType(event: PunchEvent) {
  const punchTypes = {
    CLOCK_IN: "clock_in",
    CLOCK_OUT: "clock_out",
    START_BREAK: "break_start",
    END_BREAK: "break_end",
    AUTO_CLOCK_OUT: "auto_clock_out",
    MANAGER_CORRECTION: "manager_correction",
    FLAG_FOR_REVIEW: "flag_for_review",
    RESOLVE_FLAG: "resolve_flag",
    LOCK_PAY_PERIOD: "manager_correction",
    UNLOCK_PAY_PERIOD: "manager_correction"
  } as const satisfies Record<PunchEvent, "clock_in" | "clock_out" | "break_start" | "break_end" | "auto_clock_out" | "manager_correction" | "flag_for_review" | "resolve_flag">;

  return punchTypes[event];
}

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

async function getCurrentShift(organizationId: string, membershipId: string) {
  const [shift] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.organizationId, organizationId), eq(shifts.membershipId, membershipId), isNull(shifts.deletedAt)))
    .orderBy(desc(shifts.createdAt))
    .limit(1);

  if (!shift || shift.state === "CLOCKED_OUT") return null;
  return shift;
}

async function runGuards(event: PunchEvent, payload: PunchPayload, currentShift: Awaited<ReturnType<typeof getCurrentShift>>) {
  if (payload.requestId) {
    const [existing] = await db.select().from(punches).where(eq(punches.requestId, payload.requestId)).limit(1);
    if (existing) return { allowed: false, idempotent: true, existing, reason: "duplicate_request", flags: existing.flags ?? [] };
  }

  if (event === "CLOCK_IN") {
    const assigned = await getAssignedGeofences(payload.membershipId, payload.organizationId);
    if (assigned.length) {
      if (!payload.location || payload.location.accuracy == null || payload.location.accuracy > 100) {
        return { allowed: true, flags: ["gps_unavailable"] };
      }

      const inside = assigned.some((site) => distanceMeters(payload.location!, { latitude: Number(site.latitude), longitude: Number(site.longitude) }) <= site.radiusMeters);
      if (!inside) {
        const warn = assigned.some((site) => site.outOfBoundsBehavior === "warn");
        return warn ? { allowed: true, flags: ["outside_geofence_warn"] } : { allowed: false, reason: "outside_geofence" };
      }
    } else if (!payload.location) {
      return { allowed: true, flags: ["gps_unavailable"] };
    }
  }

  if (event === "CLOCK_OUT" && !currentShift) return { allowed: false, reason: "no_active_shift" };
  if (event === "START_BREAK" && currentShift?.state === "ON_BREAK") return { allowed: false, reason: "already_on_break" };
  if (event === "AUTO_CLOCK_OUT" && payload.actorType !== "system") return { allowed: false, reason: "unauthorized_actor" };
  if (event === "MANAGER_CORRECTION" && !payload.reason) return { allowed: false, reason: "reason_required_for_correction" };

  return { allowed: true, flags: [] as string[] };
}

export async function transitionShift(event: PunchEvent, payload: PunchPayload) {
  const currentShift = await getCurrentShift(payload.organizationId, payload.membershipId);
  const currentState: ShiftState = currentShift?.state ?? "CLOCKED_OUT";
  const nextState = TRANSITIONS[currentState]?.[event];

  if (!nextState) throw new Error(`Cannot ${event} when shift is in state ${currentState}`);

  const guard = await runGuards(event, payload, currentShift);
  if ("idempotent" in guard && guard.idempotent) {
    return { state: guard.existing.newState as ShiftState, punch_id: guard.existing.id, flags: guard.flags ?? [] };
  }
  if (!guard.allowed) throw new Error(guard.reason ?? "Transition guard failed.");

  const timestamp = payload.timestamp ?? new Date();
  const flags = guard.flags ?? [];
  const flaggedNextState = flags.length && nextState !== "CLOCKED_OUT" ? "PENDING_REVIEW" : nextState;

  const [punch] = await db
    .insert(punches)
    .values({
      organizationId: payload.organizationId,
      membershipId: payload.membershipId,
      shiftId: currentShift?.id ?? null,
      requestId: payload.requestId || null,
      type: eventToPunchType(event),
      timestamp,
      location: payload.location ? { ...payload.location, outsideGeofence: flags.some((flag) => flag.includes("geofence")) } : null,
      siteId: payload.siteId || null,
      note: payload.note || payload.reason || null,
      deviceInfo: payload.deviceInfo ?? null,
      previousState: currentState,
      newState: flaggedNextState,
      flags
    })
    .returning();

  let shiftId = currentShift?.id ?? null;
  let timeEntryId = currentShift?.timeEntryId ?? null;

  if (event === "CLOCK_IN") {
    const [entry] = await db
      .insert(timeEntries)
      .values({
        organizationId: payload.organizationId,
        membershipId: payload.membershipId,
        punchNote: payload.note || null,
        startedAt: timestamp,
        startedLocation: payload.location ? { ...payload.location, outsideGeofence: flags.some((flag) => flag.includes("geofence")) } : null,
        deviceInfo: payload.deviceInfo ?? null,
        reviewFlag: flags[0] ?? null,
        source: "timer",
        status: "draft"
      })
      .returning({ id: timeEntries.id });

    timeEntryId = entry.id;
    const [shift] = await db
      .insert(shifts)
      .values({
        organizationId: payload.organizationId,
        membershipId: payload.membershipId,
        timeEntryId,
        state: flaggedNextState,
        startedAt: timestamp,
        flagReason: flags[0] ?? null,
        siteId: payload.siteId || null,
        startPunchId: punch.id
      })
      .returning();
    shiftId = shift.id;
    await db.update(punches).set({ shiftId }).where(eq(punches.id, punch.id));
  } else if (currentShift) {
    const patch: Partial<typeof shifts.$inferInsert> = {
      state: flaggedNextState,
      updatedAt: new Date(),
      flagReason: flags[0] ?? currentShift.flagReason
    };

    if (event === "START_BREAK") patch.currentBreakStartedAt = timestamp;
    if (event === "END_BREAK") patch.currentBreakStartedAt = null;
    if (event === "CLOCK_OUT" || event === "AUTO_CLOCK_OUT" || event === "RESOLVE_FLAG") {
      patch.endedAt = timestamp;
      patch.endPunchId = punch.id;
      if (event === "AUTO_CLOCK_OUT") {
        patch.autoClockedOutAt = new Date();
        patch.autoClockOutRunId = payload.requestId || null;
      }
    }

    await db.update(shifts).set(patch).where(eq(shifts.id, currentShift.id));

    if ((event === "CLOCK_OUT" || event === "AUTO_CLOCK_OUT" || event === "RESOLVE_FLAG") && currentShift.timeEntryId) {
      await db
        .update(timeEntries)
        .set({
          endedAt: timestamp,
          endedLocation: payload.location ? { ...payload.location, outsideGeofence: flags.some((flag) => flag.includes("geofence")) } : null,
          reviewFlag: flags[0] ?? currentShift.flagReason,
          status: "draft"
        })
        .where(eq(timeEntries.id, currentShift.timeEntryId));

      if (event === "CLOCK_OUT") {
        await runPerHourAccrualsForShift({
          organizationId: payload.organizationId,
          membershipId: payload.membershipId,
          shiftId: currentShift.id,
          endedAt: timestamp
        });
      }
    }
  }

  await db.insert(auditLog).values({
    organizationId: payload.organizationId,
    actorMembershipId: payload.membershipId,
    action: event,
    targetType: "punch",
    targetId: punch.id,
    before: { state: currentState, shiftId: currentShift?.id ?? null },
    after: { state: flaggedNextState, shiftId, timeEntryId },
    reason: payload.reason || payload.flagReason || flags[0] || null
  });

  return { state: flaggedNextState, punch_id: punch.id, shift_id: shiftId, time_entry_id: timeEntryId, flags };
}

export async function getCurrentShiftState(organizationId: string, membershipId: string) {
  const shift = await getCurrentShift(organizationId, membershipId);
  if (!shift) return { state: "CLOCKED_OUT" as ShiftState, shift: null };
  return { state: shift.state, shift };
}
