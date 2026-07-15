import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/admin",
  "/chat",
  "/clients",
  "/client-portal",
  "/crm",
  "/dashboard",
  "/invoices",
  "/matters",
  "/operations",
  "/operations-hub",
  "/onboarding",
  "/projects",
  "/reports",
  "/settings",
  "/shifts",
  "/storefront",
  "/templates",
  "/timer",
  "/timesheet"
];

const publicDemoPrefixes = [
  "/dashboard",
  "/templates",
  "/operations",
  "/operations-hub",
  "/client-portal",
  "/crm",
  "/crm-sales-pipeline",
  "/storefront"
];

const sessionCookieNames = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

function hasSessionCookie(request: NextRequest) {
  return sessionCookieNames.some((name) => request.cookies.has(name));
}

export default function middleware(request: NextRequest) {
  const isPublicDemo = publicDemoPrefixes.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );
  const isProtectedRoute = !isPublicDemo && protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
