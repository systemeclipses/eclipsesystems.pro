import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createMissionShift } from "@/src/db/queries/mission-command";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  const startsAt = typeof body.startsAt === "string" ? new Date(body.startsAt) : null;
  const endsAt = typeof body.endsAt === "string" ? new Date(body.endsAt) : null;
  if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: "Valid start and end times are required." }, { status: 400 });
  }
  try {
    const shift = await createMissionShift({
      organizationId,
      actorMembershipId,
      membershipId: typeof body.membershipId === "string" && body.membershipId ? body.membershipId : null,
      startsAt,
      endsAt,
      roleName: typeof body.roleName === "string" ? body.roleName : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      publish: body.publish === true
    });
    return NextResponse.json({ shift });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create shift." }, { status: 400 });
  }
}
