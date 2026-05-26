import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { initiateOffboarding } from "@/src/db/queries/offboarding";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));

  const membershipId = typeof body.membershipId === "string" ? body.membershipId : "";
  const departureType = typeof body.departureType === "string" ? body.departureType : "voluntary_notice";
  const finalDay = typeof body.finalDay === "string" ? new Date(`${body.finalDay}T12:00:00`) : null;

  if (!membershipId || !finalDay || Number.isNaN(finalDay.getTime())) {
    return NextResponse.json({ error: "Employee and final day are required." }, { status: 400 });
  }

  const record = await initiateOffboarding({
    organizationId,
    membershipId,
    actorMembershipId,
    departureType,
    finalDay,
    effectiveDate: typeof body.effectiveDate === "string" ? new Date(`${body.effectiveDate}T12:00:00`) : finalDay,
    workState: typeof body.workState === "string" ? body.workState : null,
    reasonPrivate: typeof body.reasonPrivate === "string" ? body.reasonPrivate : null,
    noteToEmployee: typeof body.noteToEmployee === "string" ? body.noteToEmployee : null,
    notifyEmployee: body.notifyEmployee !== false
  });

  return NextResponse.json({ record });
}
