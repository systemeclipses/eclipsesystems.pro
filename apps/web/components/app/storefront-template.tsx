"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Box,
  CheckCircle2,
  Download,
  Heart,
  MapPin,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tags,
  UserRound,
  Warehouse
} from "lucide-react";
import { formatStoreMoney, type StorefrontOrderStatus, type StorefrontProduct, type StorefrontSeed } from "@/lib/storefront-data";
import { selectCartTotals, useStorefrontStore, type StorefrontState } from "@/lib/storefront-store";

type AdminView = "dashboard" | "catalog" | "checkout" | "orders" | "customers" | "inventory" | "receipts" | "admin" | "packages" | "account";
type ShopView = "home" | "product" | "cart" | "checkout" | "confirmation" | "account" | "wishlist";

const adminNav: Array<{ id: AdminView; label: string; section: "WORKSPACE" | "PACKAGE"; icon: typeof Store }> = [
  { id: "dashboard", label: "Dashboard", section: "WORKSPACE", icon: Store },
  { id: "catalog", label: "Catalog", section: "WORKSPACE", icon: Tags },
  { id: "checkout", label: "Checkout", section: "WORKSPACE", icon: ShoppingCart },
  { id: "orders", label: "Orders", section: "WORKSPACE", icon: ReceiptText },
  { id: "customers", label: "Customers", section: "WORKSPACE", icon: UserRound },
  { id: "inventory", label: "Inventory", section: "WORKSPACE", icon: Warehouse },
  { id: "receipts", label: "Receipts", section: "WORKSPACE", icon: Download },
  { id: "admin", label: "Admin", section: "WORKSPACE", icon: Settings },
  { id: "packages", label: "All Packages", section: "PACKAGE", icon: Package },
  { id: "account", label: "Account", section: "PACKAGE", icon: UserRound }
];

const categories = ["All", "Men's", "Women's", "Youth / Kids", "Headwear", "Accessories", "Stickers & Decals", "Drinkware", "Prints"] as const;

function titleFor(view: AdminView) {
  if (view === "packages") return "All Packages";
  return view[0].toUpperCase() + view.slice(1);
}

function fieldClass() {
  return "h-10 rounded-md border border-[#2a3a2f] bg-[#0c1410] px-3 text-sm text-[#e9e6d8] outline-none placeholder:text-[#9aa896] focus:border-[#aebd84]";
}

function money(cents: number, currency = "USD") {
  return formatStoreMoney(cents, currency);
}

function lowStock(product: StorefrontProduct) {
  return product.trackInventory && product.stockQty <= product.lowStockThreshold;
}

function shoppable(product: StorefrontProduct) {
  return product.status === "active" && (product.isService || !product.trackInventory || product.stockQty > 0);
}

function seededStoreSnapshot(store: StorefrontState, initialSeed?: StorefrontSeed): StorefrontState {
  if (!initialSeed || store.products[0]?.id === initialSeed.products[0]?.id) return store;
  return { ...store, ...initialSeed };
}

function ProductArt({ product }: { product: StorefrontProduct }) {
  return (
    <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-white text-[#46674b]">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
      ) : product.isService ? (
        <CheckCircle2 className="h-10 w-10" />
      ) : (
        <Box className="h-10 w-10" />
      )}
    </div>
  );
}

function ShopCategoryIcon({ category }: { category: string }) {
  if (category === "Software") return <Tags className="h-4 w-4" />;
  if (category === "Services") return <CheckCircle2 className="h-4 w-4" />;
  if (category === "Hardware") return <Box className="h-4 w-4" />;
  if (category === "Add-ons") return <Package className="h-4 w-4" />;
  if (category === "Men's" || category === "Women's" || category === "Youth / Kids") return <Store className="h-4 w-4" />;
  if (category === "Headwear") return <Package className="h-4 w-4" />;
  if (category === "Accessories") return <Heart className="h-4 w-4" />;
  if (category === "Stickers & Decals") return <Tags className="h-4 w-4" />;
  if (category === "Drinkware") return <ShoppingCart className="h-4 w-4" />;
  if (category === "Prints") return <ReceiptText className="h-4 w-4" />;
  return <Star className="h-4 w-4" />;
}

function ShopProductCard({ product, saved, onOpen, onAdd, onSave }: { product: StorefrontProduct; saved: boolean; onOpen: () => void; onAdd: () => void; onSave: () => void }) {
  return (
    <article className="group overflow-hidden rounded-sm border border-[#d9d2bd] bg-[#f4eadb] text-[#0c1410] shadow-sm transition hover:border-[#aebd84] hover:shadow-lg hover:shadow-black/20">
      <button onClick={onOpen} className="block w-full p-4 text-left">
        <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-sm bg-[#e9e6d8] text-[#46674b]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
          ) : product.isService ? (
            <CheckCircle2 className="h-14 w-14" />
          ) : (
            <Box className="h-14 w-14" />
          )}
        </div>
        <div className="border-t border-[#d9d2bd] pt-3 text-center">
          <div className="flex justify-center gap-0.5 text-[#aebd84]">
            {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3 w-3 fill-current" />)}
          </div>
          <p className="mt-1 min-h-10 text-sm font-semibold leading-5">{product.name}</p>
          <p className="text-xs text-[#6b705f]">{product.category}</p>
          <p className="mt-1 text-sm font-black text-[#46674b]">{money(product.priceCents, product.currency)}</p>
        </div>
      </button>
      <div className="flex items-center justify-center gap-2 pb-4">
        <button onClick={onSave} aria-label="Save product" className={`grid h-8 w-8 place-items-center rounded-full shadow-sm ${saved ? "bg-[#46674b] text-[#f4eadb]" : "bg-white text-[#0c1410]"}`}><Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /></button>
        <button onClick={onAdd} aria-label="Add to cart" className="grid h-8 w-8 place-items-center rounded-full bg-[#aebd84] text-[#0c1410] shadow-sm"><ShoppingCart className="h-4 w-4" /></button>
      </div>
    </article>
  );
}

function StorefrontShell({ children, rightRail, activeView, onSelect }: { children: React.ReactNode; rightRail?: React.ReactNode; activeView: AdminView; onSelect: (view: AdminView) => void }) {
  const navGroups = ["WORKSPACE", "PACKAGE"] as const;
  return (
    <section className="min-h-screen bg-[#0c1410] text-[#e9e6d8]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#2a3a2f] bg-[#101a14] p-5 lg:flex lg:flex-col">
        <div>
          <p className="font-title text-4xl font-black leading-none text-[#e9e6d8]">Storefront</p>
          <Link href="/shop" className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#aebd84] px-3 py-2 text-sm font-black text-[#0c1410]">
            Open storefront <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <nav className="mt-8 grid gap-6">
          {navGroups.map((group) => (
            <div key={group}>
              <p className="px-2 text-xs font-black tracking-[0.16em] text-[#9aa896]">{group}</p>
              <div className="mt-2 grid gap-1">
                {adminNav.filter((item) => item.section === group).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => onSelect(item.id)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold transition ${activeView === item.id ? "bg-[#aebd84] text-[#0c1410]" : "text-[#d5d8c6] hover:bg-[#18261d]"}`}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
          <div>{children}</div>
          {rightRail ? <aside className="grid content-start gap-4">{rightRail}</aside> : null}
        </div>
      </main>
    </section>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-[#2a3a2f] bg-[#16241c] p-4">
      <p className="text-sm font-bold text-[#aebd84]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#e9e6d8]">{value}</p>
      <p className="mt-1 text-sm text-[#9aa896]">{detail}</p>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#2a3a2f] bg-[#16241c] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#aebd84]">{title}</p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StorefrontAdminApp({ initialSeed }: { initialSeed?: StorefrontSeed }) {
  const storeState = useStorefrontStore();
  const store = seededStoreSnapshot(storeState, initialSeed);
  const hydrateSeed = useStorefrontStore((state) => state.hydrateSeed);
  const [view, setView] = useState<AdminView>("dashboard");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StorefrontOrderStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState(store.orders[0]?.id);
  const [draftProduct, setDraftProduct] = useState({ name: "", category: "Men's" as StorefrontProduct["category"], price: "", sku: "", stock: "", service: false });
  const revenue = store.orders.filter((order) => order.status === "paid" || order.status === "fulfilled").reduce((sum, order) => sum + order.totalCents, 0);
  const inventoryAlerts = store.products.filter(lowStock);
  const recentOrders = store.orders.slice(0, 6);
  const selectedOrder = store.orders.find((order) => order.id === selectedOrderId) ?? store.orders[0];
  const selectedCustomer = store.customers.find((customer) => customer.id === selectedOrder?.customerId);
  const selectedItems = store.orderItems.filter((item) => item.orderId === selectedOrder?.id);
  const visibleProducts = store.products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  const visibleOrders = store.orders.filter((order) => statusFilter === "all" || order.status === statusFilter);

  useEffect(() => {
    if (initialSeed) hydrateSeed(initialSeed);
  }, [hydrateSeed, initialSeed]);

  function saveProduct() {
    if (!draftProduct.name.trim() || !draftProduct.sku.trim()) return;
    store.upsertProduct({
      name: draftProduct.name.trim(),
      category: draftProduct.category,
      priceCents: Math.round(Number(draftProduct.price || 0) * 100),
      sku: draftProduct.sku.trim(),
      stockQty: Number(draftProduct.stock || 0),
      lowStockThreshold: 3,
      status: "active",
      trackInventory: !draftProduct.service,
      isService: draftProduct.service,
      description: "Created from the Storefront admin catalog."
    });
    setDraftProduct({ name: "", category: "Men's", price: "", sku: "", stock: "", service: false });
  }

  const rightRail = (
    <>
      <Panel title="Low stock">
        <div className="grid gap-2">
          {inventoryAlerts.slice(0, 5).map((product) => (
            <button key={product.id} onClick={() => { setView("inventory"); store.restockProduct(product.id); }} className="rounded-sm bg-[#0c1410] p-3 text-left">
              <p className="font-bold text-[#e9e6d8]">{product.name}</p>
              <p className="text-sm text-[#9aa896]">{product.stockQty} left · threshold {product.lowStockThreshold}</p>
            </button>
          ))}
          {!inventoryAlerts.length ? <p className="text-sm text-[#9aa896]">Inventory is healthy.</p> : null}
        </div>
      </Panel>
      <Panel title="Store settings">
        <p className="text-2xl font-black">{store.settings.storeName}</p>
        <p className="mt-2 text-sm text-[#9aa896]">{store.settings.currency} · {(store.settings.taxRate * 100).toFixed(2)}% tax</p>
      </Panel>
    </>
  );

  return (
    <StorefrontShell activeView={view} onSelect={setView} rightRail={rightRail}>
      <header className="rounded-md border border-[#2a3a2f] bg-[#16241c] p-6">
        <p className="text-sm font-black text-[#aebd84]">Storefront commerce workspace</p>
        <h1 className="mt-3 font-title text-5xl font-black leading-none text-[#e9e6d8]">{titleFor(view)}</h1>
      </header>

      {view === "dashboard" ? (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Products" value={String(store.products.length)} detail="Across catalog statuses" />
            <MetricCard label="Orders" value={String(store.orders.length)} detail="Shared customer/order spine" />
            <MetricCard label="Inventory alerts" value={String(inventoryAlerts.length)} detail="Tracked at/below threshold" />
            <MetricCard label="Revenue" value={money(revenue, store.settings.currency)} detail="Paid and fulfilled orders" />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Recent orders">
              <div className="grid gap-2">
                {recentOrders.map((order) => {
                  const customer = store.customers.find((item) => item.id === order.customerId);
                  return <button key={order.id} onClick={() => { setSelectedOrderId(order.id); setView("orders"); }} className="grid gap-2 rounded-sm bg-[#0c1410] p-3 text-left md:grid-cols-[1fr_auto]"><span><span className="block font-bold">{customer?.name}</span><span className="text-sm text-[#9aa896]">{order.status} · {new Date(order.placedAt).toLocaleDateString()}</span></span><span className="font-black text-[#aebd84]">{money(order.totalCents, order.currency)}</span></button>;
                })}
              </div>
            </Panel>
            <Panel title="Low-stock list">
              <div className="grid gap-2">
                {inventoryAlerts.map((product) => <div key={product.id} className="rounded-sm bg-[#0c1410] p-3"><p className="font-bold">{product.name}</p><p className="text-sm text-[#9aa896]">{product.sku} · {product.stockQty} in stock</p></div>)}
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {view === "catalog" ? (
        <div className="mt-5 grid gap-5">
          <Panel title="Create product">
            <div className="grid gap-3 md:grid-cols-6">
              <input value={draftProduct.name} onChange={(event) => setDraftProduct({ ...draftProduct, name: event.target.value })} className={fieldClass()} placeholder="Name" />
              <select value={draftProduct.category} onChange={(event) => setDraftProduct({ ...draftProduct, category: event.target.value as StorefrontProduct["category"] })} className={fieldClass()}>{categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select>
              <input value={draftProduct.price} onChange={(event) => setDraftProduct({ ...draftProduct, price: event.target.value })} className={fieldClass()} placeholder="Price" />
              <input value={draftProduct.sku} onChange={(event) => setDraftProduct({ ...draftProduct, sku: event.target.value })} className={fieldClass()} placeholder="SKU" />
              <input value={draftProduct.stock} onChange={(event) => setDraftProduct({ ...draftProduct, stock: event.target.value })} className={fieldClass()} placeholder="Stock" />
              <button onClick={saveProduct} className="h-10 rounded-md bg-[#aebd84] text-sm font-black text-[#0c1410]">Create</button>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-[#d6d8c8]"><input type="checkbox" checked={draftProduct.service} onChange={(event) => setDraftProduct({ ...draftProduct, service: event.target.checked })} /> Service, no stock tracking</label>
          </Panel>
          <Panel title="Catalog" action={<input value={query} onChange={(event) => setQuery(event.target.value)} className={fieldClass()} placeholder="Search products" />}>
            <div className="grid gap-3">
              {visibleProducts.map((product) => (
                <div key={product.id} className="grid gap-3 rounded-sm bg-[#0c1410] p-3 lg:grid-cols-[1fr_110px_120px_140px] lg:items-center">
                  <div><p className="font-bold">{product.name}</p><p className="text-sm text-[#9aa896]">{product.category} · {product.sku} · {product.isService ? "Service" : "Physical good"}</p></div>
                  <p className="font-black">{money(product.priceCents, product.currency)}</p>
                  <select value={product.status} onChange={(event) => store.setProductStatus(product.id, event.target.value as StorefrontProduct["status"])} className={fieldClass()}><option value="active">active</option><option value="draft">draft</option><option value="archived">archived</option></select>
                  <button onClick={() => store.archiveProduct(product.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#2a3a2f] text-sm font-bold text-[#aebd84]"><Archive className="h-4 w-4" /> Archive</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {view === "checkout" ? (
        <Panel title="Checkout settings">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-[#9aa896]">Tax rate %<input value={(store.settings.taxRate * 100).toFixed(2)} onChange={(event) => store.updateSettings({ taxRate: Number(event.target.value) / 100 })} className={fieldClass()} /></label>
            <label className="grid gap-2 text-sm font-bold text-[#9aa896]">Currency<select value={store.settings.currency} onChange={(event) => store.updateSettings({ currency: event.target.value })} className={fieldClass()}><option>USD</option><option>CAD</option><option>EUR</option></select></label>
            <div className="rounded-md bg-[#0c1410] p-4"><p className="font-bold">Payment methods</p><p className="mt-1 text-sm text-[#9aa896]">Mock card is enabled for demo checkout. Stripe can be connected here.</p></div>
          </div>
        </Panel>
      ) : null}

      {view === "orders" ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
          <Panel title="Orders" action={<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className={fieldClass()}><option value="all">All statuses</option><option>pending</option><option>paid</option><option>fulfilled</option><option>refunded</option><option>cancelled</option></select>}>
            <div className="grid gap-2">{visibleOrders.map((order) => <button key={order.id} onClick={() => setSelectedOrderId(order.id)} className={`grid gap-2 rounded-sm p-3 text-left md:grid-cols-[1fr_auto] ${selectedOrder?.id === order.id ? "bg-[#aebd84] text-[#0c1410]" : "bg-[#0c1410]"}`}><span><span className="block font-bold">{store.customers.find((customer) => customer.id === order.customerId)?.name}</span><span className={selectedOrder?.id === order.id ? "text-[#2f4135]" : "text-[#9aa896]"}>{order.status} · {new Date(order.placedAt).toLocaleString()}</span></span><span className="font-black">{money(order.totalCents, order.currency)}</span></button>)}</div>
          </Panel>
          {selectedOrder ? <Panel title="Order detail"><p className="text-xl font-black">{selectedCustomer?.name}</p><p className="text-sm text-[#9aa896]">{selectedCustomer?.email}</p><div className="mt-4 grid gap-2">{selectedItems.map((item) => <div key={item.id} className="flex justify-between rounded-sm bg-[#0c1410] p-2 text-sm"><span>{item.qty} x {item.nameSnapshot}</span><span>{money(item.qty * item.unitPriceCents, selectedOrder.currency)}</span></div>)}</div><p className="mt-4 text-2xl font-black">{money(selectedOrder.totalCents, selectedOrder.currency)}</p><div className="mt-4 flex flex-wrap gap-2">{(["pending", "paid", "fulfilled", "refunded", "cancelled"] as StorefrontOrderStatus[]).map((status) => <button key={status} onClick={() => store.transitionOrder(selectedOrder.id, status)} className={`rounded-md px-3 py-2 text-sm font-bold ${selectedOrder.status === status ? "bg-[#aebd84] text-[#0c1410]" : "border border-[#2a3a2f] text-[#aebd84]"}`}>{status}</button>)}</div></Panel> : null}
        </div>
      ) : null}

      {view === "customers" ? <CustomersPanel /> : null}
      {view === "inventory" ? <InventoryPanel /> : null}
      {view === "receipts" ? <ReceiptsPanel /> : null}
      {view === "admin" ? <AdminSettingsPanel /> : null}
      {view === "packages" ? <Panel title="Suite packages"><p className="text-[#9aa896]">Operations Hub, Client Portal, CRM, and Storefront share the same Eclipse suite shell.</p></Panel> : null}
      {view === "account" ? <Panel title="Account"><p className="text-[#9aa896]">Staff/admin session powered by Auth.js. Storefront shoppers use customer accounts.</p></Panel> : null}
    </StorefrontShell>
  );
}

function CustomersPanel() {
  const store = useStorefrontStore();
  return <Panel title="Customers"><div className="grid gap-3">{store.customers.map((customer) => { const orders = store.orders.filter((order) => order.customerId === customer.id); const spend = orders.reduce((sum, order) => sum + order.totalCents, 0); return <div key={customer.id} className="rounded-sm bg-[#0c1410] p-3"><p className="font-bold">{customer.name}</p><p className="text-sm text-[#9aa896]">{customer.email} · {orders.length} orders · {money(spend)}</p></div>; })}</div></Panel>;
}

function InventoryPanel() {
  const store = useStorefrontStore();
  return <Panel title="Inventory"><div className="grid gap-3">{store.products.filter((product) => product.trackInventory).map((product) => <div key={product.id} className="grid gap-3 rounded-sm bg-[#0c1410] p-3 md:grid-cols-[1fr_100px_160px] md:items-center"><div><p className="font-bold">{product.name}</p><p className="text-sm text-[#9aa896]">{lowStock(product) ? "Alert" : "Healthy"} · threshold {product.lowStockThreshold}</p></div><p className="font-black">{product.stockQty}</p><div className="flex gap-2"><button onClick={() => store.adjustInventory(product.id, -1, "Manual adjustment")} className="h-9 rounded-md border border-[#2a3a2f] px-3 text-sm font-bold text-[#aebd84]">-1</button><button onClick={() => store.adjustInventory(product.id, 1, "Manual adjustment")} className="h-9 rounded-md border border-[#2a3a2f] px-3 text-sm font-bold text-[#aebd84]">+1</button><button onClick={() => store.restockProduct(product.id)} className="h-9 rounded-md bg-[#aebd84] px-3 text-sm font-black text-[#0c1410]">Restock</button></div></div>)}</div></Panel>;
}

function ReceiptsPanel() {
  const store = useStorefrontStore();
  return <Panel title="Receipts"><div className="grid gap-3">{store.receipts.map((receipt) => { const order = store.orders.find((item) => item.id === receipt.orderId); return <div key={receipt.id} className="grid gap-3 rounded-sm bg-[#0c1410] p-3 md:grid-cols-[1fr_auto] md:items-center"><span><span className="block font-bold">{receipt.number}</span><span className="text-sm text-[#9aa896]">{order?.status} · {new Date(receipt.issuedAt).toLocaleString()}</span></span><span className="flex gap-2"><a href={receipt.pdfUrl} download={`${receipt.number}.pdf`} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#aebd84] px-3 text-sm font-black text-[#0c1410]"><Download className="h-4 w-4" /> PDF</a><button onClick={() => store.regenerateReceipt(receipt.orderId)} className="h-9 rounded-md border border-[#2a3a2f] px-3 text-sm font-bold text-[#aebd84]">Regenerate</button></span></div>; })}</div></Panel>;
}

function AdminSettingsPanel() {
  const store = useStorefrontStore();
  return <Panel title="Store settings"><div className="grid gap-3 md:grid-cols-3"><label className="grid gap-2 text-sm font-bold text-[#9aa896]">Store name<input value={store.settings.storeName} onChange={(event) => store.updateSettings({ storeName: event.target.value })} className={fieldClass()} /></label><label className="grid gap-2 text-sm font-bold text-[#9aa896]">Currency<select value={store.settings.currency} onChange={(event) => store.updateSettings({ currency: event.target.value })} className={fieldClass()}><option>USD</option><option>CAD</option><option>EUR</option></select></label><label className="grid gap-2 text-sm font-bold text-[#9aa896]">Tax %<input value={(store.settings.taxRate * 100).toFixed(2)} onChange={(event) => store.updateSettings({ taxRate: Number(event.target.value) / 100 })} className={fieldClass()} /></label></div></Panel>;
}

export function StorefrontPublicApp({ initialView = "home", productId, initialSeed }: { initialView?: ShopView; productId?: string; initialSeed?: StorefrontSeed }) {
  const storeState = useStorefrontStore();
  const store = seededStoreSnapshot(storeState, initialSeed);
  const hydrateSeed = useStorefrontStore((state) => state.hydrateSeed);
  const [view, setView] = useState<ShopView>(initialView);
  const [selectedProductId, setSelectedProductId] = useState(productId ?? store.products.find(shoppable)?.id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [customer, setCustomer] = useState({ name: "", email: "", shipping: "" });
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [location, setLocation] = useState("Select Your Location");
  const [showLocations, setShowLocations] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Mock card");
  const [favoriteShelf, setFavoriteShelf] = useState<"Everyday" | "Travel" | "Collectibles">("Everyday");
  const [hoverMenu, setHoverMenu] = useState<"new" | "shop" | "men" | "women" | null>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const products = store.products.filter(shoppable).filter((product) => category === "All" || product.category === category).filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase()));
  const activeProducts = store.products.filter(shoppable);
  const savedProducts = store.products.filter((product) => savedProductIds.includes(product.id));
  const cartProducts = store.cart.map((item) => ({ item, product: store.products.find((product) => product.id === item.productId) })).filter((entry): entry is { item: { productId: string; qty: number }; product: StorefrontProduct } => Boolean(entry.product));
  const totals = selectCartTotals(store);
  const selectedProduct = store.products.find((product) => product.id === selectedProductId) ?? products[0];
  const lastOrder = store.orders.find((order) => order.id === store.lastOrderId);
  const lastReceipt = store.receipts.find((receipt) => receipt.orderId === lastOrder?.id);
  const shelfProducts = (products.length ? products : activeProducts).filter((product) => {
    if (favoriteShelf === "Travel") return ["Drinkware", "Accessories", "Headwear"].includes(product.category);
    if (favoriteShelf === "Collectibles") return ["Stickers & Decals", "Prints", "Accessories"].includes(product.category);
    return ["Men's", "Women's", "Youth / Kids"].includes(product.category);
  });
  const heroSlides = [
    { image: "/storefront/hero-merch-1.png", alt: "Person wearing Eclipse forest tee and cap", category: "Men's" as const, eyebrow: "Eclipse merch line", title: "New colors, field ready.", copy: "Soft tees, caps, and everyday crew staples built around the Eclipse palette." },
    { image: "/storefront/hero-merch-2.png", alt: "Person wearing Eclipse sage crop tee and dark hoodie", category: "Women's" as const, eyebrow: "New layers", title: "Soft goods for long days.", copy: "Crops, hoodies, and relaxed layers that move from shop floor to weekend." },
    { image: "/storefront/hero-merch-3.png", alt: "People wearing Eclipse crewneck, hoodie, beanie, tote, and bottle", category: "Accessories" as const, eyebrow: "Crew favorites", title: "Built for the whole kit.", copy: "Drinkware, totes, beanies, and prints that make the merch line feel complete." }
  ];
  const collectionCards: Array<{ label: string; action: string; category: (typeof categories)[number]; product?: StorefrontProduct; className: string; imageClassName?: string }> = [
    {
      label: "New Arrivals",
      action: "Shop the drop",
      category: "All",
      product: activeProducts.find((product) => product.category === "Headwear") ?? activeProducts[0],
      className: "bg-[#16241c]"
    },
    {
      label: "Men's",
      action: "Shop men",
      category: "Men's",
      product: activeProducts.find((product) => product.category === "Men's"),
      className: "bg-[#2a3a2f]",
      imageClassName: "scale-110"
    },
    {
      label: "Women's",
      action: "Shop women",
      category: "Women's",
      product: activeProducts.find((product) => product.category === "Women's"),
      className: "bg-[#46674b]"
    },
    {
      label: "Best Sellers",
      action: "Crew favorites",
      category: "Accessories",
      product: activeProducts.find((product) => product.category === "Drinkware") ?? activeProducts.find((product) => product.category === "Accessories"),
      className: "bg-[#9aa896]"
    }
  ];
  const megaMenu = {
    new: {
      label: "New Arrivals",
      columns: [
        { title: "New Arrivals", links: ["Latest Tees", "Fresh Hoodies", "New Headwear"] },
        { title: "Featured", links: ["Best Sellers", "Low Stock Picks", "Giftable Merch"] },
        { title: "Collections", links: ["Everyday Kit", "Field Ready", "Desk Setup"] }
      ]
    },
    shop: {
      label: "Shop All",
      columns: [
        { title: "Shop", links: ["Shop All", "Best Sellers", "Under $25"] },
        { title: "Categories", links: ["Accessories", "Drinkware", "Prints"] },
        { title: "Collectibles", links: ["Sticker Packs", "Vinyl Decals", "Enamel Pins"] }
      ]
    },
    men: {
      label: "Men's",
      columns: [
        { title: "Men's", links: ["Shop All", "Tees", "Hoodies"] },
        { title: "Customer Favorites", links: ["Heavyweight Logo Tee", "Vintage Wash Hoodie", "Trail Crew Beanie"] },
        { title: "Apparel & Accessories", links: ["Long Sleeves", "Joggers", "Caps"] }
      ]
    },
    women: {
      label: "Women's",
      columns: [
        { title: "Women's", links: ["Shop All", "Crops", "Tanks"] },
        { title: "Customer Favorites", links: ["Soft Crop Tee", "Vintage Wash Hoodie", "Logo Leggings"] },
        { title: "Apparel & Accessories", links: ["Hoodies", "Totes", "Drinkware"] }
      ]
    }
  } as const;

  useEffect(() => {
    if (initialSeed) hydrateSeed(initialSeed);
  }, [hydrateSeed, initialSeed]);

  useEffect(() => {
    if (!selectedProductId || !store.products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(store.products.find(shoppable)?.id);
    }
  }, [selectedProductId, store.products]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 8500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  function openProduct(id: string) {
    setSelectedProductId(id);
    setView("product");
  }

  function openCategory(next: (typeof categories)[number]) {
    setCategory(next);
    setView("home");
  }

  function toggleSaved(productId: string) {
    setSavedProductIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }

  function addProductAndOpenCart(productId: string) {
    store.addToCart(productId);
    setView("cart");
  }

  function placeOrder() {
    const order = store.placeOrder(customer);
    if (order) setView("confirmation");
  }

  return (
    <section className="min-h-screen bg-[#f4eadb] text-[#0c1410]">
      <header className="border-b border-[#d9d2bd] bg-[#f4eadb] text-[#0c1410]">
        <div className="bg-[#16241c] text-[#e9e6d8]">
          <button onClick={() => openCategory("Men's")} className="mx-auto flex h-9 w-full max-w-[1760px] items-center justify-center gap-3 px-6 text-center text-xs font-black">
            New merch drop is live. Fresh tees, caps, drinkware, and decals for the Eclipse crew.
            <ArrowRight className="h-3.5 w-3.5 text-[#aebd84]" />
          </button>
        </div>
        <div onMouseLeave={() => setHoverMenu(null)} className="relative mx-auto grid max-w-[1760px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-4">
          <nav className="flex flex-wrap items-center gap-5 text-xs font-black uppercase">
            <button onMouseEnter={() => setHoverMenu("new")} onClick={() => openCategory("All")}>New Arrivals</button>
            <button onMouseEnter={() => setHoverMenu("shop")} onClick={() => openCategory("All")}>Shop All</button>
            <button onMouseEnter={() => setHoverMenu("men")} onClick={() => openCategory("Men's")}>Men</button>
            <button onMouseEnter={() => setHoverMenu("women")} onClick={() => openCategory("Women's")}>Women</button>
            <button onClick={() => openCategory("Youth / Kids")}>Kids</button>
            <button onClick={() => openCategory("Stickers & Decals")} className="text-[#7f3f2f]">Sale</button>
          </nav>
          <button onClick={() => setView("home")} className="font-title text-3xl font-black leading-none">
            Eclipse
          </button>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => openCategory("All")} className="hidden text-xs font-black uppercase md:inline">Shop</button>
            <button onClick={() => setView("account")} className="hidden text-xs font-black uppercase md:inline">Account</button>
            <label className="relative hidden md:block">
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 w-44 rounded-full border border-[#d9d2bd] bg-white/70 px-4 pr-9 text-xs font-bold outline-none placeholder:text-[#6b705f] focus:border-[#aebd84]" placeholder="Search" />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0c1410]" />
            </label>
            <button onClick={() => setView("wishlist")} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-[#e9e6d8]"><Heart className="h-4 w-4" />{savedProductIds.length ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#aebd84] px-1 text-[11px] font-black">{savedProductIds.length}</span> : null}</button>
            <button onClick={() => setView("cart")} className="relative grid h-9 w-9 place-items-center rounded-full bg-[#0c1410] text-[#aebd84]">
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#aebd84] px-1 text-[11px] font-black text-[#0c1410]">{store.cart.reduce((sum, item) => sum + item.qty, 0)}</span>
            </button>
          </div>
          {hoverMenu ? (
            <div className="absolute left-4 right-4 top-[calc(100%+10px)] z-40 hidden rounded-xl border border-[#d9d2bd] bg-[#eee9df] p-5 shadow-2xl md:block">
              <div className="mb-7 rounded-lg bg-[#ded7c9] py-4 text-center text-sm font-black">{megaMenu[hoverMenu].label}</div>
              <div className="grid max-w-4xl grid-cols-4 gap-10">
                <div className="grid content-start gap-5 text-xs font-black uppercase">
                  <button onClick={() => openCategory("All")} className="text-left">New Arrivals</button>
                  <button onClick={() => openCategory("All")} className="text-left">Bestsellers</button>
                </div>
                {megaMenu[hoverMenu].columns.map((column) => (
                  <div key={column.title}>
                    <p className="text-xs font-black uppercase">{column.title}</p>
                    <div className="mt-4 grid gap-3 text-sm font-bold text-[#4e5347]">
                      {column.links.map((link) => (
                        <button key={link} onClick={() => openCategory(link.includes("Women") || hoverMenu === "women" ? "Women's" : link.includes("Drinkware") ? "Drinkware" : link.includes("Sticker") || link.includes("Decal") ? "Stickers & Decals" : link.includes("Cap") || link.includes("Beanie") ? "Headwear" : hoverMenu === "men" ? "Men's" : "All")} className="text-left hover:text-[#0c1410]">
                          {link}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-[1760px] px-6 py-7">
        {view === "home" ? (
          <div>
            <section className="relative min-h-[560px] overflow-hidden bg-[#16241c] text-[#f4eadb]">
              <div className="absolute left-0 top-24 z-20 hidden w-52 bg-[#f4eadb] p-9 text-[#0c1410] shadow-xl md:block">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#46674b]">Featured</p>
                <div className="mt-5 grid gap-2 text-sm font-black">
                  <button onClick={() => openCategory("Men's")} className="text-left hover:text-[#46674b]">Men's Tees</button>
                  <button onClick={() => openCategory("Women's")} className="text-left hover:text-[#46674b]">Women's Layers</button>
                  <button onClick={() => openCategory("Headwear")} className="text-left hover:text-[#46674b]">New Headwear</button>
                </div>
              </div>
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.image}
                  src={slide.image}
                  alt={slide.alt}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${heroSlide === index ? "opacity-100" : "opacity-0"}`}
                />
              ))}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,20,16,0.82),rgba(12,20,16,0.28)_48%,rgba(12,20,16,0.72)),linear-gradient(0deg,rgba(12,20,16,0.44),rgba(12,20,16,0.08)_45%,rgba(12,20,16,0.28))]" />
              <div className="relative z-10 ml-auto flex min-h-[560px] max-w-2xl flex-col justify-center px-6 py-12 text-right md:px-12">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#aebd84]">{heroSlides[heroSlide].eyebrow}</p>
                <h1 className="mt-4 font-title text-5xl font-black leading-[0.9] md:text-7xl">{heroSlides[heroSlide].title}</h1>
                <p className="mt-4 text-sm font-black md:text-base">{heroSlides[heroSlide].copy}</p>
                <div className="mt-7 flex justify-end gap-3">
                  <button onClick={() => openCategory(heroSlides[heroSlide].category)} className="h-11 bg-[#aebd84] px-6 text-xs font-black uppercase text-[#0c1410]">Shop Now</button>
                  <button onClick={() => openCategory("All")} className="h-11 border border-[#aebd84] bg-[#0c1410]/35 px-6 text-xs font-black uppercase text-[#f4eadb]">Shop All</button>
                </div>
              </div>
              <div className="absolute bottom-6 right-8 z-10 hidden gap-2 md:flex">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.image}
                    onClick={() => setHeroSlide(index)}
                    aria-label={`Show hero slide ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full ${heroSlide === index ? "bg-[#f4eadb]" : "bg-[#f4eadb]/50"}`}
                  />
                ))}
              </div>
            </section>
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {collectionCards.map((card) => (
                <button
                  key={card.label}
                  onClick={() => openCategory(card.category)}
                  className={`group relative min-h-[360px] overflow-hidden rounded-3xl p-5 text-[#f4eadb] transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.className}`}
                >
                  <div className="absolute inset-x-8 top-1/2 h-px bg-[#f4eadb]/20" />
                  {card.product ? (
                    <img
                      src={card.product.imageUrl}
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
                </button>
              ))}
            </section>
            <section className="mt-8 text-center">
              <h2 className="font-title text-3xl font-black">Our Favorites</h2>
              <div className="mx-auto mt-5 grid max-w-5xl grid-cols-3 border-b border-[#d9d2bd] text-xs font-black uppercase">
                {(["Everyday", "Travel", "Collectibles"] as const).map((shelf) => (
                  <button key={shelf} onClick={() => setFavoriteShelf(shelf)} className={`pb-3 ${favoriteShelf === shelf ? "border-b-2 border-[#0c1410]" : "text-[#6b705f]"}`}>{shelf}</button>
                ))}
              </div>
              <div className="mt-6 grid gap-5 text-left sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {(shelfProducts.length ? shelfProducts : products).slice(0, 8).map((product) => <ShopProductCard key={product.id} product={product} saved={savedProductIds.includes(product.id)} onOpen={() => openProduct(product.id)} onSave={() => toggleSaved(product.id)} onAdd={() => addProductAndOpenCart(product.id)} />)}
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {categories.filter((item) => item !== "All").map((item) => (
                  <button key={item} onClick={() => openCategory(item)} className={`h-10 border px-4 text-xs font-black uppercase ${category === item ? "border-[#0c1410] bg-[#0c1410] text-[#f4eadb]" : "border-[#d9d2bd] text-[#0c1410] hover:border-[#aebd84]"}`}>{item}</button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {view === "product" && selectedProduct ? <section className="grid gap-6 lg:grid-cols-[1fr_420px]"><ProductArt product={selectedProduct} /><div className="rounded-md bg-[#16241c] p-6"><p className="text-sm font-black text-[#aebd84]">{selectedProduct.category}</p><h1 className="mt-2 text-4xl font-semibold leading-tight text-[#f4eadb]">{selectedProduct.name}</h1><p className="mt-4 text-[#cfd4c2]">{selectedProduct.description}</p><p className="mt-5 text-3xl font-black text-[#aebd84]">{money(selectedProduct.priceCents, selectedProduct.currency)}</p><p className="mt-2 text-sm text-[#9aa896]">{selectedProduct.isService ? "Service" : `${selectedProduct.stockQty} in stock`}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => addProductAndOpenCart(selectedProduct.id)} className="h-12 rounded-md bg-[#aebd84] text-sm font-black text-[#0c1410]">Add to cart</button><button onClick={() => toggleSaved(selectedProduct.id)} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#2a3a2f] text-sm font-black text-[#aebd84]"><Heart className={`h-4 w-4 ${savedProductIds.includes(selectedProduct.id) ? "fill-current" : ""}`} /> {savedProductIds.includes(selectedProduct.id) ? "Saved" : "Save"}</button></div></div></section> : null}

        {view === "cart" ? <CartView cartProducts={cartProducts} totals={totals} onCheckout={() => setView("checkout")} /> : null}
        {view === "checkout" ? <section className="grid gap-5 lg:grid-cols-[1fr_360px]"><Panel title="Checkout"><div className="grid gap-3"><input value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} className={fieldClass()} placeholder="Name" /><input value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className={fieldClass()} placeholder="Email" /><input value={customer.shipping} onChange={(event) => setCustomer({ ...customer, shipping: event.target.value })} className={fieldClass()} placeholder="Shipping address" /><div className="grid gap-2 sm:grid-cols-3">{["Mock card", "Invoice me", "Pay in store"].map((method) => <button key={method} onClick={() => setPaymentMethod(method)} className={`h-10 rounded-md text-sm font-black ${paymentMethod === method ? "bg-[#aebd84] text-[#0c1410]" : "border border-[#2a3a2f] text-[#aebd84]"}`}>{method}</button>)}</div><div className="rounded-sm bg-[#0c1410] p-3 text-sm text-[#9aa896]">{paymentMethod} selected. Real payment providers can plug into this step later; today it runs the order transaction and receipt flow.</div><button disabled={!customer.name || !customer.email || !store.cart.length} onClick={placeOrder} className="h-11 rounded-md bg-[#aebd84] text-sm font-black text-[#0c1410] disabled:opacity-45">Place order</button></div></Panel><OrderSummary totals={totals} /></section> : null}
        {view === "confirmation" && lastOrder ? <section className="rounded-md bg-[#16241c] p-7"><CheckCircle2 className="h-10 w-10 text-[#aebd84]" /><h1 className="mt-4 font-title text-5xl font-black">Order confirmed.</h1><p className="mt-2 text-[#9aa896]">Order {lastOrder.id} · {money(lastOrder.totalCents, lastOrder.currency)}</p><div className="mt-6 flex flex-wrap gap-3">{lastReceipt ? <a href={lastReceipt.pdfUrl} download={`${lastReceipt.number}.pdf`} className="inline-flex h-11 items-center gap-2 rounded-md bg-[#aebd84] px-4 text-sm font-black text-[#0c1410]"><Download className="h-4 w-4" /> Download receipt</a> : null}<button onClick={() => openCategory("All")} className="h-11 rounded-md border border-[#2a3a2f] px-4 text-sm font-black text-[#aebd84]">Keep shopping</button><button onClick={() => setView("account")} className="h-11 rounded-md border border-[#2a3a2f] px-4 text-sm font-black text-[#aebd84]">Order history</button></div></section> : null}
        {view === "account" ? <Panel title="Customer account"><div className="grid gap-3">{store.orders.map((order) => { const receipt = store.receipts.find((item) => item.orderId === order.id); return <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-[#0c1410] p-3"><span><span className="block font-bold">{order.id}</span><span className="text-sm text-[#9aa896]">{order.status} · {money(order.totalCents, order.currency)}</span></span>{receipt ? <a href={receipt.pdfUrl} download={`${receipt.number}.pdf`} className="text-sm font-black text-[#aebd84]">Receipt</a> : null}</div>; })}</div></Panel> : null}
        {view === "wishlist" ? <Panel title="Saved items"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{savedProducts.length ? savedProducts.map((product) => <ShopProductCard key={product.id} product={product} saved onOpen={() => openProduct(product.id)} onSave={() => toggleSaved(product.id)} onAdd={() => addProductAndOpenCart(product.id)} />) : <p className="text-[#9aa896]">No saved products yet. Tap the heart on any product card.</p>}</div></Panel> : null}
      </main>
    </section>
  );
}

function CartView({ cartProducts, totals, onCheckout }: { cartProducts: Array<{ item: { productId: string; qty: number }; product: StorefrontProduct }>; totals: { subtotalCents: number; taxCents: number; totalCents: number }; onCheckout: () => void }) {
  const store = useStorefrontStore();
  return <section className="grid gap-5 lg:grid-cols-[1fr_360px]"><Panel title="Cart"><div className="grid gap-3">{cartProducts.map(({ item, product }) => <div key={product.id} className="grid gap-3 rounded-sm bg-[#0c1410] p-3 md:grid-cols-[1fr_120px_100px] md:items-center"><div><p className="font-bold">{product.name}</p><p className="text-sm text-[#9aa896]">{money(product.priceCents, product.currency)}</p></div><input type="number" min={1} value={item.qty} onChange={(event) => store.updateCartQty(product.id, Number(event.target.value))} className={fieldClass()} /><button onClick={() => store.removeFromCart(product.id)} className="h-10 rounded-md border border-[#2a3a2f] text-sm font-bold text-[#aebd84]">Remove</button></div>)}</div></Panel><OrderSummary totals={totals} action={<button disabled={!cartProducts.length} onClick={onCheckout} className="mt-4 h-11 w-full rounded-md bg-[#aebd84] text-sm font-black text-[#0c1410] disabled:opacity-45">Checkout</button>} /></section>;
}

function OrderSummary({ totals, action }: { totals: { subtotalCents: number; taxCents: number; totalCents: number }; action?: React.ReactNode }) {
  return <Panel title="Order summary"><div className="grid gap-2 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotalCents)}</span></p><p className="flex justify-between"><span>Tax</span><span>{money(totals.taxCents)}</span></p><p className="flex justify-between border-t border-[#2a3a2f] pt-3 text-xl font-black"><span>Total</span><span>{money(totals.totalCents)}</span></p></div>{action}</Panel>;
}
