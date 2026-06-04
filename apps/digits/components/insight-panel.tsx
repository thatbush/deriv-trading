'use client';

import { useMemo, useState } from 'react';
import {
  computeDigitDistribution,
  computeEvenOdd,
  computeOverUnder,
  computeMatchDiffer,
  computeStreaks,
} from '@deriv/core';

type TradeType = 'matches-differs' | 'over-under' | 'even-odd';

interface InsightPanelProps {
  prices: number[];
  pipSize: number;
  tradeType: TradeType;
  selectedDigit: number;
}

function StatBar({ leftLabel, leftPct, rightLabel, rightPct, leftColor, rightColor, highlight }: {
  leftLabel: string; leftPct: number;
  rightLabel: string; rightPct: number;
  leftColor: string; rightColor: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-md px-2 py-1.5 transition-colors ${highlight ? 'bg-muted/60' : ''}`}>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{leftLabel} <span className="font-semibold text-foreground">{leftPct.toFixed(0)}%</span></span>
        <span>{rightLabel} <span className="font-semibold text-foreground">{rightPct.toFixed(0)}%</span></span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden">
        <div className={`${leftColor} transition-all duration-500`} style={{ width: `${leftPct}%` }} />
        <div className={`${rightColor} flex-1 transition-all duration-500`} />
      </div>
    </div>
  );
}

export function InsightPanel({ prices, pipSize, tradeType, selectedDigit }: InsightPanelProps) {
  const [open, setOpen] = useState(false);
  const [barrier, setBarrier] = useState(5);

  const window100 = useMemo(() => open ? prices.slice(-100) : [], [open, prices]);
  const dist      = useMemo(() => open ? computeDigitDistribution(window100, pipSize) : null, [open, window100, pipSize]);
  const evenOdd   = useMemo(() => open ? computeEvenOdd(window100, pipSize) : null,            [open, window100, pipSize]);
  const overUnder = useMemo(() => open ? computeOverUnder(window100, pipSize, barrier) : null,  [open, window100, pipSize, barrier]);
  const matchDiff = useMemo(() => open ? computeMatchDiffer(window100, pipSize, selectedDigit) : null, [open, window100, pipSize, selectedDigit]);
  const streaks   = useMemo(() => open ? computeStreaks(window100, pipSize) : null,            [open, window100, pipSize]);

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

      {open && dist && evenOdd && overUnder && matchDiff && streaks && (
        <div className="mt-2 flex flex-col gap-1">
          <StatBar
            leftLabel={`Match ${selectedDigit}`}
            leftPct={matchDiff.matchPercent}
            rightLabel={`Differ ${selectedDigit}`}
            rightPct={matchDiff.differPercent}
            leftColor="bg-violet-500"
            rightColor="bg-zinc-400"
            highlight={tradeType === 'matches-differs'}
          />
          <StatBar
            leftLabel={`Over ${barrier}`}
            leftPct={overUnder.overPercent}
            rightLabel={`Under ${barrier}`}
            rightPct={overUnder.underPercent}
            leftColor="bg-blue-500"
            rightColor="bg-pink-500"
            highlight={tradeType === 'over-under'}
          />
          {tradeType === 'over-under' && (
            <div className="flex items-center gap-1 px-2">
              {[3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setBarrier(d)}
                  className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${barrier === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <StatBar
            leftLabel="Even"
            leftPct={evenOdd.evenPercent}
            rightLabel="Odd"
            rightPct={evenOdd.oddPercent}
            leftColor="bg-emerald-500"
            rightColor="bg-orange-500"
            highlight={tradeType === 'even-odd'}
          />

          <div className="flex gap-3 text-[11px] text-muted-foreground px-2 pt-1">
            <span>🔥 <span className="font-semibold text-foreground">{dist.hotDigit}</span></span>
            <span>🧊 <span className="font-semibold text-foreground">{dist.coldDigit}</span></span>
            {streakLabel && (
              <span className="ml-auto">streak: <span className="font-semibold text-foreground">{streakLabel}</span></span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 leading-tight px-2">
            Last 100 ticks · descriptive only
          </p>
        </div>
      )}
    </div>
  );
}
