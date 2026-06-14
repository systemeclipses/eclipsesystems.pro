import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");
const outDir = path.join(appRoot, "public", "products");
const sheetDir = path.join(repoRoot, "tmp", "contact-sheets");
const logoDir = path.join(repoRoot, "tmp", "logo-render");
const wordmarkPath = path.join(logoDir, "wordmark.png");
const markPath = path.join(logoDir, "e-olive.png");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const assetData = new Map();

async function dataUrl(filePath) {
  const cached = assetData.get(filePath);
  if (cached) return cached;
  const value = `data:image/png;base64,${(await readFile(filePath)).toString("base64")}`;
  assetData.set(filePath, value);
  return value;
}

const sheetMap = new Map([
  ["mens-heavyweight-logo-tee", ["isolated-01.png", 0]],
  ["mens-vintage-wash-hoodie", ["isolated-01.png", 1]],
  ["mens-trail-crewneck", ["isolated-01.png", 2]],
  ["mens-long-sleeve-field-shirt", ["isolated-01.png", 3]],
  ["mens-workbench-tank", ["isolated-02.png", 0]],
  ["mens-fleece-jogger", ["isolated-02.png", 1]],
  ["mens-pocket-tee", ["isolated-02.png", 2]],
  ["mens-zip-hoodie", ["isolated-02.png", 3]],
  ["womens-crop-logo-tee", ["isolated-03.png", 0]],
  ["womens-vintage-hoodie", ["isolated-03.png", 1]],
  ["womens-ribbed-tank", ["isolated-03.png", 2]],
  ["womens-performance-legging", ["isolated-03.png", 3]],
  ["womens-relaxed-tee", ["isolated-04.png", 0]],
  ["womens-fleece-crew", ["isolated-04.png", 1]],
  ["womens-long-sleeve", ["isolated-04.png", 2]],
  ["womens-cropped-hoodie", ["isolated-04.png", 3]],
  ["youth-logo-tee", ["isolated-05.png", 0]],
  ["youth-mini-hoodie", ["isolated-05.png", 1]],
  ["youth-sprout-tee", ["isolated-05.png", 2]],
  ["youth-varsity-hoodie", ["isolated-05.png", 3]],
  ["headwear-classic-snapback", ["isolated-06.png", 0]],
  ["headwear-dad-cap", ["isolated-06.png", 1]],
  ["headwear-trail-beanie", ["isolated-06.png", 2]],
  ["headwear-rope-cap", ["isolated-06.png", 3]],
  ["headwear-watch-cap", ["isolated-07.png", 0]],
  ["accessory-canvas-tote", ["isolated-07.png", 1]],
  ["accessory-crew-socks", ["isolated-07.png", 2]],
  ["accessory-enamel-pin", ["isolated-07.png", 3]],
  ["accessory-logo-lanyard", ["isolated-08.png", 0]],
  ["accessory-crossbody-pouch", ["isolated-08.png", 1]],
  ["stickers-holographic-pack", ["isolated-08.png", 2]],
  ["stickers-die-cut-logo", ["isolated-08.png", 3]],
  ["stickers-register-single", ["isolated-09.png", 0]],
  ["stickers-window-decal", ["isolated-09.png", 1]],
  ["stickers-mini-label-pack", ["isolated-09.png", 2]],
  ["stickers-bumper-decal", ["isolated-09.png", 3]],
  ["drinkware-ceramic-mug", ["isolated-10.png", 0]],
  ["drinkware-insulated-tumbler", ["isolated-10.png", 1]],
  ["drinkware-water-bottle", ["isolated-10.png", 2]],
  ["drinkware-camp-cup", ["isolated-10.png", 3]],
  ["drinkware-straw-cup", ["isolated-11.png", 0]],
  ["prints-launch-poster", ["isolated-11.png", 1]],
  ["prints-market-art", ["isolated-11.png", 2]],
  ["prints-window-sign", ["isolated-11.png", 3]],
  ["prints-archive-poster", ["isolated-12.png", 0]],
  ["prints-counter-card", ["isolated-14.png", 0]],
  ["mens-shop-coach-jacket", ["isolated-12.png", 1]],
  ["womens-studio-jogger", ["isolated-12.png", 2]],
  ["headwear-five-panel", ["isolated-12.png", 3]],
  ["accessory-packable-tote", ["isolated-13.png", 0]],
  ["drinkware-travel-mug", ["isolated-13.png", 1]]
]);

async function loadProducts() {
  const seed = await readFile(path.join(appRoot, "scripts", "seed-storefront-demo.ts"), "utf8");
  const match = seed.match(/const products: ProductSeed\[\] = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error("Could not find storefront products in seed-storefront-demo.ts");
  return Function(`
    "use strict";
    const apparelSizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const youthSizes = ["YXS", "YS", "YM", "YL", "YXL"];
    const oneSize = ["OS"];
    return ${match[1]};
  `)();
}

const logoOverrides = new Map([
  ["mens-pocket-tee", { logo: "mark", placement: "pocket" }],
  ["mens-workbench-tank", { logo: "wordmark", placement: "tank-chest" }],
  ["womens-ribbed-tank", { logo: "wordmark", placement: "tank-chest" }],
  ["womens-performance-legging", { logo: "mark", placement: "leg" }],
  ["womens-studio-jogger", { logo: "mark", placement: "leg" }],
  ["mens-fleece-jogger", { logo: "mark", placement: "leg" }],
  ["headwear-classic-snapback", { logo: "mark", placement: "cap" }],
  ["headwear-dad-cap", { logo: "mark", placement: "cap" }],
  ["headwear-five-panel", { logo: "mark", placement: "cap" }],
  ["headwear-rope-cap", { logo: "mark", placement: "cap" }],
  ["headwear-trail-beanie", { logo: "mark", placement: "beanie" }],
  ["headwear-watch-cap", { logo: "mark", placement: "beanie" }],
  ["mens-zip-hoodie", { logo: "mark", placement: "left-chest" }],
  ["mens-shop-coach-jacket", { logo: "mark", placement: "left-chest" }]
]);

function logoSpec(product) {
  const override = logoOverrides.get(product.slug);
  const type = product.type;
  const mark = override?.logo
    ? override.logo === "mark"
    : /snapback|cap|beanie|pin|sticker|decal|label|bottle|mug|cup|tumbler|jogger|legging|socks|lanyard|pocket/.test(type);
  const text = `${product.colors.join(" ")} ${product.slug}`.toLowerCase();
  const dark = /(black|forest|navy|charcoal|graphite|moss|pine|washed black)/.test(text);
  const lightFilter = "brightness(0) saturate(100%) invert(93%) sepia(14%) saturate(295%) hue-rotate(6deg) brightness(106%) contrast(93%)";
  const darkFilter = "brightness(0) saturate(100%) invert(10%) sepia(12%) saturate(781%) hue-rotate(78deg) brightness(88%) contrast(91%)";
  return {
    src: mark ? markPath : wordmarkPath,
    className: mark ? "mark" : "wordmark",
    filter: dark ? lightFilter : darkFilter
  };
}

function logoPlacement(product) {
  const override = logoOverrides.get(product.slug);
  if (override?.placement) return override.placement;
  const type = product.type;
  if (/joggers|leggings/.test(type)) return "leg";
  if (/snapback|cap/.test(type)) return "cap";
  if (/beanie/.test(type)) return "beanie";
  if (/socks/.test(type)) return "socks";
  if (/pin/.test(type)) return "pin";
  if (/lanyard/.test(type)) return "lanyard";
  if (/sticker|decal/.test(type)) return "sticker";
  if (/mug|cup|tumbler|bottle|travel/.test(type)) return "drinkware";
  if (/poster|print/.test(type)) return "print";
  if (/tote|pouch/.test(type)) return "bag";
  if (/zip|jacket/.test(type)) return "left-chest";
  return "chest";
}

async function htmlFor(product, index) {
  const sheetInfo = sheetMap.get(product.slug);
  if (!sheetInfo) throw new Error(`No source sheet mapping for ${product.slug}`);
  const [sheet, quadrant] = sheetInfo;
  const col = quadrant % 2;
  const row = Math.floor(quadrant / 2);
  const logo = logoSpec(product);
  const placement = logoPlacement(product);
  const sheetUrl = await dataUrl(path.join(sheetDir, sheet));
  const logoUrl = await dataUrl(logo.src);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; }
body { margin: 0; background: white; }
.frame { position: relative; width: 1000px; height: 1000px; overflow: hidden; background: white; }
.source { position: absolute; width: 2000px; height: 2000px; left: ${col ? "-1000px" : "0"}; top: ${row ? "-1000px" : "0"}; object-fit: cover; }
.logo { position: absolute; object-fit: contain; opacity: .92; filter: ${logo.filter}; mix-blend-mode: multiply; }
.logo.light { mix-blend-mode: screen; }
.wordmark { width: 150px; height: auto; }
.mark { width: 72px; height: 72px; }
.chest.wordmark { left: 425px; top: 405px; }
.chest.mark { left: 464px; top: 392px; }
.tank-chest.wordmark { left: 425px; top: 465px; width: 150px; }
.tank-chest.mark { left: 466px; top: 448px; width: 68px; height: 68px; }
.pocket.mark { left: 655px; top: 386px; width: 38px; height: 38px; }
.pocket.wordmark { left: 625px; top: 402px; width: 82px; }
.left-chest.wordmark { left: 545px; top: 390px; width: 92px; }
.left-chest.mark { left: 578px; top: 375px; width: 48px; height: 48px; }
.leg.mark { left: 565px; top: 640px; width: 46px; height: 46px; }
.leg.wordmark { left: 530px; top: 650px; width: 105px; }
.cap.mark { left: 466px; top: 455px; width: 62px; height: 62px; }
.cap.wordmark { left: 425px; top: 467px; width: 145px; }
.beanie.mark { left: 465px; top: 530px; width: 58px; height: 58px; }
.beanie.wordmark { left: 425px; top: 542px; width: 145px; }
.socks.mark { left: 490px; top: 500px; width: 42px; height: 42px; }
.pin.mark { left: 452px; top: 448px; width: 96px; height: 96px; }
.lanyard.wordmark { left: 385px; top: 470px; width: 170px; transform: rotate(-18deg); }
.lanyard.mark { left: 465px; top: 455px; width: 54px; height: 54px; transform: rotate(-18deg); }
.sticker.wordmark { left: 400px; top: 455px; width: 190px; }
.sticker.mark { left: 450px; top: 430px; width: 100px; height: 100px; }
.drinkware.wordmark { left: 410px; top: 475px; width: 180px; }
.drinkware.mark { left: 462px; top: 445px; width: 78px; height: 78px; }
.print.wordmark { left: 400px; top: 455px; width: 190px; }
.print.mark { left: 440px; top: 420px; width: 120px; height: 120px; }
.bag.wordmark { left: 395px; top: 462px; width: 205px; }
.bag.mark { left: 455px; top: 430px; width: 90px; height: 90px; }
</style>
</head>
<body>
  <div class="frame">
    <img class="source" src="${sheetUrl}" alt="">
    <img class="logo ${logo.className} ${placement} ${logo.filter.includes("invert(93") ? "light" : ""}" src="${logoUrl}" alt="">
  </div>
</body>
</html>`;
}

async function main() {
  if (!existsSync(wordmarkPath) || !existsSync(markPath)) {
    throw new Error("Expected rendered logos at tmp/logo-render/wordmark.png and tmp/logo-render/e-olive.png");
  }
  await mkdir(outDir, { recursive: true });
  const products = await loadProducts();
  const browser = await chromium.launch(existsSync(chromePath) ? { executablePath: chromePath } : undefined);
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1 });
  for (const [index, product] of products.entries()) {
    await page.setContent(await htmlFor(product, index), { waitUntil: "load" });
    await page.screenshot({
      path: path.join(outDir, `${product.slug}.png`),
      type: "png",
      omitBackground: false
    });
    console.log(`${index + 1}/${products.length} ${product.slug}.png`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
