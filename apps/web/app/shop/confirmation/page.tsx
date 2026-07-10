import { StorefrontPublicApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontPublicApp initialView="confirmation" initialSeed={seed} />;
}
