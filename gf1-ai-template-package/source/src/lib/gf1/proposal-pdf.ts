/**
 * PDF Handout Generator for PEO Proposals
 * Uses pdf-lib for branded, multi-page generation
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface ProposalPDFData {
  companyName: string;
  tradeName?: string; // Added trade name (DBA name) property
  logoUrl?: string;
  prospectContactName?: string;
  proposalDate?: string;
  employeeCount: number;
  adminFeePerEmployee: number;
  adminFeeMode?: 'per_check' | 'per_month' | 'percent_of_gross' | null;
  adminFeeValue?: number | null;
  estimatedSUTA: number;
  estimatedWCPremium: number;
  setupFees?: number | null;
  otherFees?: { label: string; amount: number }[];
  sutaByState?: { state: string; amount: number; rate?: number | null }[];
  wcByState?: { state: string; classCode: string; amount: number; rate?: number | null }[];
  services: {
    health: boolean;
    retirement401k: boolean;
    supplemental: boolean;
  };
  selectedServices: string[];
  defaultServices: string[];
  industry?: string;
  customTagline?: string;
  estimatedMonthlyAdminCost: number;
  notesForProspect?: string | null;
  adminFeeMonthly?: number | null;
  adminFeeAnnual?: number | null;
  adminFeeLabel?: string | null;
  timekeepingFeeMonthly?: number | null;
  timekeepingFeeAnnual?: number | null;
  timekeepingFeeLabel?: string | null;
  wcSellingAnnual?: number | null;
  addons?: { label: string; monthly: number; annual: number }[];
}

export type ProposalPDFOrientation = 'portrait' | 'landscape';

type PageHandle = {
  page: any;
  width: number;
  height: number;
};

type PageEntry = PageHandle & {
  includeFooter: boolean;
};

type TableSpec = {
  headers: string[];
  rows: string[][];
  columnAlign?: ('left' | 'right')[];
  columnWidths?: number[];
};

const BLUE = rgb(0, 87 / 255, 145 / 255);
const YELLOW = rgb(255 / 255, 209 / 255, 6 / 255);
const LIGHT_GRAY = rgb(241 / 255, 245 / 255, 249 / 255);
const TEXT = rgb(15 / 255, 23 / 255, 42 / 255);

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

function drawFooter(
  page: any,
  width: number,
  height: number,
  font: any,
  fontBold: any,
  proposalDate: string,
  galacticLogo: any,
  isCover: boolean,
) {
  let footerX = 30;
  if (galacticLogo) {
    const logoHeight = isCover ? 32 : 20;
    const logoWidth = (galacticLogo.width * logoHeight) / galacticLogo.height;
    const logoY = isCover ? 22 : 18;
    page.drawImage(galacticLogo, { x: footerX, y: logoY, width: logoWidth, height: logoHeight });
    footerX += logoWidth + 10;
  }

  const label = 'Proposal date: ';
  const dateText = proposalDate;
  const size = isCover ? 12 : 10;
  const labelWidth = font.widthOfTextAtSize(label, size);
  const dateWidth = fontBold.widthOfTextAtSize(dateText, size);
  const totalWidth = labelWidth + dateWidth;
  let x = width - 30 - totalWidth;
  page.drawText(label, { x, y: isCover ? 28 : 24, size, font, color: BLUE });
  x += labelWidth;
  page.drawText(dateText, { x, y: isCover ? 28 : 24, size, font: fontBold, color: BLUE });
}

function formatOrdinalDate(date: Date) {
  const day = date.getDate();
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? 'th'
      : day % 10 === 1
        ? 'st'
        : day % 10 === 2
          ? 'nd'
          : day % 10 === 3
            ? 'rd'
            : 'th';
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date) +
    ` ${day}${suffix}, ${date.getFullYear()}`;
}

function drawBorder(page: any, width: number, height: number) {
  page.drawRectangle({
    x: 9,
    y: 9,
    width: width - 18,
    height: height - 18,
    borderColor: BLUE,
    borderWidth: 3.5,
  });
}

async function embedLogo(doc: PDFDocument, logoUrl?: string) {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
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
  const url = 'https://i.imgur.com/oWRu6zG.png';
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return await doc.embedPng(buffer);
  } catch {
    return null;
  }
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

function drawHeader(
  page: any,
  width: number,
  height: number,
  font: any,
  fontBold: any,
  title: string,
  subtitle: string,
  logo: any,
) {
  drawBorder(page, width, height);
  page.drawText('Galactic PEO Proposal', { x: 34, y: height - 46, size: 10, font: fontBold, color: BLUE });
  page.drawText(title, { x: 34, y: height - 70, size: 20, font: fontBold, color: TEXT });
  const subtitleLines = wrapText(subtitle, font, 11, width - 200);
  subtitleLines.forEach((line, idx) => {
    page.drawText(line, { x: 34, y: height - 90 - idx * 14, size: 11, font, color: TEXT });
  });
  if (logo) {
    const logoHeight = 60;
    const logoWidth = (logo.width * logoHeight) / logo.height;
    page.drawImage(logo, {
      x: width - logoWidth - 36,
      y: height - logoHeight - 40,
      width: logoWidth,
      height: logoHeight,
    });
  }
}

function drawSectionTitle(page: any, x: number, y: number, text: string, fontBold: any) {
  page.drawText(text.toUpperCase(), { x, y, size: 12, font: fontBold, color: BLUE });
  return y - 16;
}

function drawBulletList(page: any, x: number, y: number, bullets: string[], font: any, fontBold: any, maxWidth: number) {
  const lineHeight = 16;
  let cursor = y;
  bullets.forEach((bullet) => {
    const lines = wrapText(bullet, font, 11, maxWidth - 14);
    page.drawText('•', { x, y: cursor, size: 12, font: fontBold, color: TEXT });
    lines.forEach((line, idx) => {
      page.drawText(line, { x: x + 14, y: cursor - idx * lineHeight, size: 11, font, color: TEXT });
    });
    cursor -= lines.length * lineHeight + 6;
  });
  return cursor;
}

function drawTable(
  page: any,
  x: number,
  y: number,
  width: number,
  spec: TableSpec,
  font: any,
  fontBold: any,
) {
  const rowHeight = 22;
  const colCount = spec.headers.length;
  const padding = 8;
  const columnWidths = spec.columnWidths && spec.columnWidths.length === colCount
    ? spec.columnWidths
    : Array.from({ length: colCount }, () => 1 / colCount);
  const colPixelWidths = columnWidths.map((ratio) => ratio * width);
  const colX = colPixelWidths.reduce<number[]>((acc, w) => {
    acc.push((acc.at(-1) ?? x) + w);
    return acc;
  }, [x]);

  page.drawRectangle({ x, y: y - rowHeight + 4, width, height: rowHeight, color: BLUE });
  spec.headers.forEach((header, idx) => {
    const align = spec.columnAlign?.[idx] ?? 'left';
    const headerWidth = fontBold.widthOfTextAtSize(header, 10);
    const cellX = align === 'right'
      ? colX[idx + 1] - headerWidth - padding
      : colX[idx] + padding;
    page.drawText(header, {
      x: cellX,
      y: y - 12,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  });

  let cursor = y - rowHeight - 10;
  spec.rows.forEach((row, rowIndex) => {
    const isEven = (rowIndex + 1) % 2 === 0;
    if (isEven) {
      page.drawRectangle({
        x,
        y: cursor - 6,
        width,
        height: rowHeight,
        color: LIGHT_GRAY,
      });
    }
    // Column separators
    for (let i = 1; i < colCount; i += 1) {
      page.drawLine({
        start: { x: colX[i], y: cursor - 8 },
        end: { x: colX[i], y: cursor + rowHeight - 10 },
        thickness: 0.5,
        color: rgb(226 / 255, 232 / 255, 240 / 255),
      });
    }
    row.forEach((cell, idx) => {
      const align = spec.columnAlign?.[idx] ?? 'left';
      const textWidth = font.widthOfTextAtSize(cell, 10);
      const cellX =
        align === 'right'
          ? colX[idx + 1] - textWidth - padding
          : colX[idx] + padding;
      page.drawText(cell, { x: cellX, y: cursor, size: 10, font, color: TEXT });
    });
    cursor -= rowHeight;
  });

  return cursor;
}

function addTextPage(
  doc: PDFDocument,
  font: any,
  fontBold: any,
  logo: any,
  orientation: ProposalPDFOrientation,
  title: string,
  subtitle: string,
  sections: { title: string; bullets: string[] }[],
) {
  const width = orientation === 'portrait' ? 612 : 792;
  const height = orientation === 'portrait' ? 792 : 612;
  const page = doc.addPage([width, height]);
  drawHeader(page, width, height, font, fontBold, title, subtitle, logo);
  const marginX = 40;
  const columnGap = 24;
  const maxWidth = width - marginX * 2;
  const columnWidth = (maxWidth - columnGap) / 2;
  const startY = height - 130;
  const columnY = [startY, startY];

  sections.forEach((section, idx) => {
    if (sections.length === 1) {
      let cursor = columnY[0];
      cursor = drawSectionTitle(page, marginX, cursor, section.title, fontBold);
      cursor = drawBulletList(page, marginX, cursor, section.bullets, font, fontBold, maxWidth);
      columnY[0] = cursor - 8;
      return;
    }
    const col = idx % 2;
    const x = marginX + col * (columnWidth + columnGap);
    let cursor = columnY[col];
    cursor = drawSectionTitle(page, x, cursor, section.title, fontBold);
    cursor = drawBulletList(page, x, cursor, section.bullets, font, fontBold, columnWidth);
    columnY[col] = cursor - 10;
  });

  return { page, width, height } as PageHandle;
}

async function loadTemplatePdfBytes() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const url = new URL('/New Proposal v2.1.pdf', baseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load template PDF');
  }
  return response.arrayBuffer();
}

async function importTemplatePages(pdf: PDFDocument, templateBytes?: ArrayBuffer | null): Promise<PageEntry[]> {
  try {
    const bytes = templateBytes ?? (await loadTemplatePdfBytes());
    const templateDoc = await PDFDocument.load(bytes);
    const copied = await pdf.copyPages(templateDoc, [1, 2, 3, 4]);
    return copied.map((page) => {
      const { width, height } = page.getSize();
      return { page, width, height, includeFooter: false };
    });
  } catch (err) {
    console.warn('[proposal-pdf] failed to import template pages', err);
    return [];
  }
}

function addPricingPage(
  doc: PDFDocument,
  font: any,
  fontBold: any,
  logo: any,
  orientation: ProposalPDFOrientation,
  title: string,
  subtitle: string,
  costTable: TableSpec,
  invoiceTable?: TableSpec,
  note?: string,
) {
  const width = orientation === 'portrait' ? 612 : 792;
  const height = orientation === 'portrait' ? 792 : 612;
  const page = doc.addPage([width, height]);
  drawHeader(page, width, height, font, fontBold, title, subtitle, logo);
  let cursor = height - 140;
  const marginX = 40;
  const tableWidth = width - marginX * 2;

  cursor = drawSectionTitle(page, marginX, cursor, 'Cost Summary', fontBold);
  cursor = drawTable(page, marginX, cursor, tableWidth, costTable, font, fontBold) - 10;

  if (invoiceTable) {
    cursor = drawSectionTitle(page, marginX, cursor, 'Dummy Invoice (Rates + Totals)', fontBold);
    cursor = drawTable(page, marginX, cursor, tableWidth, invoiceTable, font, fontBold) - 6;
  }

  if (note) {
    page.drawText(note, { x: marginX, y: Math.max(cursor, 70), size: 9, font, color: TEXT });
  }

  return { page, width, height } as PageHandle;
}

function addBreakdownPage(
  doc: PDFDocument,
  font: any,
  fontBold: any,
  logo: any,
  orientation: ProposalPDFOrientation,
  sutaTable?: TableSpec,
  wcTable?: TableSpec,
) {
  const width = orientation === 'portrait' ? 612 : 792;
  const height = orientation === 'portrait' ? 792 : 612;
  const page = doc.addPage([width, height]);
  drawHeader(page, width, height, font, fontBold, 'Tax & WC Breakdown', 'State-by-state totals and rates.', logo);
  let cursor = height - 140;
  const marginX = 40;
  const tableWidth = width - marginX * 2;

  if (sutaTable) {
    cursor = drawSectionTitle(page, marginX, cursor, 'SUTA by State', fontBold);
    cursor = drawTable(page, marginX, cursor, tableWidth, sutaTable, font, fontBold) - 14;
  }

  if (wcTable) {
    cursor = drawSectionTitle(page, marginX, cursor, "Workers' Comp by State & Class", fontBold);
    cursor = drawTable(page, marginX, cursor, tableWidth, wcTable, font, fontBold) - 14;
  }

  return { page, width, height } as PageHandle;
}

export async function generateProposalPDF(
  data: ProposalPDFData,
  options?: { orientation?: ProposalPDFOrientation },
): Promise<Blob> {
  const orientation: ProposalPDFOrientation = 'landscape';
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
  const tonduFont = await loadFont(
    pdf,
    typeof window !== 'undefined' ? `${window.location.origin}/Tondu-Beta.ttf` : '/Tondu-Beta.ttf',
  );
  const font = poppinsRegular ?? (await pdf.embedFont(StandardFonts.Helvetica));
  const fontBold = poppinsBold ?? (await pdf.embedFont(StandardFonts.HelveticaBold));
  const titleFont = tonduFont ?? fontBold;
  const logo = await embedLogo(pdf, data.logoUrl);
  const galacticLogo = await embedGalacticLogo(pdf);

  const pages: PageEntry[] = [];
  let templateBytes: ArrayBuffer | null = null;
  let templateSize: { width: number; height: number } | null = null;
  try {
    templateBytes = await loadTemplatePdfBytes();
    const templateDoc = await PDFDocument.load(templateBytes);
    const sizeSource = templateDoc.getPage(1) ?? templateDoc.getPage(0);
    if (sizeSource) {
      templateSize = sizeSource.getSize();
    }
  } catch (err) {
    console.warn('[proposal-pdf] unable to read template size', err);
  }
  const overviewSections = [
    {
      title: 'Executive Summary',
      bullets: [
        'Galactic is a PEO partner delivering payroll, HR, benefits, and compliance support nationwide.',
        'You remain the job site employer. Galactic becomes the administrative employer.',
        'We reduce administrative load so your team can focus on growth.',
      ],
    },
    {
      title: 'Client Snapshot',
      bullets: [
        `Employees modeled: ${data.employeeCount}`,
        `Primary contact: ${data.prospectContactName ?? '—'}`,
        `Industry: ${data.industry ?? '—'}`,
      ],
    },
    {
      title: 'Included by Default',
      bullets: data.defaultServices.length ? data.defaultServices : ['Standard PEO coverage included'],
    },
    {
      title: 'Selected Services',
      bullets: data.selectedServices.length ? data.selectedServices : ['No add-ons selected'],
    },
  ];

  if (data.customTagline) {
    overviewSections.push({
      title: 'Notes',
      bullets: [data.customTagline],
    });
  }

  const coverWidth = templateSize?.width ?? (orientation === 'portrait' ? 612 : 792);
  const coverHeight = templateSize?.height ?? (orientation === 'portrait' ? 792 : 612);
  const coverPage = pdf.addPage([coverWidth, coverHeight]);

  const drawDiagonalBand = (
    targetPage: any,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
    color: any,
  ) => {
    targetPage.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color,
    });
  };

  const bandStartX = (coverWidth * 0.34) - 40;
  const bandStartY = -coverHeight * 0.4;
  const bandAngleDeg = 55;
  const bandAngleRad = (bandAngleDeg * Math.PI) / 180;
  const bandLength = Math.hypot(coverWidth * 0.73, coverHeight * 1.6);
  const bandEndX = bandStartX + Math.cos(bandAngleRad) * bandLength;
  const bandEndY = bandStartY + Math.sin(bandAngleRad) * bandLength;
  const yellowThickness = 72;
  const blueThickness = 130;

  const dx = bandEndX - bandStartX;
  const dy = bandEndY - bandStartY;
  const len = Math.hypot(dx, dy) || 1;
  const nxUnit = -dy / len;
  const nyUnit = dx / len;
  const touchOffset = (yellowThickness / 2) + (blueThickness / 2);

  drawDiagonalBand(coverPage, bandStartX, bandStartY, bandEndX, bandEndY, yellowThickness, YELLOW);
  drawDiagonalBand(
    coverPage,
    bandStartX - (nxUnit * touchOffset),
    bandStartY - (nyUnit * touchOffset),
    bandEndX - (nxUnit * touchOffset),
    bandEndY - (nyUnit * touchOffset),
    blueThickness,
    BLUE,
  );

  const circleRadius = 1.75 * 72;
  coverPage.drawCircle({
    x: coverWidth / 2 + 220,
    y: coverHeight / 2,
    size: circleRadius,
    color: rgb(1, 1, 1),
  });

  if (logo) {
    const maxLogoSize = circleRadius * 1.35;
    const logoWidth = logo.width;
    const logoHeight = logo.height;
    const logoScale = Math.min(maxLogoSize / logoWidth, maxLogoSize / logoHeight);
    const drawWidth = logoWidth * logoScale;
    const drawHeight = logoHeight * logoScale;
    const centerX = coverWidth / 2 + 220;
    const centerY = coverHeight / 2;
    coverPage.drawImage(logo, {
      x: centerX - (drawWidth / 2),
      y: centerY - (drawHeight / 2),
      width: drawWidth,
      height: drawHeight,
    });
  }

  const coverTitleLines = ['Proposal Of', 'Services'];
  const coverTitleSize = 80;
  const coverLineHeight = 88;
  const coverTitleY = coverHeight - 190;
  coverTitleLines.forEach((line, index) => {
    coverPage.drawText(line, {
      x: 40,
      y: coverTitleY - (index * coverLineHeight),
      size: coverTitleSize,
      font: titleFont,
      color: TEXT,
    });
  });
  pages.push({ page: coverPage, width: coverWidth, height: coverHeight, includeFooter: true });

  const templatePages = await importTemplatePages(pdf, templateBytes);
  const useTemplatePages = templatePages.length === 4;
  if (useTemplatePages) {
    templatePages.forEach((entry) => {
      pdf.addPage(entry.page);
      pages.push(entry);
    });
  }

  if (!useTemplatePages) {
    pages.push({
      ...addTextPage(
        pdf,
        font,
        fontBold,
        logo,
        orientation,
        data.companyName,
        'Proposal overview and service summary.',
        overviewSections,
      ),
      includeFooter: true,
    });
  }

  if (!useTemplatePages) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'You are the Boss', 'Galactic handles the administrative employer role so you control the worksite.', [
        {
          title: 'How the relationship works',
          bullets: [
            'You keep direction of work, hiring, and culture.',
            'Galactic manages payroll, taxes, benefits, and compliance administration.',
            'Dedicated support teams and clear calendars keep you aligned year-round.',
          ],
        },
        {
          title: 'What this means for you',
          bullets: [
            'Reduce administrative load and internal HR overhead.',
            'Stay focused on your business while we handle back-office execution.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  if (!useTemplatePages) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'Payroll Services', 'Automated payroll processing with clean data flow and accurate tax handling.', [
        {
          title: 'Payroll operations',
          bullets: [
            'Easily import data from time and attendance platforms.',
            'Specialized payroll reports and data files on demand.',
            'Galactic handles all local, state, and federal tax reporting.',
            'Maintenance of payroll deductions and garnishments.',
            'Seamlessly integrated benefits deductions.',
            'Direct deposit and employee access to pay stubs and W-2s.',
          ],
        },
        {
          title: 'Tax and filing coverage',
          bullets: [
            'Multi-state tax filings and payment processing.',
            'Year-end reporting and reconciliation included.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  if (!useTemplatePages) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'HR & Compliance', 'Support across policy, compliance, and risk management.', [
        {
          title: 'Compliance support',
          bullets: [
            'Compliance with W-4, I-9, E-Verify, and state withholding forms.',
            'Guidance on FLSA, ADA, FMLA, terminations, and investigations.',
            'HIPAA and COBRA administration support.',
            'EPLI coverage coordination and compliance resources.',
            'WOTC tax credits for applicable new hires.',
          ],
        },
        {
          title: 'Risk management',
          bullets: [
            'Clear documentation practices and policy templates.',
            'Support for investigations and corrective action workflows.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  pages.push({
    ...addTextPage(pdf, font, fontBold, logo, orientation, 'Benefits Administration', 'Enrollment support and ongoing plan management.', [
      {
        title: 'Benefits operations',
        bullets: [
          'Eligibility notifications and enrollment workflows.',
          'Premium payments, reconciliation, and carrier coordination.',
          'Section 125 cafeteria plan administration.',
          'Easy enrollment on any device with clear plan comparisons.',
          'Alerts for missing information to speed completion.',
        ],
      },
      {
        title: 'Employee experience',
        bullets: [
          'Self-service tools for plan comparisons and elections.',
          'Clear communication throughout open enrollment.',
        ],
      },
    ]),
    includeFooter: true,
  });

  if (data.services.health) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'Health Plans', 'Nationwide plan options with a guided enrollment experience.', [
        {
          title: 'Health coverage',
          bullets: [
            'Nationwide coverage options for medical, dental, and vision.',
            'Crystal-clear plan comparisons for employees.',
            'Support for claims questions and carrier coordination.',
            'Eligibility tracking and automated communications.',
          ],
        },
        {
          title: 'Enrollment support',
          bullets: [
            'Guided enrollment flows that reduce confusion.',
            'Ongoing carrier connection support.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  if (data.services.retirement401k) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, '401(k) Retirement Plan', 'Flexible plan design with reduced administrative burden.', [
        {
          title: 'Retirement support',
          bullets: [
            'No annual audit required for eligible plans.',
            'Cost savings on investments and streamlined administration.',
            'Customizable plan design: eligibility, match, and vesting.',
            'Support for safe harbor, Roth, and profit sharing options.',
          ],
        },
        {
          title: 'Participant experience',
          bullets: [
            'Education resources for plan participants.',
            'Simplified rollovers and plan changes.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  if (data.services.supplemental) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'Supplemental Benefits', 'Add-on benefits that elevate the employee experience.', [
        {
          title: 'Coverage options',
          bullets: [
            'Life, disability, and accident coverage options.',
            'Easy enrollment and payroll deduction integration.',
            'Carrier support and participant education resources.',
          ],
        },
        {
          title: 'Enrollment support',
          bullets: [
            'Streamlined enrollment workflows for add-on plans.',
            'Clear communications during open enrollment.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  pages.push({
    ...addTextPage(pdf, font, fontBold, logo, orientation, 'Electronic Onboarding', 'Paperless onboarding and role-based workflows.', [
      {
        title: 'Onboarding experience',
        bullets: [
          'Paperless I-9, W-4, and state tax packets.',
          'Custom onboarding workflows for new hires and internal moves.',
          'Secure document storage with audit-ready trails.',
          'Employees access forms, policies, and videos anytime.',
        ],
      },
      {
        title: 'Self-service readiness',
        bullets: [
          'Employees complete tasks on their own time.',
          'Audit-ready compliance documentation.',
        ],
      },
    ]),
    includeFooter: true,
  });

  pages.push({
    ...addTextPage(pdf, font, fontBold, logo, orientation, 'Employee Portal', '24/7 employee access across devices.', [
      {
        title: 'Portal features',
        bullets: [
          'Responsive portal works on mobile, tablet, and desktop.',
          'Employees can access pay stubs, W-2s, and benefits info.',
          'Managers approve time off and requests on the go.',
          'Multi-factor authentication for secure access.',
        ],
      },
      {
        title: 'Manager tools',
        bullets: [
          'Quick approvals for time-off and exceptions.',
          'Audit trails for sensitive updates.',
        ],
      },
    ]),
    includeFooter: true,
  });

  const selectedServices = data.selectedServices.length ? data.selectedServices : [];
  const timekeepingKeywords = ['Swipeclock', 'Physical Timeclocks', 'Workforce Management', 'Time & Attendance'];
  const hasWorkforceManagement = selectedServices.includes('Workforce Management');
  const hasSwipeclock = selectedServices.includes('Swipeclock');
  const hasPhysicalTimeclocks = selectedServices.includes('Physical Timeclocks');
  if (selectedServices.some((service) => timekeepingKeywords.includes(service))) {
    const timekeepingSections = [
      {
        title: 'Timekeeping tools',
        bullets: [
          'Intelligent clock technology reduces missed punches and errors.',
          'Clock lockout limits early clock-ins and unplanned overtime.',
          'Manager dashboards show real-time timecards.',
          'Configurable pay rules and compliance requirements.',
        ],
      },
      {
        title: 'Operational impact',
        bullets: [
          'Reduce unplanned overtime and exceptions.',
          'Cleaner data feeds into payroll processing.',
        ],
      },
    ];
    if (hasWorkforceManagement) {
      timekeepingSections.push({
        title: 'Workforce Management',
        bullets: [
          'Optimize schedules with budgeted vs actual views.',
          'Overtime alerts before thresholds are hit.',
          'Labor planning with role-based visibility.',
        ],
      });
    }
    if (hasSwipeclock) {
      timekeepingSections.push({
        title: 'Swipeclock',
        bullets: [
          'Mobile punches with location controls.',
          'Real-time timecard visibility for managers.',
          'Integrations keep payroll accurate and on time.',
        ],
      });
    }
    if (hasPhysicalTimeclocks) {
      timekeepingSections.push({
        title: 'Physical Timeclocks',
        bullets: [
          'On-site timeclock hardware options.',
          'Restrict early clock-ins with lockouts.',
          'Reduce manual corrections and missed punches.',
        ],
      });
    }
    pages.push({
      ...addTextPage(
        pdf,
        font,
        fontBold,
        logo,
        orientation,
        'Time & Attendance',
        'Smarter clocks, overtime controls, and payroll-ready exports.',
        timekeepingSections,
      ),
      includeFooter: true,
    });
  }

  const addOnPages = [
    {
      label: 'PTO',
      title: 'PTO Management',
      subtitle: 'Simplify time-off requests and approvals.',
      bullets: [
        'Employee self-service PTO requests and balances.',
        'Manager approval workflows and audit trails.',
        'Custom accrual rules by role or tenure.',
      ],
    },
    {
      label: 'Applicant Tracking',
      title: 'Applicant Tracking',
      subtitle: 'Move candidates from application to offer faster.',
      bullets: [
        'Centralized requisitions and candidate pipeline.',
        'Interview scheduling and scorecards.',
        'Offer letter templates and approval workflows.',
      ],
    },
    {
      label: 'Benefits Administration',
      title: 'Benefits Administration Add-On',
      subtitle: 'Enhanced enrollment and ongoing benefits support.',
      bullets: [
        'Eligibility tracking and enrollment campaigns.',
        'Plan comparison tools for employees.',
        'Carrier connections and reconciliation support.',
      ],
    },
  ];

  addOnPages.forEach((page) => {
    if (!selectedServices.includes(page.label)) return;
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, page.title, page.subtitle, [
        {
          title: 'Service highlights',
          bullets: page.bullets,
        },
        {
          title: 'Operational impact',
          bullets: [
            'Improves visibility and accountability for managers.',
            'Keeps teams aligned with policy and budget.',
          ],
        },
      ]),
      includeFooter: true,
    });
  });

  pages.push({
    ...addTextPage(pdf, font, fontBold, logo, orientation, 'Reporting & Analytics', 'Advanced reporting with Data Retriever.', [
      {
        title: 'Analytics tools',
        bullets: [
          'Easy dashboard for building custom reports quickly.',
          'Export data to Excel or schedule delivery.',
          'Audit-friendly histories on key data fields.',
        ],
      },
      {
        title: 'Delivery options',
        bullets: [
          'Scheduled exports for finance or leadership.',
          'Saved templates for recurring reports.',
        ],
      },
    ]),
    includeFooter: true,
  });

  if (selectedServices.includes('WOTC')) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'WOTC Tax Credits', 'Maximize available tax credits for eligible new hires.', [
        {
          title: 'WOTC support',
          bullets: [
            'Identify eligible hires quickly.',
            'Automated workflows for documentation and filing.',
            'Reporting visibility for program performance.',
          ],
        },
        {
          title: 'Program management',
          bullets: [
            'Centralized tracking and compliance reminders.',
            'Clear reporting on credits captured.',
          ],
        },
      ]),
      includeFooter: true,
    });
  }

  const adminMonthly = data.adminFeeMonthly ?? data.estimatedMonthlyAdminCost;
  const adminAnnual = data.adminFeeAnnual ?? adminMonthly * 12;
  const wcAnnual = data.wcSellingAnnual ?? data.estimatedWCPremium;
  const wcMonthly = wcAnnual / 12;
  const timekeepingMonthly = data.timekeepingFeeMonthly ?? 0;
  const timekeepingAnnual = data.timekeepingFeeAnnual ?? timekeepingMonthly * 12;
  const addonRows = (data.addons ?? []).filter((addon) => addon.monthly > 0 || addon.annual > 0);
  const addonMonthlyTotal = addonRows.reduce((sum, row) => sum + row.monthly, 0);
  const addonAnnualTotal = addonRows.reduce((sum, row) => sum + row.annual, 0);
  const totalEstimatedMonthly =
    adminMonthly +
    (data.estimatedSUTA / 12) +
    wcMonthly +
    timekeepingMonthly +
    addonMonthlyTotal;
  const totalCostPerEmployee = data.employeeCount ? totalEstimatedMonthly / data.employeeCount : 0;
  const setupFees = data.setupFees ?? 0;
  const otherFees = data.otherFees ?? [];
  const totalOtherFees = otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);

  const costTable: TableSpec = {
    headers: ['Item', 'Monthly', 'Annual'],
    rows: [
      ['Admin Fee', `$${adminMonthly.toFixed(2)}`, `$${adminAnnual.toFixed(2)}`],
      ...(timekeepingMonthly
        ? [['Timekeeping Fee', `$${timekeepingMonthly.toFixed(2)}`, `$${timekeepingAnnual.toFixed(2)}`]]
        : []),
      ['Estimated SUTA', `$${(data.estimatedSUTA / 12).toFixed(2)}`, `$${data.estimatedSUTA.toFixed(2)}`],
      ["Workers' Compensation", `$${wcMonthly.toFixed(2)}`, `$${wcAnnual.toFixed(2)}`],
      ...addonRows.map((addon) => [addon.label, `$${addon.monthly.toFixed(2)}`, `$${addon.annual.toFixed(2)}`]),
      ...(setupFees
        ? [['Setup Fees (one-time)', '—', `$${setupFees.toFixed(2)}`]]
        : []),
      ...otherFees.map((fee) => [fee.label || 'Other Fee', '—', `$${(fee.amount || 0).toFixed(2)}`]),
      ...(totalOtherFees && otherFees.length > 1
        ? [['Other Fees Total', '—', `$${totalOtherFees.toFixed(2)}`]]
        : []),
      ['Total Estimated Cost', `$${totalEstimatedMonthly.toFixed(2)}`, `$${(totalEstimatedMonthly * 12).toFixed(2)}`],
      ['Per Employee (Monthly)', `$${totalCostPerEmployee.toFixed(2)}`, '—'],
    ],
    columnAlign: ['left', 'right', 'right'],
    columnWidths: [0.52, 0.24, 0.24],
  };

  const adminFeeLabel =
    data.adminFeeLabel ??
    (data.adminFeeMode === 'percent_of_gross'
      ? `${data.adminFeeValue ?? 0}% of gross`
      : data.adminFeeMode === 'per_check'
        ? `$${(data.adminFeeValue ?? 0).toFixed(2)} per check`
        : data.adminFeeMode === 'per_month'
          ? `$${(data.adminFeeValue ?? 0).toFixed(2)} per month`
          : '—');
  const timekeepingFeeLabel = data.timekeepingFeeLabel ?? '—';

  const sutaRows = (data.sutaByState ?? []).filter((row) => row.amount > 0);
  const useWcSelling = Boolean(data.wcSellingAnnual && data.wcSellingAnnual > 0);
  const wcRows = useWcSelling ? [] : (data.wcByState ?? []).filter((row) => row.amount > 0);

  const invoiceRows = [
    ['Admin fee', adminFeeLabel, `$${adminMonthly.toFixed(2)}`, `$${adminAnnual.toFixed(2)}`],
    ...(timekeepingMonthly
      ? [['Timekeeping fee', timekeepingFeeLabel, `$${timekeepingMonthly.toFixed(2)}`, `$${timekeepingAnnual.toFixed(2)}`]]
      : []),
    ...sutaRows.map((row) => [
      `SUTA (${row.state})`,
      `${row.rate ?? 0}%`,
      `$${(row.amount / 12).toFixed(2)}`,
      `$${row.amount.toFixed(2)}`,
    ]),
    ...(useWcSelling
      ? [
          [
            "Workers' Compensation",
            '—',
            `$${wcMonthly.toFixed(2)}`,
            `$${wcAnnual.toFixed(2)}`,
          ],
        ]
      : []),
    ...wcRows.map((row) => [
      `Workers' comp (${row.state} ${row.classCode || '—'})`,
      `${row.rate ?? 0}%`,
      `$${(row.amount / 12).toFixed(2)}`,
      `$${row.amount.toFixed(2)}`,
    ]),
    ...addonRows.map((addon) => [addon.label, '—', `$${addon.monthly.toFixed(2)}`, `$${addon.annual.toFixed(2)}`]),
  ];

  const invoiceTable: TableSpec | undefined = invoiceRows.length
    ? {
        headers: ['Item', 'Rate', 'Monthly', 'Annual'],
        rows: invoiceRows,
        columnAlign: ['left', 'left', 'right', 'right'],
        columnWidths: [0.45, 0.18, 0.185, 0.185],
      }
    : undefined;

  pages.push({
    ...addPricingPage(
      pdf,
      font,
      fontBold,
      logo,
      orientation,
      'Pricing & Taxes',
      'Annualized estimates with rate details.',
      costTable,
      invoiceTable,
      'All figures are estimates and subject to verification.',
    ),
    includeFooter: true,
  });

  const sutaTable: TableSpec | undefined = sutaRows.length
    ? {
        headers: ['State', 'Rate', 'Annual'],
        rows: sutaRows.map((row) => [row.state, `${row.rate ?? 0}%`, `$${row.amount.toFixed(2)}`]),
        columnAlign: ['left', 'left', 'right'],
        columnWidths: [0.5, 0.2, 0.3],
      }
    : undefined;
  const wcTable: TableSpec | undefined = wcRows.length
    ? {
        headers: ['State', 'WC class', 'Rate', 'Annual'],
        rows: wcRows.map((row) => [row.state, row.classCode || '—', `${row.rate ?? 0}%`, `$${row.amount.toFixed(2)}`]),
        columnAlign: ['left', 'left', 'left', 'right'],
        columnWidths: [0.32, 0.28, 0.18, 0.22],
      }
    : undefined;

  if (sutaTable || wcTable) {
    pages.push({
      ...addBreakdownPage(pdf, font, fontBold, logo, orientation, sutaTable, wcTable),
      includeFooter: true,
    });
  }

  if (data.notesForProspect) {
    pages.push({
      ...addTextPage(pdf, font, fontBold, logo, orientation, 'Proposal Notes', 'Additional context for this proposal.', [
        {
          title: 'Notes',
          bullets: [data.notesForProspect],
        },
      ]),
      includeFooter: true,
    });
  }

  const resolvedDate = data.proposalDate ?? formatOrdinalDate(new Date());

  pages.forEach((entry, idx) => {
    if (!entry.includeFooter) return;
    drawFooter(entry.page, entry.width, entry.height, font, fontBold, resolvedDate, galacticLogo, idx === 0);
  });

  const bytes = await pdf.save();
  const pdfBytes = Uint8Array.from(bytes);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}


