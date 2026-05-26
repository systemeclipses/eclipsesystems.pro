import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { auditTimesheetAction } from "@/src/db/queries/timesheet-actions";

export async function POST(request: Request, { params }: { params: { employeeId: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const ownMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!ownMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });
  const targetMembershipId = params.employeeId === "me" ? ownMembershipId : params.employeeId;
  if (targetMembershipId !== ownMembershipId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  await auditTimesheetAction({ organizationId, actorUserId: userId, targetMembershipId, action: "submit", note: typeof body.note === "string" ? body.note : null });
  return NextResponse.json({ ok: true });
}
