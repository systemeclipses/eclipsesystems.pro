import { eq } from "drizzle-orm";
import { PageHeader, Surface } from "@/components/app/page-shell";
import { PasswordSettings } from "@/components/app/password-settings";
import { ThemeSettings } from "@/components/app/theme-settings";
import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { passwordCredentials } from "@/src/db/schema";

export default async function AccountSettingsPage() {
  const session = await auth();
  const user = session?.user;
  const [credential] = user?.id
    ? await db
        .select({ userId: passwordCredentials.userId })
        .from(passwordCredentials)
        .where(eq(passwordCredentials.userId, user.id))
        .limit(1)
    : [];

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Personal settings" title="Profile" description="Manage your identity, password, notifications, and display preferences." />
      <Surface>
        <div id="profile" className="-mt-24 pt-24" />
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="mt-2 font-semibold">{user?.name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-2 font-semibold">{user?.email || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="mt-2 truncate font-mono text-sm">{user?.id}</p>
          </div>
        </div>
      </Surface>
      <PasswordSettings hasPassword={Boolean(credential)} />
      <Surface>
        <div id="notifications" className="-mt-24 pt-24" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Timekeeping and PTO notification preferences will appear here as notification channels are connected.</p>
          </div>
          <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary">Coming soon</span>
        </div>
      </Surface>
      <div id="display" className="-mt-24 pt-24">
        <ThemeSettings />
      </div>
    </section>
  );
}
