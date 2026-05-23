import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { createClientForOrganization } from "@/src/db/queries/clients";

export async function POST(request: Request) {
  await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) return NextResponse.json({ error: "Client name is required." }, { status: 400 });

  const client = await createClientForOrganization(organizationId, name);
  return NextResponse.json(client);
}
