import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/accept-invitation`, {
    method: "POST",
    headers: {
      authorization: request.headers.get("authorization") ?? "",
      "content-type": "application/json"
    },
    body: JSON.stringify({ token })
  });
  const { origin } = new URL(request.url);
  if (!response.ok) return NextResponse.redirect(`${origin}/login`);
  return NextResponse.redirect(`${origin}/onboarding`);
}
