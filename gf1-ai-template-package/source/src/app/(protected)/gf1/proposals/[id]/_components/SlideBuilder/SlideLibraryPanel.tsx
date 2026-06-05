"use client";

import { useState } from 'react';
import { SLIDE_LIBRARY_BY_CATEGORY } from '@/lib/gf1/slide-library';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ORDER } from '@/lib/gf1/slide-types';
import type { SlideCategory, SlideLayoutId } from '@/lib/gf1/slide-types';

type Props = {
  onAdd: (layoutId: SlideLayoutId) => void;
  embedded?: boolean;
};

export function SlideLibraryPanel({ onAdd, embedded = false }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<SlideCategory>>(
    new Set<SlideCategory>(['standard']),
  );

  const toggleCategory = (cat: SlideCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div
      style={{
        height: embedded ? 'auto' : '100%',
        overflowY: embedded ? 'visible' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          padding: '0 0 8px 0',
          fontSize: '11px',
          color: '#64748b',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Slide Library
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = SLIDE_LIBRARY_BY_CATEGORY[category] ?? [];
        if (items.length === 0) return null;
        const color = CATEGORY_COLORS[category];
        const label = CATEGORY_LABELS[category];
        const isOpen = openCategories.has(category);

        return (
          <div key={category}>
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${color}44`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: '2px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {label}
              </span>
              <span style={{ color: '#64748b', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ marginBottom: '6px', paddingLeft: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {items.map((meta) => (
                  <div
                    key={meta.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      background: 'transparent',
                      border: '1px solid transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {meta.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdd(meta.id)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${color}66`,
                        background: `${color}22`,
                        color,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
