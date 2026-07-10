import type { Metadata } from "next";
import { ShopIndex } from "@/components/app/storefront-pages";
import { getStorefrontSeed } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eclipse Shop",
  description: "Shop Eclipse apparel, headwear, drinkware, stickers, prints, and accessories.",
  alternates: { canonical: "/shop" }
};

export default async function ShopPage() {
  const seed = await getStorefrontSeed();
  return <ShopIndex seed={seed} />;
}
