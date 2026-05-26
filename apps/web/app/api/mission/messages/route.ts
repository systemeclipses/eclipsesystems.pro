import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createMissionMessage } from "@/src/db/queries/mission-command";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const senderMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  const channelId = typeof body.channelId === "string" ? body.channelId : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!channelId || !text) return NextResponse.json({ error: "Channel and message are required." }, { status: 400 });
  const message = await createMissionMessage({ organizationId, channelId, senderMembershipId, body: text });
  return NextResponse.json({ message });
}
