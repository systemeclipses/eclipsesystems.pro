import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export default async function ShopPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="home" initialSeed={seed} />;
}
