import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import {
  auditLog,
  observabilityIncidents,
  observabilityServiceChecks,
  observabilitySyntheticMonitors,
  securityEvents,
  securitySettings
} from "@/src/db/schema";

const defaultServices = [
  { serviceName: "Timekeeping API", status: "ok", latencyP95Ms: 142, errorRateBasisPoints: 18, saturationBasisPoints: 4100 },
  { serviceName: "Mission Command", status: "ok", latencyP95Ms: 188, errorRateBasisPoints: 22, saturationBasisPoints: 5200 },
  { serviceName: "Invoicing", status: "ok", latencyP95Ms: 164, errorRateBasisPoints: 12, saturationBasisPoints: 3700 },
  { serviceName: "Eclipse Legal", status: "ok", latencyP95Ms: 171, errorRateBasisPoints: 9, saturationBasisPoints: 3400 },
  { serviceName: "Postgres", status: "ok", latencyP95Ms: 48, errorRateBasisPoints: 0, saturationBasisPoints: 6100 }
];

const defaultMonitors = [
  { name: "User can sign in", serviceName: "Authentication", cadenceMinutes: 5, status: "passing", lastDurationMs: 920 },
  { name: "Clock in/out works", serviceName: "Timekeeping", cadenceMinutes: 5, status: "passing", lastDurationMs: 1240 },
  { name: "Submit PTO request", serviceName: "Timekeeping", cadenceMinutes: 15, status: "passing", lastDurationMs: 1180 },
  { name: "Schedule a shift", serviceName: "Mission Command", cadenceMinutes: 15, status: "passing", lastDurationMs: 1640 },
  { name: "Generate invoice", serviceName: "Invoicing", cadenceMinutes: 15, status: "passing", lastDurationMs: 1410 }
];

export async function getSecurityObservabilityOverview(organizationId: string) {
  const [settingsRow, auditCountRows, eventRows, serviceRows, monitorRows, incidentRows] = await Promise.all([
    db.select().from(securitySettings).where(eq(securitySettings.organizationId, organizationId)).limit(1),
    db.select({ value: count() }).from(auditLog).where(eq(auditLog.organizationId, organizationId)),
    db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.organizationId, organizationId))
      .orderBy(desc(securityEvents.occurredAt))
      .limit(8),
    db
      .select()
      .from(observabilityServiceChecks)
      .where(eq(observabilityServiceChecks.environment, "production"))
      .orderBy(desc(observabilityServiceChecks.checkedAt))
      .limit(8),
    db
      .select()
      .from(observabilitySyntheticMonitors)
      .orderBy(desc(observabilitySyntheticMonitors.lastRunAt))
      .limit(8),
    db
      .select()
      .from(observabilityIncidents)
      .where(and(eq(observabilityIncidents.status, "investigating")))
      .orderBy(desc(observabilityIncidents.startedAt))
      .limit(5)
  ]);

  return {
    settings: settingsRow[0] ?? null,
    auditCount: auditCountRows[0]?.value ?? 0,
    securityEvents: eventRows,
    services: serviceRows.length ? serviceRows : defaultServices,
    monitors: monitorRows.length ? monitorRows : defaultMonitors,
    incidents: incidentRows
  };
}
