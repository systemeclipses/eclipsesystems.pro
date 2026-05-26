import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, memberships, organizations } from "@/src/db/schema";

export type TimekeepingSettings = {
  payRules: {
    standardWorkweekHours: number;
    overtimeBasis: "weekly" | "daily";
    overtimeThreshold: number;
    overtimeMultiplier: number;
    doubleTimeEnabled: boolean;
    doubleTimeThreshold: number;
    doubleTimeMultiplier: number;
    payPeriod: "weekly" | "bi-weekly" | "semi-monthly" | "monthly";
    payPeriodStartDay: string;
    punchRoundingMinutes: 0 | 1 | 5 | 10 | 15;
    paidBreaks: boolean;
    shiftDifferentialsEnabled: boolean;
    autoClockOut: {
      enabled: boolean;
      thresholdHours: number;
      syntheticEndStrategy: "threshold_time" | "last_location_ping" | "shift_start_plus_8";
      notifyManager: boolean;
      notifyEmployee: boolean;
      perRoleOverrides: Array<{ roleId: string; thresholdHours: number }>;
      perSiteOverrides: Array<{ siteId: string; thresholdHours: number }>;
    };
  };
  visibility: {
    teamCalendar: "off" | "names" | "category" | "full";
    showPayRate: boolean;
    showCoworkerContactInfo: boolean;
    managerCanSeeHomeAddress: boolean;
  };
  notifications: Record<string, { email: boolean; inApp: boolean; push: boolean }>;
  lastEditedBy?: string | null;
  lastEditedAt?: string | null;
};

export const defaultTimekeepingSettings: TimekeepingSettings = {
  payRules: {
    standardWorkweekHours: 40,
    overtimeBasis: "weekly",
    overtimeThreshold: 40,
    overtimeMultiplier: 1.5,
    doubleTimeEnabled: false,
    doubleTimeThreshold: 12,
    doubleTimeMultiplier: 2,
    payPeriod: "weekly",
    payPeriodStartDay: "Monday",
    punchRoundingMinutes: 0,
    paidBreaks: false,
    shiftDifferentialsEnabled: false,
    autoClockOut: {
      enabled: true,
      thresholdHours: 16,
      syntheticEndStrategy: "threshold_time",
      notifyManager: true,
      notifyEmployee: true,
      perRoleOverrides: [],
      perSiteOverrides: []
    }
  },
  visibility: {
    teamCalendar: "names",
    showPayRate: true,
    showCoworkerContactInfo: false,
    managerCanSeeHomeAddress: false
  },
  notifications: {
    ptoSubmitted: { email: true, inApp: true, push: false },
    ptoApproved: { email: true, inApp: true, push: true },
    missedClockOut: { email: true, inApp: true, push: true },
    geofenceViolation: { email: true, inApp: true, push: true },
    overtimeApproaching: { email: true, inApp: true, push: false },
    configChanged: { email: true, inApp: true, push: false }
  }
};

function mergeSettings(value: unknown): TimekeepingSettings {
  const root = value && typeof value === "object" ? (value as { timekeeping?: Partial<TimekeepingSettings> }).timekeeping : undefined;
  return {
    ...defaultTimekeepingSettings,
    ...root,
    payRules: {
      ...defaultTimekeepingSettings.payRules,
      ...root?.payRules,
      autoClockOut: {
        ...defaultTimekeepingSettings.payRules.autoClockOut,
        ...root?.payRules?.autoClockOut
      }
    },
    visibility: { ...defaultTimekeepingSettings.visibility, ...root?.visibility },
    notifications: { ...defaultTimekeepingSettings.notifications, ...root?.notifications }
  };
}

export async function getTimekeepingSettings(organizationId: string) {
  const [organization] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  return mergeSettings(organization?.settings);
}

export async function saveTimekeepingSettings(input: {
  organizationId: string;
  actorUserId: string;
  settings: TimekeepingSettings;
}) {
  const [actor] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.organizationId, input.organizationId), eq(memberships.userId, input.actorUserId), isNull(memberships.deletedAt)))
    .limit(1);

  const [organization] = await db
    .select({ settings: organizations.settings })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  const before = mergeSettings(organization?.settings);
  const next = {
    ...(organization?.settings && typeof organization.settings === "object" ? organization.settings : {}),
    timekeeping: {
      ...input.settings,
      lastEditedBy: input.actorUserId,
      lastEditedAt: new Date().toISOString()
    }
  };

  await db.update(organizations).set({ settings: next, updatedAt: new Date() }).where(eq(organizations.id, input.organizationId));

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: actor?.id ?? null,
    action: "settings.timekeeping_updated",
    targetType: "organization",
    targetId: input.organizationId,
    before,
    after: next.timekeeping
  });

  return mergeSettings(next);
}
