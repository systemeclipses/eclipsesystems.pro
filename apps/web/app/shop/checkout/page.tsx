import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export default async function CheckoutPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="checkout" initialSeed={seed} />;
}
