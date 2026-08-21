import { StorefrontAdminApp } from "@/components/app/storefront-template";
import { getStorefrontSeed } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const seed = await getStorefrontSeed();
  return <StorefrontAdminApp initialSeed={seed} />;
}
