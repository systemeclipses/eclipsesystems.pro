import { and, eq, isNull } from "drizzle-orm";
import { portalSeedData, type StaffShift, type PortalViewer } from "@/lib/operations-portal-data";
import { scopedEmployeeIds } from "@/lib/operations-permissions";
import { withServerDb } from "@/src/db/session";
import { operationsPortalShifts, organizations } from "@/src/db/schema";

function viewerForRole(role: string | null): PortalViewer {
  if (role === "owner" || role === "admin") return { role };
  if (role === "manager") return { role: "manager" };
  return { role: "employee" };
}

function canAccessEmployee(viewer: PortalViewer, employeeId: string | null | undefined) {
  if (!employeeId) return true;
  return scopedEmployeeIds(viewer, portalSeedData.employees).includes(employeeId);
}

function rowToShift(row: typeof operationsPortalShifts.$inferSelect): StaffShift {
  return {
    id: row.id,
    employeeId: row.employeeId ?? undefined,
    swapWithEmployeeId: row.swapWithEmployeeId ?? undefined,
    day: row.day,
    time: row.time,
    site: row.site,
    status: row.status,
    resolvedBy: row.resolvedBy ?? undefined,
    resolvedAt: row.resolvedAt ?? undefined,
    resolutionNote: row.resolutionNote ?? undefined
  };
}

export async function listPersistedPortalShifts() {
  return withServerDb(async (tx, session) => {
    const [organization] = await tx
      .select({ isDemo: organizations.isDemo })
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);
    const rows = await tx
      .select()
      .from(operationsPortalShifts)
      .where(and(eq(operationsPortalShifts.organizationId, session.organizationId), isNull(operationsPortalShifts.deletedAt)));

    return {
      isDemo: organization?.isDemo ?? false,
      shifts: rows.map(rowToShift)
    };
  });
}

export async function createPersistedPortalShift(input: Pick<StaffShift, "employeeId" | "day" | "time" | "site" | "status">) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    if (!canAccessEmployee(viewer, input.employeeId)) throw new Error("You cannot create a shift for that employee.");

    const [row] = await tx
      .insert(operationsPortalShifts)
      .values({
        organizationId: session.organizationId,
        employeeId: input.employeeId ?? null,
        day: input.day,
        time: input.time,
        site: input.site,
        status: input.status
      })
      .returning();

    return rowToShift(row);
  });
}

export async function claimPersistedPortalShift(input: { shiftId: string; employeeId: string }) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    if (!canAccessEmployee(viewer, input.employeeId)) throw new Error("You cannot claim or assign that employee.");

    const [existing] = await tx
      .select()
      .from(operationsPortalShifts)
      .where(and(eq(operationsPortalShifts.id, input.shiftId), eq(operationsPortalShifts.organizationId, session.organizationId), isNull(operationsPortalShifts.deletedAt)))
      .limit(1);

    if (!existing || existing.status !== "open") throw new Error("Open shift not found.");

    const [row] = await tx
      .update(operationsPortalShifts)
      .set({
        employeeId: input.employeeId,
        status: "published",
        resolvedBy: session.role ?? "user",
        resolvedAt: "Just now",
        updatedAt: new Date()
      })
      .where(and(eq(operationsPortalShifts.id, input.shiftId), eq(operationsPortalShifts.organizationId, session.organizationId)))
      .returning();

    return rowToShift(row);
  });
}

export async function updatePersistedPortalShift(input: {
  shiftId: string;
  employeeId?: string | null;
  day?: string;
  time?: string;
  site?: string;
  status?: StaffShift["status"];
}) {
  return withServerDb(async (tx, session) => {
    const viewer = viewerForRole(session.role);
    const [existing] = await tx
      .select()
      .from(operationsPortalShifts)
      .where(and(eq(operationsPortalShifts.id, input.shiftId), eq(operationsPortalShifts.organizationId, session.organizationId), isNull(operationsPortalShifts.deletedAt)))
      .limit(1);

    if (!existing) throw new Error("Shift not found.");
    if (!canAccessEmployee(viewer, existing.employeeId) || !canAccessEmployee(viewer, input.employeeId)) throw new Error("You cannot update that shift.");

    const employeeId = input.employeeId === undefined ? existing.employeeId : input.employeeId;
    const status = input.status ?? (employeeId ? "published" : "open");
    const [row] = await tx
      .update(operationsPortalShifts)
      .set({
        employeeId,
        day: input.day ?? existing.day,
        time: input.time ?? existing.time,
        site: input.site ?? existing.site,
        status,
        resolvedBy: session.role ?? "user",
        resolvedAt: "Just now",
        updatedAt: new Date()
      })
      .where(and(eq(operationsPortalShifts.id, input.shiftId), eq(operationsPortalShifts.organizationId, session.organizationId)))
      .returning();

    return rowToShift(row);
  });
}
