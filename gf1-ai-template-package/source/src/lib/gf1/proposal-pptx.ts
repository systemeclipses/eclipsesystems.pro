"use client";

import type { ProposalPptxPayload } from './proposal-pptx-types';

const PPTX_ENDPOINT = '/api/gf1/proposals/generate-pptx';

export type { ProposalPptxPayload } from './proposal-pptx-types';

export async function generateProposalPPTX(data: ProposalPptxPayload): Promise<Blob> {
  const res = await fetch(PPTX_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let message = 'Failed to generate presentation.';
    try {
      const details = await res.json();
      if (details?.error) {
        message = details.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return await res.blob();
}
