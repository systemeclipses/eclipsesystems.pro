import path from 'path';
import { promises as fs } from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 48;
const HEADER_HEIGHT = 74;
const BRAND_BLUE = rgb(0, 87 / 255, 145 / 255);
const BRAND_GOLD = rgb(255 / 255, 209 / 255, 6 / 255);
const TEXT_COLOR = rgb(20 / 255, 26 / 255, 40 / 255);
const SUBTLE_COLOR = rgb(95 / 255, 105 / 255, 122 / 255);
const WHITE = rgb(1, 1, 1);
const ROW_FILL = rgb(245 / 255, 247 / 255, 251 / 255);

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

export type RetirementQuestionnaireAnswers = {
  companyName: string;
  prospectName?: string | null;

  interestedInJoining: boolean | null;
  estimatedDateOfAdoption: string;
  offersRetirementPlan: boolean | null;
  planType: string;
  existingPlanTrustee: string;
  planNumber: string;
  planAssets: string;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
  datePlanEstablished: string;

  fiscalYearEnd: string;
  officers: Array<{ name: string; title: string; percent: string }>;

  serviceRequirement: string;
  ageRequirement: string;
  grandfatheredEligibilityDate: string;
  entryDate: 'month' | 'quarter' | null;

  matchDetails: string;
  vesting: 'immediate' | '5-year' | '6-year' | '3-year' | null;
  threeYearVestingYear1: string;
  threeYearVestingYear2: string;
};

type Ctx = {
  doc: PDFDocument;
  page: any;
  font: any;
  fontBold: any;
  fontTitle: any;
  y: number;
};

async function loadRemoteFont(doc: PDFDocument, url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return await doc.embedFont(buf);
  } catch {
    return null;
  }
}

async function loadLocalFont(doc: PDFDocument, relativePath: string) {
  try {
    const absolute = path.resolve(process.cwd(), relativePath);
    const bytes = await fs.readFile(absolute);
    return await doc.embedFont(bytes);
  } catch {
    return null;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.valueOf()) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }
  return trimmed;
}

function valueOrDash(value?: string | null) {
  const v = (value ?? '').trim();
  return v.length ? v : '—';
}

function yesNo(value: boolean | null) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

function vestingLabel(value: RetirementQuestionnaireAnswers['vesting']) {
  switch (value) {
    case 'immediate':
      return 'Immediate';
    case '5-year':
      return '5-year graded (20% first year)';
    case '6-year':
      return '6-year graded (0% first year, 20% per year thereafter)';
    case '3-year':
      return '3-year graded (complete blanks in ascending order)';
    default:
      return '—';
  }
}

function entryDateLabel(value: RetirementQuestionnaireAnswers['entryDate']) {
  if (value === 'month') return '1st of Month (most common)';
  if (value === 'quarter') return '1st of Quarter';
  return '—';
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
      color: WHITE,
      borderColor: WHITE,
      yScale: -scale,
    });
  });
}

function drawHeader(ctx: Ctx) {
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

  const logoWidth = 200;
  const logoHeight = (GALACTIC_WORDMARK_VIEWBOX.height / GALACTIC_WORDMARK_VIEWBOX.width) * logoWidth;
  const blueSectionHeight = HEADER_HEIGHT - 6;
  drawGalacticWordmark(
    ctx.page,
    14,
    PAGE_HEIGHT - HEADER_HEIGHT + 6 + (blueSectionHeight - logoHeight) / 2,
    logoWidth
  );
}

function addPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(ctx);
  ctx.y = PAGE_HEIGHT - HEADER_HEIGHT - 60;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < 56) {
    addPage(ctx);
  }
}

function drawTitleBlock(ctx: Ctx, answers: RetirementQuestionnaireAnswers) {
  ctx.page.drawText('401(k) Retirement Plan Questionnaire', {
    x: MARGIN_X,
    y: ctx.y,
    size: 26,
    font: ctx.fontTitle,
    color: TEXT_COLOR,
  });
  ctx.y -= 30;
  ctx.page.drawText(answers.companyName || 'Prospective client', {
    x: MARGIN_X,
    y: ctx.y,
    size: 13,
    font: ctx.font,
    color: SUBTLE_COLOR,
  });
  ctx.y -= 14;
  if (answers.prospectName) {
    ctx.page.drawText(`Submitted by ${answers.prospectName}`, {
      x: MARGIN_X,
      y: ctx.y,
      size: 10,
      font: ctx.font,
      color: SUBTLE_COLOR,
    });
    ctx.y -= 14;
  }
  ctx.y -= 14;
}

function drawSectionHeader(ctx: Ctx, title: string) {
  ensureSpace(ctx, 40);
  const barHeight = 22;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - barHeight,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: barHeight,
    color: BRAND_BLUE,
  });
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - barHeight,
    width: 4,
    height: barHeight,
    color: BRAND_GOLD,
  });
  ctx.page.drawText(title.toUpperCase(), {
    x: MARGIN_X + 14,
    y: ctx.y - barHeight + 7,
    size: 10,
    font: ctx.fontBold,
    color: WHITE,
  });
  ctx.y -= barHeight + 12;
}

function drawField(ctx: Ctx, label: string, value: string, options?: { zebra?: boolean }) {
  const innerWidth = PAGE_WIDTH - MARGIN_X * 2;
  const rowHeight = 22;
  ensureSpace(ctx, rowHeight);
  if (options?.zebra) {
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: ctx.y - rowHeight + 4,
      width: innerWidth,
      height: rowHeight,
      color: ROW_FILL,
    });
  }
  ctx.page.drawText(label, {
    x: MARGIN_X + 10,
    y: ctx.y - 10,
    size: 9.5,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  const valueWidth = ctx.font.widthOfTextAtSize(value, 10.5);
  const maxValueWidth = innerWidth - 240;
  const truncated =
    valueWidth <= maxValueWidth
      ? value
      : truncateToWidth(value, ctx.font, 10.5, maxValueWidth);
  ctx.page.drawText(truncated, {
    x: MARGIN_X + 230,
    y: ctx.y - 10,
    size: 10.5,
    font: ctx.font,
    color: TEXT_COLOR,
  });
  ctx.y -= rowHeight;
}

function truncateToWidth(text: string, font: any, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && font.widthOfTextAtSize(text.slice(0, end) + '…', size) > maxWidth) {
    end -= 1;
  }
  return text.slice(0, end) + '…';
}

function drawParagraph(ctx: Ctx, label: string, value: string) {
  const innerWidth = PAGE_WIDTH - MARGIN_X * 2;
  ensureSpace(ctx, 28);
  ctx.page.drawText(label, {
    x: MARGIN_X + 10,
    y: ctx.y - 10,
    size: 9.5,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  ctx.y -= 22;
  const lines = wrap(value || '—', ctx.font, 10.5, innerWidth - 20);
  lines.forEach((line) => {
    ensureSpace(ctx, 14);
    ctx.page.drawText(line, {
      x: MARGIN_X + 10,
      y: ctx.y - 10,
      size: 10.5,
      font: ctx.font,
      color: TEXT_COLOR,
    });
    ctx.y -= 14;
  });
  ctx.y -= 4;
}

function wrap(text: string, font: any, size: number, maxWidth: number) {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = '';
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    lines.push('');
  });
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.length ? lines : ['—'];
}

function drawOfficersTable(ctx: Ctx, officers: RetirementQuestionnaireAnswers['officers']) {
  const innerWidth = PAGE_WIDTH - MARGIN_X * 2;
  const headerHeight = 18;
  const rowHeight = 20;
  ensureSpace(ctx, headerHeight + rowHeight * 3 + 8);

  ctx.page.drawText('Principal corporate officers', {
    x: MARGIN_X + 10,
    y: ctx.y - 10,
    size: 9.5,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  ctx.y -= 22;

  const nameW = innerWidth * 0.5;
  const titleW = innerWidth * 0.35;
  const pctW = innerWidth - nameW - titleW;
  const startX = MARGIN_X;

  ctx.page.drawRectangle({
    x: startX,
    y: ctx.y - headerHeight,
    width: innerWidth,
    height: headerHeight,
    color: rgb(232 / 255, 238 / 255, 247 / 255),
  });
  ctx.page.drawText('NAME', {
    x: startX + 10,
    y: ctx.y - headerHeight + 5,
    size: 9,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  ctx.page.drawText('TITLE', {
    x: startX + nameW + 10,
    y: ctx.y - headerHeight + 5,
    size: 9,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  ctx.page.drawText('%', {
    x: startX + nameW + titleW + 10,
    y: ctx.y - headerHeight + 5,
    size: 9,
    font: ctx.fontBold,
    color: SUBTLE_COLOR,
  });
  ctx.y -= headerHeight;

  const rows = (officers || []).slice(0, 3);
  while (rows.length < 3) rows.push({ name: '', title: '', percent: '' });

  rows.forEach((officer, i) => {
    ensureSpace(ctx, rowHeight);
    if (i % 2 === 1) {
      ctx.page.drawRectangle({
        x: startX,
        y: ctx.y - rowHeight,
        width: innerWidth,
        height: rowHeight,
        color: ROW_FILL,
      });
    }
    ctx.page.drawText(valueOrDash(officer.name), {
      x: startX + 10,
      y: ctx.y - rowHeight + 6,
      size: 10.5,
      font: ctx.font,
      color: TEXT_COLOR,
    });
    ctx.page.drawText(valueOrDash(officer.title), {
      x: startX + nameW + 10,
      y: ctx.y - rowHeight + 6,
      size: 10.5,
      font: ctx.font,
      color: TEXT_COLOR,
    });
    ctx.page.drawText(valueOrDash(officer.percent), {
      x: startX + nameW + titleW + 10,
      y: ctx.y - rowHeight + 6,
      size: 10.5,
      font: ctx.font,
      color: TEXT_COLOR,
    });
    ctx.y -= rowHeight;
  });
  ctx.y -= 8;
}

function drawFooter(ctx: Ctx) {
  const text = 'Galactic 365 · 401(k) Retirement Plan Questionnaire';
  const width = ctx.font.widthOfTextAtSize(text, 8.5);
  ctx.page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: 28,
    size: 8.5,
    font: ctx.font,
    color: SUBTLE_COLOR,
  });
}

export async function buildRetirementQuestionnairePdf(
  answers: RetirementQuestionnaireAnswers
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const poppinsRegular = await loadRemoteFont(
    doc,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Regular%20(1).ttf'
  );
  const poppinsBold = await loadRemoteFont(
    doc,
    'https://raw.githubusercontent.com/galacticpayroll-hash/fonts-assets/main/Poppins-Bold.ttf'
  );
  const tondu = await loadLocalFont(doc, 'public/Tondu-Beta.ttf');

  const font = poppinsRegular ?? (await doc.embedFont(StandardFonts.Helvetica));
  const fontBold = poppinsBold ?? (await doc.embedFont(StandardFonts.HelveticaBold));
  const fontTitle = tondu ?? fontBold;

  const ctx: Ctx = {
    doc,
    page: null,
    font,
    fontBold,
    fontTitle,
    y: 0,
  };
  addPage(ctx);
  drawTitleBlock(ctx, answers);

  // Section 1: Current Plan
  drawSectionHeader(ctx, 'Current Plan');
  drawField(ctx, 'Interested in Galactic 401(k)', yesNo(answers.interestedInJoining), { zebra: true });
  drawField(ctx, 'Estimated date of adoption', formatDate(answers.estimatedDateOfAdoption));
  drawField(ctx, 'Currently offers retirement plan', yesNo(answers.offersRetirementPlan), { zebra: true });
  drawField(ctx, 'Type of existing plan', valueOrDash(answers.planType));
  drawField(ctx, 'Existing plan trustee', valueOrDash(answers.existingPlanTrustee), { zebra: true });
  drawField(ctx, 'Plan number', valueOrDash(answers.planNumber));
  drawField(ctx, 'Current plan assets', valueOrDash(answers.planAssets), { zebra: true });
  drawField(ctx, 'Provider contact name', valueOrDash(answers.providerName));
  drawField(ctx, 'Provider contact phone', valueOrDash(answers.providerPhone), { zebra: true });
  drawField(ctx, 'Provider contact email', valueOrDash(answers.providerEmail));
  drawField(ctx, 'Date plan was established', formatDate(answers.datePlanEstablished), { zebra: true });
  ctx.y -= 8;

  // Section 2: Company Information
  drawSectionHeader(ctx, 'Company Information');
  drawField(ctx, 'Fiscal year end', formatDate(answers.fiscalYearEnd), { zebra: true });
  drawOfficersTable(ctx, answers.officers);

  // Section 3: Eligibility & Participation
  drawSectionHeader(ctx, 'Eligibility & Participation');
  drawField(ctx, 'Service requirement', valueOrDash(answers.serviceRequirement), { zebra: true });
  drawField(ctx, 'Age requirement', valueOrDash(answers.ageRequirement));
  drawField(ctx, 'Grandfathered eligibility date', formatDate(answers.grandfatheredEligibilityDate), {
    zebra: true,
  });
  drawField(ctx, 'Entry date', entryDateLabel(answers.entryDate));
  ctx.y -= 8;

  // Section 4: Employer Contributions
  drawSectionHeader(ctx, 'Employer Contributions');
  drawParagraph(ctx, 'Match details', valueOrDash(answers.matchDetails));
  drawField(ctx, 'Vesting schedule', vestingLabel(answers.vesting), { zebra: true });
  if (answers.vesting === '3-year') {
    drawField(ctx, '3-year graded · Year 1 vested %', valueOrDash(answers.threeYearVestingYear1));
    drawField(ctx, '3-year graded · Year 2 vested %', valueOrDash(answers.threeYearVestingYear2), {
      zebra: true,
    });
  }

  // Footer on each existing page
  const pages = doc.getPages();
  pages.forEach((page) => {
    const text = 'Galactic, Inc.  ·  401(k) Retirement Plan Questionnaire';
    const width = font.widthOfTextAtSize(text, 8.5);
    page.drawText(text, {
      x: (PAGE_WIDTH - width) / 2,
      y: 28,
      size: 8.5,
      font,
      color: SUBTLE_COLOR,
    });
  });
  void drawFooter;

  return doc.save();
}
