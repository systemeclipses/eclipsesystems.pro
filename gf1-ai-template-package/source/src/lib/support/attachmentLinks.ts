const SUPPORT_BUCKET = 'support-attachments';
const PUBLIC_PATH_SEGMENT = `/storage/v1/object/public/${SUPPORT_BUCKET}/`;

export function getAttachmentPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(PUBLIC_PATH_SEGMENT);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + PUBLIC_PATH_SEGMENT.length);
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export function toAttachmentDownloadUrl(
  url: string,
  options?: { baseUrl?: string; name?: string }
) {
  const path = getAttachmentPath(url);
  if (!path) return url;
  const params = new URLSearchParams({ path });
  if (options?.name) params.set('name', options.name);
  const relative = `/api/support/attachment?${params.toString()}`;
  if (!options?.baseUrl) return relative;
  return `${options.baseUrl.replace(/\/$/, '')}${relative}`;
}
