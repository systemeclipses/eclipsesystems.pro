import { and, asc, inArray, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, shifts } from "@/src/db/schema";
import { getTimekeepingSettings, type TimekeepingSettings } from "./timekeeping-settings";
import { transitionShift } from "./shift-state-machine";

type AutoClockOutStats = {
  candidates_found: number;
  processed: number;
  skipped: number;
  errors: number;
};

function thresholdFor(settings: TimekeepingSettings) {
  return Math.max(1, settings.payRules.autoClockOut.thresholdHours || 16);
}

function syntheticEndTime(shift: typeof shifts.$inferSelect, settings: TimekeepingSettings) {
  const config = settings.payRules.autoClockOut;
  if (config.syntheticEndStrategy === "shift_start_plus_8") {
    return new Date(shift.startedAt.getTime() + 8 * 60 * 60 * 1000);
  }
  return new Date(shift.startedAt.getTime() + thresholdFor(settings) * 60 * 60 * 1000);
}

async function evaluateShift(shift: typeof shifts.$inferSelect, settings: TimekeepingSettings) {
  const config = settings.payRules.autoClockOut;
  if (!config.enabled) return "skip" as const;
  if (shift.autoClockedOutAt || shift.state === "PENDING_REVIEW") return "skip" as const;
  const thresholdMs = thresholdFor(settings) * 60 * 60 * 1000;
  return Date.now() - shift.startedAt.getTime() >= thresholdMs ? "auto_clock_out" as const : "skip" as const;
}

export async function runAutoClockOut(runId: string) {
  const stats: AutoClockOutStats = { candidates_found: 0, processed: 0, skipped: 0, errors: 0 };
  const candidates = await db
    .select()
    .from(shifts)
    .where(and(inArray(shifts.state, ["CLOCKED_IN", "ON_BREAK"]), isNull(shifts.deletedAt), isNull(shifts.autoClockedOutAt)))
    .orderBy(asc(shifts.id))
    .limit(100);

  stats.candidates_found = candidates.length;

  for (const shift of candidates) {
    try {
      const settings = await getTimekeepingSettings(shift.organizationId);
      const action = await evaluateShift(shift, settings);
      if (action === "skip") {
        stats.skipped++;
        continue;
      }

      const threshold = thresholdFor(settings);
      const timestamp = syntheticEndTime(shift, settings);
      await transitionShift("AUTO_CLOCK_OUT", {
        userId: shift.membershipId,
        organizationId: shift.organizationId,
        membershipId: shift.membershipId,
        timestamp,
        siteId: shift.siteId,
        note: `Auto clock-out: shift exceeded ${threshold}h threshold. Synthetic end time requires manager review.`,
        requestId: `auto-clock-out:${shift.id}`,
        actorType: "system",
        flagReason: "auto_clock_out_after_threshold"
      });

      await db.insert(auditLog).values({
        organizationId: shift.organizationId,
        actorMembershipId: shift.membershipId,
        action: "auto_clock_out.notification_queued",
        targetType: "shift",
        targetId: shift.id,
        after: {
          notifyManager: settings.payRules.autoClockOut.notifyManager,
          notifyEmployee: settings.payRules.autoClockOut.notifyEmployee,
          thresholdHours: threshold
        }
      });

      stats.processed++;
    } catch (error) {
      stats.errors++;
      await db.insert(auditLog).values({
        organizationId: shift.organizationId,
        actorMembershipId: shift.membershipId,
        action: "auto_clock_out.shift_failed",
        targetType: "shift",
        targetId: shift.id,
        after: { error: error instanceof Error ? error.message : String(error), runId }
      });
    }
  }

  return stats;
}
