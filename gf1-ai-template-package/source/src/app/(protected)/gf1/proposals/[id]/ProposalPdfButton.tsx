"use client";

// import { useState, useTransition } from 'react';
// import { generatePdfAction } from './actions';

// NOTE: ProposalPdfButton has been disabled as the underlying generatePdfAction function
// was using incompatible API mixtures. Needs to be rebuilt.

/*
type Props = {
  proposalId: string;
};

export default function ProposalPdfButton({ proposalId }: Props) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generatePdfAction(proposalId);
        setUrl(result.url);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to generate PDF');
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? 'Generating…' : 'Generate proposal PDF'}
      </button>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="block text-xs text-indigo-600 underline">
          View latest PDF
        </a>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
*/

export default function ProposalPdfButton() {
  return null; // Disabled pending PDF generation rebuild
}
