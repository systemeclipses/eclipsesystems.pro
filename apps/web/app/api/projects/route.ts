import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { createProjectForOrganization } from "@/src/db/queries/projects";

export async function POST(request: Request) {
  await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!name) return NextResponse.json({ error: "Project name is required." }, { status: 400 });

  const project = await createProjectForOrganization({ organizationId, name, code });
  return NextResponse.json(project);
}
