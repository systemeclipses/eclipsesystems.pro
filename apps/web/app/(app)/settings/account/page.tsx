import { PageHeader, Surface } from "@/components/app/page-shell";
import { auth } from "@/src/auth";

export default async function AccountSettingsPage() {
  const session = await auth();
  const user = session?.user;

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
    </section>
  );
}
