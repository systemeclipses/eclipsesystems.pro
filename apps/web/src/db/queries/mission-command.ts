import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/src/db";
import {
  memberships,
  missionAnnouncementAcknowledgments,
  missionAnnouncements,
  missionAuditEvents,
  missionChannels,
  missionMessages,
  missionOpenShiftClaims,
  missionShifts,
  missionTasks,
  profiles,
  ptoRequests
} from "@/src/db/schema";

function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function getMissionCommandOverview(organizationId: string) {
  await ensureMissionDefaults(organizationId);
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  const [members, shifts, ptoBlocks, channels, messages, tasks, announcements, claims] = await Promise.all([
    db
      .select({
        id: memberships.id,
        name: profiles.fullName,
        email: profiles.email,
        role: memberships.role,
        department: memberships.department
      })
      .from(memberships)
      .innerJoin(profiles, eq(profiles.id, memberships.userId))
      .where(and(eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt))),
    db
      .select({
        id: missionShifts.id,
        membershipId: missionShifts.membershipId,
        roleName: missionShifts.roleName,
        startsAt: missionShifts.startsAt,
        endsAt: missionShifts.endsAt,
        status: missionShifts.status,
        expectedPunchStatus: missionShifts.expectedPunchStatus,
        notes: missionShifts.notes,
        employeeName: profiles.fullName,
        employeeEmail: profiles.email
      })
      .from(missionShifts)
      .leftJoin(memberships, eq(memberships.id, missionShifts.membershipId))
      .leftJoin(profiles, eq(profiles.id, memberships.userId))
      .where(and(eq(missionShifts.organizationId, organizationId), isNull(missionShifts.deletedAt), gte(missionShifts.startsAt, weekStart), lte(missionShifts.startsAt, weekEnd)))
      .orderBy(asc(missionShifts.startsAt)),
    db
      .select({
        id: ptoRequests.id,
        membershipId: ptoRequests.membershipId,
        startsAt: ptoRequests.startsAt,
        endsAt: ptoRequests.endsAt,
        status: ptoRequests.status
      })
      .from(ptoRequests)
      .where(and(eq(ptoRequests.organizationId, organizationId), eq(ptoRequests.status, "approved"), gte(ptoRequests.endsAt, weekStart), lte(ptoRequests.startsAt, weekEnd))),
    db.select().from(missionChannels).where(and(eq(missionChannels.organizationId, organizationId), isNull(missionChannels.archivedAt))).orderBy(desc(missionChannels.isPinned), asc(missionChannels.name)),
    db
      .select({
        id: missionMessages.id,
        channelId: missionMessages.channelId,
        body: missionMessages.body,
        sentAt: missionMessages.sentAt,
        senderName: profiles.fullName,
        senderEmail: profiles.email
      })
      .from(missionMessages)
      .leftJoin(memberships, eq(memberships.id, missionMessages.senderMembershipId))
      .leftJoin(profiles, eq(profiles.id, memberships.userId))
      .where(and(eq(missionMessages.organizationId, organizationId), isNull(missionMessages.deletedAt)))
      .orderBy(desc(missionMessages.sentAt))
      .limit(12),
    db
      .select({
        id: missionTasks.id,
        title: missionTasks.title,
        priority: missionTasks.priority,
        dueAt: missionTasks.dueAt,
        completedAt: missionTasks.completedAt,
        assigneeName: profiles.fullName,
        assigneeEmail: profiles.email
      })
      .from(missionTasks)
      .leftJoin(memberships, eq(memberships.id, missionTasks.assigneeMembershipId))
      .leftJoin(profiles, eq(profiles.id, memberships.userId))
      .where(and(eq(missionTasks.organizationId, organizationId), isNull(missionTasks.deletedAt)))
      .orderBy(asc(missionTasks.completedAt), asc(missionTasks.dueAt))
      .limit(24),
    db
      .select({
        id: missionAnnouncements.id,
        title: missionAnnouncements.title,
        body: missionAnnouncements.body,
        requireAcknowledgment: missionAnnouncements.requireAcknowledgment,
        status: missionAnnouncements.status,
        sentAt: missionAnnouncements.sentAt
      })
      .from(missionAnnouncements)
      .where(eq(missionAnnouncements.organizationId, organizationId))
      .orderBy(desc(missionAnnouncements.createdAt))
      .limit(8),
    db.select().from(missionOpenShiftClaims).where(eq(missionOpenShiftClaims.organizationId, organizationId)).orderBy(desc(missionOpenShiftClaims.createdAt)).limit(8)
  ]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const openShifts = shifts.filter((shift) => !shift.membershipId);
  const published = shifts.filter((shift) => shift.status === "published");
  const dueTasks = tasks.filter((task) => !task.completedAt);
  const overdueTasks = dueTasks.filter((task) => task.dueAt && task.dueAt < new Date());

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    days: days.map((day) => day.toISOString()),
    members,
    shifts,
    ptoBlocks,
    channels,
    messages,
    tasks,
    announcements,
    claims,
    stats: {
      publishedShifts: published.length,
      openShifts: openShifts.length,
      dueTasks: dueTasks.length,
      overdueTasks: overdueTasks.length,
      unreadAnnouncements: announcements.filter((announcement) => announcement.requireAcknowledgment).length
    }
  };
}

export async function createMissionShift(input: {
  organizationId: string;
  actorMembershipId: string | null;
  membershipId?: string | null;
  startsAt: Date;
  endsAt: Date;
  roleName?: string | null;
  notes?: string | null;
  publish?: boolean;
}) {
  const conflict = input.membershipId
    ? await db.select({ id: ptoRequests.id }).from(ptoRequests).where(and(
        eq(ptoRequests.organizationId, input.organizationId),
        eq(ptoRequests.membershipId, input.membershipId),
        eq(ptoRequests.status, "approved"),
        or(and(lte(ptoRequests.startsAt, input.startsAt), gte(ptoRequests.endsAt, input.startsAt)), and(lte(ptoRequests.startsAt, input.endsAt), gte(ptoRequests.endsAt, input.endsAt)))
      )).limit(1)
    : [];

  if (conflict.length) throw new Error("Employee has approved PTO during this shift.");

  const [shift] = await db.insert(missionShifts).values({
    organizationId: input.organizationId,
    membershipId: input.membershipId || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    roleName: input.roleName || null,
    notes: input.notes || null,
    status: input.publish ? "published" : "draft",
    publishedAt: input.publish ? new Date() : null,
    createdByMembershipId: input.actorMembershipId
  }).returning();

  await db.insert(missionAuditEvents).values({
    organizationId: input.organizationId,
    actorMembershipId: input.actorMembershipId,
    eventType: input.publish ? "shift.published" : "shift.drafted",
    targetType: "mission_shift",
    targetId: shift.id,
    metadata: { membership_id: input.membershipId ?? null, starts_at: input.startsAt.toISOString() }
  });

  return shift;
}

export async function createMissionMessage(input: { organizationId: string; channelId: string; senderMembershipId: string | null; body: string }) {
  const [message] = await db.insert(missionMessages).values({
    organizationId: input.organizationId,
    channelId: input.channelId,
    senderMembershipId: input.senderMembershipId,
    body: input.body
  }).returning();
  return message;
}

export async function createMissionTask(input: { organizationId: string; actorMembershipId: string | null; title: string; assigneeMembershipId?: string | null; dueAt?: Date | null; priority?: "low" | "normal" | "high" | "urgent" }) {
  const [task] = await db.insert(missionTasks).values({
    organizationId: input.organizationId,
    title: input.title,
    assigneeMembershipId: input.assigneeMembershipId || null,
    dueAt: input.dueAt ?? null,
    priority: input.priority ?? "normal",
    createdByMembershipId: input.actorMembershipId
  }).returning();
  return task;
}

export async function completeMissionTask(input: { organizationId: string; taskId: string; membershipId: string | null; note?: string | null }) {
  await db.update(missionTasks).set({
    completedAt: new Date(),
    completedByMembershipId: input.membershipId,
    completionProof: { note: input.note ?? null }
  }).where(and(eq(missionTasks.id, input.taskId), eq(missionTasks.organizationId, input.organizationId)));
}

export async function createMissionAnnouncement(input: { organizationId: string; actorMembershipId: string | null; title: string; body: string; requireAcknowledgment?: boolean }) {
  const [announcement] = await db.insert(missionAnnouncements).values({
    organizationId: input.organizationId,
    title: input.title,
    body: input.body,
    requireAcknowledgment: input.requireAcknowledgment ?? false,
    status: "sent",
    sentAt: new Date(),
    sentByMembershipId: input.actorMembershipId
  }).returning();
  return announcement;
}

export async function acknowledgeAnnouncement(input: { organizationId: string; announcementId: string; membershipId: string }) {
  await db.insert(missionAnnouncementAcknowledgments).values({
    announcementId: input.announcementId,
    membershipId: input.membershipId
  }).onConflictDoNothing();
}

async function ensureMissionDefaults(organizationId: string) {
  const existing = await db.select({ id: missionChannels.id }).from(missionChannels).where(eq(missionChannels.organizationId, organizationId)).limit(1);
  if (existing.length) return;
  await db.insert(missionChannels).values([
    { organizationId, name: "announcements", type: "announcement", isPinned: true, context: {} },
    { organizationId, name: "general", type: "general", isPinned: true, context: {} },
    { organizationId, name: "today-team", type: "team", isPinned: false, context: { auto: "clocked_in" } }
  ]);
}
