import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/src/auth";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Timer", "/timer"],
  ["Timesheet", "/timesheet"],
  ["Projects", "/projects"],
  ["Invoices", "/invoices"],
  ["Shifts", "/shifts"],
  ["Chat", "/chat"],
  ["Matters", "/matters"],
  ["Reports", "/reports"],
  ["Settings", "/settings/billing"]
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border p-4 md:block">
        <div className="font-semibold">Eclipse Systems</div>
        <nav className="mt-6 grid gap-1">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">{label}</Link>
          ))}
        </nav>
      </aside>
      <main className="md:pl-56">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
