import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  ClipboardList,
  DollarSign,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MapPinned,
  MessageSquareText,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import { ThemePreferenceSync } from "@/components/app/theme-preference-sync";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { PRODUCT_DETAILS, getProductUiContext, hasProduct, type ProductCode } from "@/src/billing/entitlements";
import { auth } from "@/src/auth";
import { hasUsableSubscription } from "@/src/db/queries/billing";
import { getDefaultOrganizationForUser } from "@/src/db/queries/organizations";

const productNav = [
  { product: "timekeeping", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { product: "timekeeping", label: "Timekeeping", href: "/timekeeping", icon: CalendarClock },
  { product: "timekeeping", label: "Reports", href: "/reports", icon: BarChart3 },
  { product: "eclipse", label: "Clients", href: "/clients", icon: UsersRound },
  { product: "eclipse", label: "Projects", href: "/projects", icon: FolderKanban },
  { product: "eclipse", label: "Invoices", href: "/invoices", icon: ReceiptText },
  { product: "mission_command", label: "Mission", href: "/shifts", icon: FileText },
  { product: "mission_command", label: "Chat", href: "/chat", icon: MessageSquareText },
  { product: "legal_addon", label: "Matters", href: "/matters", icon: ShieldCheck }
] as const;

const timekeepingPrimaryNav = [
  { label: "Clock", href: "/timekeeping?tab=clock", icon: Clock3 },
  { label: "Hours", href: "/timekeeping?tab=timesheet", icon: ClipboardList },
  { label: "PTO", href: "/timekeeping?tab=pto", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings }
] as const;

const timekeepingAdminNav = [
  { label: "People", href: "/settings/members", icon: UsersRound },
  { label: "Pay Rules", href: "/settings/timekeeping", icon: DollarSign },
  { label: "Holidays", href: "/settings/timekeeping", icon: CalendarDays },
  { label: "Sites", href: "/settings/timekeeping", icon: MapPinned },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Building2 }
] as const;

function appTitle(context: Awaited<ReturnType<typeof getProductUiContext>>) {
  if (context.isSuite) return context.organizationName;
  if (context.entitledProducts.length === 1) return PRODUCT_DETAILS[context.entitledProducts[0]].shortName;
  return context.organizationName;
}

function isActivePath(pathname: string, href: string) {
  const path = href.split("?")[0];
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

function navLinkClass(active: boolean) {
  return `flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition ${
    active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
  }`;
}

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
  const context = await getProductUiContext(session.user.id, organizationId);
  const visibleNav = productNav.filter((item) => hasProduct(context, item.product));
  const lockedCoreProducts = context.showLockedProducts ? context.lockedProducts.filter((product) => product !== "legal_addon") : [];
  const showSettings = context.role !== "employee";
  const isTimekeepingOnly = context.entitledProducts.length === 1 && context.entitledProducts[0] === "timekeeping";
  const showTimekeepingAdminNav = isTimekeepingOnly && context.role !== "employee";

  return (
    <div className="min-h-screen bg-background">
      <ThemePreferenceSync />
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href={isTimekeepingOnly ? "/timekeeping" : "/dashboard"} className="font-title text-3xl leading-none text-cream">{appTitle(context)}</Link>
        <nav className="mt-7 grid gap-1">
          {(isTimekeepingOnly ? timekeepingPrimaryNav : visibleNav).map(({ label, href, icon: Icon }) => (
            <Link key={`${label}-${href}`} href={href} className={navLinkClass(isActivePath(pathname, href))}>
              <Icon className="h-[18px] w-[18px] text-secondary" />
              {label}
            </Link>
          ))}
          {!isTimekeepingOnly && showSettings ? (
            <Link href="/settings" className={navLinkClass(isActivePath(pathname, "/settings"))}>
              <Settings className="h-[18px] w-[18px] text-secondary" />
              Settings
            </Link>
          ) : null}
        </nav>
        {showTimekeepingAdminNav ? (
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">Admin</p>
            <nav className="mt-3 grid gap-1">
              {timekeepingAdminNav.map(({ label, href, icon: Icon }) => (
                <Link key={`${label}-${href}`} href={href} className={navLinkClass(isActivePath(pathname, href))}>
                  <Icon className="h-[18px] w-[18px] text-secondary" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
        {lockedCoreProducts.length ? (
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">Other products</p>
            <div className="mt-3 grid gap-3">
              {lockedCoreProducts.map((product) => (
                <Link key={product} href={context.showUpgradePrompts ? `/settings/billing?product=${product}` : "/settings"} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-white/58 transition hover:bg-white/8 hover:text-white/78">
                  <span className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="h-3.5 w-3.5" /> {PRODUCT_DETAILS[product as ProductCode].shortName}</span>
                  <span className="mt-1 block text-xs leading-4 text-white/40">{PRODUCT_DETAILS[product as ProductCode].description}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
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
          <Link href={isTimekeepingOnly ? "/timekeeping" : "/dashboard"} className="font-title text-2xl leading-none text-cream">{appTitle(context)}</Link>
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
