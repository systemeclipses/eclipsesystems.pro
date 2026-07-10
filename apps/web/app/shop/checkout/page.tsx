import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="checkout" initialSeed={seed} />;
}
