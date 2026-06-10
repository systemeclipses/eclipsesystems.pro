import { NextResponse, type NextRequest } from "next/server";
import { PRODUCT_DETAILS, type ProductCode } from "@/src/billing/entitlements";

function isProductCode(value: string | null): value is ProductCode {
  return value === "timekeeping" || value === "eclipse" || value === "mission_command" || value === "legal_addon";
}

function productHomeHref(product: ProductCode) {
  if (product === "timekeeping") return "/timekeeping";
  if (product === "eclipse") return "/timer";
  if (product === "mission_command") return "/shifts";
  if (product === "legal_addon") return "/matters";
  return "/templates";
}

function switchProduct(request: NextRequest, product: string | null) {
  const redirectTo = isProductCode(product) ? productHomeHref(product) : "/templates";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.headers.set("Cache-Control", "no-store");

  if (isProductCode(product) && PRODUCT_DETAILS[product]) {
    response.cookies.set("eclipse_active_product", product, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  return switchProduct(request, request.nextUrl.searchParams.get("product"));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const product = formData.get("product");
  return switchProduct(request, typeof product === "string" ? product : null);
}
