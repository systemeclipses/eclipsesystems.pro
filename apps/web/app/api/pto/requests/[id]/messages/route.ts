import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createPtoRequestMessage } from "@/src/db/queries/pto-manager-v2";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const senderMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!senderMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const message = typeof body.body === "string" ? body.body.trim() : "";
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const created = await createPtoRequestMessage({ organizationId, requestId: params.id, senderMembershipId, body: message });
  return NextResponse.json(created);
}
