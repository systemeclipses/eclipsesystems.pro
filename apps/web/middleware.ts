import { NextResponse } from "next/server";
import { auth } from "@/src/auth";

const protectedPrefixes = [
  "/admin",
  "/chat",
  "/clients",
  "/dashboard",
  "/invoices",
  "/matters",
  "/onboarding",
  "/projects",
  "/reports",
  "/settings",
  "/shifts",
  "/timer",
  "/timesheet"
];

export default auth((request) => {
  const isProtectedRoute = protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
