import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { EmployeeOnboardingClient } from "@/components/onboarding/employee-onboarding-client";
import { Button } from "@/components/ui/button";
import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { geofenceAssignments, geofences, memberships, organizations, profiles } from "@/src/db/schema";
import { ensurePersonalOrganizationForUser, getDefaultOrganizationForUser } from "@/src/db/queries/organizations";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organizationId = await getDefaultOrganizationForUser(session.user.id);

  async function createOrg() {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user?.id) redirect("/login");
    await ensurePersonalOrganizationForUser(currentSession.user);
    redirect("/timer");
  }

  if (!organizationId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Set up your workspace</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Create a personal workspace or accept an invitation from your employer to start onboarding.</p>
        <form action={createOrg} className="mt-6">
          <Button>Create personal organization</Button>
        </form>
      </main>
    );
  }

  const [profile] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl
    })
    .from(profiles)
    .where(and(eq(profiles.id, session.user.id), isNull(profiles.deletedAt)))
    .limit(1);

  const [membership] = await db
    .select({
      id: memberships.id,
      organizationId: memberships.organizationId,
      role: memberships.role,
      department: memberships.department,
      managerMembershipId: memberships.managerMembershipId,
      payRateCents: memberships.payRateCents,
      hireDate: memberships.hireDate,
      probationEndsAt: memberships.probationEndsAt
    })
    .from(memberships)
    .where(and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt)))
    .limit(1);

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      timezone: organizations.timezone
    })
    .from(organizations)
    .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
    .limit(1);

  if (!membership || !organization || !profile) redirect("/dashboard");

  let manager = { name: "your manager", email: null as string | null };
  if (membership.managerMembershipId) {
    const [managerRow] = await db
      .select({
        fullName: profiles.fullName,
        displayName: profiles.displayName,
        email: profiles.email
      })
      .from(memberships)
      .innerJoin(profiles, eq(profiles.id, memberships.userId))
      .where(eq(memberships.id, membership.managerMembershipId))
      .limit(1);
    if (managerRow) {
      manager = {
        name: managerRow.displayName || managerRow.fullName || managerRow.email || "your manager",
        email: managerRow.email
      };
    }
  }

  const assignedSites = await db
    .select({
      id: geofences.id,
      name: geofences.name,
      address: geofences.address,
      behavior: geofences.outOfBoundsBehavior
    })
    .from(geofenceAssignments)
    .innerJoin(geofences, eq(geofences.id, geofenceAssignments.geofenceId))
    .where(and(eq(geofenceAssignments.membershipId, membership.id), eq(geofences.organizationId, organization.id), isNull(geofences.deletedAt)));

  return (
    <EmployeeOnboardingClient
      context={{
        employee: {
          fullName: profile.fullName || session.user.name || "",
          preferredName: profile.displayName || "",
          email: profile.email || session.user.email || "",
          phone: "",
          avatarUrl: profile.avatarUrl
        },
        organization: {
          name: organization.name,
          timezone: organization.timezone
        },
        membership: {
          role: membership.role,
          department: membership.department,
          payRateCents: membership.payRateCents,
          hireDate: membership.hireDate ? membership.hireDate.toISOString().slice(0, 10) : null,
          probationEndsAt: membership.probationEndsAt ? membership.probationEndsAt.toISOString().slice(0, 10) : null
        },
        manager,
        sites: assignedSites.map((site) => ({
          id: site.id,
          name: site.name,
          address: site.address,
          behavior: site.behavior
        }))
      }}
    />
  );
}
