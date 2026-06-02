'use client';

import type { DigitDistribution } from '@deriv/core';

interface Props {
  data: DigitDistribution;
}

const DIGIT_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-purple-500',
];

export function DigitDistributionPanel({ data }: Props) {
  const maxPct = Math.max(...data.percentages, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1.5 h-28">
        {data.percentages.map((pct, digit) => (
          <div key={digit} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground font-mono">{pct.toFixed(0)}%</span>
            <div className="w-full relative flex items-end" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${DIGIT_COLORS[digit]} ${digit === data.hotDigit ? 'opacity-100' : 'opacity-70'}`}
                style={{ height: `${(pct / maxPct) * 80}px` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {data.counts.map((_, digit) => (
          <div key={digit} className="flex-1 text-center">
            <span className={`text-xs font-bold font-mono ${digit === data.hotDigit ? 'text-foreground' : digit === data.coldDigit ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
              {digit}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>
          Most frequent: <span className="font-semibold text-foreground">digit {data.hotDigit}</span>
          <span className="ml-1">— appeared {data.percentages[data.hotDigit].toFixed(1)}% of the time</span>
        </span>
        <span>
          Least frequent: <span className="font-semibold text-foreground">digit {data.coldDigit}</span>
          <span className="ml-1">— appeared {data.percentages[data.coldDigit].toFixed(1)}% of the time</span>
        </span>
      </div>
    </div>
  );
}
