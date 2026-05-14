import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = createServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const { data: invite } = await supabase
      .from("invitations" as never)
      .select("token")
      .eq("email", user.email)
      .eq("status", "pending")
      .maybeSingle();
    if (invite && "token" in invite) return NextResponse.redirect(`${origin}/accept-invite/${invite.token}`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
