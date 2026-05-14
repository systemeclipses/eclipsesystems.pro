import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-webhook`;

  const response = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body
  });

  return new NextResponse(await response.text(), { status: response.status });
}
