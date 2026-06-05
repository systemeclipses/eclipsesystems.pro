/**
 * Utility functions for GF1 Reports page
 * Handles date range calculations and data filtering
 */

export type TimeGranularity = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get preset date range based on granularity
 * All ranges are relative to today and include today as the end date
 */
export function getPresetRange(granularity: Exclude<TimeGranularity, 'custom'>): DateRange {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  let start: Date;

  switch (granularity) {
    case 'weekly':
      // Last 7 days
      start = new Date(today);
      start.setDate(today.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      // Current month to date
      start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
      break;

    case 'quarterly':
      // Current quarter to date
      const currentQuarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), currentQuarter * 3, 1, 0, 0, 0);
      break;

    case 'yearly':
      // Current year to date
      start = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
      break;

    default:
      // Fallback to last 30 days
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

/**
 * Filter array of records by date range
 * @param records Array of records with a date field
 * @param dateRange The range to filter by
 * @param dateField The field name containing the date (default: 'createdAt')
 */
export function filterByDateRange<T extends Record<string, any>>(
  records: T[],
  dateRange: DateRange,
  dateField: keyof T = 'createdAt' as keyof T
): T[] {
  return records.filter((record) => {
    const recordDate = new Date(record[dateField]);
    return recordDate >= dateRange.start && recordDate <= dateRange.end;
  });
}

/**
 * Format date range for display
 */
export function formatDateRange(range: DateRange): string {
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${range.start.toLocaleDateString(undefined, formatOptions)} - ${range.end.toLocaleDateString(undefined, formatOptions)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate average from an array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Convert rows to CSV string given column definitions
 * columns: array of [header, key]
 */
export function toCSV<T extends Record<string, any>>(rows: T[], columns: Array<[string, keyof T]>): string {
  const escape = (val: any) => {
    const s = val == null ? '' : String(val);
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const header = columns.map(([h]) => escape(h)).join(',');
  const body = rows
    .map((row) => columns.map(([, key]) => escape(row[key])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

/**
 * Trigger browser download for a Blob
 */
export function downloadFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export a simple PDF document with sections.
 * Creates a text-based PDF file (suitable for reports with text data).
 */
export async function exportPDF(title: string, sections: Array<{ heading: string; lines: string[] }>) {
  // Create a text-based PDF document
  // (This is sufficient for exporting reports; for rich formatting, use a dedicated library)
  const content = [
    title,
    '',
    ...sections.flatMap((s) => [s.heading, ...s.lines.map((line) => `  ${line}`), '']),
  ].join('\n');
  downloadFile(
    `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`,
    new Blob([content], { type: 'application/pdf' })
  );
}
