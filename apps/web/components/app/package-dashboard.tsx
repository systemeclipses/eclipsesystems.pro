import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSignature,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  PackageOpen,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  UploadCloud,
  UserRound,
  UsersRound,
  Warehouse
} from "lucide-react";
import type { PackageDefinition } from "@/lib/packages";

const navIcons: Record<PackageDefinition["navItems"][number]["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  clock: Clock3,
  calendar: CalendarDays,
  invoice: ReceiptText,
  people: UsersRound,
  documents: FileText,
  training: BookOpenCheck,
  reports: BarChart3,
  settings: Settings,
  messages: MessageSquareText,
  uploads: UploadCloud,
  pipeline: FolderKanban,
  signature: FileSignature,
  tasks: ClipboardList,
  catalog: Store,
  cart: ShoppingCart,
  orders: PackageOpen,
  inventory: Warehouse
};

type PackageDashboardProps = {
  eyebrow: string;
  title: string;
  promise: string;
  audience: string;
  features: string[];
  metrics: Array<{ label: string; value: string }>;
  primaryAction: string;
  primaryHref: string;
  icon: LucideIcon;
  navItems: PackageDefinition["navItems"];
  moduleNote?: string;
  worksWith?: {
    packageName: string;
    copy: string;
  };
};

export function PackageDashboard({
  eyebrow,
  title,
  promise,
  audience,
  features,
  metrics,
  primaryAction,
  primaryHref,
  icon: Icon,
  navItems,
  moduleNote,
  worksWith
}: PackageDashboardProps) {
  return (
    <section className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href="/templates" className="font-title text-3xl leading-none text-cream">{eyebrow}</Link>
        <div className="mt-7 grid gap-5 pr-1">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">Workspace</p>
            <nav className="grid gap-1">
              {navItems.map((item, index) => {
                const NavIcon = navIcons[item.icon];
                return (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition ${index === 0 ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                  >
                    <NavIcon className="h-[18px] w-[18px] text-secondary" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">Package</p>
            <nav className="grid gap-1">
              <Link href="/templates" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/75 transition hover:bg-white/10 hover:text-white">
                <LayoutDashboard className="h-[18px] w-[18px] text-secondary" />
                All Packages
              </Link>
              <Link href="/demos" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/75 transition hover:bg-white/10 hover:text-white">
                <UserRound className="h-[18px] w-[18px] text-secondary" />
                All demos
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-border bg-[#2f4135] p-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/templates" className="min-w-0 truncate font-title text-2xl leading-none text-cream">{eyebrow}</Link>
          <details className="relative">
            <summary aria-label="Package navigation" className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-md border border-white/15 bg-white/10 text-white">
              <LayoutDashboard className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-14 z-50 grid w-64 gap-1 rounded-md border border-border bg-white p-2 text-sm text-ink shadow-xl">
              {navItems.map((item) => {
                const NavIcon = navIcons[item.icon];
                return (
                  <Link key={`${item.label}-mobile`} href={item.href} className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-cream">
                    <NavIcon className="h-4 w-4 text-primary" />
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/templates" className="flex items-center gap-2 rounded-sm border-t border-border px-2 py-2 hover:bg-cream">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                All Packages
              </Link>
            </div>
          </details>
        </div>
      </header>

      <main className="md:pl-60">
        <div className="w-full px-4 py-5 md:px-8 md:py-8 xl:px-10">
        <section id="dashboard" className="overflow-hidden rounded-md bg-primary text-white">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
            <div>
              <p className="text-sm font-semibold text-secondary">{eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-title text-6xl leading-[0.86] text-cream md:text-7xl">{title}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/78">{promise}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">For: {audience}</p>
              {moduleNote ? <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-secondary">{moduleNote}</p> : null}
              {worksWith ? (
                <p className="mt-3 max-w-2xl rounded-sm border border-white/15 bg-white/10 px-3 py-2 text-sm leading-6 text-white/76">
                  Works with {worksWith.packageName}: {worksWith.copy}
                </p>
              ) : null}
              <Link
                href={primaryHref}
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-cream px-4 text-sm font-semibold text-primary transition hover:bg-white"
              >
                {primaryAction} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 p-5 dark:bg-[#101a14]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-cream">Package dashboard</p>
                <Icon className="h-6 w-6 text-secondary" />
              </div>
              <div className="mt-8 grid gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between gap-4 rounded-sm bg-white/10 px-3 py-3 dark:bg-[#18241c]">
                    <span className="text-sm text-white/68">{metric.label}</span>
                    <span className="text-xl font-semibold text-white">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Included features</p>
                <h2 className="mt-2 text-3xl font-semibold leading-none text-ink">What this package controls</h2>
              </div>
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex min-h-20 items-start gap-3 rounded-md border border-border bg-cream/65 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm font-semibold leading-6 text-ink">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm bg-secondary text-primary">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Audience</h2>
                  <p className="text-sm text-muted-foreground">{audience}</p>
                </div>
              </div>
            </section>
            <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm bg-secondary text-primary">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Reporting</h2>
                  <p className="text-sm text-muted-foreground">Dashboard-ready workflows with exportable records.</p>
                </div>
              </div>
            </section>
            <section className="rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm bg-secondary text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Documents</h2>
                  <p className="text-sm text-muted-foreground">PDF-ready outputs and shared document workflows.</p>
                </div>
              </div>
            </section>
          </div>
        </section>
        </div>
      </main>
    </section>
  );
}
