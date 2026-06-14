import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);

for (const envPath of [".env.local", ".env"]) {
  if (existsSync(envPath)) {
    process.loadEnvFile?.(envPath);
  }
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const pixabayKey = process.env.PIXABAY_API_KEY;
const root = process.cwd();
const publicProductsDir = path.join(root, "public", "products");
const orgSlug = process.env.STOREFRONT_ORG_SLUG;
const orgIdEnv = process.env.STOREFRONT_ORG_ID;
const taxRate = 0.0825;

type ProductStatus = "active" | "draft" | "archived";
type Category = "Men's" | "Women's" | "Youth / Kids" | "Headwear" | "Accessories" | "Stickers & Decals" | "Drinkware" | "Prints";
type ProductSeed = {
  slug: string;
  name: string;
  category: Category;
  type: string;
  colors: string[];
  sizes?: string[];
  priceCents: number;
  description: string;
  status?: ProductStatus;
  low?: boolean;
  out?: boolean;
  best?: boolean;
  query: string;
};

const apparelSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const youthSizes = ["YXS", "YS", "YM", "YL", "YXL"];
const oneSize = ["OS"];

const products: ProductSeed[] = [
  { slug: "mens-heavyweight-logo-tee", name: "Heavyweight Logo Tee", category: "Men's", type: "tee", colors: ["Black", "Forest", "Cream"], sizes: apparelSizes, priceCents: 2800, best: true, query: "black t-shirt apparel", description: "A sturdy daily tee with a heavyweight handfeel and crisp Storefront mark. Built for repeat wear without losing its shape." },
  { slug: "mens-vintage-wash-hoodie", name: "Vintage Wash Hoodie", category: "Men's", type: "hoodie", colors: ["Washed Black", "Olive"], sizes: apparelSizes, priceCents: 6200, best: true, query: "olive hoodie apparel", description: "Soft fleece with a broken-in wash and oversized front pocket. The tonal chest hit keeps it understated." },
  { slug: "mens-trail-crewneck", name: "Trail Crew Crewneck", category: "Men's", type: "crewneck", colors: ["Pine", "Oat"], sizes: apparelSizes, priceCents: 5400, query: "green sweatshirt apparel", description: "A midweight crewneck made for cool mornings and late shop nights. Ribbed cuffs and a relaxed fit keep it easy." },
  { slug: "mens-long-sleeve-field-shirt", name: "Long Sleeve Field Shirt", category: "Men's", type: "long sleeve", colors: ["Ivory", "Charcoal"], sizes: apparelSizes, priceCents: 3400, query: "long sleeve shirt apparel", description: "A clean long sleeve with sleeve graphics and a soft cotton feel. Layers well under jackets or over tanks." },
  { slug: "mens-workbench-tank", name: "Workbench Tank", category: "Men's", type: "tank", colors: ["Black", "Sage"], sizes: apparelSizes, priceCents: 2600, query: "mens tank top apparel", description: "Lightweight tank with wide binding and a square hem. Made for gym days, summer markets, and travel." },
  { slug: "mens-fleece-jogger", name: "Fleece Shop Jogger", category: "Men's", type: "joggers", colors: ["Black", "Heather Grey"], sizes: apparelSizes, priceCents: 5800, low: true, best: true, query: "black joggers apparel", description: "Tapered fleece joggers with a soft interior and secure back pocket. Coordinates with the Storefront hoodie line." },
  { slug: "mens-pocket-tee", name: "Pocket Mark Tee", category: "Men's", type: "tee", colors: ["Clay", "Navy"], sizes: apparelSizes, priceCents: 3000, query: "pocket t-shirt apparel", description: "A garment-dyed pocket tee with a small woven label. Easy colorways make it a shelf staple." },
  { slug: "mens-zip-hoodie", name: "Full Zip Utility Hoodie", category: "Men's", type: "hoodie", colors: ["Black", "Moss"], sizes: apparelSizes, priceCents: 6400, status: "draft", query: "zip hoodie apparel", description: "A full zip hoodie with a structured hood and split kangaroo pocket. Drafted for the next seasonal drop." },
  { slug: "womens-crop-logo-tee", name: "Crop Logo Tee", category: "Women's", type: "crop tee", colors: ["Cream", "Black", "Sage"], sizes: apparelSizes, priceCents: 2600, best: true, query: "crop t-shirt apparel", description: "A cropped tee with a boxy fit and soft neckline. The front mark sits high for easy styling." },
  { slug: "womens-vintage-hoodie", name: "Vintage Wash Hoodie", category: "Women's", type: "hoodie", colors: ["Dusty Olive", "Bone"], sizes: apparelSizes, priceCents: 6000, query: "womens hoodie apparel", description: "Plush fleece with a worn-in wash and slightly shorter body. Comfortable without feeling bulky." },
  { slug: "womens-ribbed-tank", name: "Ribbed Studio Tank", category: "Women's", type: "tank", colors: ["Black", "Oat"], sizes: apparelSizes, priceCents: 2400, query: "ribbed tank top apparel", description: "A ribbed tank with a close fit and clean binding. Designed as an everyday base layer." },
  { slug: "womens-performance-legging", name: "Performance Logo Legging", category: "Women's", type: "leggings", colors: ["Black", "Forest"], sizes: apparelSizes, priceCents: 5200, best: true, query: "black leggings apparel", description: "Supportive leggings with a smooth waistband and tonal ankle mark. Good for errands, travel, and training." },
  { slug: "womens-relaxed-tee", name: "Relaxed Shop Tee", category: "Women's", type: "tee", colors: ["Ivory", "Washed Black"], sizes: apparelSizes, priceCents: 2800, query: "womens t-shirt apparel", description: "A relaxed tee with a draped shoulder and soft jersey feel. Printed with the Storefront wordmark." },
  { slug: "womens-fleece-crew", name: "Sunday Fleece Crew", category: "Women's", type: "crewneck", colors: ["Heather", "Sage"], sizes: apparelSizes, priceCents: 5200, low: true, query: "womens sweatshirt apparel", description: "A cozy crewneck with brushed fleece and ribbed side panels. The fit is roomy but polished." },
  { slug: "womens-long-sleeve", name: "Market Long Sleeve", category: "Women's", type: "long sleeve", colors: ["White", "Graphite"], sizes: apparelSizes, priceCents: 3400, status: "draft", query: "womens long sleeve shirt", description: "Long sleeve jersey with a sleeve print and minimal chest mark. Prepared for a limited run." },
  { slug: "womens-cropped-hoodie", name: "Cropped Utility Hoodie", category: "Women's", type: "hoodie", colors: ["Black", "Ecru"], sizes: apparelSizes, priceCents: 5800, query: "cropped hoodie apparel", description: "A cropped fleece hoodie with a structured hood and wide rib hem. Easy over leggings or denim." },
  { slug: "youth-logo-tee", name: "Youth Logo Tee", category: "Youth / Kids", type: "tee", colors: ["Black", "Cream"], sizes: youthSizes, priceCents: 2400, query: "kids t-shirt apparel", description: "A soft youth tee with a durable screen print. Built for school days, markets, and weekend wear." },
  { slug: "youth-mini-hoodie", name: "Mini Maker Hoodie", category: "Youth / Kids", type: "hoodie", colors: ["Forest", "Grey"], sizes: youthSizes, priceCents: 4800, query: "kids hoodie apparel", description: "A cozy youth hoodie with a front pouch pocket and cheerful back graphic. Easy to wash and easy to love." },
  { slug: "youth-sprout-tee", name: "Sprout Badge Tee", category: "Youth / Kids", type: "tee", colors: ["Sage", "White"], sizes: youthSizes, priceCents: 2400, low: true, query: "children t-shirt apparel", description: "A playful badge tee with a small front icon. Lightweight cotton keeps it comfortable all day." },
  { slug: "youth-varsity-hoodie", name: "Varsity Wordmark Hoodie", category: "Youth / Kids", type: "hoodie", colors: ["Navy", "Oat"], sizes: youthSizes, priceCents: 5000, status: "draft", query: "youth hoodie apparel", description: "A youth hoodie with a collegiate wordmark and soft fleece interior. Drafted for back-to-school merchandising." },
  { slug: "headwear-classic-snapback", name: "Classic Logo Snapback", category: "Headwear", type: "snapback", colors: ["Black", "Forest"], sizes: oneSize, priceCents: 3200, best: true, query: "black snapback hat", description: "Structured snapback with a flat brim and embroidered Storefront mark. Adjustable closure fits most." },
  { slug: "headwear-dad-cap", name: "Everyday Dad Cap", category: "Headwear", type: "dad cap", colors: ["Stone", "Olive"], sizes: oneSize, priceCents: 2800, query: "dad cap hat", description: "Unstructured cotton cap with a curved brim and low-profile embroidery. A reliable everyday hat." },
  { slug: "headwear-trail-beanie", name: "Trail Crew Beanie", category: "Headwear", type: "beanie", colors: ["Charcoal", "Moss"], sizes: oneSize, priceCents: 2200, low: true, query: "knit beanie", description: "A warm rib-knit beanie with a woven Storefront label. Packs small and wears everywhere." },
  { slug: "headwear-rope-cap", name: "Rope Detail Cap", category: "Headwear", type: "cap", colors: ["Cream", "Black"], sizes: oneSize, priceCents: 3000, query: "rope cap hat", description: "A vintage-inspired cap with rope trim and embroidered badge. Lightweight and adjustable." },
  { slug: "headwear-watch-cap", name: "Dockside Watch Cap", category: "Headwear", type: "beanie", colors: ["Navy", "Camel"], sizes: oneSize, priceCents: 2200, status: "archived", query: "winter beanie hat", description: "A classic cuffed watch cap with a tight knit and heritage look. Archived after the winter capsule." },
  { slug: "accessory-canvas-tote", name: "Market Canvas Tote", category: "Accessories", type: "tote", colors: ["Natural"], sizes: oneSize, priceCents: 1800, best: true, query: "canvas tote bag", description: "A sturdy cotton tote with long handles and a large front print. Sized for groceries, books, and daily carry." },
  { slug: "accessory-crew-socks", name: "Stacked Logo Crew Socks", category: "Accessories", type: "socks", colors: ["Cream", "Black"], sizes: ["S/M", "L/XL"], priceCents: 1200, query: "crew socks product", description: "Cushioned crew socks with a stacked logo knit into the ankle. Soft enough for lounging and durable enough for daily wear." },
  { slug: "accessory-enamel-pin", name: "Register Enamel Pin", category: "Accessories", type: "pin", colors: ["Sage"], sizes: oneSize, priceCents: 800, query: "enamel pin product", description: "A small enamel pin inspired by checkout counters and market stalls. Rubber clutch back keeps it secure." },
  { slug: "accessory-logo-lanyard", name: "Logo Lanyard", category: "Accessories", type: "lanyard", colors: ["Black", "Olive"], sizes: oneSize, priceCents: 1000, query: "lanyard product", description: "A woven lanyard with breakaway clasp and metal swivel hook. Great for events, staff badges, and keys." },
  { slug: "accessory-crossbody-pouch", name: "Utility Crossbody Pouch", category: "Accessories", type: "pouch", colors: ["Black"], sizes: oneSize, priceCents: 2600, status: "draft", query: "small crossbody bag product", description: "Compact pouch with zip compartments and adjustable strap. Draft item for a practical accessories drop." },
  { slug: "stickers-holographic-pack", name: "Holographic Sticker Pack", category: "Stickers & Decals", type: "sticker pack", colors: ["Holographic"], sizes: oneSize, priceCents: 1200, best: true, query: "holographic stickers", description: "Five holographic stickers with Storefront icons and wordmarks. Weather-resistant vinyl makes them laptop and bottle friendly." },
  { slug: "stickers-die-cut-logo", name: "Die-Cut Logo Sticker", category: "Stickers & Decals", type: "sticker", colors: ["Cream"], sizes: oneSize, priceCents: 400, query: "die cut sticker", description: "A clean die-cut logo sticker printed on durable vinyl. A simple add-on for every order." },
  { slug: "stickers-register-single", name: "Register Icon Sticker", category: "Stickers & Decals", type: "sticker", colors: ["Sage"], sizes: oneSize, priceCents: 400, query: "vinyl sticker", description: "Single register icon sticker with a satin finish. Designed for notebooks, laptops, and shipping stations." },
  { slug: "stickers-window-decal", name: "Shop Window Vinyl Decal", category: "Stickers & Decals", type: "vinyl decal", colors: ["White"], sizes: oneSize, priceCents: 1200, out: true, query: "window decal vinyl", description: "Large white vinyl decal for doors, counters, and display windows. Transfer tape included for easy application." },
  { slug: "stickers-mini-label-pack", name: "Mini Label Sticker Pack", category: "Stickers & Decals", type: "sticker pack", colors: ["Mixed"], sizes: oneSize, priceCents: 1200, query: "sticker pack product", description: "A sheet of mini labels inspired by packing slips and shop tags. Perfect for planners and packaging." },
  { slug: "stickers-bumper-decal", name: "Market Bumper Decal", category: "Stickers & Decals", type: "vinyl decal", colors: ["Black"], sizes: oneSize, priceCents: 800, query: "bumper sticker", description: "A bold bumper decal with outdoor-rated adhesive. Made for cases, cars, coolers, and toolboxes." },
  { slug: "drinkware-ceramic-mug", name: "Morning Register Mug", category: "Drinkware", type: "mug", colors: ["Cream"], sizes: oneSize, priceCents: 1600, query: "ceramic mug product", description: "A ceramic diner-style mug with a wraparound Storefront graphic. Holds coffee, tea, or late-night launch fuel." },
  { slug: "drinkware-insulated-tumbler", name: "Insulated Market Tumbler", category: "Drinkware", type: "tumbler", colors: ["Black", "Sage"], sizes: oneSize, priceCents: 2800, best: true, query: "insulated tumbler product", description: "Double-wall tumbler with a spill-resistant lid and tonal logo. Keeps drinks steady through long packing days." },
  { slug: "drinkware-water-bottle", name: "Trail Water Bottle", category: "Drinkware", type: "water bottle", colors: ["Forest", "Steel"], sizes: oneSize, priceCents: 2400, query: "water bottle product", description: "Reusable bottle with a carry loop and wide mouth. Built for daily commutes and weekend pop-ups." },
  { slug: "drinkware-camp-cup", name: "Enamel Camp Cup", category: "Drinkware", type: "camp cup", colors: ["White"], sizes: oneSize, priceCents: 1800, query: "enamel camp mug", description: "Lightweight enamel cup with a speckled finish and printed badge. A rugged piece for coffee outside or desk duty." },
  { slug: "drinkware-straw-cup", name: "Studio Straw Cup", category: "Drinkware", type: "straw cup", colors: ["Clear"], sizes: oneSize, priceCents: 2200, query: "straw tumbler cup", description: "Reusable straw cup with a clean printed mark and easy-grip lid. Ideal for iced coffee and studio days." },
  { slug: "prints-launch-poster", name: "Launch Day Poster", category: "Prints", type: "poster", colors: ["Cream"], sizes: ["18x24"], priceCents: 2800, query: "poster print product", description: "A bold 18x24 poster celebrating launch-day energy and storefront windows. Printed on heavyweight matte stock." },
  { slug: "prints-market-art", name: "Night Market Art Print", category: "Prints", type: "art print", colors: ["Forest"], sizes: ["11x14"], priceCents: 2200, query: "art print product", description: "An illustrated market scene in the Storefront palette. Easy to frame for offices, studios, and counters." },
  { slug: "prints-window-sign", name: "Open Window Sign Print", category: "Prints", type: "print", colors: ["Sage"], sizes: ["12x18"], priceCents: 1800, query: "retail sign print", description: "A friendly open-sign print made for shop walls and checkout counters. Matte paper reduces glare." },
  { slug: "prints-archive-poster", name: "Archive Collection Poster", category: "Prints", type: "poster", colors: ["Black"], sizes: ["18x24"], priceCents: 3500, status: "archived", query: "black poster print", description: "A limited archive poster from the first Storefront merch run. Archived for historical order records." },
  { slug: "prints-counter-card", name: "Counter Card Mini Print", category: "Prints", type: "mini print", colors: ["Cream"], sizes: ["8x10"], priceCents: 1800, low: true, query: "small art print", description: "Small-format print designed for counters, shelves, and packing benches. A tidy add-on for gift orders." },
  { slug: "mens-shop-coach-jacket", name: "Shop Coach Jacket", category: "Men's", type: "jacket", colors: ["Black", "Forest"], sizes: apparelSizes, priceCents: 6400, query: "coach jacket apparel", description: "A lightweight snap jacket with a crisp back print and drawcord hem. Works as a top layer for events and cool mornings." },
  { slug: "womens-studio-jogger", name: "Studio Fleece Jogger", category: "Women's", type: "joggers", colors: ["Black", "Sage"], sizes: apparelSizes, priceCents: 5600, query: "womens joggers apparel", description: "Soft fleece joggers with a relaxed taper and tonal hip mark. Comfortable enough for travel and polished enough for errands." },
  { slug: "headwear-five-panel", name: "Five Panel Shop Cap", category: "Headwear", type: "cap", colors: ["Olive", "Black"], sizes: oneSize, priceCents: 3000, query: "five panel cap", description: "Low-profile five panel cap with a woven front patch. Lightweight nylon makes it easy to pack." },
  { slug: "accessory-packable-tote", name: "Packable Logo Tote", category: "Accessories", type: "tote", colors: ["Black"], sizes: oneSize, priceCents: 1800, query: "black tote bag product", description: "A foldable tote that tucks into its own pocket. Handy for pop-ups, shopping trips, and travel." },
  { slug: "drinkware-travel-mug", name: "Commuter Travel Mug", category: "Drinkware", type: "travel mug", colors: ["Steel"], sizes: oneSize, priceCents: 2800, query: "travel mug product", description: "A stainless travel mug with a secure lid and subtle Storefront mark. Keeps morning coffee moving." }
];

const customers = [
  ["Avery Stone", "avery.stone@example.com"],
  ["Maya Brooks", "maya.brooks@example.com"],
  ["Theo Carter", "theo.carter@example.com"],
  ["Nora Ellis", "nora.ellis@example.com"],
  ["Caleb Hart", "caleb.hart@example.com"],
  ["Iris Morgan", "iris.morgan@example.com"],
  ["Julian Price", "julian.price@example.com"],
  ["Lena Shaw", "lena.shaw@example.com"],
  ["Miles Turner", "miles.turner@example.com"],
  ["Sofia Grant", "sofia.grant@example.com"],
  ["Elliot Reed", "elliot.reed@example.com"],
  ["Harper Lane", "harper.lane@example.com"],
  ["Owen Hayes", "owen.hayes@example.com"],
  ["Ruby Quinn", "ruby.quinn@example.com"],
  ["Noah Wells", "noah.wells@example.com"]
];

const orderStatuses = ["pending", "paid", "fulfilled", "refunded"] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function uuidFor(value: string) {
  const hash = createHash("sha1").update(value).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function stockFor(product: ProductSeed, variantIndex: number) {
  if (product.out) return 0;
  if (product.low) return variantIndex === 0 ? 1 : 0;
  return 3 + ((product.slug.length + variantIndex * 7) % 9);
}

function svgFallback(product: ProductSeed) {
  const label = product.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#0c1410"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#16241c" stroke="#2a3a2f" stroke-width="8"/>
  <path d="M280 235h240l52 88-56 42v200H284V365l-56-42 52-88z" fill="#aebd84"/>
  <path d="M330 235c22 44 118 44 140 0" fill="none" stroke="#0c1410" stroke-width="18" stroke-linecap="round"/>
  <text x="400" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#e9e6d8">${label}</text>
</svg>`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function cropWithSips(input: string, output: string) {
  const temp = `${output}.tmp.jpg`;
  await execFileAsync("sips", ["-Z", "900", input, "--out", temp]);
  await execFileAsync("sips", ["--cropToHeightWidth", "800", "800", temp, "--out", output]);
  await unlink(temp).catch(() => undefined);
}

async function ensureImage(product: ProductSeed, usedUrls: Set<string>) {
  await mkdir(publicProductsDir, { recursive: true });
  const pngPath = path.join(publicProductsDir, `${product.slug}.png`);
  const jpgPath = path.join(publicProductsDir, `${product.slug}.jpg`);
  const svgPath = path.join(publicProductsDir, `${product.slug}.svg`);
  if (existsSync(pngPath)) return `/products/${product.slug}.png`;
  if (existsSync(jpgPath)) return `/products/${product.slug}.jpg`;
  if (existsSync(svgPath)) return `/products/${product.slug}.svg`;

  if (pixabayKey) {
    try {
      const url = new URL("https://pixabay.com/api/");
      url.searchParams.set("key", pixabayKey);
      url.searchParams.set("q", product.query);
      url.searchParams.set("image_type", "photo");
      url.searchParams.set("per_page", "10");
      url.searchParams.set("safesearch", "true");
      url.searchParams.set("order", "popular");
      const response = await fetch(url);
      const data = await response.json() as { hits?: Array<{ webformatURL?: string; largeImageURL?: string }> };
      const hit = data.hits?.find((item) => {
        const imageUrl = item.largeImageURL ?? item.webformatURL;
        return imageUrl && !usedUrls.has(imageUrl);
      });
      const imageUrl = hit?.largeImageURL ?? hit?.webformatURL;
      if (imageUrl) {
        usedUrls.add(imageUrl);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Image download failed: ${imageResponse.status}`);
        const tempPath = path.join(publicProductsDir, `${product.slug}.source`);
        await writeFile(tempPath, Buffer.from(await imageResponse.arrayBuffer()));
        await cropWithSips(tempPath, jpgPath);
        await unlink(tempPath).catch(() => undefined);
        await sleep(1000);
        return `/products/${product.slug}.jpg`;
      }
    } catch (error) {
      console.warn(`Image fetch failed for ${product.slug}:`, error instanceof Error ? error.message : error);
    }
  }

  await writeFile(svgPath, svgFallback(product));
  return `/products/${product.slug}.svg`;
}

function receiptDataUrl(number: string) {
  const text = `Storefront receipt ${number}`;
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 50 760 Td (${text}) Tj ET
endstream endobj
trailer << /Root 1 0 R >>
%%EOF`;
  return `data:application/pdf;base64,${Buffer.from(pdf).toString("base64")}`;
}

async function main() {
  if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL env missing");
  const sql = postgres(connectionString, { max: 1, prepare: false });
  const usedUrls = new Set<string>();
  try {
    const orgRows = orgIdEnv
      ? await sql<{ id: string }[]>`SELECT id FROM organizations WHERE id = ${orgIdEnv}::uuid LIMIT 1`
      : orgSlug
        ? await sql<{ id: string }[]>`SELECT id FROM organizations WHERE slug = ${orgSlug} LIMIT 1`
        : await sql<{ id: string }[]>`SELECT id FROM organizations ORDER BY created_at NULLS LAST LIMIT 1`;
    const orgId = orgRows[0]?.id;
    if (!orgId) throw new Error("No organization found. Set STOREFRONT_ORG_ID or create a demo org first.");

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO store_settings (org_id, store_name, currency, tax_rate, branding)
        VALUES (${orgId}, 'Eclipse', 'USD', ${taxRate}, '{"primary":"#0c1410","accent":"#aebd84","logoText":"Eclipse"}'::jsonb)
        ON CONFLICT (org_id)
        DO UPDATE SET store_name = EXCLUDED.store_name, currency = EXCLUDED.currency, tax_rate = EXCLUDED.tax_rate, branding = EXCLUDED.branding, updated_at = now()
      `;
    });

    const imageBySlug = new Map<string, string>();
    for (const product of products) {
      imageBySlug.set(product.slug, await ensureImage(product, usedUrls));
    }

    await sql.begin(async (tx) => {
      for (const product of products) {
        const imageUrl = imageBySlug.get(product.slug)!;
        const rows = await tx<{ id: string }[]>`
          INSERT INTO products (org_id, name, description, category, price_cents, currency, sku, track_inventory, stock_qty, low_stock_threshold, status, image_url, is_best_seller, is_service)
          VALUES (${orgId}, ${product.name}, ${product.description}, ${product.category}, ${product.priceCents}, 'USD', ${product.slug.toUpperCase()}, true, 0, ${product.low || product.out ? 3 : 6}, ${product.status ?? "active"}, ${imageUrl}, ${Boolean(product.best)}, false)
          ON CONFLICT (org_id, sku)
          DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, price_cents = EXCLUDED.price_cents, currency = EXCLUDED.currency, low_stock_threshold = EXCLUDED.low_stock_threshold, status = EXCLUDED.status, image_url = EXCLUDED.image_url, is_best_seller = EXCLUDED.is_best_seller, is_service = false, track_inventory = true, updated_at = now()
          RETURNING id
        `;
        const productId = rows[0].id;
        let totalStock = 0;
        let variantIndex = 0;
        for (const color of product.colors) {
          for (const size of product.sizes ?? oneSize) {
            const stockQty = stockFor(product, variantIndex);
            totalStock += stockQty;
            await tx`
              INSERT INTO product_variants (org_id, product_id, size, color, sku, stock_qty)
              VALUES (${orgId}, ${productId}, ${size}, ${color}, ${`${product.slug}-${slugify(color)}-${slugify(size)}`.toUpperCase()}, ${stockQty})
              ON CONFLICT (product_id, size, color)
              DO UPDATE SET sku = EXCLUDED.sku, stock_qty = EXCLUDED.stock_qty, updated_at = now()
            `;
            variantIndex += 1;
          }
        }
        await tx`UPDATE products SET stock_qty = ${totalStock} WHERE id = ${productId} AND org_id = ${orgId}`;
      }

      for (const [name, email] of customers) {
        await tx`
          INSERT INTO customers (org_id, name, email)
          VALUES (${orgId}, ${name}, ${email})
          ON CONFLICT (org_id, email) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
        `;
      }

      const customerRows = await tx<{ id: string; email: string }[]>`SELECT id, email FROM customers WHERE org_id = ${orgId} AND email LIKE '%@example.com' ORDER BY email`;
      const productRows = await tx<{ id: string; name: string; price_cents: number; sku: string }[]>`SELECT id, name, price_cents, sku FROM products WHERE org_id = ${orgId} AND status = 'active' ORDER BY sku`;
      const variantRows = await tx<{ id: string; product_id: string; stock_qty: number }[]>`SELECT id, product_id, stock_qty FROM product_variants WHERE org_id = ${orgId}`;

      for (let index = 0; index < 20; index += 1) {
        const orderNumber = `MERCH-${String(1001 + index)}`;
        const customer = customerRows[index % customerRows.length];
        const status = orderStatuses[index % orderStatuses.length];
        const orderId = uuidFor(`${orgId}:${orderNumber}`);
        const placedAt = new Date(Date.now() - (index * 3 + 1) * 86_400_000);
        const count = 1 + (index % 4);
        const picked = Array.from({ length: count }, (_, itemIndex) => productRows[(index * 3 + itemIndex * 5) % productRows.length]);
        const subtotal = picked.reduce((sum, product, itemIndex) => sum + product.price_cents * (1 + ((index + itemIndex) % 2)), 0);
        const tax = Math.round(subtotal * taxRate);
        const orderRows = await tx<{ id: string }[]>`
          INSERT INTO orders (id, org_id, customer_id, status, subtotal_cents, tax_cents, total_cents, currency, placed_at)
          VALUES (${orderId}, ${orgId}, ${customer.id}, ${status}, ${subtotal}, ${tax}, ${subtotal + tax}, 'USD', ${placedAt.toISOString()})
          ON CONFLICT (id) DO UPDATE SET customer_id = EXCLUDED.customer_id, status = EXCLUDED.status, subtotal_cents = EXCLUDED.subtotal_cents, tax_cents = EXCLUDED.tax_cents, total_cents = EXCLUDED.total_cents, currency = EXCLUDED.currency, placed_at = EXCLUDED.placed_at, updated_at = now()
          RETURNING id
        `;
        const savedOrderId = orderRows[0]?.id ?? orderId;
        await tx`DELETE FROM order_items WHERE org_id = ${orgId} AND order_id = ${savedOrderId}`;
        for (const [itemIndex, product] of picked.entries()) {
          const variant = variantRows.find((entry) => entry.product_id === product.id);
          const qty = 1 + ((index + itemIndex) % 2);
          await tx`
            INSERT INTO order_items (org_id, order_id, product_id, product_variant_id, name_snapshot, qty, unit_price_cents)
            VALUES (${orgId}, ${savedOrderId}, ${product.id}, ${variant?.id ?? null}, ${product.name}, ${qty}, ${product.price_cents})
          `;
        }
        if (status === "paid" || status === "fulfilled") {
          await tx`
            INSERT INTO receipts (org_id, order_id, pdf_url, number, issued_at)
            VALUES (${orgId}, ${savedOrderId}, ${receiptDataUrl(orderNumber)}, ${orderNumber}, ${placedAt.toISOString()})
            ON CONFLICT (order_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url, number = EXCLUDED.number, issued_at = EXCLUDED.issued_at
          `;
        }
      }
    });

    const summary = await sql<{ products: number; variants: number; customers: number; orders: number; receipts: number; alerts: number }[]>`
      SELECT
        (SELECT count(*)::int FROM products WHERE org_id = ${orgId}) AS products,
        (SELECT count(*)::int FROM product_variants WHERE org_id = ${orgId}) AS variants,
        (SELECT count(*)::int FROM customers WHERE org_id = ${orgId}) AS customers,
        (SELECT count(*)::int FROM orders WHERE org_id = ${orgId}) AS orders,
        (SELECT count(*)::int FROM receipts WHERE org_id = ${orgId}) AS receipts,
        (SELECT count(*)::int FROM products WHERE org_id = ${orgId} AND track_inventory = true AND stock_qty <= low_stock_threshold) AS alerts
    `;
    console.log("Storefront demo seed complete:", summary[0]);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
