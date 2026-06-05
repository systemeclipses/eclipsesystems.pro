import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type DealLossPdfData = {
  organizationName: string;
  date: string;
  previousStatus: string;
  primaryReason: string;
  competitorName: string | null;
  returnProbability: string;
  whatCouldImprove: string | null;
  additionalNotes: string | null;
};

const DARK = rgb(10 / 255, 15 / 255, 26 / 255);
const RED = rgb(220 / 255, 38 / 255, 38 / 255);
const BLUE = rgb(0 / 255, 87 / 255, 145 / 255);
const YELLOW = rgb(255 / 255, 209 / 255, 6 / 255);
const WHITE = rgb(1, 1, 1);
const LIGHT_TEXT = rgb(0.55, 0.6, 0.68);
const BODY_TEXT = rgb(0.12, 0.17, 0.27);
const DIVIDER = rgb(0.88, 0.9, 0.93);

function toWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '>')
    .replace(/\u2190/g, '<')
    .replace(/[^\x00-\xFF]/g, '?');
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  text = toWinAnsi(text);
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateDealLossPdf(data: DealLossPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Header background
  page.drawRectangle({ x: 0, y: height - 115, width, height: 115, color: DARK });

  // Red accent bar at bottom of header
  page.drawRectangle({ x: 0, y: height - 118, width, height: 3, color: RED });

  // "DEAL LOSS ANALYSIS" title
  page.drawText('DEAL LOSS ANALYSIS', {
    x: 40,
    y: height - 46,
    size: 22,
    font: fontBold,
    color: WHITE,
  });

  // Org name
  page.drawText(toWinAnsi(data.organizationName), {
    x: 40,
    y: height - 70,
    size: 13,
    font: fontRegular,
    color: rgb(0.65, 0.72, 0.82),
  });

  // Previous status pill label
  const statusLabel = `${data.previousStatus.charAt(0).toUpperCase() + data.previousStatus.slice(1)} > Suspect`;
  page.drawText(statusLabel, {
    x: 40,
    y: height - 90,
    size: 10,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.62),
  });

  // Date top-right
  const dateLabel = 'Report Date: ';
  const labelW = fontRegular.widthOfTextAtSize(dateLabel, 10);
  const dateW = fontBold.widthOfTextAtSize(data.date, 10);
  page.drawText(dateLabel, {
    x: width - 40 - labelW - dateW,
    y: height - 46,
    size: 10,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.62),
  });
  page.drawText(data.date, {
    x: width - 40 - dateW,
    y: height - 46,
    size: 10,
    font: fontBold,
    color: YELLOW,
  });

  // Body
  const leftMargin = 40;
  const rightMargin = 40;
  const contentWidth = width - leftMargin - rightMargin;
  let y = height - 155;

  const questions: { label: string; value: string }[] = [
    { label: 'Primary Reason for Loss', value: data.primaryReason },
    ...(data.competitorName ? [{ label: 'Competitor', value: data.competitorName }] : []),
    { label: 'Probability of Return', value: data.returnProbability },
    { label: 'What Could Galactic Have Done Differently?', value: data.whatCouldImprove || 'Not provided' },
    { label: 'Additional Notes', value: data.additionalNotes || 'None' },
  ];

  for (const q of questions) {
    // Section label
    page.drawText(q.label.toUpperCase(), {
      x: leftMargin,
      y,
      size: 8,
      font: fontBold,
      color: LIGHT_TEXT,
    });
    y -= 18;

    // Answer (wrapped)
    const answerLines = wrapText(q.value, fontRegular, 12, contentWidth);
    for (const line of answerLines) {
      page.drawText(line, {
        x: leftMargin,
        y,
        size: 12,
        font: fontRegular,
        color: BODY_TEXT,
      });
      y -= 18;
    }
    y -= 10;

    // Divider
    page.drawLine({
      start: { x: leftMargin, y },
      end: { x: width - rightMargin, y },
      thickness: 0.5,
      color: DIVIDER,
    });
    y -= 24;

    if (y < 80) break;
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 45, color: DARK });
  page.drawLine({
    start: { x: 0, y: 45 },
    end: { x: width, y: 45 },
    thickness: 1,
    color: RED,
  });
  page.drawText('Confidential — Galactic Employer Services', {
    x: leftMargin,
    y: 16,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.52),
  });
  const footerRight = 'galactic365.com';
  page.drawText(footerRight, {
    x: width - rightMargin - fontBold.widthOfTextAtSize(footerRight, 9),
    y: 16,
    size: 9,
    font: fontBold,
    color: BLUE,
  });

  return doc.save();
}
