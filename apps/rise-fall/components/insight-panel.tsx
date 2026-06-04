'use client';

import { useMemo, useState } from 'react';
import { computeRiseFall, computeStreaks } from '@deriv/core';

interface InsightPanelProps {
  prices: number[];
  pipSize: number;
}

export function InsightPanel({ prices, pipSize }: InsightPanelProps) {
  const [open, setOpen] = useState(false);

  const window100 = useMemo(() => open ? prices.slice(-100) : [], [open, prices]);
  const riseFall  = useMemo(() => open ? computeRiseFall(window100) : null,        [open, window100]);
  const streaks   = useMemo(() => open ? computeStreaks(window100, pipSize) : null, [open, window100, pipSize]);

  if (prices.length < 5) return null;

  const currentDir = streaks?.current.type === 'rise' || streaks?.current.type === 'fall'
    ? streaks.current
    : null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-medium">Market insight</span>
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && riseFall && streaks && (
        <div className="mt-2 flex flex-col gap-2">
          {/* Rise / Fall split */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Rise <span className="font-semibold text-emerald-500">{riseFall.risePercent.toFixed(0)}%</span></span>
              <span>Fall <span className="font-semibold text-red-500">{riseFall.fallPercent.toFixed(0)}%</span></span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${riseFall.risePercent}%` }} />
              <div className="bg-red-500 flex-1 transition-all duration-500" />
            </div>
          </div>

          {/* Current direction + longest streaks */}
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            {currentDir ? (
              <span className={currentDir.type === 'rise' ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                {currentDir.type === 'rise' ? '↑ Rising' : '↓ Falling'} {currentDir.length}
              </span>
            ) : null}
            <span className="ml-auto flex gap-2">
              <span>↑<span className="font-semibold text-foreground">{streaks.longestRise}</span></span>
              <span>↓<span className="font-semibold text-foreground">{streaks.longestFall}</span></span>
              <span className="text-muted-foreground/60">longest</span>
            </span>
          </div>

          <p className="text-[10px] text-muted-foreground/70 leading-tight">
            Last 100 ticks · descriptive only
          </p>
        </div>
      )}
    </div>
  );
}
