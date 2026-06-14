"use client";

import { create } from "zustand";
import {
  formatStoreMoney,
  storefrontReceiptPdfDataUrl,
  storefrontSeed,
  storefrontOrgId,
  type StorefrontCustomer,
  type StorefrontInventoryAdjustment,
  type StorefrontOrder,
  type StorefrontOrderItem,
  type StorefrontOrderStatus,
  type StorefrontProduct,
  type StorefrontReceipt,
  type StorefrontSettings
} from "@/lib/storefront-data";

export type StorefrontCartItem = {
  productId: string;
  qty: number;
};

type CheckoutInput = {
  name: string;
  email: string;
  shipping: string;
};

export type StorefrontState = {
  settings: StorefrontSettings;
  products: StorefrontProduct[];
  customers: StorefrontCustomer[];
  orders: StorefrontOrder[];
  orderItems: StorefrontOrderItem[];
  receipts: StorefrontReceipt[];
  inventoryAdjustments: StorefrontInventoryAdjustment[];
  cart: StorefrontCartItem[];
  lastOrderId?: string;
  hydrateSeed: (seed: Partial<Omit<StorefrontState, "cart" | "lastOrderId" | "hydrateSeed">>) => void;
  updateSettings: (settings: Partial<Pick<StorefrontSettings, "storeName" | "currency" | "taxRate">>) => void;
  upsertProduct: (product: Partial<StorefrontProduct> & Pick<StorefrontProduct, "name" | "category" | "priceCents" | "sku">) => void;
  archiveProduct: (productId: string) => void;
  setProductStatus: (productId: string, status: StorefrontProduct["status"]) => void;
  adjustInventory: (productId: string, delta: number, reason: string) => void;
  restockProduct: (productId: string) => void;
  transitionOrder: (orderId: string, status: StorefrontOrderStatus) => void;
  regenerateReceipt: (orderId: string) => void;
  addToCart: (productId: string, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (input: CheckoutInput) => StorefrontOrder | null;
};

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneSeed() {
  return {
    settings: { ...storefrontSeed.settings, branding: { ...storefrontSeed.settings.branding } },
    products: storefrontSeed.products.map((product) => ({ ...product })),
    customers: storefrontSeed.customers.map((customer) => ({ ...customer })),
    orders: storefrontSeed.orders.map((order) => ({ ...order })),
    orderItems: storefrontSeed.orderItems.map((item) => ({ ...item })),
    receipts: storefrontSeed.receipts.map((receipt) => ({ ...receipt })),
    inventoryAdjustments: storefrontSeed.inventoryAdjustments.map((adjustment) => ({ ...adjustment }))
  };
}

function cartTotals(products: StorefrontProduct[], cart: StorefrontCartItem[], taxRate: number) {
  const subtotalCents = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product?.priceCents ?? 0) * item.qty;
  }, 0);
  const taxCents = Math.round(subtotalCents * taxRate);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

function receiptFor(order: StorefrontOrder, customer: StorefrontCustomer, items: StorefrontOrderItem[], receiptNumber: string) {
  const lines = [
    "Eclipse Storefront receipt",
    receiptNumber,
    `Order: ${order.id}`,
    `Customer: ${customer.name} <${customer.email}>`,
    `Placed: ${new Date(order.placedAt).toLocaleString()}`,
    "",
    ...items.map((item) => `${item.qty} x ${item.nameSnapshot} ${formatStoreMoney(item.unitPriceCents * item.qty, order.currency)}`),
    "",
    `Subtotal: ${formatStoreMoney(order.subtotalCents, order.currency)}`,
    `Tax: ${formatStoreMoney(order.taxCents, order.currency)}`,
    `Total: ${formatStoreMoney(order.totalCents, order.currency)}`
  ];
  return storefrontReceiptPdfDataUrl(lines.join("\n"));
}

const seed = cloneSeed();

export const useStorefrontStore = create<StorefrontState>((set, get) => ({
  ...seed,
  cart: [],
  hydrateSeed: (nextSeed) =>
    set((state) => ({
      settings: nextSeed.settings ?? state.settings,
      products: nextSeed.products ?? state.products,
      customers: nextSeed.customers ?? state.customers,
      orders: nextSeed.orders ?? state.orders,
      orderItems: nextSeed.orderItems ?? state.orderItems,
      receipts: nextSeed.receipts ?? state.receipts,
      inventoryAdjustments: nextSeed.inventoryAdjustments ?? state.inventoryAdjustments
    })),
  updateSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
        currency: settings.currency ?? state.settings.currency
      },
      products: settings.currency ? state.products.map((product) => ({ ...product, currency: settings.currency! })) : state.products
    })),
  upsertProduct: (product) =>
    set((state) => {
      const existing = product.id ? state.products.find((item) => item.id === product.id) : undefined;
      const next: StorefrontProduct = {
        id: existing?.id ?? id("prod"),
        description: product.description ?? existing?.description ?? "",
        currency: state.settings.currency,
        trackInventory: product.trackInventory ?? existing?.trackInventory ?? true,
        stockQty: product.stockQty ?? existing?.stockQty ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? existing?.lowStockThreshold ?? 0,
        status: product.status ?? existing?.status ?? "draft",
        imageUrl: product.imageUrl ?? existing?.imageUrl,
        isService: product.isService ?? existing?.isService ?? false,
        ...existing,
        ...product,
        orgId: storefrontOrgId
      };
      return {
        products: existing
          ? state.products.map((item) => (item.id === existing.id ? next : item))
          : [next, ...state.products]
      };
    }),
  archiveProduct: (productId) =>
    set((state) => ({
      products: state.products.map((product) => (product.id === productId ? { ...product, status: "archived" } : product))
    })),
  setProductStatus: (productId, status) =>
    set((state) => ({
      products: state.products.map((product) => (product.id === productId ? { ...product, status } : product))
    })),
  adjustInventory: (productId, delta, reason) =>
    set((state) => ({
      products: state.products.map((product) => (
        product.id === productId ? { ...product, stockQty: Math.max(0, product.stockQty + delta), trackInventory: true } : product
      )),
      inventoryAdjustments: [
        { id: id("adj"), orgId: storefrontOrgId, productId, delta, reason, createdAt: new Date().toISOString() },
        ...state.inventoryAdjustments
      ]
    })),
  restockProduct: (productId) => {
    const product = get().products.find((item) => item.id === productId);
    if (!product) return;
    get().adjustInventory(productId, Math.max(5, product.lowStockThreshold * 2), "Restock action");
  },
  transitionOrder: (orderId, status) =>
    set((state) => {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return state;
      let products = state.products;
      let adjustments = state.inventoryAdjustments;
      const items = state.orderItems.filter((item) => item.orderId === orderId);
      if ((status === "refunded" || status === "cancelled") && order.status !== "refunded" && order.status !== "cancelled") {
        products = products.map((product) => {
          const orderItem = items.find((item) => item.productId === product.id);
          return orderItem && product.trackInventory ? { ...product, stockQty: product.stockQty + orderItem.qty } : product;
        });
        adjustments = [
          ...items.map((item) => ({ id: id("adj"), orgId: storefrontOrgId, productId: item.productId, delta: item.qty, reason: `${status} ${orderId}`, createdAt: new Date().toISOString() })),
          ...adjustments
        ];
      }
      return {
        products,
        inventoryAdjustments: adjustments,
        orders: state.orders.map((item) => (item.id === orderId ? { ...item, status } : item))
      };
    }),
  regenerateReceipt: (orderId) =>
    set((state) => {
      const order = state.orders.find((item) => item.id === orderId);
      const customer = state.customers.find((item) => item.id === order?.customerId);
      if (!order || !customer) return state;
      const number = state.receipts.find((receipt) => receipt.orderId === orderId)?.number ?? `ECL-${state.receipts.length + 1001}`;
      const pdfUrl = receiptFor(order, customer, state.orderItems.filter((item) => item.orderId === orderId), number);
      const nextReceipt = { id: id("receipt"), orgId: storefrontOrgId, orderId, pdfUrl, number, issuedAt: new Date().toISOString() };
      return { receipts: [nextReceipt, ...state.receipts.filter((receipt) => receipt.orderId !== orderId)] };
    }),
  addToCart: (productId, qty = 1) =>
    set((state) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product || product.status !== "active") return state;
      const existing = state.cart.find((item) => item.productId === productId);
      const nextQty = Math.min((existing?.qty ?? 0) + qty, product.trackInventory ? Math.max(product.stockQty, 0) : 99);
      return {
        cart: existing
          ? state.cart.map((item) => (item.productId === productId ? { ...item, qty: nextQty } : item))
          : [...state.cart, { productId, qty: Math.max(1, nextQty) }]
      };
    }),
  updateCartQty: (productId, qty) =>
    set((state) => ({
      cart: qty <= 0 ? state.cart.filter((item) => item.productId !== productId) : state.cart.map((item) => (item.productId === productId ? { ...item, qty } : item))
    })),
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.productId !== productId) })),
  clearCart: () => set({ cart: [] }),
  placeOrder: (input) => {
    const state = get();
    if (!state.cart.length) return null;
    const cartProducts = state.cart.map((item) => ({ cartItem: item, product: state.products.find((product) => product.id === item.productId) })).filter((item): item is { cartItem: StorefrontCartItem; product: StorefrontProduct } => Boolean(item.product));
    if (!cartProducts.length) return null;
    const hasStockProblem = cartProducts.some(({ cartItem, product }) => product.trackInventory && product.stockQty < cartItem.qty);
    if (hasStockProblem) return null;
    const existingCustomer = state.customers.find((customer) => customer.email.toLowerCase() === input.email.toLowerCase());
    const customer: StorefrontCustomer = existingCustomer ?? { id: id("cust"), orgId: storefrontOrgId, name: input.name, email: input.email, createdAt: new Date().toISOString() };
    const totals = cartTotals(state.products, state.cart, state.settings.taxRate);
    const order: StorefrontOrder = {
      id: id("order"),
      orgId: storefrontOrgId,
      customerId: customer.id,
      status: "paid",
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      currency: state.settings.currency,
      placedAt: new Date().toISOString()
    };
    const items = cartProducts.map(({ cartItem, product }) => ({
      id: id("item"),
      orgId: storefrontOrgId,
      orderId: order.id,
      productId: product.id,
      nameSnapshot: product.name,
      qty: cartItem.qty,
      unitPriceCents: product.priceCents
    }));
    const receiptNumber = `ECL-${state.orders.length + 1001}`;
    const receipt: StorefrontReceipt = {
      id: id("receipt"),
      orgId: storefrontOrgId,
      orderId: order.id,
      pdfUrl: receiptFor(order, customer, items, receiptNumber),
      number: receiptNumber,
      issuedAt: new Date().toISOString()
    };
    const adjustments = items
      .filter((item) => state.products.find((product) => product.id === item.productId)?.trackInventory)
      .map((item) => ({ id: id("adj"), orgId: storefrontOrgId, productId: item.productId, delta: -item.qty, reason: `Order ${receiptNumber}`, createdAt: new Date().toISOString() }));
    set({
      customers: existingCustomer ? state.customers : [customer, ...state.customers],
      orders: [order, ...state.orders],
      orderItems: [...items, ...state.orderItems],
      receipts: [receipt, ...state.receipts],
      inventoryAdjustments: [...adjustments, ...state.inventoryAdjustments],
      products: state.products.map((product) => {
        const orderItem = items.find((item) => item.productId === product.id);
        return orderItem && product.trackInventory ? { ...product, stockQty: Math.max(0, product.stockQty - orderItem.qty) } : product;
      }),
      cart: [],
      lastOrderId: order.id
    });
    return order;
  }
}));

export function selectCartTotals(state: Pick<StorefrontState, "products" | "cart" | "settings">) {
  return cartTotals(state.products, state.cart, state.settings.taxRate);
}
