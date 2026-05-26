import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart3, CalendarClock, FileText, FolderKanban, LayoutDashboard, MessageSquareText, ReceiptText, Settings, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { ThemePreferenceSync } from "@/components/app/theme-preference-sync";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { auth } from "@/src/auth";
import { hasUsableSubscription } from "@/src/db/queries/billing";
import { getDefaultOrganizationForUser } from "@/src/db/queries/organizations";

const nav = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Timekeeping", "/timekeeping", CalendarClock],
  ["Clients", "/clients", UsersRound],
  ["Projects", "/projects", FolderKanban],
  ["Invoices", "/invoices", ReceiptText],
  ["Mission", "/shifts", FileText],
  ["Chat", "/chat", MessageSquareText],
  ["Matters", "/matters", ShieldCheck],
  ["Reports", "/reports", BarChart3],
  ["Settings", "/settings", Settings]
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userName = session.user.name || session.user.email || "Account";
  const pathname = headers().get("x-pathname") ?? "";
  const subscriptionSetupRoutes = ["/settings/billing", "/settings/account", "/account"];
  const canBypassSubscription = subscriptionSetupRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const organizationId = session.user.id ? await getDefaultOrganizationForUser(session.user.id) : null;

  if (!organizationId) redirect("/onboarding");
  if (!canBypassSubscription && !(await hasUsableSubscription(organizationId))) redirect("/settings/billing");

  return (
    <div className="min-h-screen bg-background">
      <ThemePreferenceSync />
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href="/dashboard" className="font-title text-3xl leading-none text-cream">Eclipse</Link>
        <nav className="mt-7 grid gap-1">
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/75 hover:bg-white/10 hover:text-white">
              <Icon className="h-[18px] w-[18px] text-secondary" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-5">
          <Link href="/account" className="mb-3 flex items-center gap-3 rounded-md border border-white/10 bg-white/8 px-3 py-3 text-sm text-white/82 transition hover:bg-white/13 hover:text-white">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary text-primary">
              <UserRound className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{userName}</span>
              <span className="block text-xs text-white/52">Account settings</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border bg-[#2f4135] p-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-title text-2xl leading-none text-cream">Eclipse</Link>
          <div className="flex items-center gap-2">
            <Link href="/account" aria-label="Account settings" className="grid h-12 w-12 place-items-center rounded-md border border-white/15 bg-white/10 text-white">
              <UserRound className="h-5 w-5" />
            </Link>
            <div className="w-36">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <main className="md:pl-60">
        <div className="w-full px-4 py-5 md:px-8 md:py-8 xl:px-10">{children}</div>
      </main>
    </div>
  );
}
