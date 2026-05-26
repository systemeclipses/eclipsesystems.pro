import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { auditTimesheetAction } from "@/src/db/queries/timesheet-actions";

export async function POST(request: Request, { params }: { params: { employeeId: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const body = await request.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) return NextResponse.json({ error: "A note is required when sending back a timesheet." }, { status: 400 });
  await auditTimesheetAction({ organizationId, actorUserId: userId, targetMembershipId: params.employeeId, action: "send_back", note });
  return NextResponse.json({ ok: true });
}
