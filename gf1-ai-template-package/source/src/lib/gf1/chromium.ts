import type { Browser } from 'puppeteer-core';

// Launches a headless Chromium suitable for the current environment:
//   - On Vercel/serverless: the @sparticuz/chromium build.
//   - Locally (Windows/macOS dev): a Chrome/Edge already installed on the
//     machine, found via PUPPETEER_EXECUTABLE_PATH or a few common paths.
//
// Keeping this isolated means the PDF route only ever imports one launcher and
// never has to know which environment it's in.

// @sparticuz/chromium-min carries no binary, so nothing has to be file-traced
// into the serverless function (which is fragile under Turbopack/Vercel and was
// dropping the `bin/` brotli packs). Instead the matching Chromium pack is
// fetched from this URL at runtime and cached in /tmp across warm invocations.
// The version here MUST match the @sparticuz/chromium-min version in
// package.json (148) and the Chrome that puppeteer-core targets.
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

const localAppData = process.env.LOCALAPPDATA;
const LOCAL_CHROME_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  localAppData ? `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe` : undefined,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter((p): p is string => Boolean(p));

export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }

  // Local development: use an installed browser.
  const fs = await import('node:fs');
  const executablePath = LOCAL_CHROME_CANDIDATES.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  if (!executablePath) {
    throw new Error(
      'No local Chrome/Edge found for PDF rendering. Set PUPPETEER_EXECUTABLE_PATH to a Chrome executable.',
    );
  }
  return puppeteer.launch({
    executablePath,
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
    headless: true,
  });
}
