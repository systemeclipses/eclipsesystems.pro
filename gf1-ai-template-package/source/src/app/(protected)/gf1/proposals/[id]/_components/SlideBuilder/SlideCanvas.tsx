"use client";

import React from 'react';
import type { ProposalSlide, SalesContext, SlideFieldValue, SlideLayoutId } from '@/lib/gf1/slide-types';
import { getLayoutEntry, getLayoutDefaults } from './layouts';
import { resolveDataWithDefaults } from '@/lib/gf1/slide-tokens';

type SlideCanvasProps = {
  slide: ProposalSlide;
  salesContext: SalesContext;
  renderMode?: 'preview' | 'export';
  deckLayoutIds?: SlideLayoutId[];
};

function MissingLayout({ layoutId }: { layoutId: string }) {
  return (
    <div
      style={{
        width: '1280px',
        height: '720px',
        background: '#fef2f2',
        color: '#7f1d1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
      }}
    >
      Unknown slide layout: <code style={{ marginLeft: 8 }}>{layoutId}</code>
    </div>
  );
}

export const SlideCanvas = React.forwardRef<HTMLDivElement, SlideCanvasProps>(function SlideCanvas(
  { slide, salesContext, renderMode, deckLayoutIds },
  ref,
) {
  const entry = getLayoutEntry(slide.layoutId);

  let body: React.ReactNode;
  if (!entry) {
    body = <MissingLayout layoutId={slide.layoutId} />;
  } else {
    const defaults = getLayoutDefaults(slide.layoutId);
    const data: Record<string, SlideFieldValue> = resolveDataWithDefaults(
      slide.data ?? {},
      defaults,
      salesContext,
    );
    const Layout = entry.Component;
    const deck = deckLayoutIds ? { layoutIds: deckLayoutIds } : undefined;
    body = <Layout data={data} ctx={salesContext} renderMode={renderMode} deck={deck} />;
  }

  return (
    <div ref={ref} style={{ width: '1280px', height: '720px' }}>
      {body}
    </div>
  );
});
