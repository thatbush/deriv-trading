'use client';

import { useCallback, useRef } from 'react';
import { FastMarker } from '@deriv/deriv-charts';
import type { ContractMarker, MarkerPoint } from '@/lib/chart-markers';

/**
 * DOM-overlay contract markers for @deriv/deriv-charts.
 *
 * The library's native `contracts_array` (Flutter) path expects a different shape
 * than our champion-era `ContractMarker[]`, so instead of feeding that prop we draw
 * the markers ourselves with the library's `FastMarker` API (README "Marker API").
 *
 * `FastMarker` positions a DOM node by date/price: on mount it hands us
 * `{ setPosition, div }`; we call `setPosition({ epoch, price })` to place it
 * (`price: null` draws a vertical line). The library does NOT factor marker
 * width/height, so each marker type offsets itself in CSS (see contract-markers.css).
 *
 * Children of <SmartChart> render inside the chart surface, so this whole layer is
 * mounted as a child of the chart. It re-renders with the markers data (cheap —
 * a handful of small DOM nodes), which keeps the chart canvas itself untouched.
 */

interface MarkerRefApi {
  setPosition: (pos: { epoch: number | null; price: number | null }) => void;
  div: HTMLDivElement;
}

/** A single positioned marker point. */
function PointMarker({
  point,
  isProfit,
  isRunning,
}: {
  point: MarkerPoint;
  isProfit: boolean;
  isRunning: boolean;
}) {
  const apiRef = useRef<MarkerRefApi | null>(null);

  // FastMarker mount callback. Position immediately and on every data change.
  const setRef = useCallback(
    (ref: MarkerRefApi | null) => {
      apiRef.current = ref;
      if (ref) {
        ref.setPosition({
          epoch: point.epoch,
          // `quote == null` → vertical line (startTime / exitTimeCollapsed).
          price: point.quote ?? null,
        });
      }
    },
    // Re-bind whenever the placement coordinates change so the marker follows ticks.
    [point.epoch, point.quote]
  );

  const cls = [
    'bm-marker',
    `bm-marker--${point.type}`,
    `bm-marker--${point.direction ?? 'up'}`,
    isProfit ? 'bm-marker--profit' : 'bm-marker--loss',
    isRunning ? 'bm-marker--running' : 'bm-marker--settled',
  ].join(' ');

  return (
    <FastMarker markerRef={setRef} className={cls}>
      {point.type === 'contractMarker' && point.text ? (
        <span className="bm-marker__counter">{point.text}</span>
      ) : null}
      {point.type === 'profitAndLossLabel' && point.text ? (
        <span className="bm-marker__pnl">{point.text}</span>
      ) : null}
    </FastMarker>
  );
}

export function ContractMarkersLayer({
  contractsArray,
}: {
  contractsArray: ContractMarker[];
}) {
  return (
    <>
      {contractsArray.map((contract, ci) =>
        contract.markers.map((point, mi) => {
          // P&L label text isn't on the point — pull it from the contract.
          const enriched: MarkerPoint =
            point.type === 'profitAndLossLabel' && !point.text
              ? { ...point, text: contract.profitAndLossText ?? undefined }
              : point;
          return (
            <PointMarker
              key={`${ci}-${mi}-${point.type}-${point.epoch}`}
              point={enriched}
              isProfit={contract.props.isProfit}
              isRunning={contract.props.isRunning}
            />
          );
        })
      )}
    </>
  );
}
