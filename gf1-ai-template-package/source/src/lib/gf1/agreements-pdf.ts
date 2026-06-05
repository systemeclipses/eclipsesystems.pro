import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { AgreementCalculationResult, AgreementFormValues } from './agreements-types';
import { formatCurrency, downloadFile } from './reports-utils';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 48;
const MARGIN_Y = 56;
const LINE_HEIGHT = 16;
const HEADER_HEIGHT = 74;
const BRAND_BLUE = rgb(0, 87 / 255, 145 / 255);
const BRAND_LIGHT = rgb(99 / 255, 173 / 255, 242 / 255);
const BRAND_GOLD = rgb(255 / 255, 209 / 255, 6 / 255);
const TEXT_COLOR = rgb(20 / 255, 26 / 255, 40 / 255);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);
const GALACTIC_WORDMARK_VIEWBOX = { width: 744.55, height: 107.02 };
const GALACTIC_WORDMARK_PATHS = [
  'M53.51,53.51c0-19.8,10.77-37.08,26.75-46.33C72.39,2.62,63.26,0,53.51,0,23.96,0,0,23.96,0,53.51s23.96,53.51,53.51,53.51c9.75,0,18.88-2.62,26.75-7.18-15.99-9.25-26.75-26.53-26.75-46.33Z',
  'M263.97,44.97h40.71c.71,0,1.29.58,1.29,1.29v18.71c0,26.86-16.08,42.05-44.04,42.05-33.03,0-51.43-21.32-51.43-52.27C210.49,21.9,232.51,0,262.65,0c11.85,0,21.36,3.18,29.21,7.8.4.23.63.66.63,1.12v26.25c0,1.06-1.21,1.66-2.06,1.03-7.15-5.29-13.67-7-20.68-7-16.37,0-21.59,13.43-21.59,27.74s8.29,21.61,16.98,21.61c6.98,0,10.37-3.98,11.36-8.98.16-.79-.46-1.54-1.28-1.54h-11.26c-.71,0-1.29-.58-1.29-1.29v-20.48c0-.71.58-1.29,1.29-1.29Z',
  'M360.77,34.1h27.66c.92,0,1.67.75,1.67,1.67v67.96c0,.92-.75,1.67-1.67,1.67h-25.89c-.92,0-1.67-.75-1.67-1.67v-1.5c0-1.46-1.72-2.19-2.8-1.21-4.23,3.87-9.56,6-15.65,6-16.53,0-27.6-14.91-27.6-37.2s11.07-37.34,27.6-37.34c5.38,0,10.09,1.65,14.03,4.63,1.09.82,2.65.03,2.65-1.34h0c0-.92.75-1.67,1.67-1.67ZM359.11,69.82c0-6.49-3.25-10.04-7.97-10.04-5.02,0-7.82,3.99-7.82,10.04s3.1,9.89,7.82,9.89c5.17,0,7.97-3.99,7.97-9.89Z',
  'M398.96,105.35V5.36c0-.92.75-1.67,1.67-1.67h27.66c.92,0,1.67.75,1.67,1.67v99.99c0,.92-.75,1.67-1.67,1.67h-27.66c-.92,0-1.67-.75-1.67-1.67Z',
  'M484.13,34.1h27.66c.92,0,1.67.75,1.67,1.67v67.96c0,.92-.75,1.67-1.67,1.67h-25.89c-.92,0-1.67-.75-1.67-1.67v-1.5c0-1.46-1.72-2.19-2.8-1.21-4.23,3.87-9.56,6-15.65,6-16.53,0-27.6-14.91-27.6-37.2s11.07-37.34,27.6-37.34c5.38,0,10.09,1.65,14.03,4.63,1.09.82,2.65.03,2.65-1.34h0c0-.92.75-1.67,1.67-1.67ZM482.47,69.82c0-6.49-3.25-10.04-7.97-10.04-5.02,0-7.82,3.99-7.82,10.04s3.1,9.89,7.82,9.89c5.17,0,7.97-3.99,7.97-9.89Z',
  'M521.51,69.82c0-20.52,15.94-37.34,37.64-37.34,6.44,0,12.75,1.59,17.92,4.53.52.29.83.86.83,1.45v22.4c0,1.21-1.25,2.01-2.35,1.52-3.44-1.52-6.94-2.59-12.11-2.59-7.38,0-10.78,4.58-10.78,10.04s3.39,9.89,10.78,9.89c4.51,0,8.6-1.12,11.79-3.43,1.12-.81,2.68-.06,2.68,1.32v23.69c0,.62-.34,1.2-.89,1.48-5.16,2.67-11.44,4.25-17.86,4.25-21.7,0-37.64-16.53-37.64-37.2Z',
  'M638.25,59.49h-8.33c-.92,0-1.67.75-1.67,1.67v15.01c0,3.54,1.33,5.61,4.43,5.61,1.32,0,2.97-.41,5.01-1.17,1.08-.4,2.23.42,2.23,1.57v20.43c0,.7-.44,1.33-1.09,1.57-6.28,2.31-10.11,2.84-15,2.84-20.96,0-26.57-11.96-26.57-25.68v-20.18c0-.92-.75-1.67-1.67-1.67h-7.29c-.92,0-1.67-.75-1.67-1.67v-22.05c0-.92.75-1.67,1.67-1.67h7.29c.92,0,1.67-.75,1.67-1.67v-15.56c0-.92.75-1.67,1.67-1.67h27.66c.92,0,1.67.75,1.67,1.67v15.56c0,.92.75,1.67,1.67,1.67h8.33c.92,0,1.67.75,1.67,1.67v22.05c0,.92-.75,1.67-1.67,1.67Z',
  'M648.45,15.94C648.45,6.35,654.69,0,664.04,0s15.47,6.35,15.47,15.94-6.24,15.65-15.47,15.65-15.6-6.35-15.6-15.65ZM648.56,105.35V37.39c0-.92.75-1.67,1.67-1.67h27.66c.92,0,1.67.75,1.67,1.67v67.96c0,.92-.75,1.67-1.67,1.67h-27.66c-.92,0-1.67-.75-1.67-1.67Z',
  'M688.16,69.82c0-20.52,15.94-37.34,37.64-37.34,6.44,0,12.75,1.59,17.92,4.53.52.29.83.86.83,1.45v22.4c0,1.21-1.25,2.01-2.35,1.52-3.44-1.52-6.94-2.59-12.11-2.59-7.38,0-10.78,4.58-10.78,10.04s3.39,9.89,10.78,9.89c4.51,0,8.6-1.12,11.79-3.43,1.12-.81,2.68-.06,2.68,1.32v23.69c0,.62-.34,1.2-.89,1.48-5.16,2.67-11.44,4.25-17.86,4.25-21.7,0-37.64-16.53-37.64-37.2Z',
];

type TextContext = {
  page: any;
  font: any;
  fontBold: any;
  fontTitle: any;
  cursorY: number;
};

function drawLine(ctx: TextContext, text: string, options?: { bold?: boolean; size?: number }) {
  const size = options?.size ?? 11;
  ctx.page.drawText(text, {
    x: MARGIN_X,
    y: ctx.cursorY,
    size,
    font: options?.bold ? ctx.fontBold : ctx.font,
    color: TEXT_COLOR,
  });
  ctx.cursorY -= LINE_HEIGHT;
}

function drawSectionTitle(ctx: TextContext, title: string) {
  ctx.cursorY -= 8;
  drawLine(ctx, title.toUpperCase(), { bold: true, size: 12 });
}

function drawKeyValue(ctx: TextContext, label: string, value: string) {
  drawLine(ctx, `${label}: ${value}`);
}

function drawTable(
  ctx: TextContext,
  rows: Array<[string, string]>,
  columnGap = 16,
  valueAlignRight = true
) {
  const col1Width = 320;
  rows.forEach(([label, value]) => {
    ctx.page.drawText(label, {
      x: MARGIN_X,
      y: ctx.cursorY,
      size: 11,
      font: ctx.font,
      color: TEXT_COLOR,
    });

    const valueWidth = ctx.font.widthOfTextAtSize(value, 11);
    const valueX = valueAlignRight
      ? MARGIN_X + col1Width + columnGap + Math.max(0, 160 - valueWidth)
      : MARGIN_X + col1Width + columnGap;
    ctx.page.drawText(value, {
      x: valueX,
      y: ctx.cursorY,
      size: 11,
      font: ctx.fontBold,
      color: TEXT_COLOR,
    });
    ctx.cursorY -= LINE_HEIGHT;
  });
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      line = testLine;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  return lines;
}

function drawWrappedParagraph(ctx: TextContext, text: string, maxWidth: number, size = 11) {
  const lines = wrapText(text, ctx.font, size, maxWidth);
  lines.forEach((line) => {
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.cursorY,
      size,
      font: ctx.font,
      color: TEXT_COLOR,
    });
    ctx.cursorY -= LINE_HEIGHT;
  });
}

function formatDocumentDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatPhoneWithPeriods(value?: string | null) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return value.replace(/-/g, '.');
}

async function loadFont(doc: PDFDocument, url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return await doc.embedFont(buffer);
  } catch {
    return null;
  }
}

async function embedImage(doc: PDFDocument, url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    try {
      return await doc.embedPng(buffer);
    } catch {
      return await doc.embedJpg(buffer);
    }
  } catch {
    return null;
  }
}

async function embedGalacticLogo(doc: PDFDocument) {
  return embedImage(doc, 'https://img.mailinblue.com/8584587/images/content_library/original/684355ccd54dfce6fde801cd.png');
}

function drawGalacticWordmark(page: any, x: number, y: number, width: number) {
  const scale = width / GALACTIC_WORDMARK_VIEWBOX.width;
  const height = GALACTIC_WORDMARK_VIEWBOX.height * scale;
  page.drawCircle({
    x: x + 133.77 * scale,
    y: y + height - 53.51 * scale,
    size: 53.51 * scale,
    color: WHITE,
    borderColor: WHITE,
    borderWidth: 1,
  });
  GALACTIC_WORDMARK_PATHS.forEach((path) => {
    page.drawSvgPath(path, {
      x,
      y: y + height,
      scale,
      rotate: undefined,
      xSkew: undefined,
      ySkew: undefined,
      borderWidth: 0,
      color: WHITE,
      borderColor: WHITE,
      yScale: -scale,
    });
  });
}

function drawHeader(ctx: TextContext, agreementDate: string, logo: any) {
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
    color: BRAND_BLUE,
  });
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: 6,
    color: BRAND_GOLD,
  });

  const logoWidth = 236;
  const logoHeight = (GALACTIC_WORDMARK_VIEWBOX.height / GALACTIC_WORDMARK_VIEWBOX.width) * logoWidth;
  const blueSectionHeight = HEADER_HEIGHT - 6;
  drawGalacticWordmark(
    ctx.page,
    14,
    PAGE_HEIGHT - HEADER_HEIGHT + 6 + (blueSectionHeight - logoHeight) / 2,
    logoWidth,
  );

  const dateText = agreementDate || 'N/A';
  const dateWidth = ctx.fontBold.widthOfTextAtSize(dateText, 11);
  ctx.page.drawText(dateText, {
    x: PAGE_WIDTH - 10 - dateWidth,
    y: PAGE_HEIGHT - 16,
    size: 11,
    font: ctx.fontBold,
    color: WHITE,
  });
}

type AgreementSignatureBlock = {
  name: string;
  title?: string | null;
  signaturePngBytes?: Uint8Array | null;
  signatureText?: string | null;
  printName?: string | null;
  dateText?: string | null;
};

type SignatureRenderOptions = {
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

type CostAnalysisPdfCard = {
  title: string;
  perPayroll: number;
  annual: number;
  lines: Array<{ label: string; value: number }>;
};

export type CostAnalysisPdfPayload = {
  form: AgreementFormValues;
  calculations: AgreementCalculationResult;
  analysis: {
    current: CostAnalysisPdfCard;
    proposed: CostAnalysisPdfCard;
    savingsPerPayroll: number;
    savingsAnnual: number;
  };
};

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function addPageContext(
  pdf: PDFDocument,
  font: any,
  fontBold: any,
  fontTitle: any,
  agreementDate: string,
  logo: any,
) {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const ctx: TextContext = {
    page,
    font,
    fontBold,
    fontTitle,
    cursorY: PAGE_HEIGHT - MARGIN_Y,
  };
  drawHeader(ctx, agreementDate, logo);
  ctx.cursorY = PAGE_HEIGHT - (HEADER_HEIGHT + 38);
  return ctx;
}

function drawMetricCard(
  page: any,
  payload: {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    value: string;
    subtitle?: string;
    fill: any;
    titleColor?: any;
    valueColor?: any;
    textColor?: any;
  },
  font: any,
  fontBold: any,
) {
  const {
    x,
    y,
    width,
    height,
    title,
    value,
    subtitle,
    fill,
    titleColor = TEXT_COLOR,
    valueColor = TEXT_COLOR,
    textColor = TEXT_COLOR,
  } = payload;
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: fill,
    borderColor: rgb(212 / 255, 221 / 255, 232 / 255),
    borderWidth: 1,
    borderRadius: 10,
  });
  page.drawText(title.toUpperCase(), {
    x: x + 16,
    y: y + height - 24,
    size: 9,
    font: fontBold,
    color: titleColor,
  });
  page.drawText(value, {
    x: x + 16,
    y: y + height - 52,
    size: 20,
    font: fontBold,
    color: valueColor,
  });
  if (subtitle) {
    page.drawText(subtitle, {
      x: x + 16,
      y: y + 16,
      size: 10,
      font,
      color: textColor,
    });
  }
}

function drawAnalysisColumn(
  page: any,
  payload: {
    x: number;
    y: number;
    width: number;
    title?: string;
    annualLabel: string;
    annualValue: string;
    perPayrollLabel: string;
    perPayrollValue: string;
    lines: Array<{ label: string; value: string }>;
    accent: any;
    useGalacticLogo?: boolean;
  },
  font: any,
  fontBold: any,
) {
  const {
    x,
    y,
    width,
    title,
    annualLabel,
    annualValue,
    perPayrollLabel,
    perPayrollValue,
    lines,
    accent,
    useGalacticLogo,
  } = payload;
  const lineHeight = 18;
  const bodyHeight = 174 + lines.length * lineHeight;
  page.drawRectangle({
    x,
    y: y - bodyHeight,
    width,
    height: bodyHeight,
    color: rgb(249 / 255, 251 / 255, 254 / 255),
    borderColor: rgb(214 / 255, 223 / 255, 234 / 255),
    borderWidth: 1,
    borderRadius: 12,
  });
  page.drawRectangle({
    x,
    y: y - 46,
    width,
    height: 46,
    color: accent,
    borderRadius: 12,
  });
  if (useGalacticLogo) {
    const logoWidth = Math.min(150, width - 32);
    const logoHeight = (GALACTIC_WORDMARK_VIEWBOX.height / GALACTIC_WORDMARK_VIEWBOX.width) * logoWidth;
    drawGalacticWordmark(page, x + (width - logoWidth) / 2, y - 23 - logoHeight / 2, logoWidth);
  } else if (title) {
    const titleWidth = fontBold.widthOfTextAtSize(title, 13);
    page.drawText(title, {
      x: x + Math.max(16, (width - titleWidth) / 2),
      y: y - 28,
      size: 13,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  let cursorY = y - 72;
  page.drawText(annualLabel.toUpperCase(), {
    x: x + 16,
    y: cursorY,
    size: 9,
    font: fontBold,
    color: BRAND_BLUE,
  });
  page.drawText(annualValue, {
    x: x + 16,
    y: cursorY - 22,
    size: 21,
    font: fontBold,
    color: TEXT_COLOR,
  });
  cursorY -= 52;

  page.drawText(perPayrollLabel.toUpperCase(), {
    x: x + 16,
    y: cursorY,
    size: 9,
    font: fontBold,
    color: rgb(90 / 255, 103 / 255, 124 / 255),
  });
  page.drawText(perPayrollValue, {
    x: x + 16,
    y: cursorY - 18,
    size: 15,
    font: fontBold,
    color: TEXT_COLOR,
  });
  cursorY -= 46;

  lines.forEach((line) => {
    page.drawText(line.label, {
      x: x + 16,
      y: cursorY,
      size: 10,
      font,
      color: TEXT_COLOR,
    });
    const lineValueWidth = fontBold.widthOfTextAtSize(line.value, 10);
    page.drawText(line.value, {
      x: x + width - 16 - lineValueWidth,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: TEXT_COLOR,
    });
    cursorY -= lineHeight;
  });
}

export async function generateAgreementPdfBytes(payload: {
  form: AgreementFormValues;
  calculations: AgreementCalculationResult;
  clientSignature?: AgreementSignatureBlock | null;
  providerSignature?: AgreementSignatureBlock | null;
  assetBaseUrl?: string | null;
  billingOverrides?: Record<string, string>;
  signatureRenderOptions?: {
    client?: SignatureRenderOptions;
    provider?: SignatureRenderOptions;
  };
}) {
  const {
    form,
    calculations,
    clientSignature,
    providerSignature,
    assetBaseUrl,
    billingOverrides,
    signatureRenderOptions,
  } = payload;

  // Format date as M/D/YYYY
  const fmtShortDate = (iso: string | undefined | null): string => {
    if (!iso) return 'N/A';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };
  const effectiveDate = fmtShortDate(form.agreementDate);
  const documentDate = formatDocumentDate();

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const poppinsRegular = await loadFont(
    pdf,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Regular%20(1).ttf',
  );
  const poppinsBold = await loadFont(
    pdf,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Bold.ttf',
  );
  const baseUrl =
    assetBaseUrl ??
    (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL ?? '');
  const tonduFont = await loadFont(
    pdf,
    baseUrl ? `${baseUrl.replace(/\/$/, '')}/Tondu-Beta.ttf` : '/Tondu-Beta.ttf',
  );
  const font = poppinsRegular ?? (await pdf.embedFont(StandardFonts.Helvetica));
  const fontBold = poppinsBold ?? (await pdf.embedFont(StandardFonts.HelveticaBold));
  const fontTitle = tonduFont ?? fontBold;
  const billingLogo = baseUrl ? await embedImage(pdf, `${baseUrl.replace(/\/$/, '')}/Logo%20Slammed.png`) : null;
  const signatureFont =
    (await loadFont(
      pdf,
      'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf',
    )) ??
    (await loadFont(
      pdf,
      baseUrl ? `${baseUrl.replace(/\/$/, '')}/calibril.ttf` : '/calibril.ttf',
    )) ??
    (await pdf.embedFont(StandardFonts.TimesRomanItalic));

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // ── Layout constants ──
  const VAL_RIGHT = PAGE_WIDTH - MARGIN_X; // right edge for values
  const LH = 15; // standard line height
  const SUB_LH = 14; // sub-item line height

  // ── Drawing helpers ──
  function txt(text: string, x: number, y: number, size = 9.5, bold = false, color = TEXT_COLOR) {
    if (!text) return;
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
  }

  function txtRight(text: string, y: number, size = 9.5, bold = false, color = TEXT_COLOR) {
    const w = (bold ? fontBold : font).widthOfTextAtSize(text, size);
    page.drawText(text, { x: VAL_RIGHT - w, y, size, font: bold ? fontBold : font, color });
  }

  function hRule(y: number) {
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: VAL_RIGHT, y },
      thickness: 0.4,
      color: rgb(190 / 255, 200 / 255, 215 / 255),
    });
  }

  function sigLine(x: number, y: number, w: number) {
    page.drawLine({
      start: { x, y },
      end: { x: x + w, y },
      thickness: 0.7,
      color: TEXT_COLOR,
    });
  }

  // ── HEADER ──
  // "BILLING AGREEMENT" title (right)
  const titleText = 'BILLING AGREEMENT';
  const titleSize = 19;
  const titleW = fontTitle.widthOfTextAtSize(titleText, titleSize);
  const titleY = PAGE_HEIGHT - 54;
  const titleCenterY = titleY + titleSize / 2;

  if (billingLogo) {
    const targetWidth = 164;
    const scaled = billingLogo.scale(targetWidth / billingLogo.width);
    page.drawImage(billingLogo, {
      x: MARGIN_X,
      y: titleCenterY - scaled.height / 2,
      width: scaled.width,
      height: scaled.height,
    });
  }

  page.drawText(titleText, {
    x: PAGE_WIDTH - MARGIN_X - titleW,
    y: titleY,
    size: titleSize,
    font: fontTitle,
    color: BLACK,
  });

  const dateSize = 10;
  const dateText = documentDate;
  const dateWidth = fontBold.widthOfTextAtSize(dateText, dateSize);
  page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN_X - dateWidth,
    y: titleY - 14,
    size: dateSize,
    font: fontBold,
    color: TEXT_COLOR,
  });

  // ── Cursor ──
  let y = PAGE_HEIGHT - HEADER_HEIGHT - 42;

  // ── Intro paragraph ──
  const introLabel = 'Agreement for Professional Employment Services:';
  txt(introLabel, MARGIN_X, y, 11, true);
  y -= SUB_LH + 8;
  const introBody = `Client does hereby agree to follow the instructions set forth in the CLIENT SERVICE AGREEMENT and pay fees as prescribed below.`;
  const introLines = wrapText(introBody, font, 9, PAGE_WIDTH - MARGIN_X * 2);
  introLines.forEach((line) => {
    txt(line, MARGIN_X, y, 9);
    y -= SUB_LH;
  });
  y -= 4;

  // Lead-in
  txt('Client will be billed for the following fees due prior to release of payroll:', MARGIN_X, y, 9.5);
  y -= LH + 3;

  // ── Fee line items ──
  const proposed = calculations.costAnalysis.proposed;
  const taxes = proposed.taxes;
  const getOverrideNumber = (key: string, fallback: number) => {
    const raw = billingOverrides?.[key];
    if (raw == null || raw === '') return fallback;
    const parsed = parseFloat(raw.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const grossPerPayroll = getOverrideNumber('gross', proposed.grossPerPayroll);
  const adminFeePerPayroll = getOverrideNumber('adminFee', proposed.adminFeePerPayroll);
  const workersCompPerPayroll = form.workersCompClasses.reduce(
    (sum, wc) => sum + getOverrideNumber(`wc_${wc.code}_${wc.description}`, 0),
    0,
  );
  const healthPerPayroll = getOverrideNumber('health', form.healthPerPayroll || 0);
  const dentalPerPayroll = getOverrideNumber('dental', form.dentalPerPayroll || 0);
  const lifeDisabilityPerPayroll = getOverrideNumber('life', form.lifeDisabilityPerPayroll || 0);
  const creditsPerPayroll = getOverrideNumber(
    'credits',
    -((form.creditForAdvancePerPayroll || 0) + (form.deductionsCreditPerPayroll || 0)),
  );
  const conversionFee = getOverrideNumber('conversion', form.conversionFee || 0);
  const workersCompDeposit = getOverrideNumber('wcDeposit', form.workersCompDeposit || 0);
  const totalPerPayrollCalc =
    grossPerPayroll +
    taxes.totalPerPayroll +
    adminFeePerPayroll +
    workersCompPerPayroll +
    healthPerPayroll +
    dentalPerPayroll +
    lifeDisabilityPerPayroll +
    creditsPerPayroll;
  const totalPerPayroll = getOverrideNumber('totalPerPayroll', totalPerPayrollCalc);

  // Helper for bullet rows
  function bulletRow(label: string, value: string, bold = false) {
    txt('\u2022', MARGIN_X, y, 9.5, false);
    txt(label, MARGIN_X + 11, y, 9.5, bold);
    if (value) txtRight(value, y, 9.5, bold);
    y -= LH;
  }

  function subRow(label: string, value: string) {
    txt(label, MARGIN_X + 22, y, 9, false);
    if (value) txtRight(value, y, 9);
    y -= SUB_LH;
  }

  // Gross Payroll
  bulletRow('Gross Payroll', formatCurrency(grossPerPayroll));

  // Employer Taxes
  bulletRow('Employer Taxes (including but not limited to)', '');
  const ficaRate = (form.socialSecurityRate || 6.2) + (form.medicareRate || 1.45);
  subRow('FICA, Social Security and Medicare Fee', `${ficaRate.toFixed(2)}%`);
  const futaBase = (form.futaWageBase || 7000).toLocaleString('en-US');
  subRow(
    `FUTA, Federal Unemployment Tax fee  *Subject to $${futaBase} limit per EE`,
    `${(form.futaRate || 0.6).toFixed(2)}%`,
  );
  const sutaBase = (form.sutaWageBase || 14000).toLocaleString('en-US');
  const sutaStateName = form.sutaState ? `${form.sutaState} State` : 'State';
  subRow(
    `SUTA ${sutaStateName} Unemployment Insurance fee  *Subject to $${sutaBase} limit per EE`,
    `${(form.sutaRate || 1.2).toFixed(2)}%`,
  );
  y -= 1;

  // Administrative Fee
  if (form.adminFeeBasis === 'per_payroll') {
    const r = form.galacticAdminRate || 0;
    bulletRow(`Administrative Fee  $${r.toFixed(0)} / EE / Pay Period`, `$${r.toFixed(0)} / check`);
  } else {
    bulletRow(
      `Administrative Fee  ${(form.galacticAdminRate || 0).toFixed(2)}% of Gross Payroll`,
      formatCurrency(adminFeePerPayroll),
    );
  }

  // Time & Attendance
  const taPerEE = form.timeAndAttendancePerEmployee ?? 0;
  bulletRow(
    `Time and Attendance  $${taPerEE.toFixed(2)} / EE / Pay Period`,
    `$${taPerEE.toFixed(2)} / EE`,
    true,
  );

  // Workers' Compensation
  bulletRow("Workers\u2019 Compensation fee", '');
  // Column headers
  txt('Class Code', MARGIN_X + 22, y, 8.5, true);
  txt('Description', MARGIN_X + 90, y, 8.5, true);
  y -= 11;
  form.workersCompClasses.forEach((wc) => {
    txt(wc.code || '—', MARGIN_X + 22, y, 9);
    txt(wc.description || '—', MARGIN_X + 90, y, 9);
    txtRight(`${(wc.galacticRate ?? 0).toFixed(2)}%`, y, 9);
    y -= SUB_LH;
  });
  y -= 1;

  // Credits
  bulletRow('Credit for Advance', formatCurrency(creditsPerPayroll), true);

  // Benefits
  bulletRow('Health Insurance Billed Client', formatCurrency(healthPerPayroll), true);
  bulletRow('Dental Insurance Billed Client', formatCurrency(dentalPerPayroll), true);
  bulletRow('Life / Disability Insurance Billed Client', formatCurrency(lifeDisabilityPerPayroll), true);

  // Total Invoice Summary
  y -= 2;
  hRule(y);
  y -= LH;
  txt('Total Invoice Summary', MARGIN_X + 11, y, 9.5, false);
  txtRight(formatCurrency(totalPerPayroll), y, 9.5);
  y -= LH + 4;

  // ── First invoice extras (**) ──
  const starItems: Array<[string, number]> = [];
  if (conversionFee > 0) starItems.push(['Conversion Fee', conversionFee]);
  if (workersCompDeposit > 0) starItems.push(['Workers Comp Deposit', workersCompDeposit]);
  const taSetup = form.timeAndAttendanceSetupFee ?? 0;
  if (taSetup > 0) starItems.push(['Time and Attendance Setup', taSetup]);

  starItems.forEach(([label, value]) => {
    txt('**', MARGIN_X, y, 9, true);
    txt(label, MARGIN_X + 14, y, 9);
    txtRight(formatCurrency(value), y, 9);
    y -= SUB_LH;
  });

  y -= 2;
  hRule(y);
  y -= LH;

  // ** TOTAL FEES (on first invoice)
  txt('**', MARGIN_X, y, 9.5, true);
  txt('TOTAL FEES', MARGIN_X + 14, y, 9.5, true);
  const totalFeesW = fontBold.widthOfTextAtSize('TOTAL FEES', 9.5);
  txt(' (on first invoice)', MARGIN_X + 14 + totalFeesW, y, 9.5, false);
  txtRight(
    formatCurrency(
      getOverrideNumber('firstInvoiceTotal', totalPerPayroll + starItems.reduce((sum, [, value]) => sum + value, 0)),
    ),
    y,
    9.5,
    true,
  );
  y -= LH + 8;

  // ── Agreement Terms ──
  const freqLabels: Record<AgreementFormValues['payrollFrequency'], string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    semimonthly: 'Semi-Monthly',
    monthly: 'Monthly',
  };
  const termRows: Array<[string, string]> = [
    ['Initial Term', `${form.initialTermMonths || 12} Months`],
    ['Pay Frequency', freqLabels[form.payrollFrequency] ?? form.payrollFrequency],
    ['First Check Date', fmtShortDate(form.firstCheckDate)],
    ['Contract Effective Date:', effectiveDate !== 'N/A' ? effectiveDate : documentDate],
  ];
  termRows.forEach(([label, value]) => {
    txt(label, MARGIN_X + 11, y, 9.5);
    txtRight(value, y, 9.5);
    y -= SUB_LH;
  });

  y -= 14;

  // ── Signature Block (two-column) ──
  const colL = MARGIN_X;
  const colR = MARGIN_X + 290;
  const sigW = 208;
  const sigRowH = 20;
  const signatureLabelWidth = font.widthOfTextAtSize('Signature:', 9);

  const clientName = form.legalName || clientSignature?.name || 'N/A';
  const addr = form.physicalAddress;
  const clientPhone = formatPhoneWithPeriods(form.primaryContact?.phone);

  // Party info rows
  const infoRows: Array<[string, string]> = [
    [`Client:  ${clientName}`, `Provider:  Galactic Inc.`],
    ['', 'Galactic Employer Services'],
    [`Address:  ${addr?.street || ''}`, `Address:  400 Vestavia Pkwy Ste 402`],
    [`${addr?.city || ''} ${addr?.state || ''} ${addr?.zip || ''}`.trim(), `Vestavia, AL 35216`],
    [`Phone:  ${clientPhone}`, `Phone:  205.322.2220`],
  ];
  const infoValueOffset = font.widthOfTextAtSize('Provider:  ', 9);
  const drawInfoLine = (text: string, x: number) => {
    const match = text.match(/^([^:]+:\s+)(.*)$/);
    if (!match) {
      txt(text, x + infoValueOffset, y, 9, true);
      return;
    }
    const [, label, value] = match;
    txt(label, x, y, 9, false);
    txt(value, x + infoValueOffset, y, 9, true);
  };
  infoRows.forEach(([left, right], index) => {
    drawInfoLine(left, colL);
    drawInfoLine(right, colR);
    y -= SUB_LH;
  });
  y -= 20;

  // Signature fields
  type SigField = { label: string; prefillLeft?: string; prefillRight?: string };
  const sigFields: SigField[] = [
    { label: 'Signature:', prefillLeft: undefined, prefillRight: undefined },
    {
      label: 'Print Name:',
      prefillLeft: clientSignature?.printName || undefined,
      prefillRight: providerSignature?.name || 'Blan Marriott',
    },
    {
      label: 'Title:',
      prefillLeft: clientSignature?.title || undefined,
      prefillRight: 'President',
    },
    { label: 'Date:', prefillLeft: clientSignature?.dateText || undefined, prefillRight: documentDate },
  ];

  for (const field of sigFields) {
    // Draw label
    txt(field.label, colL, y, 9);
    txt(field.label, colR, y, 9);
    const labelW = font.widthOfTextAtSize(field.label, 9) + 4;
    // Draw lines
    sigLine(colL + labelW, y, sigW - labelW);
    sigLine(colR + labelW, y, sigW - labelW);
    // Pre-fill values on the line
    if (field.prefillLeft) txt(field.prefillLeft, colL + labelW + 4, y + 2, 9, false);
    if (field.prefillRight) txt(field.prefillRight, colR + labelW + 4, y + 2, 9, false);
    y -= sigRowH;
  }

  // Embed client signature image if provided
  if (clientSignature?.signaturePngBytes) {
    const img = await pdf.embedPng(clientSignature.signaturePngBytes);
    const render = signatureRenderOptions?.client;
    const imgH = render?.height ?? 28;
    const imgW = render?.width ?? (img.width * imgH) / img.height;
    const sigFieldY = y + sigRowH * 4 + 2; // back to the signature row y
    page.drawImage(img, {
      x: colL + signatureLabelWidth + 8 + (render?.offsetX ?? 0),
      y: sigFieldY + 1 + (render?.offsetY ?? 0),
      width: Math.min(sigW - 60, imgW),
      height: imgH,
    });
  } else if (clientSignature?.signatureText) {
    const typedSignature = clientSignature.signatureText.trim();
    if (typedSignature) {
      const render = signatureRenderOptions?.client;
      const typedFont = signatureFont;
      const typedSize = Math.min(22, Math.max(18, (render?.height ?? 24) - 6));
      page.drawText(typedSignature, {
        x: colL + signatureLabelWidth + 8 + (render?.offsetX ?? 0),
        y: y + sigRowH * 4 + 3 + (render?.offsetY ?? 0),
        size: typedSize,
        font: typedFont,
        color: TEXT_COLOR,
      });
    }
  }
  if (providerSignature?.signaturePngBytes) {
    const img = await pdf.embedPng(providerSignature.signaturePngBytes);
    const render = signatureRenderOptions?.provider;
    const imgH = render?.height ?? 28;
    const imgW = render?.width ?? (img.width * imgH) / img.height;
    const sigFieldY = y + sigRowH * 4 + 2;
    page.drawImage(img, {
      x: colR + signatureLabelWidth + 8 + (render?.offsetX ?? 0),
      y: sigFieldY + 1 + (render?.offsetY ?? 0),
      width: Math.min(sigW - 60, imgW),
      height: imgH,
    });
  }

  const bytes = await pdf.save();
  return bytes;
}

export async function exportAgreementPdf(payload: {
  form: AgreementFormValues;
  calculations: AgreementCalculationResult;
}) {
  const bytes = await generateAgreementPdfBytes(payload);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const filename = `${payload.form.legalName || 'agreement'}-billing-agreement.pdf`
    .replace(/\s+/g, '_')
    .toLowerCase();
  downloadFile(filename, blob);
}

export async function exportCostAnalysisPdf(payload: CostAnalysisPdfPayload) {
  const bytes = await generateCostAnalysisPdfBytes(payload);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const baseName = sanitizeFilenamePart(payload.form.legalName || payload.form.dbaName || 'Client') || 'cost-analysis';
  downloadFile(`${baseName}-cost-analysis.pdf`, blob);
}

export async function generateCostAnalysisPdfBytes(payload: CostAnalysisPdfPayload) {
  const { form, calculations, analysis } = payload;
  const documentDate = formatDocumentDate();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const poppinsRegular = await loadFont(
    pdf,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Regular%20(1).ttf',
  );
  const poppinsBold = await loadFont(
    pdf,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Bold.ttf',
  );
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const tonduFont = await loadFont(
    pdf,
    baseUrl ? `${baseUrl.replace(/\/$/, '')}/Tondu-Beta.ttf` : '/Tondu-Beta.ttf',
  );
  const font = poppinsRegular ?? (await pdf.embedFont(StandardFonts.Helvetica));
  const fontBold = poppinsBold ?? (await pdf.embedFont(StandardFonts.HelveticaBold));
  const fontTitle = tonduFont ?? fontBold;
  const logo = await embedGalacticLogo(pdf);
  const ctx = addPageContext(pdf, font, fontBold, fontTitle, documentDate, logo);
  ctx.cursorY -= 18;

  ctx.page.drawText('Cost Analysis Summary', {
    x: MARGIN_X,
    y: ctx.cursorY,
    size: 18,
    font: ctx.fontTitle,
    color: TEXT_COLOR,
  });
  ctx.cursorY -= 24;

  const companyName = form.legalName || form.dbaName || 'Client';
  const providerName = analysis.current.title || form.currentProviderName || 'Current payroll company';
  const proposalName = analysis.proposed.title || 'Galactic Inc proposal';
  const hasPositiveSavings = analysis.savingsAnnual > 0;
  const subtitle = `Prepared for ${companyName}. This compares current payroll costs against the Galactic Inc proposal using ${calculations.payPeriodsPerYear} pay periods and ${calculations.employeeCount} employees.`;
  wrapText(subtitle, font, 10.5, PAGE_WIDTH - MARGIN_X * 2).forEach((line) => {
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.cursorY,
      size: 10.5,
      font,
      color: rgb(78 / 255, 91 / 255, 112 / 255),
    });
    ctx.cursorY -= 14;
  });

  const cardTop = ctx.cursorY - 12;
  const cardWidth = 160;
  const cardGap = 18;
  drawMetricCard(
    ctx.page,
    {
      x: MARGIN_X,
      y: cardTop - 92,
      width: cardWidth,
      height: 92,
      title: 'Current annual',
      value: formatCurrency(analysis.current.annual),
      subtitle: `${providerName}`,
      fill: rgb(241 / 255, 245 / 255, 249 / 255),
    },
    font,
    fontBold,
  );
  drawMetricCard(
    ctx.page,
    {
      x: MARGIN_X + cardWidth + cardGap,
      y: cardTop - 92,
      width: cardWidth,
      height: 92,
      title: 'Galactic annual',
      value: formatCurrency(analysis.proposed.annual),
      subtitle: 'Galactic Inc proposal',
      fill: rgb(232 / 255, 244 / 255, 255 / 255),
      titleColor: BRAND_BLUE,
      valueColor: BRAND_BLUE,
    },
    font,
    fontBold,
  );
  drawMetricCard(
    ctx.page,
    {
      x: MARGIN_X + (cardWidth + cardGap) * 2,
      y: cardTop - 92,
      width: cardWidth,
      height: 92,
      title: 'Annual savings',
      value: formatCurrency(analysis.savingsAnnual),
      subtitle: `${formatCurrency(analysis.savingsPerPayroll)} per payroll`,
      fill: hasPositiveSavings ? rgb(226 / 255, 246 / 255, 231 / 255) : rgb(255 / 255, 248 / 255, 214 / 255),
      titleColor: hasPositiveSavings ? rgb(22 / 255, 101 / 255, 52 / 255) : rgb(124 / 255, 95 / 255, 0),
      valueColor: hasPositiveSavings ? rgb(22 / 255, 101 / 255, 52 / 255) : rgb(124 / 255, 95 / 255, 0),
      textColor: hasPositiveSavings ? rgb(22 / 255, 101 / 255, 52 / 255) : rgb(124 / 255, 95 / 255, 0),
    },
    font,
    fontBold,
  );

  const columnsTop = cardTop - 128;
  const columnWidth = (PAGE_WIDTH - MARGIN_X * 2 - 16) / 2;
  drawAnalysisColumn(
    ctx.page,
    {
      x: MARGIN_X,
      y: columnsTop,
      width: columnWidth,
      title: providerName,
      annualLabel: 'Annual total',
      annualValue: formatCurrency(analysis.current.annual),
      perPayrollLabel: 'Per payroll',
      perPayrollValue: formatCurrency(analysis.current.perPayroll),
      lines: analysis.current.lines.map((line) => ({
        label: line.label,
        value: formatCurrency(line.value),
      })),
      accent: rgb(94 / 255, 110 / 255, 132 / 255),
    },
    font,
    fontBold,
  );
  drawAnalysisColumn(
    ctx.page,
    {
      x: MARGIN_X + columnWidth + 16,
      y: columnsTop,
      width: columnWidth,
      annualLabel: 'Annual total',
      annualValue: formatCurrency(analysis.proposed.annual),
      perPayrollLabel: 'Per payroll',
      perPayrollValue: formatCurrency(analysis.proposed.perPayroll),
      lines: analysis.proposed.lines.map((line) => ({
        label: line.label,
        value: formatCurrency(line.value),
      })),
      accent: BRAND_BLUE,
      useGalacticLogo: true,
    },
    font,
    fontBold,
  );

  const bytes = await pdf.save();
  return bytes;
}
