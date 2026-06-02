'use client';

import { useMemo, useState } from 'react';
import {
  computeDigitDistribution,
  computeEvenOdd,
  computeStreaks,
} from '@deriv/core';

interface InsightPanelProps {
  prices: number[];
  pipSize: number;
}

export function InsightPanel({ prices, pipSize }: InsightPanelProps) {
  const [open, setOpen] = useState(false);

  // Only slice + compute when the panel is open — no CPU spent while collapsed.
  const window100 = useMemo(() => open ? prices.slice(-100) : [], [open, prices]);
  const dist   = useMemo(() => open ? computeDigitDistribution(window100, pipSize) : null, [open, window100, pipSize]);
  const evenOdd = useMemo(() => open ? computeEvenOdd(window100, pipSize) : null,         [open, window100, pipSize]);
  const streaks = useMemo(() => open ? computeStreaks(window100, pipSize) : null,          [open, window100, pipSize]);

  if (prices.length < 5) return null;

  const streakLabel = streaks && streaks.current.type !== 'none'
    ? `${streaks.current.length} ${streaks.current.type}`
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

      {open && dist && evenOdd && streaks && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Even <span className="font-semibold text-foreground">{evenOdd.evenPercent.toFixed(0)}%</span></span>
              <span>Odd <span className="font-semibold text-foreground">{evenOdd.oddPercent.toFixed(0)}%</span></span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${evenOdd.evenPercent}%` }} />
              <div className="bg-orange-500 flex-1 transition-all duration-500" />
            </div>
          </div>

          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span>🔥 <span className="font-semibold text-foreground">{dist.hotDigit}</span></span>
            <span>🧊 <span className="font-semibold text-foreground">{dist.coldDigit}</span></span>
            {streakLabel && (
              <span className="ml-auto">
                Streak: <span className="font-semibold text-foreground">{streakLabel}</span>
              </span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 leading-tight">
            Last 100 ticks · descriptive only
          </p>
        </div>
      )}
    </div>
  );
}
