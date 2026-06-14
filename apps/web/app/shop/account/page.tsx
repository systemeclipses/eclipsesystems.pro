import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export default async function ShopAccountPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="account" initialSeed={seed} />;
}
