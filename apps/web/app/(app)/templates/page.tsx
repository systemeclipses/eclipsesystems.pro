import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, Store, UsersRound } from "lucide-react";
import { auth } from "@/src/auth";
import { packageDefinitions, type PackageSlug } from "@/lib/packages";

const packageIcons: Record<PackageSlug, typeof Building2> = {
  "operations-hub": Building2,
  "client-portal": UsersRound,
  "crm-sales-pipeline": BriefcaseBusiness,
  storefront: Store
};

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-background px-4 py-5 md:px-8 md:py-8 xl:px-10">
      <section className="overflow-hidden rounded-md bg-primary text-white">
        <div className="p-6 md:p-8">
          <p className="text-sm font-semibold text-secondary">Select a package</p>
          <h1 className="mt-4 max-w-5xl font-title text-6xl leading-[0.86] text-cream md:text-7xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/75">
            Choose one of the four Eclipse software templates before entering a workspace. Each package has its own dashboard and workflows.
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {packageDefinitions.map((pkg) => {
          const Icon = packageIcons[pkg.slug];

          return (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="group flex min-h-[480px] flex-col justify-between rounded-md border border-border bg-white/70 p-5 shadow-sm shadow-primary/5 transition hover:-translate-y-0.5 hover:border-primary hover:bg-white dark:border-white/10 dark:bg-[#142018] dark:shadow-black/20 dark:hover:border-secondary/45 dark:hover:bg-[#19271d]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-sm bg-secondary text-primary dark:bg-secondary/85 dark:text-[#101a14]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary dark:text-white/50 dark:group-hover:text-secondary" />
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-none text-ink dark:text-cream">{pkg.name}</h2>
                <p className="mt-4 text-base font-semibold leading-6 text-primary dark:text-[#f0f2df]">{pkg.tagline}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-white/68">For: {pkg.audience}.</p>
                {pkg.moduleNote ? <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-white/68">{pkg.moduleNote}</p> : null}
                {pkg.worksWith ? <p className="mt-3 rounded-sm bg-secondary/25 px-3 py-2 text-xs font-semibold leading-5 text-primary dark:bg-secondary/14 dark:text-[#edf0ce]">Works with {pkg.worksWith.packageName}: {pkg.worksWith.copy}</p> : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {pkg.features.slice(0, 4).map((feature) => (
                  <span key={feature} className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary dark:bg-white/12 dark:text-[#e8ecdb]">{feature}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
