import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { getCurrentShiftState } from "@/src/db/queries/shift-state-machine";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const current = await getCurrentShiftState(organizationId, membershipId);
  return NextResponse.json({
    state: current.state,
    shift_start: current.shift?.startedAt?.toISOString() ?? null,
    current_break_start: current.shift?.currentBreakStartedAt?.toISOString() ?? null,
    flags: current.shift?.flagReason ? [current.shift.flagReason] : []
  });
}
