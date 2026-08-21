import Link from "next/link";
import { ArrowRight, ChevronRight, Heart, Menu, Search, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import type { StorefrontProduct, StorefrontSeed } from "@/lib/storefront-data";
import { formatStoreMoney } from "@/lib/storefront-data";
import {
  audienceSegments,
  buildTaxonomy,
  categorySegments,
  defaultColorSlug,
  groupByProductType,
  merchandisingSegments,
  productHref,
  productImageUrl,
  productSlug,
  productType,
  segmentLabel,
  storefrontColorways
} from "@/lib/storefront-taxonomy";
import { AddToCartButton, FilteredProductGrid, ProductGallery, ProductOptions, SaveButton, StorefrontHeroCard, StorefrontHydrator, type StorefrontHeroSlide } from "@/components/app/storefront-shop-client";

const apparelSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const youthSizes = ["YXS", "YS", "YM", "YL", "YXL"];

function shoppable(product: StorefrontProduct) {
  return product.status === "active" && (product.isService || !product.trackInventory || product.stockQty > 0);
}

function sizesFor(product: StorefrontProduct) {
  if (product.category === "Youth / Kids") return youthSizes;
  if (product.category === "Men's" || product.category === "Women's") return apparelSizes;
  if (product.name.toLowerCase().includes("socks")) return ["S/M", "L/XL"];
  return [];
}

export function activeProducts(seed: StorefrontSeed) {
  return seed.products.filter(shoppable);
}

export function findProductBySlug(products: StorefrontProduct[], slug: string) {
  return products.find((product) => productSlug(product) === slug) ?? null;
}

function compareAt(product: StorefrontProduct) {
  return Math.ceil(product.priceCents * 1.18 / 100) * 100;
}

const sectionHeroSlides: Record<string, StorefrontHeroSlide[]> = {
  home: [
    {
      image: "/storefront/hero-eclipse-mens.png",
      alt: "Eclipse merch group wearing forest, terracotta, sage, and cream apparel",
      eyebrow: "Eclipse merch line",
      title: "New colors, field ready.",
      copy: "Soft tees, caps, and everyday crew staples built around the Eclipse palette.",
      href: "/shop/new-arrivals",
      cta: "Shop New"
    },
    {
      image: "/storefront/hero-eclipse-womens.png",
      alt: "Women wearing sage, cream, terracotta, and forest Eclipse-style layers",
      eyebrow: "Women's layers",
      title: "Soft goods, sharp fit.",
      copy: "Crops, tanks, hoodies, and leggings with the same clean storefront energy.",
      href: "/shop/womens",
      cta: "Shop Women"
    },
    {
      image: "/storefront/hero-eclipse-youth.png",
      alt: "Eclipse merch rack with apparel, caps, bottles, and folded colorways",
      eyebrow: "New arrivals",
      title: "The merch wall got louder.",
      copy: "Fresh colorways, everyday blanks, and a few pieces that will disappear first.",
      href: "/shop/new-arrivals",
      cta: "Shop the Drop"
    }
  ],
  mens: [
    {
      image: "/storefront/hero-eclipse-new-arrivals.png",
      alt: "Men wearing forest, cream, and terracotta Eclipse-style apparel",
      eyebrow: "Men's merch",
      title: "Men's Eclipse layers.",
      copy: "Tees, hoodies, joggers, and headwear in the darker side of the Eclipse palette.",
      href: "/shop/mens#tees",
      cta: "Shop Men"
    },
    {
      image: "/storefront/hero-eclipse-mens.png",
      alt: "Group wearing premium casual Eclipse-style apparel",
      eyebrow: "Field ready",
      title: "Heavyweight, not heavy-handed.",
      copy: "Built for repeat wear with enough polish to leave the house in.",
      href: "/shop/mens#hoodies",
      cta: "Shop Layers"
    }
  ],
  womens: [
    {
      image: "/storefront/hero-eclipse-womens.png",
      alt: "Women wearing sage tank, cream crop tee, forest hoodie, and terracotta joggers",
      eyebrow: "Women's merch",
      title: "Women's Eclipse essentials.",
      copy: "Crops, tanks, hoodies, leggings, and soft layers with clean logo placement.",
      href: "/shop/womens#tees",
      cta: "Shop Women"
    },
    {
      image: "/storefront/hero-eclipse-mens.png",
      alt: "Eclipse apparel group in warm studio light",
      eyebrow: "New layers",
      title: "Soft enough for off-duty.",
      copy: "A calmer palette, better textures, and pieces that do not need an explanation.",
      href: "/shop/womens#tanks",
      cta: "Shop Layers"
    }
  ],
  youth: [
    {
      image: "/storefront/hero-eclipse-home.png",
      alt: "Family wearing Eclipse-style youth merch in forest, cream, and terracotta",
      eyebrow: "Youth merch",
      title: "Smaller sizes, same Eclipse feel.",
      copy: "Youth tees and hoodies made to match the rest of the shop drop.",
      href: "/shop/youth#tees",
      cta: "Shop Kids"
    },
    {
      image: "/storefront/hero-eclipse-youth.png",
      alt: "Colorful Eclipse-style merch rack with caps and folded apparel",
      eyebrow: "Mini uniforms",
      title: "Easy colors. Easier mornings.",
      copy: "Soft staples for the little people who somehow need three outfit changes.",
      href: "/shop/youth#hoodies",
      cta: "Shop Youth"
    }
  ],
  "new-arrivals": [
    {
      image: "/storefront/hero-eclipse-youth.png",
      alt: "New Eclipse-style apparel, caps, drinkware, and accessories arranged in a studio",
      eyebrow: "New & Featured",
      title: "Fresh drop, clean shelves.",
      copy: "New colorways, fresh layers, and the pieces everyone grabs first.",
      href: "/shop/new-arrivals#tees",
      cta: "Shop New"
    },
    {
      image: "/storefront/hero-eclipse-mens.png",
      alt: "Group wearing new Eclipse-style apparel in forest, sage, cream, and terracotta",
      eyebrow: "New colors",
      title: "The palette finally showed up.",
      copy: "Forest, sage, terracotta, bone, and black in a stack that actually works together.",
      href: "/shop/best-sellers",
      cta: "Best Sellers"
    }
  ],
  sale: [
    {
      image: "/storefront/hero-eclipse-sale.png",
      alt: "Women wearing Eclipse-style apparel in sage, cream, forest, and terracotta",
      eyebrow: "Sale",
      title: "Good stuff, friendlier math.",
      copy: "End-of-run pieces, low-stock favorites, and under-$25 add-ons while they last.",
      href: "/shop/sale#tees",
      cta: "Shop Sale"
    },
    {
      image: "/storefront/hero-eclipse-new-arrivals.png",
      alt: "Men wearing Eclipse-style basics in a warm studio sale hero",
      eyebrow: "Last call",
      title: "Not clearance. Just moving fast.",
      copy: "A tighter edit of the pieces most likely to vanish from the shelf.",
      href: "/shop/sale#accessories",
      cta: "Shop Deals"
    }
  ]
};

export function StorefrontNav({ products, activeSegment }: { products: StorefrontProduct[]; activeSegment?: string }) {
  const taxonomy = buildTaxonomy(products);
  const audienceBySlug = new Map(taxonomy.audiences.map((item) => [item.slug, item]));
  const sectionHref = (segment: string, section: string) => `/shop/${segment}#${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const megaMenus = [
    {
      key: "new",
      label: "New & Featured",
      href: "/shop/new-arrivals",
      columns: [
        { title: "New & Featured", links: [{ label: "New Arrivals", href: "/shop/new-arrivals" }, { label: "Best Sellers", href: "/shop/best-sellers" }, { label: "Sale", href: "/shop/sale" }] },
        { title: "Shop by Fit", links: [{ label: "Tees", href: "/shop/mens#tees" }, { label: "Hoodies", href: "/shop/womens#hoodies" }, { label: "Headwear", href: "/shop/headwear" }] },
        { title: "Collections", links: [{ label: "Everyday Kit", href: "/shop/mens" }, { label: "Field Ready", href: "/shop/womens" }, { label: "Desk Setup", href: "/shop/prints" }] }
      ]
    },
    {
      key: "men",
      label: "Men",
      href: "/shop/mens",
      columns: [
        { title: "Men's", links: [{ label: "Shop All", href: "/shop/mens" }, ...(audienceBySlug.get("mens")?.sections ?? []).slice(0, 2).map((section) => ({ label: section, href: sectionHref("mens", section) }))] },
        { title: "Customer Favorites", links: [{ label: "Heavyweight Logo Tee", href: "/shop/mens/heavyweight-logo-tee" }, { label: "Vintage Wash Hoodie", href: "/shop/mens/vintage-wash-hoodie" }, { label: "Fleece Shop Jogger", href: "/shop/mens/fleece-shop-jogger" }] },
        { title: "Clothing", links: (audienceBySlug.get("mens")?.sections ?? []).slice(2, 7).map((section) => ({ label: section, href: sectionHref("mens", section) })) }
      ]
    },
    {
      key: "women",
      label: "Women",
      href: "/shop/womens",
      columns: [
        { title: "Women's", links: [{ label: "Shop All", href: "/shop/womens" }, ...(audienceBySlug.get("womens")?.sections ?? []).slice(0, 2).map((section) => ({ label: section, href: sectionHref("womens", section) }))] },
        { title: "Customer Favorites", links: [{ label: "Crop Logo Tee", href: "/shop/womens/crop-logo-tee" }, { label: "Ribbed Studio Tank", href: "/shop/womens/ribbed-studio-tank" }, { label: "Performance Logo Legging", href: "/shop/womens/performance-logo-legging" }] },
        { title: "Clothing", links: (audienceBySlug.get("womens")?.sections ?? []).slice(2, 7).map((section) => ({ label: section, href: sectionHref("womens", section) })) }
      ]
    },
    {
      key: "accessories",
      label: "Accessories",
      href: "/shop/accessories",
      columns: [
        { title: "Accessories", links: [{ label: "Shop All", href: "/shop/accessories" }, { label: "Headwear", href: "/shop/headwear" }, { label: "Drinkware", href: "/shop/drinkware" }] },
        { title: "Small Goods", links: [{ label: "Stickers", href: "/shop/stickers" }, { label: "Prints", href: "/shop/prints" }, { label: "Totes & Socks", href: "/shop/accessories" }] },
        { title: "Featured", links: [{ label: "Best Sellers", href: "/shop/best-sellers" }, { label: "Under $25", href: "/shop/sale" }, { label: "Giftable Merch", href: "/shop/accessories" }] }
      ]
    }
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#d9d2bd] bg-[#f4eadb]/95 text-[#0c1410] shadow-sm backdrop-blur">
      <div className="bg-[#16241c] text-[#e9e6d8]">
        <Link href="/shop/mens" className="mx-auto flex h-9 w-full max-w-[1760px] items-center justify-center gap-3 px-6 text-center text-xs font-black">
          New merch drop is live. Fresh tees, caps, drinkware, and decals for the Eclipse crew.
          <ArrowRight className="h-3.5 w-3.5 text-[#aebd84]" />
        </Link>
      </div>
      <div className="relative mx-auto grid max-w-[1760px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
        <Link href="/shop" className="font-title text-3xl font-black leading-none">Eclipse</Link>
        <nav className="hidden min-w-0 self-stretch whitespace-nowrap text-xs font-black uppercase xl:absolute xl:inset-y-0 xl:left-1/2 xl:flex xl:-translate-x-1/2 xl:items-stretch xl:justify-center xl:gap-5">
          {megaMenus.map((menu) => (
            <div key={menu.key} className="group flex items-center">
              <Link href={menu.href} className={`flex h-full items-center ${activeSegment && menu.href.endsWith(activeSegment) ? "text-[#7f3f2f]" : ""}`}>{menu.label}</Link>
              <div className="absolute left-4 right-4 top-[calc(100%-1px)] z-40 hidden rounded-xl border border-[#d9d2bd] bg-[#eee9df] p-5 shadow-2xl group-hover:block">
                <div className="mb-7 rounded-lg bg-[#ded7c9] py-4 text-center text-sm font-black">{menu.label}</div>
                <div className="grid max-w-4xl grid-cols-4 gap-10">
                  <div className="grid content-start gap-5 text-xs font-black uppercase">
                    <Link href="/shop">New Arrivals</Link>
                    <Link href="/shop/drinkware">Bestsellers</Link>
                  </div>
                  {menu.columns.map((column) => (
                    <div key={column.title}>
                      <p className="text-xs font-black uppercase">{column.title}</p>
                      <div className="mt-4 grid gap-3 text-sm font-bold normal-case text-[#4e5347]">
                        {column.links.map((link) => (
                          <Link key={link.href + link.label} href={link.href} className="text-left hover:text-[#0c1410]">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link href="/shop/youth" className={`flex h-full items-center ${activeSegment === "youth" ? "text-[#7f3f2f]" : ""}`}>Kids</Link>
          <Link href="/shop/sale" className="flex h-full items-center text-[#7f3f2f]">Sale</Link>
        </nav>
        <div className="flex items-center justify-end gap-3">
          <details className="relative xl:hidden">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full hover:bg-[#e9e6d8]"><Menu className="h-4 w-4" /></summary>
            <div className="absolute right-0 top-12 grid w-64 gap-2 rounded-md border border-[#d9d2bd] bg-white p-4 text-sm font-bold shadow-xl">
              {[...merchandisingSegments, ...audienceSegments, ...categorySegments].map((item) => <Link key={item.slug} href={`/shop/${item.slug}`}>{item.label}</Link>)}
            </div>
          </details>
          <Link href="/shop" className="hidden text-xs font-black uppercase md:inline">Shop</Link>
          <Link href="/shop/account" className="hidden text-xs font-black uppercase md:inline">Account</Link>
          <label className="relative hidden md:block">
            <input className="h-9 w-44 rounded-full border border-[#d9d2bd] bg-white/70 px-4 pr-9 text-xs font-bold outline-none placeholder:text-[#6b705f]" placeholder="Search" />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0c1410]" />
          </label>
          <Link href="/shop/account" className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-[#e9e6d8]"><Heart className="h-4 w-4" /></Link>
          <Link href="/shop/cart" className="relative grid h-9 w-9 place-items-center rounded-full bg-[#0c1410] text-[#aebd84]"><ShoppingCart className="h-4 w-4" /></Link>
        </div>
      </div>
    </header>
  );
}

export function ShopShell({ seed, activeSegment, children }: { seed: StorefrontSeed; activeSegment?: string; children: ReactNode }) {
  const products = activeProducts(seed);
  return (
    <section className="min-h-screen bg-[#f4eadb] text-[#0c1410]">
      <StorefrontHydrator seed={seed} />
      <StorefrontNav products={products} activeSegment={activeSegment} />
      {children}
      <footer className="mt-12 bg-[#0c1410] px-6 py-10 text-[#f4eadb]">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-4 text-sm font-semibold">
          <p>© 2026 Eclipse Systems. All rights reserved.</p>
          <div className="flex gap-5 text-[#cfd4c2]"><span>Refund policy</span><span>Privacy policy</span><span>Terms of service</span></div>
        </div>
      </footer>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#6b705f]">
      <Link href="/shop">Shop</Link>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <ChevronRight className="h-3 w-3" />
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="text-[#0c1410]">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const image = productImageUrl(product);
  return (
    <article style={{ backgroundColor: "#ffffff" }} className="group overflow-hidden rounded-[18px] border border-[#d9d2bd] bg-white p-3 text-[#0c1410] shadow-sm transition hover:-translate-y-0.5 hover:border-[#aebd84] hover:shadow-xl hover:shadow-[#0c1410]/10">
      <div style={{ backgroundColor: "#ffffff" }} className="relative overflow-hidden rounded-[16px] bg-white">
        <SaveButton className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-[#7f3f2f] transition hover:bg-white" />
        <Link href={productHref(product)} style={{ backgroundColor: "#ffffff" }} className="grid aspect-[1.24] w-full place-items-center overflow-hidden rounded-[16px] bg-white px-5 py-5">
          {image ? <img src={image} alt={product.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" /> : null}
        </Link>
      </div>
      <div className="pt-3">
        <div className="mb-4 flex items-center gap-2">
          {storefrontColorways.map((colorway) => (
            <span key={colorway.slug} className={`grid h-9 w-8 place-items-center rounded-md border bg-[#fbfaf6] shadow-sm ${defaultColorSlug(product) === colorway.slug ? "border-[#7f3f2f]" : "border-[#e1dccd]"}`}>
              <span className="h-3 w-4 rounded-full" style={{ backgroundColor: colorway.hex }} />
            </span>
          ))}
        </div>
        <Link href={productHref(product)} className="block">
          <p className="text-base font-semibold leading-5 text-[#0c1410]">{product.name}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#7f3f2f]">{product.category}</p>
        </Link>
        <p className="mt-6 text-sm font-semibold text-[#0c1410]">
          {formatStoreMoney(product.priceCents, product.currency)}
          <span className="ml-2 text-sm font-semibold text-[#9aa896] line-through">{formatStoreMoney(compareAt(product), product.currency)}</span>
        </p>
      </div>
      <div className="pt-5">
        <AddToCartButton product={product} className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-[#0c1410] px-3 text-sm font-black uppercase text-[#f4eadb] transition hover:bg-[#16241c]" />
      </div>
    </article>
  );
}

export function ShopIndex({ seed }: { seed: StorefrontSeed }) {
  const products = activeProducts(seed);
  const collectionCards = [
    {
      label: "New Arrivals",
      action: "Shop the drop",
      href: "/shop/headwear",
      product: products.find((product) => product.category === "Headwear") ?? products[0],
      className: "bg-[#16241c]"
    },
    {
      label: "Men's",
      action: "Shop men",
      href: "/shop/mens",
      product: products.find((product) => product.category === "Men's"),
      className: "bg-[#2a3a2f]",
      imageClassName: "scale-110"
    },
    {
      label: "Women's",
      action: "Shop women",
      href: "/shop/womens",
      product: products.find((product) => product.category === "Women's"),
      className: "bg-[#46674b]"
    },
    {
      label: "Best Sellers",
      action: "Crew favorites",
      href: "/shop/drinkware",
      product: products.find((product) => product.category === "Drinkware") ?? products.find((product) => product.category === "Accessories"),
      className: "bg-[#9aa896]"
    }
  ];
  return (
    <ShopShell seed={seed}>
      <main className="mx-auto max-w-[1760px] px-6 py-7">
        <StorefrontHeroCard slides={sectionHeroSlides.home} />
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collectionCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`group relative min-h-[360px] overflow-hidden rounded-3xl p-5 text-[#f4eadb] transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.className}`}
            >
              <div className="absolute inset-x-8 top-1/2 h-px bg-[#f4eadb]/20" />
              {card.product ? (
                <img
                  src={productImageUrl(card.product)}
                  alt={card.product.name}
                  className={`absolute left-1/2 top-1/2 h-[68%] w-[82%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-2xl transition duration-500 group-hover:scale-105 ${card.imageClassName ?? ""}`}
                />
              ) : null}
              <span className="absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f4eadb] bg-[#0c1410]/10 px-5 py-2 text-xs font-black uppercase tracking-[0.08em] backdrop-blur-sm">
                {card.label}
              </span>
              <span className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs font-black uppercase opacity-0 transition group-hover:opacity-100">
                {card.action}
              </span>
            </Link>
          ))}
        </section>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Link href="/shop/new-arrivals" className="rounded-md bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f3f2f]">Start here</p>
            <h2 className="mt-3 font-title text-4xl font-black">New & Featured</h2>
            <p className="mt-3 text-sm font-semibold text-[#6b705f]">Fresh arrivals, best sellers, and the pieces most likely to vanish.</p>
          </Link>
          <Link href="/shop/mens" className="rounded-md bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f3f2f]">Apparel</p>
            <h2 className="mt-3 font-title text-4xl font-black">Men + Women</h2>
            <p className="mt-3 text-sm font-semibold text-[#6b705f]">Tees, layers, bottoms, and everyday uniform pieces.</p>
          </Link>
          <Link href="/shop/accessories" className="rounded-md bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f3f2f]">Small goods</p>
            <h2 className="mt-3 font-title text-4xl font-black">Accessories</h2>
            <p className="mt-3 text-sm font-semibold text-[#6b705f]">Headwear, drinkware, totes, stickers, prints, and carry pieces.</p>
          </Link>
        </section>
        <section id="featured" className="mt-10 scroll-mt-32">
          <h2 className="font-title text-4xl font-black">Featured</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {products.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      </main>
    </ShopShell>
  );
}

export function ListingPage({ seed, segment, products }: { seed: StorefrontSeed; segment: string; products: StorefrontProduct[] }) {
  const label = segmentLabel(segment) ?? "Shop";
  const heroSlides = sectionHeroSlides[segment];
  return (
    <ShopShell seed={seed} activeSegment={segment}>
      <main className="mx-auto max-w-[1760px] px-6 py-8">
        {heroSlides ? <div className="mb-8"><StorefrontHeroCard slides={heroSlides} /></div> : null}
        <Breadcrumbs items={[{ label }]} />
        <header className="grid gap-4 border-b border-[#d9d2bd] pb-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f3f2f]">Collection</p>
            <h1 className="mt-2 font-title text-5xl font-black">{label}</h1>
          </div>
          <div className="text-sm font-bold text-[#6b705f]">{products.length} products</div>
        </header>
        <FilteredProductGrid products={products} segment={segment} />
      </main>
    </ShopShell>
  );
}

export function ProductDetailPage({ seed, segment, product }: { seed: StorefrontSeed; segment: string; product: StorefrontProduct }) {
  const related = activeProducts(seed).filter((item) => item.id !== product.id && (item.category === product.category || productType(item) === productType(product))).slice(0, 4);
  return (
    <ShopShell seed={seed} activeSegment={segment}>
      <main className="mx-auto max-w-[1760px] px-6 py-8">
        <Breadcrumbs items={[{ label: segmentLabel(segment) ?? product.category, href: `/shop/${segment}` }, { label: product.name }]} />
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ProductGallery product={product} />
          <div className="rounded-md bg-[#16241c] p-6 text-[#f4eadb]">
            <p className="text-sm font-black text-[#aebd84]">{product.category} / {productType(product)}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">{product.name}</h1>
            <p className="mt-4 text-[#cfd4c2]">{product.description}</p>
            <p className="mt-5 text-3xl font-black text-[#aebd84]">
              {formatStoreMoney(product.priceCents, product.currency)}
              <span className="ml-3 text-lg text-[#8f9b83] line-through">{formatStoreMoney(compareAt(product), product.currency)}</span>
            </p>
            <div className="mt-6"><ProductOptions product={product} sizes={sizesFor(product)} /></div>
          </div>
        </section>
        {related.length ? (
          <section className="mt-12">
            <h2 className="font-title text-3xl font-black">Related Items</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        ) : null}
      </main>
    </ShopShell>
  );
}
