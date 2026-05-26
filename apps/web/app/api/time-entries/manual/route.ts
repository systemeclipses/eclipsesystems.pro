import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createManualTimeEntryForUser } from "@/src/db/queries/time-entries";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  const startedAt = typeof body.startedAt === "string" ? new Date(body.startedAt) : null;
  const endedAt = typeof body.endedAt === "string" ? new Date(body.endedAt) : null;

  if (!startedAt || Number.isNaN(startedAt.getTime()) || !endedAt || Number.isNaN(endedAt.getTime())) {
    return NextResponse.json({ error: "Start and end times are required." }, { status: 400 });
  }

  if (endedAt <= startedAt) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const entry = await createManualTimeEntryForUser({
    organizationId,
    membershipId,
    projectId,
    description,
    startedAt,
    endedAt,
    reason: typeof body.reason === "string" ? body.reason : null
  });

  return NextResponse.json(entry);
}
