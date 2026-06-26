import merchColorways from "@/lib/storefront-merch-colorways.json";
import type { StorefrontProduct } from "@/lib/storefront-data";

export const audienceSegments = [
  { label: "Men's", slug: "mens" },
  { label: "Women's", slug: "womens" },
  { label: "Youth / Kids", slug: "youth" }
] as const;

export const categorySegments = [
  { label: "Stickers & Decals", slug: "stickers" },
  { label: "Drinkware", slug: "drinkware" },
  { label: "Accessories", slug: "accessories" },
  { label: "Headwear", slug: "headwear" },
  { label: "Prints", slug: "prints" }
] as const;

export const merchandisingSegments = [
  { label: "New & Featured", slug: "new-arrivals" },
  { label: "Best Sellers", slug: "best-sellers" },
  { label: "Sale", slug: "sale" }
] as const;

export const storefrontColorways = merchColorways as Array<{ name: string; slug: string; hex: string }>;

const defaultColorByCategory: Record<string, string> = {
  "Men's": "forest",
  "Women's": "sage",
  "Youth / Kids": "terracotta",
  Headwear: "forest",
  Accessories: "bone-cream",
  Drinkware: "bone-cream",
  Prints: "bone-cream",
  "Stickers & Decals": "bone-cream"
};

const explicitDefaultColor: Record<string, string> = {
  "mens-fleece-jogger": "black",
  "mens-pocket-tee": "terracotta",
  "womens-performance-legging": "black",
  "womens-ribbed-tank": "sage",
  "mens-shop-coach-jacket": "black"
};

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function productSlug(product: StorefrontProduct) {
  return slugify(product.name);
}

export function productSkuSlug(product: StorefrontProduct) {
  return product.sku.toLowerCase();
}

export function productAudience(product: StorefrontProduct) {
  return audienceSegments.find((item) => item.label === product.category) ?? null;
}

export function productCategorySegment(product: StorefrontProduct) {
  return categorySegments.find((item) => item.label === product.category) ?? null;
}

export function segmentForProduct(product: StorefrontProduct) {
  return productAudience(product)?.slug ?? productCategorySegment(product)?.slug ?? slugify(product.category);
}

export function productHref(product: StorefrontProduct) {
  return `/shop/${segmentForProduct(product)}/${productSlug(product)}`;
}

export function productType(product: StorefrontProduct) {
  const text = `${product.sku} ${product.name}`.toLowerCase();
  if (/pocket/.test(text)) return "Pocket Tees";
  if (/crop|relaxed|tee|sprout|logo tee/.test(text)) return "Tees";
  if (/long-sleeve|long sleeve/.test(text)) return "Long Sleeves";
  if (/hoodie|zip/.test(text)) return "Hoodies";
  if (/crewneck|crew/.test(text)) return "Crews";
  if (/jogger/.test(text)) return "Joggers";
  if (/legging/.test(text)) return "Leggings";
  if (/tank/.test(text)) return "Tanks";
  if (/jacket/.test(text)) return "Jackets";
  if (/snapback|dad-cap|five-panel|rope-cap|cap/.test(text)) return "Caps";
  if (/beanie|watch-cap/.test(text)) return "Beanies";
  if (/mug|tumbler|bottle|cup/.test(text)) return "Drinkware";
  if (/sticker|decal|label/.test(text)) return "Stickers & Decals";
  if (/poster|print/.test(text)) return "Prints";
  if (/tote/.test(text)) return "Totes";
  if (/socks/.test(text)) return "Socks";
  if (/lanyard/.test(text)) return "Lanyards";
  if (/pouch/.test(text)) return "Pouches";
  if (/pin/.test(text)) return "Pins";
  return product.category;
}

export function merchPlacement(product: StorefrontProduct) {
  const slug = productSkuSlug(product);
  const text = `${slug} ${product.name}`.toLowerCase();
  if (slug === "mens-pocket-tee") return "left_chest_pocket";
  if (slug === "womens-performance-legging") return "legging_lower_right";
  if (slug === "mens-fleece-jogger" || slug === "womens-studio-jogger") return "jogger_upper_left";
  if (slug === "mens-zip-hoodie" || slug === "mens-shop-coach-jacket") return "left_chest";
  if (/snapback|dad-cap|five-panel|rope-cap/.test(text)) return "cap";
  if (/beanie|watch-cap/.test(text)) return "beanie";
  if (/socks/.test(text)) return "socks";
  if (/tote|pouch/.test(text)) return "bag";
  if (/lanyard/.test(text)) return "lanyard";
  if (["Men's", "Women's", "Youth / Kids"].includes(product.category)) return "center_chest";
  return null;
}

export function defaultColorSlug(product: StorefrontProduct) {
  const sku = productSkuSlug(product);
  return explicitDefaultColor[sku] ?? defaultColorByCategory[product.category] ?? "black";
}

export function productImageUrl(product: StorefrontProduct, colorSlug = defaultColorSlug(product)) {
  const placement = merchPlacement(product);
  if (!placement) return product.imageUrl;
  return `/products/${productSkuSlug(product)}-${colorSlug}-${placement}.jpg`;
}

export function productImages(product: StorefrontProduct) {
  const placement = merchPlacement(product);
  if (!placement) return product.imageUrl ? [{ ...storefrontColorways[0], url: product.imageUrl }] : [];
  return storefrontColorways.map((colorway) => ({
    ...colorway,
    url: productImageUrl(product, colorway.slug)
  }));
}

export function productsForSegment(products: StorefrontProduct[], segment: string) {
  if (segment === "new-arrivals") return products.slice(0, 16);
  if (segment === "best-sellers") return products.filter((product) => product.stockQty <= Math.max(product.lowStockThreshold, 3)).slice(0, 16);
  if (segment === "sale") return products.filter((product) => product.priceCents <= 2500 || product.stockQty <= Math.max(product.lowStockThreshold, 3));
  const audience = audienceSegments.find((item) => item.slug === segment);
  if (audience) return products.filter((product) => product.category === audience.label);
  const category = categorySegments.find((item) => item.slug === segment);
  if (category) return products.filter((product) => product.category === category.label);
  return [];
}

export function segmentLabel(segment: string) {
  return merchandisingSegments.find((item) => item.slug === segment)?.label ?? audienceSegments.find((item) => item.slug === segment)?.label ?? categorySegments.find((item) => item.slug === segment)?.label ?? null;
}

export function groupByProductType(products: StorefrontProduct[]) {
  const groups = new Map<string, StorefrontProduct[]>();
  for (const product of products) {
    const type = productType(product);
    groups.set(type, [...(groups.get(type) ?? []), product]);
  }
  return Array.from(groups.entries()).map(([type, items]) => ({ type, products: items }));
}

export function buildTaxonomy(products: StorefrontProduct[]) {
  return {
    merchandising: merchandisingSegments.map((segment) => ({
      ...segment,
      sections: groupByProductType(productsForSegment(products, segment.slug)).map((group) => group.type)
    })),
    audiences: audienceSegments.map((segment) => ({
      ...segment,
      sections: groupByProductType(products.filter((product) => product.category === segment.label)).map((group) => group.type)
    })),
    categories: categorySegments.map((segment) => ({
      ...segment,
      sections: groupByProductType(products.filter((product) => product.category === segment.label)).map((group) => group.type)
    }))
  };
}
