import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { db } from "@/src/db";
import { memberships } from "@/src/db/schema";
import { calculateTimesheetForMembership } from "@/src/db/queries/timekeeping";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { getTimekeepingSettings } from "@/src/db/queries/timekeeping-settings";

export async function GET(_request: Request, { params }: { params: { employeeId: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const ownMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!ownMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const [actor] = await db.select({ role: memberships.role }).from(memberships).where(eq(memberships.id, ownMembershipId)).limit(1);
  const requestedMembershipId = params.employeeId === "me" ? ownMembershipId : params.employeeId;
  const canView = requestedMembershipId === ownMembershipId || ["superuser", "owner", "admin", "manager"].includes(actor?.role ?? "");
  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getTimekeepingSettings(organizationId);
  const timesheet = await calculateTimesheetForMembership({ organizationId, membershipId: requestedMembershipId, settings });
  return NextResponse.json(timesheet);
}
