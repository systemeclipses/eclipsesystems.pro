import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { storefrontSeed, type StorefrontSeed } from "@/lib/storefront-data";

for (const envPath of [".env.local", ".env"]) {
  if (existsSync(envPath)) {
    process.loadEnvFile?.(envPath);
  }
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const publicProductsDir = existsSync(path.join(process.cwd(), "public", "products"))
  ? path.join(process.cwd(), "public", "products")
  : path.join(process.cwd(), "apps", "web", "public", "products");

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function preferredProductImageUrl(product: { sku: string; image_url: string | null }) {
  const slug = product.sku.toLowerCase();
  const deterministicPlacements = [
    "center_chest",
    "left_chest_pocket",
    "left_chest",
    "jogger_upper_left",
    "legging_lower_right",
    "cap",
    "beanie",
    "socks",
    "bag",
    "lanyard"
  ];
  for (const placement of deterministicPlacements) {
    const jpgPath = path.join(publicProductsDir, `${slug}-black-${placement}.jpg`);
    if (existsSync(jpgPath)) return `/products/${slug}-black-${placement}.jpg`;
  }
  const pngPath = path.join(publicProductsDir, `${slug}.png`);
  if (existsSync(pngPath)) return `/products/${slug}.png`;
  return product.image_url ?? undefined;
}

export async function getStorefrontSeed(): Promise<StorefrontSeed> {
  if (!connectionString) return storefrontSeed;

  const sql = postgres(connectionString, { max: 1, prepare: false });
  try {
    const orgRows = process.env.STOREFRONT_ORG_ID
      ? await sql<{ id: string }[]>`SELECT id FROM organizations WHERE id = ${process.env.STOREFRONT_ORG_ID}::uuid LIMIT 1`
      : process.env.STOREFRONT_ORG_SLUG
        ? await sql<{ id: string }[]>`SELECT id FROM organizations WHERE slug = ${process.env.STOREFRONT_ORG_SLUG} LIMIT 1`
        : await sql<{ org_id: string }[]>`SELECT org_id FROM store_settings ORDER BY updated_at DESC NULLS LAST LIMIT 1`;

    const orgId = "id" in (orgRows[0] ?? {}) ? (orgRows[0] as { id: string }).id : (orgRows[0] as { org_id?: string } | undefined)?.org_id;
    if (!orgId) return storefrontSeed;

    const [settingsRows, productRows, customerRows, orderRows, itemRows, receiptRows, adjustmentRows] = await Promise.all([
      sql<{
        org_id: string;
        store_name: string;
        currency: string;
        tax_rate: string | number;
        branding: StorefrontSeed["settings"]["branding"];
      }[]>`SELECT org_id, store_name, currency, tax_rate, branding FROM store_settings WHERE org_id = ${orgId} LIMIT 1`,
      sql<{
        id: string;
        org_id: string;
        name: string;
        description: string;
        category: string;
        price_cents: number;
        currency: string;
        sku: string;
        track_inventory: boolean;
        stock_qty: number;
        low_stock_threshold: number;
        status: StorefrontSeed["products"][number]["status"];
        image_url: string | null;
        is_service: boolean;
      }[]>`SELECT id, org_id, name, description, category, price_cents, currency, sku, track_inventory, stock_qty, low_stock_threshold, status, image_url, is_service FROM products WHERE org_id = ${orgId} ORDER BY status, category, name`,
      sql<{ id: string; org_id: string; name: string; email: string; created_at: Date }[]>`SELECT id, org_id, name, email, created_at FROM customers WHERE org_id = ${orgId} ORDER BY created_at DESC`,
      sql<{
        id: string;
        org_id: string;
        customer_id: string;
        status: StorefrontSeed["orders"][number]["status"];
        subtotal_cents: number;
        tax_cents: number;
        total_cents: number;
        currency: string;
        placed_at: Date;
      }[]>`SELECT id, org_id, customer_id, status, subtotal_cents, tax_cents, total_cents, currency, placed_at FROM orders WHERE org_id = ${orgId} ORDER BY placed_at DESC`,
      sql<{ id: string; org_id: string; order_id: string; product_id: string; name_snapshot: string; qty: number; unit_price_cents: number }[]>`SELECT id, org_id, order_id, product_id, name_snapshot, qty, unit_price_cents FROM order_items WHERE org_id = ${orgId}`,
      sql<{ id: string; org_id: string; order_id: string; pdf_url: string; number: string; issued_at: Date }[]>`SELECT id, org_id, order_id, pdf_url, number, issued_at FROM receipts WHERE org_id = ${orgId} ORDER BY issued_at DESC`,
      sql<{ id: string; org_id: string; product_id: string; delta: number; reason: string; created_at: Date }[]>`SELECT id, org_id, product_id, delta, reason, created_at FROM inventory_adjustments WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 100`
    ]);

    const settings = settingsRows[0];
    return {
      settings: settings
        ? {
            orgId: settings.org_id,
            storeName: settings.store_name,
            currency: settings.currency,
            taxRate: toNumber(settings.tax_rate),
            branding: settings.branding ?? storefrontSeed.settings.branding
          }
        : storefrontSeed.settings,
      products: productRows.map((product) => ({
        id: product.id,
        orgId: product.org_id,
        name: product.name,
        description: product.description,
        category: product.category,
        priceCents: product.price_cents,
        currency: product.currency,
        sku: product.sku,
        trackInventory: product.track_inventory,
        stockQty: product.stock_qty,
        lowStockThreshold: product.low_stock_threshold,
        status: product.status,
        imageUrl: preferredProductImageUrl(product),
        isService: product.is_service
      })),
      customers: customerRows.map((customer) => ({
        id: customer.id,
        orgId: customer.org_id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.created_at.toISOString()
      })),
      orders: orderRows.map((order) => ({
        id: order.id,
        orgId: order.org_id,
        customerId: order.customer_id,
        status: order.status,
        subtotalCents: order.subtotal_cents,
        taxCents: order.tax_cents,
        totalCents: order.total_cents,
        currency: order.currency,
        placedAt: order.placed_at.toISOString()
      })),
      orderItems: itemRows.map((item) => ({
        id: item.id,
        orgId: item.org_id,
        orderId: item.order_id,
        productId: item.product_id,
        nameSnapshot: item.name_snapshot,
        qty: item.qty,
        unitPriceCents: item.unit_price_cents
      })),
      receipts: receiptRows.map((receipt) => ({
        id: receipt.id,
        orgId: receipt.org_id,
        orderId: receipt.order_id,
        pdfUrl: receipt.pdf_url,
        number: receipt.number,
        issuedAt: receipt.issued_at.toISOString()
      })),
      inventoryAdjustments: adjustmentRows.map((adjustment) => ({
        id: adjustment.id,
        orgId: adjustment.org_id,
        productId: adjustment.product_id,
        delta: adjustment.delta,
        reason: adjustment.reason,
        createdAt: adjustment.created_at.toISOString()
      }))
    };
  } finally {
    await sql.end();
  }
}
