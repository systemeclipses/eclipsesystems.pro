import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const title = request.nextUrl.searchParams.get("title") ?? "Eclipse Timekeeping by Eclipse Systems";
  const badge = params.type === "comparison" ? "Comparison" : params.type === "guide" ? "Guide" : params.type === "industry" ? "Industry" : "Timekeeping SaaS";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f8fbfa", color: "#10201f", padding: 64, fontFamily: "Inter" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Eclipse Systems</div>
          <div style={{ border: "2px solid #12706b", color: "#12706b", borderRadius: 999, padding: "10px 20px", fontSize: 24 }}>{badge}</div>
        </div>
        <div style={{ fontSize: 72, lineHeight: 1.04, fontWeight: 800, maxWidth: 980 }}>{title}</div>
        <div style={{ fontSize: 30, color: "#45615e" }}>Time tracking, invoicing, shifts, and legal billing.</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
