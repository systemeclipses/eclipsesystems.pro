"use client";

import Image from 'next/image';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { supaClient } from '@/lib/supabase/client';
import { fetchLatestLogoPublicUrl } from '@/lib/gf1/logos';

type LogoUploaderProps = {
  organizationId: string;
  currentLogoUrl: string | null;
};

function cacheSafeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.includes('/object/sign/')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

export default function LogoUploader({ organizationId, currentLogoUrl }: LogoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (previewUrl) return;
    const supabase = supaClient();
    let active = true;
    fetchLatestLogoPublicUrl(supabase, organizationId)
      .then((url) => {
        if (!active || !url) return;
        setPreviewUrl(cacheSafeUrl(url));
      })
      .catch((error) => {
        console.error('Failed to load current logo', error);
      });
    return () => {
      active = false;
    };
  }, [organizationId, previewUrl]);

  useEffect(() => {
    if (!currentLogoUrl) return;
    setPreviewUrl(cacheSafeUrl(currentLogoUrl));
  }, [currentLogoUrl]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;

      setStatus('uploading');
      setMessage(null);

      const formData = new FormData();
      formData.append('organizationId', organizationId);
      formData.append('file', file);

      let response;
      try {
        response = await fetch('/api/gf1/organizations/upload-logo', {
          method: 'POST',
          body: formData,
        });
      } catch (networkError) {
        console.error('Logo upload request failed', networkError);
        setStatus('error');
        setMessage('Upload failed. Please try again.');
        return;
      } finally {
        input.value = '';
      }

      if (!response.ok) {
        let details = 'Upload failed. Please try again.';
        try {
          const payload = await response.json();
          if (payload?.error) details = payload.error;
        } catch {
          // ignore
        }
        setStatus('error');
        setMessage(details);
        return;
      }

      const payload = (await response.json()) as { logoUrl?: string };
      if (!payload.logoUrl) {
        setStatus('error');
        setMessage('Upload succeeded but no logo URL returned.');
        return;
      }

      setPreviewUrl(cacheSafeUrl(payload.logoUrl));
      setStatus('success');
      setMessage('Logo updated. Refresh to see everywhere.');
    },
    [organizationId]
  );

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-neutral-300 p-4">
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Organization logo"
            width={80}
            height={80}
            className="h-20 w-20 rounded-lg border bg-white object-contain p-2"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
            No logo
          </div>
        )}
        <div>
          <div className="font-semibold">Logo</div>
          <p className="text-sm text-neutral-500">Upload a square PNG or SVG. Max 2MB.</p>
        </div>
      </div>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-400">
        <input
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileChange}
        />
        {status === 'uploading' ? 'Uploading...' : 'Upload logo'}
      </label>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>{message}</p>
      )}
    </div>
  );
}
