"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { formatStoreMoney, type StorefrontProduct, type StorefrontSeed } from "@/lib/storefront-data";
import { defaultColorSlug, productHref, productImageUrl, productImages, productType, storefrontColorways } from "@/lib/storefront-taxonomy";
import { useStorefrontStore } from "@/lib/storefront-store";

export type StorefrontHeroSlide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  cta: string;
};

export function StorefrontHydrator({ seed }: { seed: StorefrontSeed }) {
  const hydrateSeed = useStorefrontStore((state) => state.hydrateSeed);

  useEffect(() => {
    hydrateSeed(seed);
  }, [hydrateSeed, seed]);

  return null;
}

export function AddToCartButton({ product, size, className }: { product: StorefrontProduct; size?: string; className?: string }) {
  const addToCart = useStorefrontStore((state) => state.addToCart);
  return (
    <button
      type="button"
      onClick={() => addToCart(product.id, 1, size)}
      className={className ?? "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0c1410] px-5 text-sm font-black uppercase text-[#f4eadb] transition hover:bg-[#16241c]"}
    >
      <ShoppingCart className="h-4 w-4" />
      Add to cart
    </button>
  );
}

export function SaveButton({ className }: { className?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-label="Save product"
      onClick={() => setSaved((current) => !current)}
      className={className ?? `grid h-10 w-10 place-items-center rounded-full ${saved ? "bg-[#0c1410] text-[#aebd84]" : "bg-white text-[#7f3f2f]"}`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}

export function StorefrontHeroCard({ slides }: { slides: StorefrontHeroSlide[] }) {
  const [selected, setSelected] = useState(0);
  const active = slides[selected] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setSelected((current) => (current + 1) % slides.length);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!active) return null;

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-[28px] bg-[#16241c] text-[#f4eadb]">
      <div className="absolute left-0 top-24 z-20 hidden w-52 bg-[#f4eadb] p-9 text-[#0c1410] shadow-xl md:block">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#46674b]">Featured</p>
        <div className="mt-5 grid gap-2 text-sm font-black">
          <a href="/shop/mens#tees" className="text-left hover:text-[#46674b]">Men's Tees</a>
          <a href="/shop/womens#hoodies" className="text-left hover:text-[#46674b]">Women's Layers</a>
          <a href="/shop/headwear" className="text-left hover:text-[#46674b]">New Headwear</a>
        </div>
      </div>
      {slides.map((slide, index) => (
        <img
          key={slide.image}
          src={slide.image}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${selected === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,20,16,0.82),rgba(12,20,16,0.28)_48%,rgba(12,20,16,0.72)),linear-gradient(0deg,rgba(12,20,16,0.44),rgba(12,20,16,0.08)_45%,rgba(12,20,16,0.28))]" />
      <div className="relative z-10 ml-auto flex min-h-[560px] max-w-2xl flex-col justify-center px-6 py-12 text-right md:px-12">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#aebd84]">{active.eyebrow}</p>
        <h1 className="mt-4 font-title text-5xl font-black leading-[0.9] md:text-7xl">{active.title}</h1>
        <p className="mt-4 text-sm font-black md:text-base">{active.copy}</p>
        <div className="mt-7 flex justify-end gap-3">
          <a href={active.href} className="inline-flex h-11 items-center bg-[#aebd84] px-6 text-xs font-black uppercase text-[#0c1410]">{active.cta}</a>
          <a href="#featured" className="inline-flex h-11 items-center border border-[#aebd84] bg-[#0c1410]/35 px-6 text-xs font-black uppercase text-[#f4eadb]">Shop All</a>
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-6 right-8 z-10 hidden gap-2 md:flex">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show hero slide ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full ${selected === index ? "bg-[#f4eadb]" : "bg-[#f4eadb]/50"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function ProductGallery({ product }: { product: StorefrontProduct }) {
  const images = useMemo(() => productImages(product), [product]);
  const [selected, setSelected] = useState(defaultColorSlug(product) ?? images[0]?.slug ?? storefrontColorways[0].slug);
  const active = images.find((item) => item.slug === selected) ?? images[0];

  if (!active) return null;

  return (
    <div className="grid gap-4">
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-md bg-white">
        <SaveButton className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-[#7f3f2f] shadow-sm" />
        <img src={active.url} alt={`${product.name} in ${active.name}`} className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <button
            key={image.slug}
            type="button"
            onClick={() => setSelected(image.slug)}
            aria-label={`${image.name} colorway`}
            className={`grid h-11 w-11 place-items-center rounded-md border bg-white ${selected === image.slug ? "border-[#7f3f2f]" : "border-[#d9d2bd]"}`}
          >
            <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: image.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductOptions({ product, sizes }: { product: StorefrontProduct; sizes: string[] }) {
  const [size, setSize] = useState(sizes[0]);
  return (
    <div className="grid gap-5">
      {sizes.length ? (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6d6a4a]">Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                className={`h-10 min-w-12 rounded-md border px-3 text-sm font-bold ${size === item ? "border-[#0c1410] bg-[#0c1410] text-[#f4eadb]" : "border-[#d9d2bd] bg-white text-[#0c1410]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <AddToCartButton product={product} size={size} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0c1410] px-5 text-sm font-black uppercase text-[#f4eadb] transition hover:bg-[#16241c]" />
    </div>
  );
}

function compareAt(product: StorefrontProduct) {
  return Math.ceil(product.priceCents * 1.18 / 100) * 100;
}

function broadGroup(product: StorefrontProduct, segment: string) {
  const type = productType(product);
  if (["new-arrivals", "best-sellers", "sale"].includes(segment)) {
    if (["Tees", "Pocket Tees", "Long Sleeves", "Tanks"].includes(type)) return "Apparel";
    if (["Hoodies", "Crews", "Jackets"].includes(type)) return "Layers";
    if (["Joggers", "Leggings"].includes(type)) return "Bottoms";
    if (["Caps", "Beanies"].includes(type)) return "Headwear";
    return "Accessories";
  }
  if (["mens", "womens", "youth"].includes(segment)) {
    if (["Tees", "Pocket Tees", "Long Sleeves", "Tanks"].includes(type)) return "Tops";
    if (["Hoodies", "Crews", "Jackets"].includes(type)) return "Layers";
    if (["Joggers", "Leggings"].includes(type)) return "Bottoms";
    return type;
  }
  if (segment === "accessories") {
    if (["Totes", "Pouches", "Lanyards"].includes(type)) return "Carry";
    if (["Socks", "Pins"].includes(type)) return "Small Goods";
    return type;
  }
  return type;
}

function matchesPrice(product: StorefrontProduct, price: string) {
  if (price === "under-25") return product.priceCents < 2500;
  if (price === "25-50") return product.priceCents >= 2500 && product.priceCents <= 5000;
  if (price === "50-plus") return product.priceCents > 5000;
  return true;
}

export function FilteredProductGrid({ products, segment }: { products: StorefrontProduct[]; segment: string }) {
  const [audience, setAudience] = useState("all");
  const [price, setPrice] = useState("all");
  const [type, setType] = useState("all");
  const [color, setColor] = useState("all");
  const types = useMemo(() => Array.from(new Set(products.map(productType))), [products]);
  const audiences = useMemo(() => Array.from(new Set(products.map((product) => product.category))), [products]);
  const activeColor = color === "all" ? undefined : color;
  const filtered = useMemo(() => products.filter((product) => {
    if (audience !== "all" && product.category !== audience) return false;
    if (type !== "all" && productType(product) !== type) return false;
    if (!matchesPrice(product, price)) return false;
    return true;
  }), [audience, price, products, type]);
  const groups = useMemo(() => {
    const next = new Map<string, StorefrontProduct[]>();
    for (const product of filtered) {
      const group = broadGroup(product, segment);
      next.set(group, [...(next.get(group) ?? []), product]);
    }
    return Array.from(next.entries()).map(([name, items]) => ({ name, products: items }));
  }, [filtered, segment]);
  const hasFilters = audience !== "all" || price !== "all" || type !== "all" || color !== "all";

  return (
    <div id="featured" className="mt-8 scroll-mt-36">
      <div className="sticky top-[105px] z-30 -mx-6 overflow-x-auto border-y border-[#d9d2bd] bg-[#f4eadb]/95 px-6 py-3 backdrop-blur">
        <div className="flex min-w-max items-center gap-3">
          {audiences.length > 1 ? (
            <select value={audience} onChange={(event) => setAudience(event.target.value)} className="h-10 rounded-full border border-[#d9d2bd] bg-white px-4 text-xs font-black uppercase">
              <option value="all">All genders</option>
              {audiences.map((item) => <option key={item} value={item}>{item.replace(" / Kids", "")}</option>)}
            </select>
          ) : null}
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-full border border-[#d9d2bd] bg-white px-4 text-xs font-black uppercase">
            <option value="all">All types</option>
            {types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={price} onChange={(event) => setPrice(event.target.value)} className="h-10 rounded-full border border-[#d9d2bd] bg-white px-4 text-xs font-black uppercase">
            <option value="all">All prices</option>
            <option value="under-25">Under $25</option>
            <option value="25-50">$25-$50</option>
            <option value="50-plus">$50+</option>
          </select>
          <div className="flex items-center gap-2 rounded-full border border-[#d9d2bd] bg-white px-3 py-2">
            <button type="button" onClick={() => setColor("all")} className={`text-xs font-black uppercase ${color === "all" ? "text-[#7f3f2f]" : "text-[#6b705f]"}`}>All colors</button>
            {storefrontColorways.map((colorway) => (
              <button
                key={colorway.slug}
                type="button"
                onClick={() => setColor(colorway.slug)}
                aria-label={colorway.name}
                className={`h-5 w-5 rounded-full border ${color === colorway.slug ? "border-[#7f3f2f] ring-2 ring-[#7f3f2f]/25" : "border-black/10"}`}
                style={{ backgroundColor: colorway.hex }}
              />
            ))}
          </div>
          {hasFilters ? (
            <button type="button" onClick={() => { setAudience("all"); setPrice("all"); setType("all"); setColor("all"); }} className="h-10 rounded-full border border-[#d9d2bd] bg-[#0c1410] px-4 text-xs font-black uppercase text-[#f4eadb]">
              Clear
            </button>
          ) : null}
          <span className="pl-2 text-xs font-black uppercase text-[#6b705f]">{filtered.length} items</span>
        </div>
      </div>
      <div className="mt-8 grid gap-12">
        {groups.map((group) => (
          <section key={group.name} id={group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-40">
            <div className="flex items-end justify-between gap-4 border-b border-[#d9d2bd] pb-3">
              <h2 className="font-title text-3xl font-black">{group.name}</h2>
              <p className="text-xs font-black uppercase text-[#6b705f]">{group.products.length} items</p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {group.products.map((product) => <FilterProductCard key={product.id} product={product} colorSlug={activeColor} />)}
            </div>
          </section>
        ))}
        {!groups.length ? <p className="rounded-md bg-white p-8 text-center text-sm font-bold text-[#6b705f]">No products match those filters.</p> : null}
      </div>
    </div>
  );
}

function FilterProductCard({ product, colorSlug }: { product: StorefrontProduct; colorSlug?: string }) {
  const image = productImageUrl(product, colorSlug ?? defaultColorSlug(product));
  return (
    <article style={{ backgroundColor: "#ffffff" }} className="group overflow-hidden rounded-[18px] border border-[#d9d2bd] bg-white p-3 text-[#0c1410] shadow-sm transition hover:-translate-y-0.5 hover:border-[#aebd84] hover:shadow-xl hover:shadow-[#0c1410]/10">
      <div style={{ backgroundColor: "#ffffff" }} className="relative overflow-hidden rounded-[16px] bg-white">
        <SaveButton className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-[#7f3f2f] transition hover:bg-white" />
        <a href={productHref(product)} style={{ backgroundColor: "#ffffff" }} className="grid aspect-[1.24] w-full place-items-center overflow-hidden rounded-[16px] bg-white px-5 py-5">
          {image ? <img src={image} alt={product.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" /> : null}
        </a>
      </div>
      <div className="pt-3">
        <div className="mb-4 flex items-center gap-2">
          {storefrontColorways.slice(0, 4).map((colorway) => (
            <span key={colorway.slug} className={`grid h-9 w-8 place-items-center rounded-md border bg-[#fbfaf6] shadow-sm ${(colorSlug ?? defaultColorSlug(product)) === colorway.slug ? "border-[#7f3f2f]" : "border-[#e1dccd]"}`}>
              <span className="h-3 w-4 rounded-full" style={{ backgroundColor: colorway.hex }} />
            </span>
          ))}
        </div>
        <a href={productHref(product)} className="block">
          <p className="text-base font-semibold leading-5 text-[#0c1410]">{product.name}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#7f3f2f]">{product.category}</p>
        </a>
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
