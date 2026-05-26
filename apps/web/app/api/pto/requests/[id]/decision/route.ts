import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { decidePtoRequest } from "@/src/db/queries/timekeeping";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!actorMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const status = body.status === "approved" || body.status === "denied" ? body.status : null;
  if (!status) return NextResponse.json({ error: "Decision must be approved or denied." }, { status: 400 });

  try {
    const ptoRequest = await decidePtoRequest({
      organizationId,
      actorMembershipId,
      requestId: params.id,
      status,
      managerNote: typeof body.managerNote === "string" ? body.managerNote : null,
      overrideValidationFailures: Boolean(body.overrideValidationFailures)
    });
    return NextResponse.json(ptoRequest);
  } catch (error) {
    const validation = error && typeof error === "object" && "validation" in error ? (error as { validation: unknown }).validation : undefined;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to decide request.", validation }, { status: 400 });
  }
}
