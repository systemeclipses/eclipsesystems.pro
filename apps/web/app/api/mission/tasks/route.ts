import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createMissionTask } from "@/src/db/queries/mission-command";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
  const dueAt = typeof body.dueAt === "string" && body.dueAt ? new Date(body.dueAt) : null;
  const task = await createMissionTask({
    organizationId,
    actorMembershipId,
    title,
    assigneeMembershipId: typeof body.assigneeMembershipId === "string" && body.assigneeMembershipId ? body.assigneeMembershipId : null,
    dueAt,
    priority: body.priority
  });
  return NextResponse.json({ task });
}
