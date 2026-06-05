"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { ProposalSlide } from '@/lib/gf1/slide-types';
import { SlideDeckItem } from './SlideDeckItem';

type Props = {
  slides: ProposalSlide[];
  selectedSlideId: string | null;
  onSelect: (instanceId: string) => void;
  onToggleVisible: (instanceId: string) => void;
  onDuplicate: (instanceId: string) => void;
  onReorder: (reordered: ProposalSlide[]) => void;
  onEdit: (slide: ProposalSlide) => void;
  onRemove: (instanceId: string) => void;
  onExportPdf: () => Promise<void>;
  onSave: () => Promise<void>;
  saving: boolean;
  exporting: boolean;
  embedded?: boolean;
};

export function SlideDeck({
  slides,
  selectedSlideId,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onReorder,
  onEdit,
  onRemove,
  onExportPdf,
  onSave,
  saving,
  exporting,
  embedded = false,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((s) => s.instanceId === active.id);
    const newIndex = slides.findIndex((s) => s.instanceId === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    onReorder(reordered);
  };

  const isEmpty = slides.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: embedded ? 'auto' : '100%' }}>
      {/* Deck header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid #1f2937',
        }}
      >
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {slides.length} slide{slides.length !== 1 ? 's' : ''} in deck
        </span>
        {!embedded ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: saving ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                color: saving ? '#64748b' : '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Deck'}
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exporting || isEmpty}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: '1px solid #1d4ed844',
                background: exporting || isEmpty ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.18)',
                color: exporting || isEmpty ? '#475569' : '#60a5fa',
                fontSize: '12px',
                fontWeight: 600,
                cursor: exporting || isEmpty ? 'not-allowed' : 'pointer',
              }}
            >
              {exporting ? 'Exporting…' : '⬇ Export PDF'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Slide list */}
      <div style={{ flex: embedded ? 'none' : 1, overflowY: embedded ? 'visible' : 'auto' }}>
        {isEmpty ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#475569',
              gap: '8px',
              border: '2px dashed #1f2937',
              borderRadius: '10px',
            }}
          >
            <span style={{ fontSize: '32px' }}>📋</span>
            <span style={{ fontSize: '13px' }}>Add slides from the library on the left</span>
          </div>
        ) : (
          <DndContext id="slide-deck-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={slides.map((s) => s.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {slides.map((slide, i) => (
                  <SlideDeckItem
                    key={slide.instanceId}
                    slide={slide}
                    index={i}
                    selected={slide.instanceId === selectedSlideId}
                    onSelect={onSelect}
                    onToggleVisible={onToggleVisible}
                    onDuplicate={onDuplicate}
                    onEdit={onEdit}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
