import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser } from "@/src/db/queries/organizations";

export async function getActiveOrgId() {
  const userId = await getAuthenticatedUserId();
  const defaultOrganizationId = await getDefaultOrganizationForUser(userId);

  if (!defaultOrganizationId) redirect("/onboarding");
  return defaultOrganizationId;
}

export async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}
