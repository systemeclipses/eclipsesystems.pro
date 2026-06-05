"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProposalSlide } from '@/lib/gf1/slide-types';
import { CATEGORY_COLORS } from '@/lib/gf1/slide-types';
import { getLayoutEntry } from './layouts';

type Props = {
  slide: ProposalSlide;
  index: number;
  selected: boolean;
  onSelect: (instanceId: string) => void;
  onToggleVisible: (instanceId: string) => void;
  onDuplicate: (instanceId: string) => void;
  onEdit: (slide: ProposalSlide) => void;
  onRemove: (instanceId: string) => void;
};

export function SlideDeckItem({
  slide,
  index,
  selected,
  onSelect,
  onToggleVisible,
  onDuplicate,
  onEdit,
  onRemove,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const entry = getLayoutEntry(slide.layoutId);
  const category = entry?.category ?? 'standard';
  const accentColor = CATEGORY_COLORS[category] ?? '#3b82f6';

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(slide.instanceId)}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'stretch',
        gap: '10px',
        padding: '10px 12px',
        background: selected
          ? 'rgba(59,130,246,0.12)'
          : slide.visible
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(15,23,42,0.72)',
        borderStyle: 'solid',
        borderWidth: '1px 1px 1px 3px',
        borderTopColor: selected ? 'rgba(96,165,250,0.45)' : `${accentColor}33`,
        borderRightColor: selected ? 'rgba(96,165,250,0.45)' : `${accentColor}33`,
        borderBottomColor: selected ? 'rgba(96,165,250,0.45)' : `${accentColor}33`,
        borderLeftColor: accentColor,
        borderRadius: '8px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          color: '#475569',
          fontSize: '16px',
          alignSelf: 'stretch',
          minHeight: '100%',
          padding: '4px 2px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        title="Drag to reorder"
      >
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
          <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#475569' }} />
        </div>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#64748b',
          fontWeight: 600,
          minWidth: '20px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                color: slide.visible ? '#e2e8f0' : '#64748b',
                fontWeight: 500,
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {slide.title}
            </div>
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: accentColor,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {category.replace(/_/g, ' ')}
              </span>
              {!slide.visible ? (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#f59e0b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Hidden
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleVisible(slide.instanceId);
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '5px',
              border: '1px solid #334155',
              background: 'rgba(255,255,255,0.06)',
              color: slide.visible ? '#cbd5e1' : '#fbbf24',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            title={slide.visible ? 'Hide slide' : 'Show slide'}
          >
            {slide.visible ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDuplicate(slide.instanceId);
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '5px',
              border: '1px solid #334155',
              background: 'rgba(255,255,255,0.06)',
              color: '#93c5fd',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Copy
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(slide);
            }}
            style={{
              padding: '5px 12px',
              borderRadius: '5px',
              border: '1px solid #334155',
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(slide.instanceId);
              if (window.confirm(`Remove "${slide.title}" from the deck?`)) {
                onRemove(slide.instanceId);
              }
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '5px',
              border: '1px solid #7f1d1d44',
              background: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
