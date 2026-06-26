import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPage, activeProducts, findProductBySlug } from "@/components/app/storefront-pages";
import { getStorefrontSeed } from "@/lib/storefront-db";
import { productHref, productImageUrl, productSlug, productsForSegment, segmentForProduct, segmentLabel } from "@/lib/storefront-taxonomy";

type PageProps = {
  params: Promise<{ segment: string; productSlug: string }>;
};

export async function generateStaticParams() {
  const seed = await getStorefrontSeed();
  return activeProducts(seed).map((product) => ({
    segment: segmentForProduct(product),
    productSlug: productSlug(product)
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment, productSlug: slug } = await params;
  const seed = await getStorefrontSeed();
  const product = findProductBySlug(productsForSegment(activeProducts(seed), segment), slug);
  if (!product) return {};

  return {
    title: `${product.name} | Eclipse Shop`,
    description: product.description,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: `${product.name} | Eclipse Shop`,
      description: product.description,
      images: [{ url: productImageUrl(product) ?? "" }]
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { segment, productSlug: slug } = await params;
  const seed = await getStorefrontSeed();
  const products = productsForSegment(activeProducts(seed), segment);
  const product = findProductBySlug(products, slug);

  if (!segmentLabel(segment) || !product) notFound();

  return <ProductDetailPage seed={seed} segment={segment} product={product} />;
}
