import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { timeEntries } from "@/src/db/schema";

export async function getRunningTimeEntryForUser(userId: string, organizationId: string) {
  const [entry] = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.organizationId, organizationId),
        isNull(timeEntries.endedAt),
        isNull(timeEntries.deletedAt)
      )
    )
    .limit(1);

  return entry ?? null;
}

export async function startTimerForUser(input: {
  userId: string;
  organizationId: string;
  membershipId: string;
  projectId?: string | null;
  description?: string | null;
}) {
  const [entry] = await db
    .insert(timeEntries)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      projectId: input.projectId || null,
      description: input.description || null,
      startedAt: new Date(),
      source: "timer",
      status: "draft"
    })
    .returning({
      id: timeEntries.id,
      description: timeEntries.description,
      startedAt: timeEntries.startedAt
    });

  return entry;
}

export async function stopTimerForUser(userId: string, organizationId: string, entryId: string) {
  await db
    .update(timeEntries)
    .set({ endedAt: new Date() })
    .where(and(eq(timeEntries.id, entryId), eq(timeEntries.organizationId, organizationId)));
}

export async function getTimesheetEntriesForUser(userId: string, organizationId: string) {
  return db
    .select({
      id: timeEntries.id,
      description: timeEntries.description,
      started_at: timeEntries.startedAt,
      ended_at: timeEntries.endedAt,
      duration_seconds: timeEntries.durationSeconds,
      status: timeEntries.status
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.organizationId, organizationId), isNull(timeEntries.deletedAt)))
    .orderBy(desc(timeEntries.startedAt));
}

export async function createManualTimeEntryForUser(input: {
  organizationId: string;
  membershipId: string;
  projectId?: string | null;
  description?: string | null;
  startedAt: Date;
  endedAt: Date;
}) {
  const [entry] = await db
    .insert(timeEntries)
    .values({
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      projectId: input.projectId || null,
      description: input.description || null,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      source: "manual",
      status: "draft"
    })
    .returning({ id: timeEntries.id });

  return entry;
}

export function getTimeEntrySeconds(entry: { started_at: Date; ended_at: Date | null; duration_seconds: number | null }) {
  if (entry.duration_seconds !== null) return entry.duration_seconds;
  if (!entry.ended_at) return Math.max(0, Math.floor((Date.now() - entry.started_at.getTime()) / 1000));
  return Math.max(0, Math.floor((entry.ended_at.getTime() - entry.started_at.getTime()) / 1000));
}
