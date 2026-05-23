import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CalendarClock, Clock3, FileText, FolderKanban, LayoutDashboard, MessageSquareText, ReceiptText, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { auth } from "@/src/auth";

const nav = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Timer", "/timer", Clock3],
  ["Timesheet", "/timesheet", CalendarClock],
  ["Clients", "/clients", UsersRound],
  ["Projects", "/projects", FolderKanban],
  ["Invoices", "/invoices", ReceiptText],
  ["Shifts", "/shifts", FileText],
  ["Chat", "/chat", MessageSquareText],
  ["Matters", "/matters", ShieldCheck],
  ["Reports", "/reports", BarChart3],
  ["Settings", "/settings/billing", Settings]
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href="/dashboard" className="font-title text-3xl leading-none text-cream">Eclipse</Link>
        <nav className="mt-7 grid gap-1">
          {nav.map(([label, href, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
              <Icon className="h-4 w-4 text-secondary" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-5">
          <ThemeToggle />
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border bg-[#2f4135] p-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-title text-2xl leading-none text-cream">Eclipse</Link>
          <div className="w-36">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="md:pl-60">
        <div className="w-full px-4 py-5 md:px-8 md:py-8 xl:px-10">{children}</div>
      </main>
    </div>
  );
}
