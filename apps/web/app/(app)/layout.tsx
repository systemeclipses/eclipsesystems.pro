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
  CreditCard,
  DollarSign,
  FileCheck2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LockKeyhole,
  MapPinned,
  Megaphone,
  MessageSquareText,
  ReceiptText,
  Settings,
  ShieldCheck,
  Tags,
  UserRound,
  UsersRound
} from "lucide-react";
import { ThemePreferenceSync } from "@/components/app/theme-preference-sync";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { PRODUCT_DETAILS, getProductUiContext, type ProductCode, type RoleLevel } from "@/src/billing/entitlements";
import { auth } from "@/src/auth";
import { hasUsableSubscription } from "@/src/db/queries/billing";
import { getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { getCurrentShiftState, type ShiftState } from "@/src/db/queries/shift-state-machine";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Clock3;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const dashboardNavItem = { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard } satisfies NavItem;

const timekeepingEmployeeNav = [
  { label: "Clock", href: "/timekeeping?tab=clock", icon: Clock3 },
  { label: "Hours", href: "/timekeeping?tab=timesheet", icon: ClipboardList },
  { label: "PTO", href: "/timekeeping?tab=pto", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings }
] satisfies NavItem[];

const timekeepingAdminNav = [
  { label: "People", href: "/settings/members", icon: UsersRound },
  { label: "Pay Rules", href: "/settings/timekeeping", icon: DollarSign },
  { label: "Holidays", href: "/settings/timekeeping", icon: CalendarDays },
  { label: "Sites", href: "/settings/timekeeping", icon: MapPinned },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Building2 }
] satisfies NavItem[];

const invoicingEmployeeNav = [
  { label: "Timer", href: "/timer", icon: Clock3 },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Clients", href: "/clients", icon: UsersRound },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Settings", href: "/settings", icon: Settings }
] satisfies NavItem[];

const invoicingAdminNav = [
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Tax & Compliance", href: "/settings/rates?section=tax", icon: Tags },
  { label: "Recurring", href: "/invoices?view=recurring", icon: CalendarClock },
  { label: "Settings", href: "/settings", icon: Building2 }
] satisfies NavItem[];

const missionEmployeeNav = [
  { label: "Schedule", href: "/shifts", icon: CalendarDays },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
  { label: "Tasks", href: "/shifts?view=tasks", icon: FileCheck2 },
  { label: "Announcements", href: "/chat?view=announcements", icon: Megaphone },
  { label: "Settings", href: "/settings", icon: Settings }
] satisfies NavItem[];

const missionManagerNav = [
  ...missionEmployeeNav.slice(0, 4),
  { label: "My Team", href: "/settings/members", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings }
] satisfies NavItem[];

const missionAdminNav = [
  { label: "Sites", href: "/settings/timekeeping?section=sites", icon: MapPinned },
  { label: "Coverage Rules", href: "/settings/timekeeping?section=coverage", icon: ShieldCheck },
  { label: "Forms", href: "/settings/security?section=forms", icon: ClipboardList },
  { label: "Skills", href: "/settings/members?section=skills", icon: FileCheck2 },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Building2 }
] satisfies NavItem[];

const legalEmployeeNav = [
  { label: "Cases", href: "/matters", icon: ShieldCheck },
  { label: "Documents", href: "/matters?tab=documents", icon: FileText },
  { label: "Time Entries", href: "/timer?product=legal", icon: Clock3 },
  { label: "Billing", href: "/invoices?product=legal", icon: ReceiptText },
  { label: "Calendar", href: "/shifts?product=legal", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings }
] satisfies NavItem[];

const legalAdminNav = [
  { label: "People", href: "/settings/members", icon: UsersRound },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Trust Accounting", href: "/settings/billing?section=trust", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Building2 }
] satisfies NavItem[];

const productPrimaryNav: Record<Exclude<ProductCode, "legal_addon">, NavItem[]> = {
  timekeeping: timekeepingEmployeeNav.slice(0, 3),
  eclipse: invoicingEmployeeNav.slice(0, 4),
  mission_command: missionEmployeeNav.slice(0, 4)
};

const productSectionTitles: Record<Exclude<ProductCode, "legal_addon">, string> = {
  timekeeping: "Timekeeping",
  eclipse: "Invoicing",
  mission_command: "Mission Command"
};

const suiteSections: NavSection[] = [
  { title: "Workforce", items: timekeepingEmployeeNav.slice(0, 3) },
  { title: "Operations", items: missionEmployeeNav.slice(0, 4) },
  {
    title: "Billing",
    items: [
      ...invoicingEmployeeNav.slice(0, 4),
      { label: "Payments", href: "/invoices?view=payments", icon: CreditCard }
    ]
  }
];

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

function isClockItem(item: NavItem) {
  return item.href.startsWith("/timekeeping?tab=clock");
}

function ClockStatusIndicator({ state }: { state: ShiftState | null }) {
  if (!state || state === "CLOCKED_OUT") return null;
  if (state === "ON_BREAK") return <span aria-label="On break" className="ml-auto text-sm font-semibold text-amber-300">◐</span>;
  if (state === "PENDING_REVIEW" || state === "LOCKED") return <span aria-label="Needs attention" className="ml-auto text-xs font-semibold text-amber-300">⚠</span>;
  return <span aria-label="Clocked in" className="ml-auto h-2.5 w-2.5 rounded-full bg-green-400" />;
}

function isAdminRole(role: RoleLevel) {
  return role === "admin" || role === "owner";
}

function isManagerRole(role: RoleLevel) {
  return role === "team_lead" || role === "manager" || isAdminRole(role);
}

function singleProductSections(product: ProductCode, role: RoleLevel): NavSection[] {
  if (product === "timekeeping") {
    return isAdminRole(role)
      ? [{ items: timekeepingEmployeeNav.slice(0, 3) }, { title: "Admin", items: timekeepingAdminNav }]
      : [{ items: timekeepingEmployeeNav }];
  }
  if (product === "eclipse") {
    const adminPrimary = [
      ...invoicingEmployeeNav.slice(0, 4),
      { label: "Payments", href: "/invoices?view=payments", icon: CreditCard }
    ];
    return isAdminRole(role)
      ? [{ items: adminPrimary }, { title: "Admin", items: invoicingAdminNav }]
      : [{ items: invoicingEmployeeNav }];
  }
  if (product === "mission_command") {
    if (isAdminRole(role)) {
      return [{ items: [...missionEmployeeNav.slice(0, 4), { label: "People", href: "/settings/members", icon: UsersRound }] }, { title: "Admin", items: missionAdminNav }];
    }
    return [{ items: isManagerRole(role) ? missionManagerNav : missionEmployeeNav }];
  }
  return isAdminRole(role)
    ? [{ items: [...legalEmployeeNav.slice(0, 5), { label: "Clients", href: "/clients?product=legal", icon: UsersRound }] }, { title: "Admin", items: legalAdminNav }]
    : [{ items: legalEmployeeNav }];
}

function multiProductSections(products: ProductCode[], role: RoleLevel): NavSection[] {
  const coreProducts = products.filter((product): product is Exclude<ProductCode, "legal_addon"> => product === "timekeeping" || product === "eclipse" || product === "mission_command");
  const hasCoreSuite = coreProducts.length === 3;
  const sections: NavSection[] = hasCoreSuite
    ? [...suiteSections]
    : coreProducts.map((product) => ({ title: productSectionTitles[product], items: productPrimaryNav[product] }));

  if (products.includes("legal_addon")) {
    sections.push({ title: "Legal", items: legalEmployeeNav.slice(0, 5) });
  }

  if (isAdminRole(role)) {
    const adminItems: NavItem[] = [];
    if (products.some((product) => product === "timekeeping" || product === "mission_command")) {
      adminItems.push(
        { label: "People", href: "/settings/members", icon: UsersRound },
        { label: "Sites", href: "/settings/timekeeping?section=sites", icon: MapPinned }
      );
    }
    if (products.includes("timekeeping")) {
      adminItems.push(
        { label: "Pay Rules", href: "/settings/timekeeping", icon: DollarSign },
        { label: "Holidays", href: "/settings/timekeeping?section=holidays", icon: CalendarDays }
      );
    }
    if (products.includes("mission_command")) {
      adminItems.push({ label: "Coverage Rules", href: "/settings/timekeeping?section=coverage", icon: ShieldCheck });
    }
    if (products.includes("eclipse")) {
      adminItems.push({ label: "Tax & Compliance", href: "/settings/rates?section=tax", icon: Tags });
    }
    if (products.includes("legal_addon")) {
      adminItems.push({ label: "Trust Accounting", href: "/settings/billing?section=trust", icon: ShieldCheck });
    }
    adminItems.push({ label: "Reports", href: "/reports", icon: BarChart3 }, { label: "Settings", href: "/settings", icon: Settings });
    sections.push({ title: "Admin", items: adminItems });
  } else {
    sections.push({ items: [{ label: "Settings", href: "/settings", icon: Settings }] });
  }

  return sections;
}

function sidebarSections(context: Awaited<ReturnType<typeof getProductUiContext>>) {
  const sections = context.entitledProducts.length === 1
    ? singleProductSections(context.entitledProducts[0], context.role)
    : multiProductSections(context.entitledProducts, context.role);

  return [{ items: [dashboardNavItem] }, ...sections];
}

function lockedProductsFor(context: Awaited<ReturnType<typeof getProductUiContext>>) {
  if (!isAdminRole(context.role)) return [];
  if (context.entitledProducts.length === 1 && context.entitledProducts[0] === "legal_addon") {
    return (["timekeeping", "mission_command"] as ProductCode[]).filter((product) => !context.entitledProducts.includes(product));
  }
  return context.lockedProducts.filter((product) => product !== "legal_addon");
}

function lockedProductLabel(product: ProductCode) {
  if (product === "mission_command") return "Mission Cmd";
  return PRODUCT_DETAILS[product].shortName;
}

function startHref(context: Awaited<ReturnType<typeof getProductUiContext>>) {
  const first = context.entitledProducts[0];
  if (context.entitledProducts.length !== 1) return "/dashboard";
  if (first === "timekeeping") return "/timekeeping";
  if (first === "eclipse") return "/timer";
  if (first === "mission_command") return "/shifts";
  if (first === "legal_addon") return "/matters";
  return "/dashboard";
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
  const membershipId = context.entitledProducts.includes("timekeeping") ? await getMembershipIdForUser(session.user.id, organizationId) : null;
  const currentClockState = membershipId ? (await getCurrentShiftState(organizationId, membershipId)).state : null;
  const sections = sidebarSections(context);
  const lockedCoreProducts = lockedProductsFor(context);
  const productCount = context.entitledProducts.filter((product) => product === "timekeeping" || product === "eclipse" || product === "mission_command").length;
  const lockedHeading = productCount === 2 && lockedCoreProducts.length === 1 ? "One more" : "Other products";
  const homeHref = startHref(context);

  return (
    <div className="min-h-screen bg-background">
      <ThemePreferenceSync />
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href={homeHref} className="font-title text-3xl leading-none text-cream">{appTitle(context)}</Link>
        <div className="mt-7 grid gap-5 overflow-y-auto pr-1">
          {sections.map((section, index) => (
            <div key={`${section.title ?? "primary"}-${index}`} className={index > 0 ? "border-t border-white/10 pt-5" : undefined}>
              {section.title ? <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">{section.title}</p> : null}
              <nav className="grid gap-1">
                {section.items.map(({ label, href, icon: Icon }) => (
                  <Link key={`${section.title ?? "primary"}-${label}-${href}`} href={href} className={navLinkClass(isActivePath(pathname, href))}>
                    <Icon className="h-[18px] w-[18px] text-secondary" />
                    {label}
                    {isClockItem({ label, href, icon: Icon }) ? <ClockStatusIndicator state={currentClockState} /> : null}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        {lockedCoreProducts.length ? (
          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">{lockedHeading}</p>
            <div className="mt-3 grid gap-3">
              {lockedCoreProducts.map((product) => (
                <Link key={product} href={context.showUpgradePrompts ? `/settings/billing?product=${product}` : "/settings"} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-white/58 transition hover:bg-white/8 hover:text-white/78">
                  <span className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="h-3.5 w-3.5" /> {lockedProductLabel(product)}</span>
                  <span className="mt-1 block text-xs leading-4 text-white/40">{PRODUCT_DETAILS[product].description}</span>
                  {lockedHeading === "One more" ? <span className="mt-3 block text-xs font-semibold text-secondary">Complete the Suite - save 20%</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-auto pt-5">
          <details className="group mb-3 rounded-md border border-white/10 bg-white/8 text-sm text-white/82 transition open:bg-white/13">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{userName}</span>
                <span className="block text-xs text-white/52">Account menu</span>
              </span>
            </summary>
            <div className="grid gap-1 border-t border-white/10 p-2">
              <Link href="/settings/account#profile" className="rounded-sm px-2 py-2 text-white/72 hover:bg-white/10 hover:text-white">My Profile</Link>
              <Link href="/settings/account#notifications" className="rounded-sm px-2 py-2 text-white/72 hover:bg-white/10 hover:text-white">Notification Settings</Link>
              <Link href="/help-center" className="rounded-sm px-2 py-2 text-white/72 hover:bg-white/10 hover:text-white">Help & Support</Link>
              <Link href="/api/auth/signout" className="rounded-sm px-2 py-2 text-white/72 hover:bg-white/10 hover:text-white">Sign out</Link>
            </div>
          </details>
          <ThemeToggle />
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border bg-[#2f4135] p-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href={homeHref} className="font-title text-2xl leading-none text-cream">{appTitle(context)}</Link>
          <div className="flex items-center gap-2">
            <details className="relative">
              <summary aria-label="Account menu" className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-md border border-white/15 bg-white/10 text-white">
                <UserRound className="h-5 w-5" />
              </summary>
              <div className="absolute right-0 top-14 z-50 grid w-56 gap-1 rounded-md border border-border bg-white p-2 text-sm text-ink shadow-xl">
                <Link href="/settings/account#profile" className="rounded-sm px-2 py-2 hover:bg-cream">My Profile</Link>
                <Link href="/settings/account#notifications" className="rounded-sm px-2 py-2 hover:bg-cream">Notification Settings</Link>
                <Link href="/help-center" className="rounded-sm px-2 py-2 hover:bg-cream">Help & Support</Link>
                <Link href="/api/auth/signout" className="rounded-sm px-2 py-2 hover:bg-cream">Sign out</Link>
              </div>
            </details>
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
