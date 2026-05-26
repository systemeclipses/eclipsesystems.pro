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
      <PageHeader eyebrow="Personal settings" title="Account" description="Your profile information as Eclipse sees it today." />
      <Surface>
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
      <ThemeSettings />
    </section>
  );
}
