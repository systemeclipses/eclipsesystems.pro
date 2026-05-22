import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { startTimerForUser } from "@/src/db/queries/time-entries";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await getDefaultOrganizationForUser(userId);
  if (!organizationId) return NextResponse.json({ error: "Workspace required" }, { status: 400 });

  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const entry = await startTimerForUser({
    userId,
    organizationId,
    membershipId,
    projectId: typeof body.projectId === "string" ? body.projectId : null,
    description: typeof body.description === "string" ? body.description : null
  });

  return NextResponse.json({
    id: entry.id,
    description: entry.description,
    started_at: entry.startedAt.toISOString()
  });
}
