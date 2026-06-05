'use client';

import { useState, type ReactNode } from 'react';
import type { TimeGranularity, DateRange } from '@/lib/gf1/reports-utils';
import { getPresetRange, formatDateRange } from '@/lib/gf1/reports-utils';

interface TimeRangeFilterProps {
  onRangeChange: (granularity: TimeGranularity, range: DateRange) => void;
  // Optional right-aligned content rendered inside the same container as the
  // time-range buttons (e.g. the sales-rep dropdown). Pushed to the far right.
  rightSlot?: ReactNode;
}

export function TimeRangeFilter({ onRangeChange, rightSlot }: TimeRangeFilterProps) {
  const [activeGranularity, setActiveGranularity] = useState<TimeGranularity>('quarterly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (granularity: Exclude<TimeGranularity, 'custom'>) => {
    setActiveGranularity(granularity);
    setShowCustom(false);
    const range = getPresetRange(granularity);
    onRangeChange(granularity, range);
  };

  const handleCustomClick = () => {
    setActiveGranularity('custom');
    setShowCustom(true);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const range: DateRange = {
        start: new Date(customStart),
        end: new Date(customEnd),
      };
      onRangeChange('custom', range);
    }
  };

  const presets: Array<{ label: string; value: Exclude<TimeGranularity, 'custom'> }> = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annually', value: 'yearly' },
  ];

  return (
    <div style={{ background: '#313D4E', border: '1px solid #3d4b5e', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginRight: '8px' }}>
          Time Range:
        </label>
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeGranularity === preset.value ? '#273142' : 'rgba(255, 255, 255, 0.7)',
              background: activeGranularity === preset.value ? 'white' : 'transparent',
              border: activeGranularity === preset.value ? 'none' : '1px solid #3d4b5e',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activeGranularity !== preset.value) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeGranularity !== preset.value) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleCustomClick}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: activeGranularity === 'custom' ? '#273142' : 'rgba(255, 255, 255, 0.7)',
            background: activeGranularity === 'custom' ? 'white' : 'transparent',
            border: activeGranularity === 'custom' ? 'none' : '1px solid #3d4b5e',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activeGranularity !== 'custom') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (activeGranularity !== 'custom') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          Custom
        </button>
        {rightSlot ? (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {rightSlot}
          </div>
        ) : null}
      </div>

      {showCustom && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #3d4b5e' }}>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              color: 'white',
              background: '#273142',
              border: '1px solid #3d4b5e',
              borderRadius: '4px',
            }}
          />
          <span style={{ color: '#738297' }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              color: 'white',
              background: '#273142',
              border: '1px solid #3d4b5e',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: customStart && customEnd ? 'white' : '#738297',
              background: customStart && customEnd ? '#1C93ED' : '#313D4E',
              border: 'none',
              borderRadius: '4px',
              cursor: customStart && customEnd ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
