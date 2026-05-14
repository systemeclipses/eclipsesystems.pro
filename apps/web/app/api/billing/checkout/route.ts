import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: "POST",
    headers: {
      authorization: request.headers.get("authorization") ?? "",
      "content-type": "application/json"
    },
    body
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
