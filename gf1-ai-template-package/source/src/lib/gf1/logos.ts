import type { SupabaseClient } from '@supabase/supabase-js';

export const LOGO_BUCKET = 'organization_logos';
const ROOT_PREFIX = 'organizations';
const LEGACY_PREFIX = 'logos';

function isMissingFolderError(error: unknown) {
  return typeof error === 'object' && error !== null && 'statusCode' in error && (error as any).statusCode === 404;
}

type StorageFile = { name: string; created_at?: string };

async function listFolder(
  supabase: SupabaseClient,
  path: string
): Promise<StorageFile[] | null> {
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).list(path, {
    limit: 50,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    if (!isMissingFolderError(error)) {
      console.error(`Failed to list storage folder "${path}"`, error);
    }
    return null;
  }

  return data ?? [];
}

export async function buildAccessibleLogoUrl(supabase: SupabaseClient, path: string) {
  const { data: signedData, error: signedError } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }
  if (signedError) {
    console.warn('Falling back to public URL for logo', { path, error: signedError });
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  if (data?.publicUrl) return data.publicUrl;
  return null;
}

function sortNewest(files: StorageFile[]) {
  return [...files].sort((a, b) => {
    const aTime = new Date(a.created_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? 0).getTime();
    return bTime - aTime;
  });
}

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].some((ext) => lower.endsWith(ext));
}

export async function fetchLatestLogoPublicUrl(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string | null> {
  if (!organizationId) return null;

  const nestedPath = `${ROOT_PREFIX}/${organizationId}`;
  const nestedFiles = await listFolder(supabase, nestedPath);
  if (nestedFiles && nestedFiles.length > 0) {
    const latest = sortNewest(nestedFiles).find((f) => isImageFile(f.name));
    if (latest) {
      return buildAccessibleLogoUrl(supabase, `${nestedPath}/${latest.name}`);
    }
  }

  const legacyFiles = await listFolder(supabase, LEGACY_PREFIX);
  if (legacyFiles && legacyFiles.length > 0) {
    const matches = sortNewest(legacyFiles).filter((file) => file.name?.startsWith(`${organizationId}-`) && isImageFile(file.name));
    if (matches.length) {
      return buildAccessibleLogoUrl(supabase, `${LEGACY_PREFIX}/${matches[0].name}`);
    }
  }

  const rootFiles = await listFolder(supabase, '');
  if (rootFiles && rootFiles.length > 0) {
    const matches = sortNewest(rootFiles).filter((file) => file.name?.startsWith(`${organizationId}-`) && isImageFile(file.name));
    if (matches.length) {
      return buildAccessibleLogoUrl(supabase, matches[0].name);
    }
  }

  return null;
}

export function shouldRefreshLogoUrl(currentUrl: string | null) {
  if (!currentUrl) return true;
  if (!currentUrl.includes(LOGO_BUCKET)) return false;
  return currentUrl.includes('/object/public/') || currentUrl.includes('/object/sign/');
}
