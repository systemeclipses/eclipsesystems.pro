import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAppRoute = request.nextUrl.pathname.startsWith("/dashboard")
    || ["/templates", "/operations", "/operations-hub", "/client-portal", "/crm", "/crm-sales-pipeline", "/storefront", "/timer", "/timesheet", "/projects", "/clients", "/invoices", "/shifts", "/chat", "/matters", "/reports", "/settings", "/admin"].some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAppRoute && user) {
    const { data: profile } = await supabase.from("profiles").select("default_organization_id").eq("id", user.id).maybeSingle();
    if (!profile?.default_organization_id && request.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}
