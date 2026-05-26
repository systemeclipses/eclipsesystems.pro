import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { auditTimesheetAction } from "@/src/db/queries/timesheet-actions";

export async function POST(request: Request, { params }: { params: { employeeId: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const body = await request.json().catch(() => ({}));
  await auditTimesheetAction({ organizationId, actorUserId: userId, targetMembershipId: params.employeeId, action: "lock", note: typeof body.note === "string" ? body.note : null });
  return NextResponse.json({ ok: true });
}
