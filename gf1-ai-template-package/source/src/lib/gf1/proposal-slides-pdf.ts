import type { ProposalSlide } from './slide-types';

// Page width in points. Height is derived per-slide from the captured canvas's
// aspect ratio so the image always fills the page without distortion.
const PDF_SLIDE_WIDTH_PT = 960;
const MIN_EXPORT_SCALE = 2;
const MAX_EXPORT_SCALE = 3;

type PricingData = {
  adminFeeMonthly?: number | null;
  adminFeeAnnual?: number | null;
  employeeCount?: number | null;
  wcSellingAnnual?: number | null;
  timekeepingFeeMonthly?: number | null;
};

export type SlidePdfOptions = {
  slides: ProposalSlide[];
  slideRefs: Map<string, HTMLDivElement>;
  orgName: string;
  filename?: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        finish(value);
      },
      () => {
        clearTimeout(timer);
        finish(fallback);
      },
    );
  });
}

// The slides use Tondu (headings) and Poppins (body), both loaded async. If
// html2canvas captures before they are fully ready, it measures glyph advances
// with a fallback font but paints with the real font once it swaps in — the
// result is text whose letters drift and overlap. Explicitly load every
// family/weight the slides use and await them (once) before capturing.
const SLIDE_FONT_SPECS = [
  '700 100px Tondu',
  '900 100px Tondu',
  '300 32px Poppins',
  '400 32px Poppins',
  '500 32px Poppins',
  '600 32px Poppins',
  '700 32px Poppins',
  '800 32px Poppins',
  '900 32px Poppins',
];

let fontsLoadedPromise: Promise<void> | null = null;
function ensureSlideFontsLoaded(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;
  if (typeof document === 'undefined' || !('fonts' in document)) {
    fontsLoadedPromise = Promise.resolve();
    return fontsLoadedPromise;
  }
  const fontSet = (document as Document & { fonts: FontFaceSet }).fonts;
  fontsLoadedPromise = withTimeout(
    Promise.all(SLIDE_FONT_SPECS.map((spec) => fontSet.load(spec).catch(() => undefined)))
      .then(() => fontSet.ready as unknown as Promise<unknown>)
      .then(() => undefined),
    6000,
    undefined,
  ).then(() => undefined);
  return fontsLoadedPromise;
}

async function waitForSlideAssets(el: HTMLDivElement) {
  await ensureSlideFontsLoaded();

  const images = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      try {
        if (!img.complete) {
          await withTimeout(
            new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            }),
            5000,
            undefined,
          );
        }
        if (typeof img.decode === 'function') {
          await withTimeout(img.decode().catch(() => undefined), 3000, undefined);
        }
      } catch {
        // Ignore individual image decode failures and continue.
      }
    }),
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function generateSlideshowPDF(options: SlidePdfOptions): Promise<void> {
  const { slides, slideRefs, orgName, filename } = options;

  // Dynamically import to keep bundle weight client-side only
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const orderedSlides = [...slides].sort((a, b) => a.order - b.order);

  // Build the document lazily from the first captured canvas so the page size
  // is derived from the real capture, never assumed. jsPDF's first page is
  // fixed at construction time, so we defer `new jsPDF(...)` until we have a
  // canvas to measure.
  let pdf: InstanceType<typeof jsPDF> | null = null;
  const exportScale = Math.max(
    MIN_EXPORT_SCALE,
    Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, MAX_EXPORT_SCALE),
  );

  for (let i = 0; i < orderedSlides.length; i += 1) {
    const slide = orderedSlides[i];
    const el = slideRefs.get(slide.instanceId);
    if (!el) {
      // eslint-disable-next-line no-console
      console.warn(`[slide-pdf] missing ref for slide ${i + 1} (${slide.layoutId}); skipping.`);
      continue;
    }
    // eslint-disable-next-line no-console
    console.log(`[slide-pdf] rendering slide ${i + 1}/${orderedSlides.length} — ${slide.layoutId}`);
    await waitForSlideAssets(el);

    const computed = window.getComputedStyle(el.firstElementChild as Element);
    const backgroundColor =
      computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? computed.backgroundColor
        : '#ffffff';

    // Capture the element at its natural size (the slide is a fixed 1280x720).
    // We intentionally do NOT pass width/height here: in html2canvas 1.4.1 those
    // crop options interact badly with an off-screen element, producing a canvas
    // whose aspect ratio differs from the slide — which then got squished when
    // forced into a 16:9 page. Letting it use the element's own box yields a
    // correctly proportioned canvas.
    const canvasPromise = html2canvas(el, {
      scale: exportScale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor,
      imageTimeout: 8000,
      onclone: (_doc, clonedEl) => {
        // html2canvas 1.4.1 garbles text when letter-spacing != normal: it falls
        // into a per-character rendering path that mis-positions glyphs, so
        // letters overlap and double up. letter-spacing is inherited, so the
        // headings' 0.02em leaks onto every text node. Force `normal` on the
        // throwaway clone — html2canvas then renders whole runs correctly. The
        // ~2px aesthetic spacing is not worth garbled text, and the live DOM is
        // untouched.
        const nodes = [clonedEl, ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*'))];
        for (const node of nodes) {
          node.style.letterSpacing = 'normal';
        }
      },
    });

    const canvas = await withTimeout<HTMLCanvasElement | null>(canvasPromise, 30000, null);
    if (!canvas || !canvas.width || !canvas.height) {
      // eslint-disable-next-line no-console
      console.warn(`[slide-pdf] timed out rendering slide ${i + 1} (${slide.layoutId}); skipping.`);
      continue;
    }

    const imgData = canvas.toDataURL('image/png');

    // Derive the page size from the captured canvas so the image always fills
    // the page at its true aspect ratio — no stretching or squishing, whatever
    // dimensions html2canvas returns. Width is pinned to a constant; height
    // follows the canvas ratio (≈540pt for a 1280x720 slide).
    const pageWidthPt = PDF_SLIDE_WIDTH_PT;
    const pageHeightPt = (pageWidthPt * canvas.height) / canvas.width;

    if (!pdf) {
      pdf = new jsPDF({
        orientation: pageWidthPt >= pageHeightPt ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pageWidthPt, pageHeightPt],
        compress: true,
      });
    } else {
      pdf.addPage([pageWidthPt, pageHeightPt], pageWidthPt >= pageHeightPt ? 'landscape' : 'portrait');
    }
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidthPt, pageHeightPt);
  }

  if (!pdf) {
    // eslint-disable-next-line no-console
    console.warn('[slide-pdf] no slides captured; nothing to export.');
    return;
  }

  const safeOrgName = orgName.replace(/[^a-z0-9\s-]/gi, '').trim() || 'Proposal';
  pdf.save(filename ?? `${safeOrgName} Proposal Deck.pdf`);
}
