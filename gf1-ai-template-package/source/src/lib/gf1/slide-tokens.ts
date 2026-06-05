import type { SalesContext, SlideFieldValue } from './slide-types';

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function lookupPath(ctx: SalesContext, path: string): string {
  const parts = path.split('.');
  let cursor: unknown = ctx;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return '';
    }
  }
  if (cursor == null) return '';
  if (typeof cursor === 'number') return String(cursor);
  if (typeof cursor === 'boolean') return cursor ? 'Yes' : 'No';
  if (typeof cursor === 'string') return cursor;
  return '';
}

export function resolveTokensInString(value: string, ctx: SalesContext): string {
  if (!value) return value;
  return value.replace(TOKEN_RE, (_match, path) => lookupPath(ctx, String(path)));
}

export function resolveFieldValue(value: SlideFieldValue, ctx: SalesContext): SlideFieldValue {
  if (Array.isArray(value)) return value.map((item) => resolveTokensInString(item, ctx));
  return resolveTokensInString(value, ctx);
}

export function resolveDataWithDefaults(
  data: Record<string, SlideFieldValue>,
  defaults: Record<string, SlideFieldValue>,
  ctx: SalesContext,
): Record<string, SlideFieldValue> {
  const result: Record<string, SlideFieldValue> = {};
  const keys = new Set([...Object.keys(defaults), ...Object.keys(data)]);
  for (const key of keys) {
    const userVal = data[key];
    const def = defaults[key];
    // `undefined` means the user has never touched this field — use the layout
    // default. Anything else (including empty string / empty array) is treated
    // as the user's explicit intent so they can clear a field to collapse it
    // out of the layout. The editor input still lets them refill it.
    if (userVal !== undefined) {
      result[key] = resolveFieldValue(userVal, ctx);
    } else if (def !== undefined) {
      result[key] = resolveFieldValue(def, ctx);
    } else {
      result[key] = '';
    }
  }
  return result;
}

export function asString(v: SlideFieldValue | undefined): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(' ');
  return v;
}

export function asList(v: SlideFieldValue | undefined): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((s) => s.trim().length > 0);
  return v
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const CHECKLIST_DISABLED_PREFIX = '[off] ';

export function isChecklistDisabled(item: string): boolean {
  return item.startsWith(CHECKLIST_DISABLED_PREFIX);
}

export function stripChecklistPrefix(item: string): string {
  return isChecklistDisabled(item) ? item.slice(CHECKLIST_DISABLED_PREFIX.length) : item;
}

export function asChecklist(v: SlideFieldValue | undefined): string[] {
  return asList(v)
    .filter((s) => !isChecklistDisabled(s))
    .map(stripChecklistPrefix);
}
