import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, geofenceAssignments, geofences, memberships, shifts, timeEntries } from "@/src/db/schema";

export type PunchLocation = { latitude: number; longitude: number; accuracy?: number | null; offline?: boolean };
export type PunchDevice = { userAgent?: string | null; platform?: string | null; offline?: boolean };

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

export async function getMembershipForUser(userId: string, organizationId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt)))
    .limit(1);

  return membership ?? null;
}

export async function getRunningTimeEntryForUser(userId: string, organizationId: string) {
  const membership = await getMembershipForUser(userId, organizationId);
  if (!membership) return null;

  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.organizationId, organizationId),
        eq(timeEntries.membershipId, membership.id),
        isNull(timeEntries.endedAt),
        isNull(timeEntries.deletedAt)
      )
    )
    .limit(1);

  return entry ?? null;
}

export async function reconcileStaleRunningTimeEntries(input: {
  organizationId: string;
  membershipId: string;
}) {
  const [activeShift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(
      and(
        eq(shifts.organizationId, input.organizationId),
        eq(shifts.membershipId, input.membershipId),
        isNull(shifts.deletedAt),
        ne(shifts.state, "CLOCKED_OUT")
      )
    )
    .limit(1);

  if (activeShift) return [];

  const runningEntries = await db
    .select({
      id: timeEntries.id,
      startedAt: timeEntries.startedAt
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.organizationId, input.organizationId),
        eq(timeEntries.membershipId, input.membershipId),
        isNull(timeEntries.endedAt),
        isNull(timeEntries.deletedAt)
      )
    );

  if (!runningEntries.length) return [];

  const [latestCompletedShift] = await db
    .select({ endedAt: shifts.endedAt })
    .from(shifts)
    .where(
      and(
        eq(shifts.organizationId, input.organizationId),
        eq(shifts.membershipId, input.membershipId),
        eq(shifts.state, "CLOCKED_OUT"),
        isNull(shifts.deletedAt)
      )
    )
    .orderBy(desc(shifts.createdAt))
    .limit(1);

  const reconciled = [];
  for (const entry of runningEntries) {
    const endedAt = latestCompletedShift?.endedAt && latestCompletedShift.endedAt > entry.startedAt
      ? latestCompletedShift.endedAt
      : new Date();
    const [updated] = await db
      .update(timeEntries)
      .set({
        endedAt
      })
      .where(eq(timeEntries.id, entry.id))
      .returning({ id: timeEntries.id });
    reconciled.push(updated);
  }

  return reconciled;
}

export async function getAssignedGeofences(membershipId: string, organizationId: string) {
  return db
    .select({
      id: geofences.id,
      name: geofences.name,
      address: geofences.address,
      latitude: geofences.latitude,
      longitude: geofences.longitude,
      radiusMeters: geofences.radiusMeters,
      outOfBoundsBehavior: geofences.outOfBoundsBehavior
    })
    .from(geofenceAssignments)
    .innerJoin(geofences, eq(geofences.id, geofenceAssignments.geofenceId))
    .where(and(eq(geofenceAssignments.membershipId, membershipId), eq(geofences.organizationId, organizationId), isNull(geofences.deletedAt)));
}

async function evaluateGeofence(input: { organizationId: string; membershipId: string; location?: PunchLocation | null }) {
  const assigned = await getAssignedGeofences(input.membershipId, input.organizationId);
  if (!assigned.length) return { allowed: true, reviewFlag: null as string | null, outsideGeofence: false };
  if (!input.location) return { allowed: true, reviewFlag: "gps_unavailable", outsideGeofence: false };

  const inside = assigned.some((site) => {
    const siteLocation = { latitude: Number(site.latitude), longitude: Number(site.longitude) };
    return distanceMeters(input.location!, siteLocation) <= site.radiusMeters;
  });

  if (inside) return { allowed: true, reviewFlag: null, outsideGeofence: false };
  const warnOnly = assigned.some((site) => site.outOfBoundsBehavior === "warn");
  return { allowed: warnOnly, reviewFlag: "outside_geofence", outsideGeofence: true };
}

export async function startTimerForUser(input: {
  userId: string;
  organizationId: string;
  membershipId: string;
  projectId?: string | null;
  description?: string | null;
  punchNote?: string | null;
  location?: PunchLocation | null;
  deviceInfo?: PunchDevice | null;
}) {
  const running = await getRunningTimeEntryForUser(input.userId, input.organizationId);
  if (running) throw new Error("You are already clocked in.");

  const geofenceResult = await evaluateGeofence(input);
  if (!geofenceResult.allowed) throw new Error("You must be inside an assigned job-site geofence to clock in.");

  const [entry] = await db
    .insert(timeEntries)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      projectId: input.projectId || null,
      description: input.description || null,
      punchNote: input.punchNote || null,
      startedAt: new Date(),
      startedLocation: input.location ? { ...input.location, outsideGeofence: geofenceResult.outsideGeofence } : null,
      deviceInfo: input.deviceInfo ?? null,
      reviewFlag: geofenceResult.reviewFlag,
      source: "timer",
      status: "draft"
    })
    .returning({
      id: timeEntries.id,
      description: timeEntries.description,
      startedAt: timeEntries.startedAt
    });

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.membershipId,
    action: "punch.clock_in",
    targetType: "time_entry",
    targetId: entry.id,
    after: entry
  });

  return entry;
}

export async function stopTimerForUser(input: {
  userId: string;
  organizationId: string;
  membershipId: string;
  entryId: string;
  punchNote?: string | null;
  location?: PunchLocation | null;
  deviceInfo?: PunchDevice | null;
}) {
  const [before] = await db.select().from(timeEntries).where(and(eq(timeEntries.id, input.entryId), eq(timeEntries.organizationId, input.organizationId), eq(timeEntries.membershipId, input.membershipId))).limit(1);
  if (!before) throw new Error("Running entry not found.");

  const endedAt = new Date();
  const geofenceResult = await evaluateGeofence(input);

  const [after] = await db
    .update(timeEntries)
    .set({
      endedAt,
      endedLocation: input.location ? { ...input.location, outsideGeofence: geofenceResult.outsideGeofence } : null,
      punchNote: input.punchNote || before.punchNote,
      deviceInfo: input.deviceInfo || before.deviceInfo,
      reviewFlag: before.reviewFlag ?? geofenceResult.reviewFlag,
      status: before.status
    })
    .where(and(eq(timeEntries.id, input.entryId), eq(timeEntries.organizationId, input.organizationId), eq(timeEntries.membershipId, input.membershipId)))
    .returning();

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.membershipId,
    action: "punch.clock_out",
    targetType: "time_entry",
    targetId: input.entryId,
    before,
    after
  });
}

export async function getTimesheetEntriesForUser(userId: string, organizationId: string) {
  return db
    .select({
      id: timeEntries.id,
      description: timeEntries.description,
      punch_note: timeEntries.punchNote,
      started_at: timeEntries.startedAt,
      ended_at: timeEntries.endedAt,
      duration_seconds: timeEntries.durationSeconds,
      review_flag: timeEntries.reviewFlag,
      status: timeEntries.status
    })
    .from(timeEntries)
    .innerJoin(memberships, eq(memberships.id, timeEntries.membershipId))
    .where(and(eq(timeEntries.organizationId, organizationId), eq(memberships.userId, userId), isNull(timeEntries.deletedAt)))
    .orderBy(desc(timeEntries.startedAt));
}

export async function createManualTimeEntryForUser(input: {
  organizationId: string;
  membershipId: string;
  projectId?: string | null;
  description?: string | null;
  startedAt: Date;
  endedAt: Date;
  reason?: string | null;
}) {
  const durationSeconds = Math.max(0, Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000));
  const [entry] = await db
    .insert(timeEntries)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      projectId: input.projectId || null,
      description: input.description || null,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      punchNote: input.reason || null,
      source: "manual",
      status: "draft"
    })
    .returning({ id: timeEntries.id });

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: input.membershipId,
    action: "time_entry.manual_create",
    targetType: "time_entry",
    targetId: entry.id,
    after: { ...input, id: entry.id, durationSeconds },
    reason: input.reason || null
  });

  return entry;
}

export function getTimeEntrySeconds(entry: { started_at: Date; ended_at: Date | null; duration_seconds: number | null }) {
  if (entry.duration_seconds !== null) return entry.duration_seconds;
  if (!entry.ended_at) return Math.max(0, Math.floor((Date.now() - entry.started_at.getTime()) / 1000));
  return Math.max(0, Math.floor((entry.ended_at.getTime() - entry.started_at.getTime()) / 1000));
}
