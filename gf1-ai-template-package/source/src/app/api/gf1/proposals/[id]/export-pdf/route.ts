import { NextResponse } from 'next/server';
import type { Browser } from 'puppeteer-core';
import { loadProposalWorkspace } from '@/app/(protected)/gf1/proposals/[id]/workspace-data';
import { buildSalesContext } from '@/lib/gf1/sales-context';
import { renderSlidesToHtml } from '@/lib/gf1/render-slides-html';
import { launchBrowser } from '@/lib/gf1/chromium';
import type { ProposalSlide } from '@/lib/gf1/slide-types';

// Chromium needs the Node runtime, and a real deck can take several seconds.
export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  // loadProposalWorkspace authenticates the user (requireSalesUser) and enforces
  // the sales-rep ownership check, so this route is gated exactly like the editor.
  let workspace: Awaited<ReturnType<typeof loadProposalWorkspace>>;
  try {
    workspace = await loadProposalWorkspace(id);
  } catch {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }

  let body: { slides?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const slides = Array.isArray(body.slides) ? (body.slides as ProposalSlide[]) : [];
  if (slides.length === 0) {
    return NextResponse.json({ error: 'No slides to export' }, { status: 400 });
  }

  const salesContext = buildSalesContext(workspace.safeProposal, workspace.safeOrganization);
  const origin = new URL(request.url).origin;
  const html = await renderSlidesToHtml({ slides, salesContext, origin });

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
    // Images are inlined as data URLs, so the only remaining network is fonts.
    // Wait for the load event (not networkidle0 — a slow Google Fonts fetch or a
    // broken external image keeps connections pending and that wait never
    // settles). If even 'load' is slow, proceed anyway: the DOM is already built.
    try {
      await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
    } catch {
      /* proceed — content is already in the DOM */
    }
    // Wait for web fonts so glyph metrics are final, but cap it so a blocked
    // external font (e.g. Google Fonts) can never hang the export.
    await page.evaluate(async () => {
      try {
        await Promise.race([
          (document as Document & { fonts: FontFaceSet }).fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      } catch {
        /* ignore */
      }
    });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    const orgName = (workspace.safeOrganization.trade_name ||
      workspace.safeOrganization.dba_name ||
      workspace.safeOrganization.legal_name ||
      'Proposal') as string;
    const safeName = orgName.replace(/[^a-z0-9\s-]/gi, '').trim() || 'Proposal';

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName} Proposal Deck.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export-pdf] render failed', err);
    // Surface a useful message even when the thrown value isn't an Error (some
    // puppeteer/chromium failures reject with a plain object, which would
    // otherwise stringify to "[object Object]").
    let detail: string;
    if (err instanceof Error) {
      detail = err.message;
    } else if (err && typeof err === 'object') {
      const obj = err as Record<string, unknown>;
      detail =
        (typeof obj.message === 'string' && obj.message) ||
        (() => {
          try {
            return JSON.stringify(obj);
          } catch {
            return Object.prototype.toString.call(obj);
          }
        })();
    } else {
      detail = String(err);
    }
    return NextResponse.json({ error: 'PDF generation failed', detail }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
  }
}
