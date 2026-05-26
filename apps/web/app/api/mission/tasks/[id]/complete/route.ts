import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { completeMissionTask } from "@/src/db/queries/mission-command";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));
  await completeMissionTask({ organizationId, taskId: params.id, membershipId, note: typeof body.note === "string" ? body.note : null });
  return NextResponse.json({ ok: true });
}
