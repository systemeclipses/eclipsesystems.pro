import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { completeChecklistItem } from "@/src/db/queries/offboarding";

export async function POST(request: Request, { params }: { params: { id: string; itemId: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  const body = await request.json().catch(() => ({}));

  await completeChecklistItem({
    organizationId,
    offboardingId: params.id,
    itemId: params.itemId,
    actorMembershipId,
    note: typeof body.note === "string" ? body.note : null
  });

  return NextResponse.json({ ok: true });
}
