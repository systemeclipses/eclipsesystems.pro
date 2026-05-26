import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createMissionAnnouncement } from "@/src/db/queries/mission-command";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!title || !text) return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  const announcement = await createMissionAnnouncement({ organizationId, actorMembershipId, title, body: text, requireAcknowledgment: body.requireAcknowledgment === true });
  return NextResponse.json({ announcement });
}
