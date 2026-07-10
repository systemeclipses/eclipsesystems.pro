import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="product" productId={params.id} initialSeed={seed} />;
}
