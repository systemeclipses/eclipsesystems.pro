import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createPtoDecisionReaction } from "@/src/db/queries/pto-manager-v2";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!actorMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const reaction = typeof body.reaction === "string" ? body.reaction : null;
  const message = typeof body.message === "string" ? body.message.trim() : null;
  if (!reaction && !message) return NextResponse.json({ error: "Reaction or message is required." }, { status: 400 });

  const created = await createPtoDecisionReaction({ organizationId, requestId: params.id, actorMembershipId, reaction, message });
  return NextResponse.json(created);
}
