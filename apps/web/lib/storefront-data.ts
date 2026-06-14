export type StorefrontProductStatus = "active" | "draft" | "archived";
export type StorefrontOrderStatus = "pending" | "paid" | "fulfilled" | "refunded" | "cancelled";

export type StorefrontProduct = {
  id: string;
  orgId: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  sku: string;
  trackInventory: boolean;
  stockQty: number;
  lowStockThreshold: number;
  status: StorefrontProductStatus;
  imageUrl?: string;
  isService: boolean;
};

export type StorefrontCustomer = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  createdAt: string;
};

export type StorefrontOrderItem = {
  id: string;
  orgId: string;
  orderId: string;
  productId: string;
  nameSnapshot: string;
  qty: number;
  unitPriceCents: number;
};

export type StorefrontOrder = {
  id: string;
  orgId: string;
  customerId: string;
  status: StorefrontOrderStatus;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  placedAt: string;
};

export type StorefrontReceipt = {
  id: string;
  orgId: string;
  orderId: string;
  pdfUrl: string;
  number: string;
  issuedAt: string;
};

export type StorefrontInventoryAdjustment = {
  id: string;
  orgId: string;
  productId: string;
  delta: number;
  reason: string;
  createdAt: string;
};

export type StorefrontSettings = {
  orgId: string;
  storeName: string;
  currency: string;
  taxRate: number;
  branding: {
    primary: string;
    accent: string;
    logoText: string;
  };
};

export type StorefrontSeed = {
  settings: StorefrontSettings;
  products: StorefrontProduct[];
  customers: StorefrontCustomer[];
  orders: StorefrontOrder[];
  orderItems: StorefrontOrderItem[];
  receipts: StorefrontReceipt[];
  inventoryAdjustments: StorefrontInventoryAdjustment[];
};

export const storefrontOrgId = "org-eclipse-storefront";

export const storefrontSeed: StorefrontSeed = {
  settings: {
    orgId: storefrontOrgId,
    storeName: "Eclipse",
    currency: "USD",
    taxRate: 0.0825,
    branding: {
      primary: "#0c1410",
      accent: "#aebd84",
      logoText: "Eclipse"
    }
  },
  products: [
    ["prod-mens-heavyweight-logo-tee", "Heavyweight Logo Tee", "A sturdy daily tee with a heavyweight handfeel and crisp Storefront mark. Built for repeat wear without losing its shape.", "Men's", 2800, "MENS-HEAVYWEIGHT-LOGO-TEE", true, 24, 6, "active", false, "/products/mens-heavyweight-logo-tee.png"],
    ["prod-mens-vintage-wash-hoodie", "Vintage Wash Hoodie", "Soft fleece with a broken-in wash and oversized front pocket. The tonal chest hit keeps it understated.", "Men's", 6200, "MENS-VINTAGE-WASH-HOODIE", true, 24, 6, "active", false, "/products/mens-vintage-wash-hoodie.png"],
    ["prod-mens-trail-crewneck", "Trail Crew Crewneck", "A midweight crewneck made for cool mornings and late shop nights. Ribbed cuffs and a relaxed fit keep it easy.", "Men's", 5400, "MENS-TRAIL-CREWNECK", true, 24, 6, "active", false, "/products/mens-trail-crewneck.png"],
    ["prod-mens-long-sleeve-field-shirt", "Long Sleeve Field Shirt", "A clean long sleeve with sleeve graphics and a soft cotton feel. Layers well under jackets or over tanks.", "Men's", 3400, "MENS-LONG-SLEEVE-FIELD-SHIRT", true, 24, 6, "active", false, "/products/mens-long-sleeve-field-shirt.png"],
    ["prod-mens-workbench-tank", "Workbench Tank", "Lightweight tank with wide binding and a square hem. Made for gym days, summer markets, and travel.", "Men's", 2600, "MENS-WORKBENCH-TANK", true, 24, 6, "active", false, "/products/mens-workbench-tank.png"],
    ["prod-mens-fleece-jogger", "Fleece Shop Jogger", "Tapered fleece joggers with a soft interior and secure back pocket. Coordinates with the Storefront hoodie line.", "Men's", 5800, "MENS-FLEECE-JOGGER", true, 2, 3, "active", false, "/products/mens-fleece-jogger.png"],
    ["prod-mens-pocket-tee", "Pocket Mark Tee", "A garment-dyed pocket tee with a small woven label. Easy colorways make it a shelf staple.", "Men's", 3000, "MENS-POCKET-TEE", true, 24, 6, "active", false, "/products/mens-pocket-tee.png"],
    ["prod-mens-zip-hoodie", "Full Zip Utility Hoodie", "A full zip hoodie with a structured hood and split kangaroo pocket. Drafted for the next seasonal drop.", "Men's", 6400, "MENS-ZIP-HOODIE", true, 24, 6, "draft", false, "/products/mens-zip-hoodie.png"],
    ["prod-womens-crop-logo-tee", "Crop Logo Tee", "A cropped tee with a boxy fit and soft neckline. The front mark sits high for easy styling.", "Women's", 2600, "WOMENS-CROP-LOGO-TEE", true, 24, 6, "active", false, "/products/womens-crop-logo-tee.png"],
    ["prod-womens-vintage-hoodie", "Vintage Wash Hoodie", "Plush fleece with a worn-in wash and slightly shorter body. Comfortable without feeling bulky.", "Women's", 6000, "WOMENS-VINTAGE-HOODIE", true, 24, 6, "active", false, "/products/womens-vintage-hoodie.png"],
    ["prod-womens-ribbed-tank", "Ribbed Studio Tank", "A ribbed tank with a close fit and clean binding. Designed as an everyday base layer.", "Women's", 2400, "WOMENS-RIBBED-TANK", true, 24, 6, "active", false, "/products/womens-ribbed-tank.png"],
    ["prod-womens-performance-legging", "Performance Logo Legging", "Supportive leggings with a smooth waistband and tonal ankle mark. Good for errands, travel, and training.", "Women's", 5200, "WOMENS-PERFORMANCE-LEGGING", true, 24, 6, "active", false, "/products/womens-performance-legging.png"],
    ["prod-womens-relaxed-tee", "Relaxed Shop Tee", "A relaxed tee with a draped shoulder and soft jersey feel. Printed with the Storefront wordmark.", "Women's", 2800, "WOMENS-RELAXED-TEE", true, 24, 6, "active", false, "/products/womens-relaxed-tee.png"],
    ["prod-womens-fleece-crew", "Sunday Fleece Crew", "A cozy crewneck with brushed fleece and ribbed side panels. The fit is roomy but polished.", "Women's", 5200, "WOMENS-FLEECE-CREW", true, 2, 3, "active", false, "/products/womens-fleece-crew.png"],
    ["prod-womens-long-sleeve", "Market Long Sleeve", "Long sleeve jersey with a sleeve print and minimal chest mark. Prepared for a limited run.", "Women's", 3400, "WOMENS-LONG-SLEEVE", true, 24, 6, "draft", false, "/products/womens-long-sleeve.png"],
    ["prod-womens-cropped-hoodie", "Cropped Utility Hoodie", "A cropped fleece hoodie with a structured hood and wide rib hem. Easy over leggings or denim.", "Women's", 5800, "WOMENS-CROPPED-HOODIE", true, 24, 6, "active", false, "/products/womens-cropped-hoodie.png"],
    ["prod-youth-logo-tee", "Youth Logo Tee", "A soft youth tee with a durable screen print. Built for school days, markets, and weekend wear.", "Youth / Kids", 2400, "YOUTH-LOGO-TEE", true, 24, 6, "active", false, "/products/youth-logo-tee.png"],
    ["prod-youth-mini-hoodie", "Mini Maker Hoodie", "A cozy youth hoodie with a front pouch pocket and cheerful back graphic. Easy to wash and easy to love.", "Youth / Kids", 4800, "YOUTH-MINI-HOODIE", true, 24, 6, "active", false, "/products/youth-mini-hoodie.png"],
    ["prod-youth-sprout-tee", "Sprout Badge Tee", "A playful badge tee with a small front icon. Lightweight cotton keeps it comfortable all day.", "Youth / Kids", 2400, "YOUTH-SPROUT-TEE", true, 2, 3, "active", false, "/products/youth-sprout-tee.png"],
    ["prod-youth-varsity-hoodie", "Varsity Wordmark Hoodie", "A youth hoodie with a collegiate wordmark and soft fleece interior. Drafted for back-to-school merchandising.", "Youth / Kids", 5000, "YOUTH-VARSITY-HOODIE", true, 24, 6, "draft", false, "/products/youth-varsity-hoodie.png"],
    ["prod-headwear-classic-snapback", "Classic Logo Snapback", "Structured snapback with a flat brim and embroidered Storefront mark. Adjustable closure fits most.", "Headwear", 3200, "HEADWEAR-CLASSIC-SNAPBACK", true, 24, 6, "active", false, "/products/headwear-classic-snapback.png"],
    ["prod-headwear-dad-cap", "Everyday Dad Cap", "Unstructured cotton cap with a curved brim and low-profile embroidery. A reliable everyday hat.", "Headwear", 2800, "HEADWEAR-DAD-CAP", true, 24, 6, "active", false, "/products/headwear-dad-cap.png"],
    ["prod-headwear-trail-beanie", "Trail Crew Beanie", "A warm rib-knit beanie with a woven Storefront label. Packs small and wears everywhere.", "Headwear", 2200, "HEADWEAR-TRAIL-BEANIE", true, 2, 3, "active", false, "/products/headwear-trail-beanie.png"],
    ["prod-headwear-rope-cap", "Rope Detail Cap", "A vintage-inspired cap with rope trim and embroidered badge. Lightweight and adjustable.", "Headwear", 3000, "HEADWEAR-ROPE-CAP", true, 24, 6, "active", false, "/products/headwear-rope-cap.png"],
    ["prod-headwear-watch-cap", "Dockside Watch Cap", "A classic cuffed watch cap with a tight knit and heritage look. Archived after the winter capsule.", "Headwear", 2200, "HEADWEAR-WATCH-CAP", true, 24, 6, "archived", false, "/products/headwear-watch-cap.png"],
    ["prod-accessory-canvas-tote", "Market Canvas Tote", "A sturdy cotton tote with long handles and a large front print. Sized for groceries, books, and daily carry.", "Accessories", 1800, "ACCESSORY-CANVAS-TOTE", true, 24, 6, "active", false, "/products/accessory-canvas-tote.png"],
    ["prod-accessory-crew-socks", "Stacked Logo Crew Socks", "Cushioned crew socks with a stacked logo knit into the ankle. Soft enough for lounging and durable enough for daily wear.", "Accessories", 1200, "ACCESSORY-CREW-SOCKS", true, 24, 6, "active", false, "/products/accessory-crew-socks.png"],
    ["prod-accessory-enamel-pin", "Register Enamel Pin", "A small enamel pin inspired by checkout counters and market stalls. Rubber clutch back keeps it secure.", "Accessories", 800, "ACCESSORY-ENAMEL-PIN", true, 24, 6, "active", false, "/products/accessory-enamel-pin.png"],
    ["prod-accessory-logo-lanyard", "Logo Lanyard", "A woven lanyard with breakaway clasp and metal swivel hook. Great for events, staff badges, and keys.", "Accessories", 1000, "ACCESSORY-LOGO-LANYARD", true, 24, 6, "active", false, "/products/accessory-logo-lanyard.png"],
    ["prod-accessory-crossbody-pouch", "Utility Crossbody Pouch", "Compact pouch with zip compartments and adjustable strap. Draft item for a practical accessories drop.", "Accessories", 2600, "ACCESSORY-CROSSBODY-POUCH", true, 24, 6, "draft", false, "/products/accessory-crossbody-pouch.png"],
    ["prod-stickers-holographic-pack", "Holographic Sticker Pack", "Five holographic stickers with Storefront icons and wordmarks. Weather-resistant vinyl makes them laptop and bottle friendly.", "Stickers & Decals", 1200, "STICKERS-HOLOGRAPHIC-PACK", true, 24, 6, "active", false, "/products/stickers-holographic-pack.png"],
    ["prod-stickers-die-cut-logo", "Die-Cut Logo Sticker", "A clean die-cut logo sticker printed on durable vinyl. A simple add-on for every order.", "Stickers & Decals", 400, "STICKERS-DIE-CUT-LOGO", true, 24, 6, "active", false, "/products/stickers-die-cut-logo.png"],
    ["prod-stickers-register-single", "Register Icon Sticker", "Single register icon sticker with a satin finish. Designed for notebooks, laptops, and shipping stations.", "Stickers & Decals", 400, "STICKERS-REGISTER-SINGLE", true, 24, 6, "active", false, "/products/stickers-register-single.png"],
    ["prod-stickers-window-decal", "Shop Window Vinyl Decal", "Large white vinyl decal for doors, counters, and display windows. Transfer tape included for easy application.", "Stickers & Decals", 1200, "STICKERS-WINDOW-DECAL", true, 0, 3, "active", false, "/products/stickers-window-decal.png"],
    ["prod-stickers-mini-label-pack", "Mini Label Sticker Pack", "A sheet of mini labels inspired by packing slips and shop tags. Perfect for planners and packaging.", "Stickers & Decals", 1200, "STICKERS-MINI-LABEL-PACK", true, 24, 6, "active", false, "/products/stickers-mini-label-pack.png"],
    ["prod-stickers-bumper-decal", "Market Bumper Decal", "A bold bumper decal with outdoor-rated adhesive. Made for cases, cars, coolers, and toolboxes.", "Stickers & Decals", 800, "STICKERS-BUMPER-DECAL", true, 24, 6, "active", false, "/products/stickers-bumper-decal.png"],
    ["prod-drinkware-ceramic-mug", "Morning Register Mug", "A ceramic diner-style mug with a wraparound Storefront graphic. Holds coffee, tea, or late-night launch fuel.", "Drinkware", 1600, "DRINKWARE-CERAMIC-MUG", true, 24, 6, "active", false, "/products/drinkware-ceramic-mug.png"],
    ["prod-drinkware-insulated-tumbler", "Insulated Market Tumbler", "Double-wall tumbler with a spill-resistant lid and tonal logo. Keeps drinks steady through long packing days.", "Drinkware", 2800, "DRINKWARE-INSULATED-TUMBLER", true, 24, 6, "active", false, "/products/drinkware-insulated-tumbler.png"],
    ["prod-drinkware-water-bottle", "Trail Water Bottle", "Reusable bottle with a carry loop and wide mouth. Built for daily commutes and weekend pop-ups.", "Drinkware", 2400, "DRINKWARE-WATER-BOTTLE", true, 24, 6, "active", false, "/products/drinkware-water-bottle.png"],
    ["prod-drinkware-camp-cup", "Enamel Camp Cup", "Lightweight enamel cup with a speckled finish and printed badge. A rugged piece for coffee outside or desk duty.", "Drinkware", 1800, "DRINKWARE-CAMP-CUP", true, 24, 6, "active", false, "/products/drinkware-camp-cup.png"],
    ["prod-drinkware-straw-cup", "Studio Straw Cup", "Reusable straw cup with a clean printed mark and easy-grip lid. Ideal for iced coffee and studio days.", "Drinkware", 2200, "DRINKWARE-STRAW-CUP", true, 24, 6, "active", false, "/products/drinkware-straw-cup.png"],
    ["prod-prints-launch-poster", "Launch Day Poster", "A bold 18x24 poster celebrating launch-day energy and storefront windows. Printed on heavyweight matte stock.", "Prints", 2800, "PRINTS-LAUNCH-POSTER", true, 24, 6, "active", false, "/products/prints-launch-poster.png"],
    ["prod-prints-market-art", "Night Market Art Print", "An illustrated market scene in the Storefront palette. Easy to frame for offices, studios, and counters.", "Prints", 2200, "PRINTS-MARKET-ART", true, 24, 6, "active", false, "/products/prints-market-art.png"],
    ["prod-prints-window-sign", "Open Window Sign Print", "A friendly open-sign print made for shop walls and checkout counters. Matte paper reduces glare.", "Prints", 1800, "PRINTS-WINDOW-SIGN", true, 24, 6, "active", false, "/products/prints-window-sign.png"],
    ["prod-prints-archive-poster", "Archive Collection Poster", "A limited archive poster from the first Storefront merch run. Archived for historical order records.", "Prints", 3500, "PRINTS-ARCHIVE-POSTER", true, 24, 6, "archived", false, "/products/prints-archive-poster.png"],
    ["prod-prints-counter-card", "Counter Card Mini Print", "Small-format print designed for counters, shelves, and packing benches. A tidy add-on for gift orders.", "Prints", 1800, "PRINTS-COUNTER-CARD", true, 2, 3, "active", false, "/products/prints-counter-card.png"],
    ["prod-mens-shop-coach-jacket", "Shop Coach Jacket", "A lightweight snap jacket with a crisp back print and drawcord hem. Works as a top layer for events and cool mornings.", "Men's", 6400, "MENS-SHOP-COACH-JACKET", true, 24, 6, "active", false, "/products/mens-shop-coach-jacket.png"],
    ["prod-womens-studio-jogger", "Studio Fleece Jogger", "Soft fleece joggers with a relaxed taper and tonal hip mark. Comfortable enough for travel and polished enough for errands.", "Women's", 5600, "WOMENS-STUDIO-JOGGER", true, 24, 6, "active", false, "/products/womens-studio-jogger.png"],
    ["prod-headwear-five-panel", "Five Panel Shop Cap", "Low-profile five panel cap with a woven front patch. Lightweight nylon makes it easy to pack.", "Headwear", 3000, "HEADWEAR-FIVE-PANEL", true, 24, 6, "active", false, "/products/headwear-five-panel.png"],
    ["prod-accessory-packable-tote", "Packable Logo Tote", "A foldable tote that tucks into its own pocket. Handy for pop-ups, shopping trips, and travel.", "Accessories", 1800, "ACCESSORY-PACKABLE-TOTE", true, 24, 6, "active", false, "/products/accessory-packable-tote.png"],
    ["prod-drinkware-travel-mug", "Commuter Travel Mug", "A stainless travel mug with a secure lid and subtle Storefront mark. Keeps morning coffee moving.", "Drinkware", 2800, "DRINKWARE-TRAVEL-MUG", true, 24, 6, "active", false, "/products/drinkware-travel-mug.png"]
  ].map(([id, name, description, category, priceCents, sku, trackInventory, stockQty, lowStockThreshold, status, isService, imageUrl]) => ({
    id: id as string,
    orgId: storefrontOrgId,
    name: name as string,
    description: description as string,
    category: category as StorefrontProduct["category"],
    priceCents: priceCents as number,
    currency: "USD",
    sku: sku as string,
    trackInventory: trackInventory as boolean,
    stockQty: stockQty as number,
    lowStockThreshold: lowStockThreshold as number,
    status: status as StorefrontProductStatus,
    imageUrl: imageUrl as string,
    isService: isService as boolean
  })),
  customers: [
    { id: "cust-ada", orgId: storefrontOrgId, name: "Ada Benton", email: "ada@example.com", createdAt: "2026-06-01T14:15:00.000Z" },
    { id: "cust-marco", orgId: storefrontOrgId, name: "Marco Ruiz", email: "marco@example.com", createdAt: "2026-06-03T09:20:00.000Z" },
    { id: "cust-nina", orgId: storefrontOrgId, name: "Nina Cole", email: "nina@example.com", createdAt: "2026-06-06T16:40:00.000Z" }
  ],
  orders: [
    { id: "order-1001", orgId: storefrontOrgId, customerId: "cust-ada", status: "fulfilled", subtotalCents: 17800, taxCents: 1469, totalCents: 19269, currency: "USD", placedAt: "2026-06-08T15:30:00.000Z" },
    { id: "order-1002", orgId: storefrontOrgId, customerId: "cust-marco", status: "paid", subtotalCents: 240000, taxCents: 19800, totalCents: 259800, currency: "USD", placedAt: "2026-06-10T18:10:00.000Z" },
    { id: "order-1003", orgId: storefrontOrgId, customerId: "cust-nina", status: "pending", subtotalCents: 12900, taxCents: 1064, totalCents: 13964, currency: "USD", placedAt: "2026-06-11T11:08:00.000Z" }
  ],
  orderItems: [
    { id: "item-1001-a", orgId: storefrontOrgId, orderId: "order-1001", productId: "prod-analytics", nameSnapshot: "Analytics Starter", qty: 2, unitPriceCents: 4900 },
    { id: "item-1001-b", orgId: storefrontOrgId, orderId: "order-1001", productId: "prod-warranty", nameSnapshot: "Extended Warranty", qty: 1, unitPriceCents: 4900 },
    { id: "item-1002-a", orgId: storefrontOrgId, orderId: "order-1002", productId: "prod-launch", nameSnapshot: "Store Launch Sprint", qty: 1, unitPriceCents: 240000 },
    { id: "item-1003-a", orgId: storefrontOrgId, orderId: "order-1003", productId: "prod-scanner", nameSnapshot: "Counter Scanner Kit", qty: 1, unitPriceCents: 12900 }
  ],
  receipts: [
    { id: "receipt-1001", orgId: storefrontOrgId, orderId: "order-1001", pdfUrl: "data:application/pdf;base64,JVBERi0xLjQK", number: "ECL-1001", issuedAt: "2026-06-08T15:31:00.000Z" },
    { id: "receipt-1002", orgId: storefrontOrgId, orderId: "order-1002", pdfUrl: "data:application/pdf;base64,JVBERi0xLjQK", number: "ECL-1002", issuedAt: "2026-06-10T18:11:00.000Z" }
  ],
  inventoryAdjustments: [
    { id: "adj-1", orgId: storefrontOrgId, productId: "prod-printer", delta: -1, reason: "Order ECL-1001", createdAt: "2026-06-08T15:30:00.000Z" },
    { id: "adj-2", orgId: storefrontOrgId, productId: "prod-terminal", delta: -2, reason: "Demo stock reserve", createdAt: "2026-06-09T12:00:00.000Z" }
  ]
};

export function formatStoreMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function storefrontReceiptPdfDataUrl(text: string) {
  const escaped = text.replace(/[()\\]/g, "\\$&").replace(/\n/g, ") Tj 0 -16 Td (");
  const stream = `BT /F1 12 Tf 50 760 Td (${escaped}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
xref
0 6
0000000000 65535 f 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`;
  if (typeof window === "undefined") return `data:application/pdf;base64,${Buffer.from(pdf).toString("base64")}`;
  return `data:application/pdf;base64,${window.btoa(unescape(encodeURIComponent(pdf)))}`;
}
