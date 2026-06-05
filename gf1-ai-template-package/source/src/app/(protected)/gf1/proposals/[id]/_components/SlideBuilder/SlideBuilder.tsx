"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProposalSlide,
  ProposalSlidesPayload,
  SalesContext,
  SlideFieldValue,
  SlideLayoutId,
} from '@/lib/gf1/slide-types';
import { SLIDES_PAYLOAD_VERSION } from '@/lib/gf1/slide-types';
import { DEFAULT_DECK_ORDER, getLayoutById } from '@/lib/gf1/slide-library';
import { SlideLibraryPanel } from './SlideLibraryPanel';
import { SlideDeck } from './SlideDeck';
import { SlideEditorModal } from './SlideEditorModal';
import { SlideCanvas } from './SlideCanvas';

type SlideBuilderProps = {
  proposalId: string;
  initialSlides: ProposalSlide[];
  salesContext: SalesContext;
  canEdit: boolean;
  onSave: (payload: ProposalSlidesPayload) => Promise<void>;
};

function buildDefaultSlides(): ProposalSlide[] {
  return DEFAULT_DECK_ORDER
    .map((id) => getLayoutById(id))
    .filter((meta): meta is NonNullable<typeof meta> => meta != null)
    .map((meta, index) => ({
      instanceId: crypto.randomUUID(),
      layoutId: meta.id,
      title: meta.title,
      data: {},
      order: index,
      visible: true,
    }));
}

export function SlideBuilder({
  proposalId,
  initialSlides,
  salesContext,
  canEdit,
  onSave,
}: SlideBuilderProps) {
  const [slides, setSlides] = useState<ProposalSlide[]>(() =>
    initialSlides.length > 0 ? initialSlides : buildDefaultSlides(),
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    () => slides[0]?.instanceId ?? null,
  );
  const [editingSlide, setEditingSlide] = useState<ProposalSlide | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.6);

  const addSlide = useCallback(
    (layoutId: SlideLayoutId) => {
      const meta = getLayoutById(layoutId);
      if (!meta) return;
      const newSlide: ProposalSlide = {
        instanceId: crypto.randomUUID(),
        layoutId,
        title: meta.title,
        data: {},
        order: slides.length,
        visible: true,
      };
      setSlides((prev) => [...prev, newSlide]);
      setSelectedSlideId(newSlide.instanceId);
    },
    [slides.length],
  );

  const removeSlide = useCallback(
    (instanceId: string) => {
      setSlides((prev) => {
        const nextSlides = prev
          .filter((s) => s.instanceId !== instanceId)
          .map((s, i) => ({ ...s, order: i }));
        if (selectedSlideId === instanceId) {
          setSelectedSlideId(nextSlides[0]?.instanceId ?? null);
        }
        return nextSlides;
      });
    },
    [selectedSlideId],
  );

  const reorderSlides = useCallback((reordered: ProposalSlide[]) => {
    setSlides(reordered);
  }, []);

  const toggleSlideVisibility = useCallback((instanceId: string) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.instanceId === instanceId ? { ...slide, visible: !slide.visible } : slide,
      ),
    );
  }, []);

  const duplicateSlide = useCallback((instanceId: string) => {
    setSlides((prev) => {
      const sourceIndex = prev.findIndex((slide) => slide.instanceId === instanceId);
      if (sourceIndex < 0) return prev;
      const source = prev[sourceIndex];
      const duplicate: ProposalSlide = {
        ...source,
        instanceId: crypto.randomUUID(),
        title: `${source.title} Copy`,
        data: { ...source.data },
      };
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, duplicate);
      const normalized = next.map((slide, index) => ({ ...slide, order: index }));
      setSelectedSlideId(duplicate.instanceId);
      return normalized;
    });
  }, []);

  const updateSlide = useCallback(
    (instanceId: string, patch: { title: string; data: Record<string, SlideFieldValue> }) => {
      setSlides((prev) =>
        prev.map((s) => (s.instanceId === instanceId ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveNotice(null);
    try {
      await onSave({ version: SLIDES_PAYLOAD_VERSION, slides });
      setSaveNotice({ type: 'success', text: 'Slide deck saved.' });
    } catch {
      setSaveNotice({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const handleExportPdf = async () => {
    if (slides.length === 0) return;
    setExporting(true);
    try {
      // The PDF is rendered server-side by headless Chromium so the output is
      // identical on every machine (no dependency on the local screen DPI, zoom,
      // or installed fonts). We POST the current in-memory slides so the export
      // reflects unsaved edits, then download the returned PDF.
      const res = await fetch(`/api/gf1/proposals/${proposalId}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: slides.filter((slide) => slide.visible) }),
      });
      if (!res.ok) {
        let detail = '';
        try {
          const data = await res.json();
          detail = data?.detail || data?.error || '';
        } catch {
          /* response was not JSON */
        }
        throw new Error(`Export failed (${res.status})${detail ? `: ${detail}` : ''}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeName =
        (salesContext.org.name || 'Proposal').replace(/[^a-z0-9\s-]/gi, '').trim() || 'Proposal';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName} Proposal Deck.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[slide-pdf] export failed', err);
      setSaveNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'PDF export failed — please try again.',
      });
      setTimeout(() => setSaveNotice(null), 12000);
    } finally {
      setExporting(false);
    }
  };

  const visibleSlides = useMemo(() => slides.filter((slide) => slide.visible), [slides]);
  const selectedSlide = useMemo(
    () => slides.find((slide) => slide.instanceId === selectedSlideId) ?? slides[0] ?? null,
    [selectedSlideId, slides],
  );

  useEffect(() => {
    if (!slides.length) {
      setSelectedSlideId(null);
      return;
    }
    if (!selectedSlideId || !slides.some((slide) => slide.instanceId === selectedSlideId)) {
      setSelectedSlideId(slides[0].instanceId);
    }
  }, [selectedSlideId, slides]);

  useEffect(() => {
    const node = previewFrameRef.current;
    if (!node) return;

    const updateScale = () => {
      const { clientWidth } = node;
      if (!clientWidth) return;
      const nextScale = Math.min(clientWidth / 1280, 1);
      setPreviewScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 420px) minmax(0, 1fr)',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* Left: Controls */}
        <div
          style={{
            border: '1px solid #1f2937',
            borderRadius: '16px',
            background: '#0b1220',
            padding: '0',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 180px)',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              padding: '16px',
              background: 'linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(11,18,32,0.94) 100%)',
              borderBottom: '1px solid rgba(148,163,184,0.12)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: saving ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                  color: saving ? '#64748b' : '#e2e8f0',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save Deck'}
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exporting || visibleSlides.length === 0}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #1d4ed844',
                  background:
                    exporting || visibleSlides.length === 0
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(59,130,246,0.18)',
                  color:
                    exporting || visibleSlides.length === 0 ? '#475569' : '#60a5fa',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: exporting || visibleSlides.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {exporting ? 'Exporting…' : 'Export Visible'}
              </button>
            </div>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {saveNotice ? (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background:
                    saveNotice.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${
                    saveNotice.type === 'success' ? '#10b981' : '#ef4444'
                  }44`,
                  color: saveNotice.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  fontSize: '12px',
                }}
              >
                {saveNotice.text}
              </div>
            ) : null}

            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 700 }}>Deck</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                  {visibleSlides.length} visible / {slides.length} total
                </div>
              </div>
              <SlideDeck
                slides={slides}
                selectedSlideId={selectedSlide?.instanceId ?? null}
                onSelect={setSelectedSlideId}
                onToggleVisible={toggleSlideVisibility}
                onDuplicate={duplicateSlide}
                onReorder={reorderSlides}
                onEdit={setEditingSlide}
                onRemove={removeSlide}
                onSave={handleSave}
                onExportPdf={handleExportPdf}
                saving={saving}
                exporting={exporting}
                embedded
              />
            </section>

            <section>
              <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>
                Library
              </div>
              <SlideLibraryPanel onAdd={canEdit ? addSlide : () => {}} embedded />
            </section>
          </div>
        </div>

        {/* Right: Preview */}
        <div
          style={{
            position: 'sticky',
            top: '24px',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, #0b1220 0%, #020617 100%)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Slide Preview
              </div>
              <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700, marginTop: '6px' }}>
                {selectedSlide?.title ?? 'No slides yet'}
              </div>
            </div>
            <div style={{ color: '#64748b', fontSize: '12px' }}>
              Proposal ID: {proposalId.slice(0, 8)}
            </div>
          </div>

          {selectedSlide ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                borderRadius: '14px',
                border: '1px solid rgba(59,130,246,0.18)',
                background:
                  'radial-gradient(circle at top, rgba(30,64,175,0.22) 0%, rgba(2,6,23,0) 42%), #020617',
                padding: '20px',
                overflow: 'hidden',
              }}
            >
              <div
                ref={previewFrameRef}
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  background: '#020617',
                }}
              >
                <div
                  style={{
                    width: '1280px',
                    height: '720px',
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    pointerEvents: 'none',
                    flexShrink: 0,
                  }}
                >
                  <SlideCanvas
                    slide={selectedSlide}
                    salesContext={salesContext}
                    renderMode="preview"
                    deckLayoutIds={slides.filter((s) => s.visible).map((s) => s.layoutId)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                borderRadius: '14px',
                border: '1px dashed rgba(148, 163, 184, 0.18)',
                color: '#64748b',
                aspectRatio: '16 / 9',
              }}
            >
              <span style={{ fontSize: '36px' }}>🪐</span>
              <div style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>Start your deck</div>
              <div style={{ fontSize: '14px', textAlign: 'center', maxWidth: '320px' }}>
                Add a cover slide or content slide from the library to begin building this proposal.
              </div>
            </div>
          )}

          {selectedSlide ? (
            <div
              style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(15,23,42,0.82)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>
                  {selectedSlide.title}
                </span>
                <span style={{ color: selectedSlide.visible ? '#64748b' : '#f59e0b', fontSize: '12px' }}>
                  {selectedSlide.visible
                    ? 'Select, reorder, duplicate, or hide slides from the control rail.'
                    : 'This slide is hidden and will stay out of the exported deck until you show it again.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlide(selectedSlide)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56,189,248,0.28)',
                  background: 'rgba(14,165,233,0.12)',
                  color: '#bae6fd',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit Selected
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {editingSlide && (
        <SlideEditorModal
          slide={editingSlide}
          salesContext={salesContext}
          proposalId={proposalId}
          deckLayoutIds={slides.filter((s) => s.visible).map((s) => s.layoutId)}
          onSave={(patch) => {
            updateSlide(editingSlide.instanceId, patch);
            setEditingSlide(null);
          }}
          onClose={() => setEditingSlide(null)}
        />
      )}
    </>
  );
}
