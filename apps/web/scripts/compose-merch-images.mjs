import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import colorways from "../lib/storefront-merch-colorways.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");
const outDir = path.join(appRoot, "public", "products");
const contactSheetPath = path.join(repoRoot, "tmp", "contact-sheets", "eclipse-merch-mockups.jpg");
const sheetDir = path.join(repoRoot, "tmp", "contact-sheets");
const logoDir = path.join(repoRoot, "tmp", "logo-render");
const wordmarkPath = path.join(logoDir, "wordmark.png");
const markPath = path.join(logoDir, "e-olive.png");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const outputSize = 800;
const creamLogo = "#f4eadb";
const forestLogo = "#2f3d34";
const garmentKinds = /tee|hoodie|crewneck|long sleeve|tank|joggers|leggings|jacket|snapback|dad cap|cap|beanie|tote|socks|lanyard|pouch/;

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
  ["accessory-logo-lanyard", ["isolated-08.png", 0]],
  ["accessory-crossbody-pouch", ["isolated-08.png", 1]],
  ["mens-shop-coach-jacket", ["isolated-12.png", 1]],
  ["womens-studio-jogger", ["isolated-12.png", 2]],
  ["headwear-five-panel", ["isolated-12.png", 3]],
  ["accessory-packable-tote", ["isolated-13.png", 0]]
]);

const placementOverrides = new Map([
  ["mens-pocket-tee", "left_chest_pocket"],
  ["mens-workbench-tank", "center_chest"],
  ["womens-ribbed-tank", "center_chest"],
  ["womens-performance-legging", "legging_lower_right"],
  ["womens-studio-jogger", "jogger_upper_left"],
  ["mens-fleece-jogger", "jogger_upper_left"],
  ["mens-zip-hoodie", "left_chest"],
  ["mens-shop-coach-jacket", "left_chest"]
]);

const zones = {
  left_chest_pocket: { logo: "mark", cx: 0.665, cy: 0.382, pct: 0.095 },
  left_chest: { logo: "mark", cx: 0.62, cy: 0.34, pct: 0.12 },
  center_chest: { logo: "wordmark", cx: 0.5, cy: 0.42, pct: 0.38 },
  full_front: { logo: "wordmark", cx: 0.5, cy: 0.48, pct: 0.6 },
  legging_lower_right: { logo: "mark", cx: 0.62, cy: 0.68, pct: 0.11 },
  jogger_upper_left: { logo: "mark", cx: 0.38, cy: 0.34, pct: 0.11 },
  cap: { logo: "mark", cx: 0.5, cy: 0.48, pct: 0.16 },
  beanie: { logo: "mark", cx: 0.5, cy: 0.53, pct: 0.16 },
  socks: { logo: "mark", cx: 0.5, cy: 0.5, pct: 0.1 },
  bag: { logo: "wordmark", cx: 0.5, cy: 0.48, pct: 0.5 },
  lanyard: { logo: "wordmark", cx: 0.48, cy: 0.48, pct: 0.38, rotate: -18 }
};

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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

function placementFor(product) {
  const override = placementOverrides.get(product.slug);
  if (override) return override;
  if (/joggers/.test(product.type)) return "jogger_upper_left";
  if (/leggings/.test(product.type)) return "legging_lower_right";
  if (/snapback|dad cap|cap/.test(product.type)) return "cap";
  if (/beanie/.test(product.type)) return "beanie";
  if (/socks/.test(product.type)) return "socks";
  if (/tote|pouch/.test(product.type)) return "bag";
  if (/lanyard/.test(product.type)) return "lanyard";
  if (/tee|long sleeve|tank|crewneck|hoodie|jacket/.test(product.type)) return "center_chest";
  return "center_chest";
}

function chestWidthFor(product) {
  if (/cap|beanie/.test(product.type)) return 330;
  if (/socks|lanyard/.test(product.type)) return 340;
  if (/tote|pouch/.test(product.type)) return 430;
  if (/joggers|leggings/.test(product.type)) return 420;
  if (/tank/.test(product.type)) return 390;
  return 460;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function srgb(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function logoColorFor(colorway) {
  if (["black", "forest", "terracotta", "oxblood", "olive-army"].includes(colorway.slug)) return creamLogo;
  if (["bone-cream", "sage"].includes(colorway.slug)) return forestLogo;
  return contrast(creamLogo, colorway.hex) >= contrast(forestLogo, colorway.hex) ? creamLogo : forestLogo;
}

function isGarment(product) {
  return garmentKinds.test(product.type) && sheetMap.has(product.slug);
}

function defaultMockupPath(product) {
  const placement = placementFor(product);
  return `/products/${product.slug}-black-${placement}.jpg`;
}

async function imageDataUrl(filePath) {
  return `data:image/png;base64,${(await readFile(filePath)).toString("base64")}`;
}

async function pageRuntime(page) {
  await page.evaluate(
    ({ outputSize }) => {
      window.__mockup = {
        outputSize,
        async loadImage(src) {
          const img = new Image();
          img.src = src;
          await img.decode();
          return img;
        },
        cropBase(sheet, quadrant) {
          const canvas = document.createElement("canvas");
          canvas.width = outputSize;
          canvas.height = outputSize;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, outputSize, outputSize);
          const cell = sheet.width / 2;
          const sx = (quadrant % 2) * cell;
          const sy = Math.floor(quadrant / 2) * cell;
          ctx.drawImage(sheet, sx, sy, cell, cell, 0, 0, outputSize, outputSize);
          return canvas;
        },
        garmentMask(data) {
          const mask = new Uint8Array(data.data.length / 4);
          let minLum = 255;
          let maxLum = 0;
          let count = 0;
          for (let i = 0, p = 0; i < data.data.length; i += 4, p += 1) {
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const l = 0.299 * r + 0.587 * g + 0.114 * b;
            const saturated = max - min > 10;
            const fabric = (l < 238 && saturated) || l < 205;
            mask[p] = fabric ? 1 : 0;
            if (fabric) {
              minLum = Math.min(minLum, l);
              maxLum = Math.max(maxLum, l);
              count += 1;
            }
          }
          return { mask, minLum: count ? minLum : 25, maxLum: count ? maxLum : 245 };
        },
        hexToRgb(hex) {
          const clean = hex.replace("#", "");
          return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
          };
        },
        rgbToHsl(r, g, b) {
          r /= 255;
          g /= 255;
          b /= 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0;
          let s = 0;
          const l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
          }
          return { h, s, l };
        },
        hslToRgb(h, s, l) {
          if (s === 0) {
            const v = Math.round(l * 255);
            return { r: v, g: v, b: v };
          }
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          return {
            r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
          };
        },
        toneProfile(colorSlug, fallbackLightness) {
          const profiles = {
            black: { low: 0.055, mid: 0.12, high: 0.27, saturation: 0.5, minMean: 18, maxMean: 82 },
            forest: { low: 0.12, mid: 0.24, high: 0.44, saturation: 0.7, minMean: 36, maxMean: 132 },
            terracotta: { low: 0.23, mid: 0.42, high: 0.64, saturation: 0.74, minMean: 68, maxMean: 182 },
            oxblood: { low: 0.12, mid: 0.28, high: 0.48, saturation: 0.7, minMean: 38, maxMean: 125 },
            "olive-army": { low: 0.2, mid: 0.35, high: 0.55, saturation: 0.6, minMean: 58, maxMean: 165 },
            sage: { low: 0.48, mid: 0.6, high: 0.78, saturation: 0.5, minMean: 112, maxMean: 222 },
            "bone-cream": { low: 0.62, mid: 0.73, high: 0.86, saturation: 0.38, minMean: 150, maxMean: 235 }
          };
          return profiles[colorSlug] ?? { low: Math.max(0.08, fallbackLightness - 0.22), mid: fallbackLightness, high: Math.min(0.94, fallbackLightness + 0.22), saturation: 0.58, minMean: 40, maxMean: 220 };
        },
        tintGarment(baseCanvas, targetHex, colorSlug, fallback = false, maskInfo) {
          const target = this.hexToRgb(targetHex);
          const targetHsl = this.rgbToHsl(target.r, target.g, target.b);
          const profile = this.toneProfile(colorSlug, targetHsl.l);
          const ctx = baseCanvas.getContext("2d");
          const data = ctx.getImageData(0, 0, outputSize, outputSize);
          const { mask, minLum, maxLum } = maskInfo ?? this.garmentMask(data);
          const range = Math.max(1, maxLum - minLum);
          for (let i = 0, p = 0; i < data.data.length; i += 4, p += 1) {
            if (!mask[p]) continue;
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const n = Math.max(0, Math.min(1, (lum - minLum) / range));
            const curved = Math.pow(n, fallback ? 0.78 : 0.92);
            const lightness = curved < 0.5
              ? profile.low + (profile.mid - profile.low) * (curved / 0.5)
              : profile.mid + (profile.high - profile.mid) * ((curved - 0.5) / 0.5);
            const specular = Math.max(0, n - 0.82) / 0.18;
            const sat = Math.max(0.05, Math.min(0.85, targetHsl.s * profile.saturation * (1 - specular * 0.5)));
            const rgb = this.hslToRgb(targetHsl.h, sat, Math.min(0.96, lightness + specular * 0.05));
            data.data[i] = rgb.r;
            data.data[i + 1] = rgb.g;
            data.data[i + 2] = rgb.b;
          }
          ctx.putImageData(data, 0, 0);
          return baseCanvas;
        },
        validateGarment(canvas, targetHex, colorSlug, maskOverride) {
          const ctx = canvas.getContext("2d");
          const data = ctx.getImageData(0, 0, outputSize, outputSize);
          const { mask } = maskOverride ?? this.garmentMask(data);
          const profile = this.toneProfile(colorSlug, this.rgbToHsl(...Object.values(this.hexToRgb(targetHex))).l);
          const unique = new Set();
          const uniqueLum = new Set();
          let totalLum = 0;
          let totalRgb = [0, 0, 0];
          let count = 0;

          for (let i = 0, p = 0; i < data.data.length; i += 4, p += 1) {
            if (!mask[p]) continue;
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLum += lum;
            totalRgb[0] += r;
            totalRgb[1] += g;
            totalRgb[2] += b;
            unique.add(`${r >> 3}-${g >> 3}-${b >> 3}`);
            uniqueLum.add(Math.round(lum / 4));
            count += 1;
          }

          const meanLum = count ? totalLum / count : 255;
          const meanRgb = count ? totalRgb.map((value) => value / count) : [255, 255, 255];
          const target = this.hexToRgb(targetHex);
          const distance = Math.hypot(meanRgb[0] - target.r, meanRgb[1] - target.g, meanRgb[2] - target.b);
          const lightnessOk = meanLum >= profile.minMean && meanLum <= profile.maxMean;
          const colorOk = colorSlug === "black" ? meanLum < 92 : distance < 130;
          const textureOk = unique.size >= 8 && uniqueLum.size >= 12;

          return { ok: lightnessOk && colorOk && textureOk, meanLum, uniqueColors: unique.size, uniqueLum: uniqueLum.size, distance };
        },
        tintedLogo(logo, color, width) {
          const height = width * (logo.height / logo.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(logo, 0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-in";
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-over";
          return canvas;
        },
        drawLogo(canvas, logo, color, zone, chestWidth) {
          const ctx = canvas.getContext("2d");
          const width = chestWidth * zone.pct;
          const logoCanvas = this.tintedLogo(logo, color, width);
          const x = outputSize * zone.cx - logoCanvas.width / 2;
          const y = outputSize * zone.cy - logoCanvas.height / 2;
          ctx.save();
          if (zone.rotate) {
            ctx.translate(outputSize * zone.cx, outputSize * zone.cy);
            ctx.rotate((zone.rotate * Math.PI) / 180);
            ctx.drawImage(logoCanvas, -logoCanvas.width / 2, -logoCanvas.height / 2);
          } else {
            ctx.drawImage(logoCanvas, x, y);
          }
          ctx.restore();
        },
        drawHoodieStrings(canvas, color) {
          const ctx = canvas.getContext("2d");
          const dark = color === "#f4eadb" ? "rgba(55,60,48,.62)" : "rgba(20,24,20,.5)";
          ctx.strokeStyle = dark;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          for (const x of [338, 402]) {
            ctx.beginPath();
            ctx.moveTo(x, 290);
            ctx.lineTo(x + (x < 370 ? -5 : 5), 388);
            ctx.stroke();
            ctx.fillStyle = dark;
            ctx.fillRect(x - 5, 386, 10, 18);
          }
        },
        async compose(args) {
          const sheet = await this.loadImage(args.sheetUrl);
          const logo = await this.loadImage(args.logoUrl);
          const base = this.cropBase(sheet, args.quadrant);
          const baseData = base.getContext("2d").getImageData(0, 0, outputSize, outputSize);
          const maskInfo = this.garmentMask(baseData);
          let canvas = this.tintGarment(base, args.colorHex, args.colorSlug, false, maskInfo);
          let validation = this.validateGarment(canvas, args.colorHex, args.colorSlug, maskInfo);
          if (!validation.ok) {
            canvas = this.tintGarment(this.cropBase(sheet, args.quadrant), args.colorHex, args.colorSlug, true, maskInfo);
            validation = this.validateGarment(canvas, args.colorHex, args.colorSlug, maskInfo);
          }
          if (!validation.ok) {
            throw new Error(`Rejected ${args.productSlug} ${args.colorSlug}: meanLum=${validation.meanLum.toFixed(1)} unique=${validation.uniqueColors}/${validation.uniqueLum} distance=${validation.distance.toFixed(1)}`);
          }
          this.drawLogo(canvas, logo, args.logoColor, args.zone, args.chestWidth);
          if (args.hasHoodieStrings) this.drawHoodieStrings(canvas, args.logoColor);
          return canvas.toDataURL("image/jpeg", 0.92);
        },
        async contactSheet(items) {
          const cell = 180;
          const gap = 18;
          const cols = 7;
          const rows = Math.ceil(items.length / cols);
          const canvas = document.createElement("canvas");
          canvas.width = cols * cell + (cols + 1) * gap;
          canvas.height = rows * (cell + 38) + (rows + 1) * gap;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#f4eadb";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.fillStyle = "#0c1410";
          for (let i = 0; i < items.length; i += 1) {
            const item = items[i];
            const img = await this.loadImage(item.url);
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = gap + col * (cell + gap);
            const y = gap + row * (cell + 38 + gap);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, y, cell, cell);
            ctx.drawImage(img, x, y, cell, cell);
            ctx.fillStyle = "#0c1410";
            ctx.fillText(item.label, x + cell / 2, y + cell + 18, cell - 8);
          }
          return canvas.toDataURL("image/jpeg", 0.9);
        }
      };
    },
    { outputSize }
  );
}

async function writeDataUrl(filePath, dataUrl) {
  const base64 = dataUrl.split(",")[1];
  await writeFile(filePath, Buffer.from(base64, "base64"));
}

async function main() {
  if (!existsSync(wordmarkPath) || !existsSync(markPath)) {
    throw new Error("Expected transparent logo PNGs in tmp/logo-render/");
  }
  await mkdir(outDir, { recursive: true });
  await mkdir(path.dirname(contactSheetPath), { recursive: true });

  const products = (await loadProducts()).filter(isGarment);
  const browser = await chromium.launch(existsSync(chromePath) ? { executablePath: chromePath } : undefined);
  const page = await browser.newPage({ viewport: { width: outputSize, height: outputSize }, deviceScaleFactor: 1 });
  await pageRuntime(page);

  const sheetUrls = new Map();
  const logoUrls = {
    mark: await imageDataUrl(markPath),
    wordmark: await imageDataUrl(wordmarkPath)
  };
  const contactItems = [];
  let generated = 0;
  let skipped = 0;

  for (const product of products) {
    const [sheetName, quadrant] = sheetMap.get(product.slug);
    if (!sheetUrls.has(sheetName)) sheetUrls.set(sheetName, await imageDataUrl(path.join(sheetDir, sheetName)));
    const placement = placementFor(product);
    const zone = zones[placement];
    const logoKind = zone.logo;

    for (const colorway of colorways) {
      const fileName = `${product.slug}-${colorway.slug}-${placement}.jpg`;
      const filePath = path.join(outDir, fileName);
      if (existsSync(filePath)) {
        skipped += 1;
      } else {
        const dataUrl = await page.evaluate(
          (args) => window.__mockup.compose(args),
          {
            sheetUrl: sheetUrls.get(sheetName),
            quadrant,
            colorHex: colorway.hex,
            colorSlug: colorway.slug,
            productSlug: product.slug,
            logoUrl: logoUrls[logoKind],
            logoColor: logoColorFor(colorway),
            zone,
            chestWidth: chestWidthFor(product),
            hasHoodieStrings: /hoodie/.test(product.type) && !/zip/.test(product.type)
          }
        );
        await writeDataUrl(filePath, dataUrl);
        generated += 1;
      }
      contactItems.push({ url: await imageDataUrl(filePath), label: `${product.slug} ${colorway.slug}` });
    }
    console.log(`${product.slug}: ${defaultMockupPath(product)}`);
  }

  const sheetDataUrl = await page.evaluate((items) => window.__mockup.contactSheet(items), contactItems);
  await writeDataUrl(contactSheetPath, sheetDataUrl);
  await browser.close();
  console.log(`generated=${generated} skipped=${skipped} contactSheet=${contactSheetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
