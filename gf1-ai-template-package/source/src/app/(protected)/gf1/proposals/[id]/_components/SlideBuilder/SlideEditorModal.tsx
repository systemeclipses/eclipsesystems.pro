"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ProposalSlide,
  SalesContext,
  SlideFieldDef,
  SlideFieldValue,
  SlideLayoutId,
} from '@/lib/gf1/slide-types';
import {
  CHECKLIST_DISABLED_PREFIX,
  isChecklistDisabled,
  stripChecklistPrefix,
} from '@/lib/gf1/slide-tokens';
import { getLayoutEntry } from './layouts';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  slide: ProposalSlide;
  salesContext: SalesContext;
  proposalId: string;
  deckLayoutIds?: SlideLayoutId[];
  onSave: (patch: { title: string; data: Record<string, SlideFieldValue> }) => void;
  onClose: () => void;
};

function listToText(list: string[]): string {
  return list.join('\n');
}

function textToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const IMAGE_FIELD_DELETED = '__deleted__';

function ImageField({
  value,
  placeholder,
  baseInputStyle,
  proposalId,
  onChange,
}: {
  value: string;
  placeholder: string;
  baseInputStyle: React.CSSProperties;
  proposalId: string;
  onChange: (next: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const isDeleted = value === IMAGE_FIELD_DELETED;
  const displayValue = isDeleted ? '' : value;

  const handlePick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('proposalId', proposalId);
      const res = await fetch('/api/gf1/proposals/upload-slide-image', {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Upload failed');
      }
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setDragging(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragging(false);
    }
  };
  const handleDrop = async (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        borderRadius: '8px',
        border: dragging ? '2px dashed #60a5fa' : '2px dashed transparent',
        background: dragging ? 'rgba(59,130,246,0.08)' : 'transparent',
        padding: dragging ? '6px' : '0',
        transition: 'background 0.15s ease, padding 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
        <input
          value={displayValue}
          placeholder={placeholder || 'https://… • drop image here • or Upload'}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...baseInputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          style={{
            padding: '0 12px',
            borderRadius: '6px',
            border: '1px solid #1d4ed8',
            background: 'rgba(59,130,246,0.18)',
            color: '#93c5fd',
            fontSize: '12px',
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        {value && !isDeleted ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(IMAGE_FIELD_DELETED);
            }}
            style={{
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid #7f1d1d',
              background: 'rgba(220,38,38,0.18)',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Delete
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
      {dragging ? (
        <div
          style={{
            color: '#93c5fd',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'center',
            padding: '4px 0',
          }}
        >
          Drop image to upload
        </div>
      ) : null}
      {value && !isDeleted ? (
        <div
          style={{
            border: '1px solid #1f2937',
            borderRadius: '6px',
            padding: '6px',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', margin: '0 auto' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null}
      {error ? (
        <div style={{ color: '#f87171', fontSize: '11px' }}>{error}</div>
      ) : null}
    </div>
  );
}

function splitTitleSubtitle(raw: string): { title: string; subtitle: string } {
  const [head, ...rest] = raw.split(':');
  return { title: head.trim(), subtitle: rest.join(':').trim() };
}

function joinTitleSubtitle(title: string, subtitle: string): string {
  const t = title.trim();
  const s = subtitle.trim();
  if (!s) return t;
  return `${t} : ${s}`;
}

function ChecklistField({
  items,
  baseInputStyle,
  subtitled,
  onChange,
}: {
  items: string[];
  baseInputStyle: React.CSSProperties;
  subtitled: boolean;
  onChange: (next: string[]) => void;
}) {
  const update = (idx: number, next: string) => {
    onChange(items.map((it, i) => (i === idx ? next : it)));
  };
  const toggle = (idx: number) => {
    const item = items[idx];
    const next = isChecklistDisabled(item)
      ? stripChecklistPrefix(item)
      : `${CHECKLIST_DISABLED_PREFIX}${item}`;
    update(idx, next);
  };
  const remove = (idx: number) => {
    const item = items[idx];
    // Two-click delete for checklists: first click hides (adds [off] prefix),
    // second click (on an already-hidden item) actually removes. This avoids
    // the pitfall where clearing every item empties the array, causing the
    // defaults resolver to repopulate the full list on the next render.
    if (isChecklistDisabled(item)) {
      onChange(items.filter((_, i) => i !== idx));
    } else {
      onChange(items.map((it, i) => (i === idx ? `${CHECKLIST_DISABLED_PREFIX}${it}` : it)));
    }
  };
  const add = () => {
    onChange([...items, '']);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((raw, idx) => {
        const disabled = isChecklistDisabled(raw);
        const text = stripChecklistPrefix(raw);
        const { title, subtitle } = splitTitleSubtitle(text);
        const writeBack = (nextText: string) => {
          update(idx, disabled ? `${CHECKLIST_DISABLED_PREFIX}${nextText}` : nextText);
        };
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
            <button
              type="button"
              onClick={() => toggle(idx)}
              title={disabled ? 'Include on slide' : 'Hide from slide'}
              style={{
                width: '30px',
                flexShrink: 0,
                borderRadius: '6px',
                border: `1px solid ${disabled ? '#334155' : '#1d4ed8'}`,
                background: disabled ? 'transparent' : 'rgba(59,130,246,0.25)',
                color: disabled ? '#475569' : '#93c5fd',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {disabled ? '' : '✓'}
            </button>
            {subtitled ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  value={title}
                  placeholder="Title"
                  onChange={(e) => writeBack(joinTitleSubtitle(e.target.value, subtitle))}
                  style={{
                    ...baseInputStyle,
                    fontWeight: 600,
                    opacity: disabled ? 0.5 : 1,
                    textDecoration: disabled ? 'line-through' : 'none',
                  }}
                />
                <input
                  value={subtitle}
                  placeholder="Subtitle / description"
                  onChange={(e) => writeBack(joinTitleSubtitle(title, e.target.value))}
                  style={{
                    ...baseInputStyle,
                    fontSize: '12px',
                    color: '#94a3b8',
                    opacity: disabled ? 0.5 : 1,
                    textDecoration: disabled ? 'line-through' : 'none',
                  }}
                />
              </div>
            ) : (
              <input
                value={text}
                onChange={(e) => writeBack(e.target.value)}
                style={{
                  ...baseInputStyle,
                  flex: 1,
                  opacity: disabled ? 0.5 : 1,
                  textDecoration: disabled ? 'line-through' : 'none',
                }}
              />
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              title={disabled ? 'Click again to delete item' : 'Hide item (click again to delete)'}
              style={{
                width: '30px',
                flexShrink: 0,
                borderRadius: '6px',
                border: '1px solid #7f1d1d',
                background: 'rgba(220,38,38,0.18)',
                color: '#fca5a5',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px dashed #334155',
          background: 'transparent',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add item
      </button>
    </div>
  );
}

function PricingRowsField({
  items,
  autoFillRows,
  baseInputStyle,
  onChange,
}: {
  items: string[];
  autoFillRows: string[];
  baseInputStyle: React.CSSProperties;
  onChange: (next: string[]) => void;
}) {
  const COLS: Array<{ key: 'state' | 'wcCode' | 'wcRate' | 'suta'; label: string; placeholder: string; flex: number }> = [
    { key: 'state', label: 'State', placeholder: 'CA', flex: 1 },
    { key: 'wcCode', label: 'WC Class Code', placeholder: '8810', flex: 1.4 },
    { key: 'wcRate', label: 'WC Rate %', placeholder: '2.50', flex: 1 },
    { key: 'suta', label: 'SUTA Rate %', placeholder: '0.95', flex: 1 },
  ];

  const parseRow = (raw: string): { state: string; wcCode: string; wcRate: string; suta: string } => {
    const parts = raw.split('|').map((p) => p.trim());
    return {
      state: parts[0] ?? '',
      wcCode: parts[1] ?? '',
      wcRate: parts[2] ?? '',
      suta: parts[3] ?? '',
    };
  };

  const stringifyRow = (cells: { state: string; wcCode: string; wcRate: string; suta: string }): string =>
    [cells.state, cells.wcCode, cells.wcRate, cells.suta].map((c) => c.trim()).join(' | ');

  // When the user has not entered any custom rows yet, show the proposal's
  // existing state pricing pre-populated so they can edit in place. Any edit
  // materializes those auto rows into actual saved items.
  const usingAutoFill = items.length === 0 && autoFillRows.length > 0;
  const displayed = usingAutoFill ? autoFillRows : items;

  const baseRows = (): string[] => (usingAutoFill ? [...autoFillRows] : [...items]);

  const updateCell = (idx: number, key: 'state' | 'wcCode' | 'wcRate' | 'suta', value: string) => {
    const next = baseRows();
    const cells = parseRow(next[idx] ?? '');
    cells[key] = value;
    next[idx] = stringifyRow(cells);
    onChange(next);
  };

  const addRow = () => onChange([...baseRows(), ' |  |  | ']);
  const removeRow = (idx: number) => onChange(baseRows().filter((_, i) => i !== idx));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '6px', paddingLeft: '4px', paddingRight: '38px' }}>
        {COLS.map((col) => (
          <div
            key={col.key}
            style={{
              flex: col.flex,
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {displayed.map((raw, idx) => {
        const cells = parseRow(raw);
        return (
          <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {COLS.map((col) => (
              <input
                key={col.key}
                value={cells[col.key]}
                placeholder={col.placeholder}
                onChange={(e) => updateCell(idx, col.key, e.target.value)}
                style={{ ...baseInputStyle, flex: col.flex, padding: '6px 8px' }}
              />
            ))}
            <button
              type="button"
              onClick={() => removeRow(idx)}
              title="Remove row"
              style={{
                width: '32px',
                flexShrink: 0,
                background: 'rgba(239,68,68,0.18)',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
                padding: '6px 0',
              }}
            >
              ×
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        style={{
          alignSelf: 'flex-start',
          marginTop: '4px',
          padding: '6px 12px',
          background: 'rgba(59,130,246,0.18)',
          color: '#93c5fd',
          border: '1px solid rgba(59,130,246,0.4)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        + Add row
      </button>
      {usingAutoFill ? (
        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
          Auto-filled from proposal pricing — edit any cell to make this slide-specific.
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
          No rows. Add one to populate the table.
        </div>
      ) : null}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  proposalId,
  salesContext,
  onChange,
}: {
  field: SlideFieldDef;
  value: SlideFieldValue | undefined;
  proposalId: string;
  salesContext: SalesContext;
  onChange: (next: SlideFieldValue) => void;
}) {
  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const placeholder =
    field.placeholder ?? (field.kind === 'list'
      ? 'One item per line\u2026'
      : field.defaultValue ?? '');

  if (field.kind === 'list') {
    const text = Array.isArray(value)
      ? listToText(value)
      : typeof value === 'string'
        ? value
        : listToText(field.defaultList ?? []);
    return (
      <textarea
        value={text}
        placeholder={placeholder}
        onChange={(e) => onChange(textToList(e.target.value))}
        rows={Math.max(4, Math.min(12, (field.defaultList?.length ?? 4) + 1))}
        style={{ ...baseInputStyle, resize: 'vertical', lineHeight: 1.5 }}
      />
    );
  }

  if (field.kind === 'checklist') {
    const items = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : (field.defaultList ?? []);
    return (
      <ChecklistField
        items={items}
        baseInputStyle={baseInputStyle}
        subtitled={field.subtitled ?? false}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.kind === 'multiline') {
    const text = typeof value === 'string' ? value : (field.defaultValue ?? '');
    return (
      <textarea
        value={text}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{ ...baseInputStyle, resize: 'vertical', lineHeight: 1.5 }}
      />
    );
  }

  const text = typeof value === 'string' ? value : (field.defaultValue ?? '');

  if (field.kind === 'image_url') {
    return (
      <ImageField
        value={text}
        placeholder={placeholder}
        baseInputStyle={baseInputStyle}
        proposalId={proposalId}
        onChange={onChange}
      />
    );
  }

  if (field.kind === 'pricing_rows') {
    const rows = Array.isArray(value) ? value : [];
    const fmt = (n: number | null | undefined): string =>
      n == null || !Number.isFinite(n) ? '' : Number(n).toFixed(2);
    const autoFillRows = (salesContext.pricing.statePricings ?? []).map((sp) =>
      [sp.state ?? '', sp.wcClassCode ?? '', fmt(sp.wcSellingRate), fmt(sp.sutaRate)]
        .map((c) => c.trim())
        .join(' | '),
    );
    return (
      <PricingRowsField
        items={rows}
        autoFillRows={autoFillRows}
        baseInputStyle={baseInputStyle}
        onChange={onChange}
      />
    );
  }

  return (
    <input
      value={text}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={baseInputStyle}
    />
  );
}

export function SlideEditorModal({ slide, salesContext, proposalId, deckLayoutIds, onSave, onClose }: Props) {
  const entry = getLayoutEntry(slide.layoutId);
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localData, setLocalData] = useState<Record<string, SlideFieldValue>>(
    () => ({ ...(slide.data ?? {}) }),
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  const previewSlide = useMemo<ProposalSlide>(
    () => ({ ...slide, title: localTitle, data: localData }),
    [slide, localTitle, localData],
  );

  const setFieldValue = (key: string, next: SlideFieldValue) => {
    setLocalData((prev) => ({ ...prev, [key]: next }));
  };

  const resetField = (field: SlideFieldDef) => {
    setLocalData((prev) => {
      const next = { ...prev };
      delete next[field.key];
      return next;
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = () => {
    onSave({ title: localTitle, data: localData });
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0b1220',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          width: '94vw',
          maxWidth: '1320px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #1f2937',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Title:</span>
            <input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                maxWidth: '480px',
              }}
            />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {entry?.title ?? slide.layoutId}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '7px 20px',
                borderRadius: '7px',
                border: '1px solid #1d4ed8',
                background: 'rgba(59,130,246,0.2)',
                color: '#60a5fa',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Slide
            </button>
          </div>
        </div>

        {/* Body: form left, preview right */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
          {/* Form panel */}
          <div
            style={{
              borderRight: '1px solid #1f2937',
              overflowY: 'auto',
              padding: '16px 18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {!entry ? (
              <div style={{ color: '#fca5a5', fontSize: '13px' }}>
                Unknown layout: {slide.layoutId}
              </div>
            ) : (
              entry.fields.map((field) => {
                const v = localData[field.key];
                const hasOverride = v !== undefined;
                return (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>
                        {field.label}
                      </label>
                      {hasOverride ? (
                        <button
                          type="button"
                          onClick={() => resetField(field)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          reset
                        </button>
                      ) : null}
                    </div>
                    <FieldEditor
                      field={field}
                      value={v}
                      proposalId={proposalId}
                      salesContext={salesContext}
                      onChange={(next) => setFieldValue(field.key, next)}
                    />
                    {field.helpText ? (
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{field.helpText}</div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {/* Preview panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#060d18',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #1f2937',
                fontSize: '11px',
                color: '#64748b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Live Preview
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '16px',
                overflow: 'auto',
              }}
            >
              <div
                style={{
                  width: '850px',
                  height: '478px',
                  overflow: 'hidden',
                  borderRadius: '6px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '1280px',
                    height: '720px',
                    transform: 'scale(0.664)',
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                  }}
                >
                  <SlideCanvas slide={previewSlide} salesContext={salesContext} renderMode="preview" deckLayoutIds={deckLayoutIds} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
