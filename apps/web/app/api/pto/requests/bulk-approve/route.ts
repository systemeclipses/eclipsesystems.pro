import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { bulkApprovePtoRequests } from "@/src/db/queries/pto-workflow";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!actorMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const requestIds = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  if (!requestIds.length) return NextResponse.json({ error: "Select at least one request." }, { status: 400 });

  const result = await bulkApprovePtoRequests({
    organizationId,
    actorMembershipId,
    requestIds,
    note: typeof body.note === "string" ? body.note : null
  });
  return NextResponse.json(result);
}
