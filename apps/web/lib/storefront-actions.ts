"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { getActiveOrgId } from "@/lib/org";
import { db } from "@/src/db";

export async function updateStorefrontSettingsAction(input: { storeName: string; currency: string; taxRate: number }) {
  const orgId = await getActiveOrgId();
  await db.execute(sql`
    INSERT INTO store_settings (org_id, store_name, currency, tax_rate, branding)
    VALUES (${orgId}, ${input.storeName}, ${input.currency}, ${input.taxRate}, '{}'::jsonb)
    ON CONFLICT (org_id)
    DO UPDATE SET store_name = EXCLUDED.store_name, currency = EXCLUDED.currency, tax_rate = EXCLUDED.tax_rate, updated_at = now()
  `);
  revalidatePath("/storefront");
}

export async function upsertStorefrontProductAction(input: {
  id?: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  sku: string;
  trackInventory: boolean;
  stockQty: number;
  lowStockThreshold: number;
  status: "active" | "draft" | "archived";
  isService: boolean;
}) {
  const orgId = await getActiveOrgId();
  await db.execute(sql`
    INSERT INTO products (id, org_id, name, description, category, price_cents, currency, sku, track_inventory, stock_qty, low_stock_threshold, status, is_service)
    VALUES (COALESCE(${input.id ?? null}::uuid, gen_random_uuid()), ${orgId}, ${input.name}, ${input.description}, ${input.category}, ${input.priceCents}, ${input.currency}, ${input.sku}, ${input.trackInventory}, ${input.stockQty}, ${input.lowStockThreshold}, ${input.status}, ${input.isService})
    ON CONFLICT (org_id, sku)
    DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, price_cents = EXCLUDED.price_cents, currency = EXCLUDED.currency, track_inventory = EXCLUDED.track_inventory, stock_qty = EXCLUDED.stock_qty, low_stock_threshold = EXCLUDED.low_stock_threshold, status = EXCLUDED.status, is_service = EXCLUDED.is_service, updated_at = now()
  `);
  revalidatePath("/storefront");
  revalidatePath("/shop");
}

export async function adjustStorefrontInventoryAction(input: { productId: string; delta: number; reason: string }) {
  const orgId = await getActiveOrgId();
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE products
      SET stock_qty = GREATEST(0, stock_qty + ${input.delta}), track_inventory = true, updated_at = now()
      WHERE id = ${input.productId}::uuid AND org_id = ${orgId}
    `);
    await tx.execute(sql`
      INSERT INTO inventory_adjustments (org_id, product_id, delta, reason)
      VALUES (${orgId}, ${input.productId}::uuid, ${input.delta}, ${input.reason})
    `);
  });
  revalidatePath("/storefront");
  revalidatePath("/shop");
}

export async function transitionStorefrontOrderAction(input: { orderId: string; status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled" }) {
  const orgId = await getActiveOrgId();
  await db.transaction(async (tx) => {
    const existing = await tx.execute(sql<{ status: string }>`SELECT status FROM orders WHERE id = ${input.orderId}::uuid AND org_id = ${orgId} FOR UPDATE`);
    const previous = existing[0]?.status;
    if ((input.status === "refunded" || input.status === "cancelled") && previous !== "refunded" && previous !== "cancelled") {
      const items = await tx.execute(sql<{ product_id: string; qty: number }>`SELECT product_id, qty FROM order_items WHERE order_id = ${input.orderId}::uuid AND org_id = ${orgId}`);
      for (const item of items) {
        await tx.execute(sql`UPDATE products SET stock_qty = stock_qty + ${item.qty}, updated_at = now() WHERE id = ${item.product_id}::uuid AND org_id = ${orgId} AND track_inventory = true`);
        await tx.execute(sql`INSERT INTO inventory_adjustments (org_id, product_id, delta, reason) VALUES (${orgId}, ${item.product_id}::uuid, ${item.qty}, ${input.status || "order transition"})`);
      }
    }
    await tx.execute(sql`UPDATE orders SET status = ${input.status}, updated_at = now() WHERE id = ${input.orderId}::uuid AND org_id = ${orgId}`);
  });
  revalidatePath("/storefront");
}

export async function placeStorefrontOrderAction(input: {
  customer: { name: string; email: string };
  items: Array<{ productId: string; qty: number }>;
}) {
  const orgId = await getActiveOrgId();
  await db.transaction(async (tx) => {
    const settings = await tx.execute(sql<{ currency: string; tax_rate: string }>`SELECT currency, tax_rate FROM store_settings WHERE org_id = ${orgId} FOR UPDATE`);
    const currency = settings[0]?.currency ?? "USD";
    const taxRate = Number(settings[0]?.tax_rate ?? 0);
    const customerRows = await tx.execute(sql<{ id: string }>`
      INSERT INTO customers (org_id, name, email)
      VALUES (${orgId}, ${input.customer.name}, ${input.customer.email})
      ON CONFLICT (org_id, email) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING id
    `);
    const productIds = input.items.map((item) => item.productId);
    const products = await tx.execute(sql<{ id: string; name: string; price_cents: number; track_inventory: boolean; stock_qty: number }>`
      SELECT id, name, price_cents, track_inventory, stock_qty FROM products
      WHERE org_id = ${orgId} AND id = ANY(${productIds}::uuid[]) AND status = 'active'
      FOR UPDATE
    `) as Array<{ id: string; name: string; price_cents: number; track_inventory: boolean; stock_qty: number }>;
    let subtotal = 0;
    for (const item of input.items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) throw new Error("Product unavailable.");
      if (product.track_inventory && product.stock_qty < item.qty) throw new Error(`${product.name} is out of stock.`);
      subtotal += product.price_cents * item.qty;
    }
    const tax = Math.round(subtotal * taxRate);
    const orderRows = await tx.execute(sql<{ id: string }>`
      INSERT INTO orders (org_id, customer_id, status, subtotal_cents, tax_cents, total_cents, currency)
      VALUES (${orgId}, ${customerRows[0].id}::uuid, 'paid', ${subtotal}, ${tax}, ${subtotal + tax}, ${currency})
      RETURNING id
    `);
    for (const item of input.items) {
      const product = products.find((entry) => entry.id === item.productId)!;
      await tx.execute(sql`
        INSERT INTO order_items (org_id, order_id, product_id, name_snapshot, qty, unit_price_cents)
        VALUES (${orgId}, ${orderRows[0].id}::uuid, ${product.id}::uuid, ${product.name}, ${item.qty}, ${product.price_cents})
      `);
      if (product.track_inventory) {
        await tx.execute(sql`UPDATE products SET stock_qty = stock_qty - ${item.qty}, updated_at = now() WHERE id = ${product.id}::uuid AND org_id = ${orgId}`);
        await tx.execute(sql`INSERT INTO inventory_adjustments (org_id, product_id, delta, reason) VALUES (${orgId}, ${product.id}::uuid, ${-item.qty}, 'Order placed')`);
      }
    }
    await tx.execute(sql`
      INSERT INTO receipts (org_id, order_id, pdf_url, number)
      VALUES (${orgId}, ${orderRows[0].id}::uuid, 'pending://receipt-generation', 'ECL-' || upper(substr(${orderRows[0].id}, 1, 8)))
      ON CONFLICT (order_id) DO UPDATE SET issued_at = now()
    `);
  });
  revalidatePath("/storefront");
  revalidatePath("/shop");
}
