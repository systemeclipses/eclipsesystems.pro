import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingPage, activeProducts } from "@/components/app/storefront-pages";
import { getStorefrontSeed } from "@/lib/storefront-db";
import { audienceSegments, categorySegments, merchandisingSegments, productsForSegment, segmentLabel } from "@/lib/storefront-taxonomy";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ segment: string }>;
};

const segments = [...merchandisingSegments, ...audienceSegments, ...categorySegments];

export function generateStaticParams() {
  return segments.map((segment) => ({ segment: segment.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segment } = await params;
  const label = segmentLabel(segment);
  if (!label) return {};
  return {
    title: `${label} | Eclipse Shop`,
    description: `Shop Eclipse ${label.toLowerCase()} products.`,
    alternates: { canonical: `/shop/${segment}` }
  };
}

export default async function SegmentPage({ params }: PageProps) {
  const { segment } = await params;
  const seed = await getStorefrontSeed();
  const products = productsForSegment(activeProducts(seed), segment);

  if (!segmentLabel(segment) || products.length === 0) notFound();

  return <ListingPage seed={seed} segment={segment} products={products} />;
}
