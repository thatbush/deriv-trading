'use client';

import type { DigitDistribution } from '@deriv/core';

interface Props {
  data: DigitDistribution;
  circleMode?: boolean;
  liveDigit?: number | null;
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

const DIGIT_RING_COLORS = [
  'ring-violet-500',
  'ring-blue-500',
  'ring-cyan-500',
  'ring-teal-500',
  'ring-emerald-500',
  'ring-yellow-500',
  'ring-orange-500',
  'ring-red-500',
  'ring-pink-500',
  'ring-purple-500',
];

const DIGIT_TEXT_COLORS = [
  'text-violet-500',
  'text-blue-500',
  'text-cyan-500',
  'text-teal-500',
  'text-emerald-500',
  'text-yellow-500',
  'text-orange-500',
  'text-red-500',
  'text-pink-500',
  'text-purple-500',
];

function BarView({ data, liveDigit }: { data: DigitDistribution; liveDigit?: number | null }) {
  const maxPct = Math.max(...data.percentages, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1 sm:gap-1.5 h-24 sm:h-28">
        {data.percentages.map((pct, digit) => (
          <div key={digit} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">{pct.toFixed(0)}%</span>
            <div className="w-full relative flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${DIGIT_COLORS[digit]} ${
                  digit === liveDigit ? 'opacity-100 animate-pulse' : digit === data.hotDigit ? 'opacity-100' : 'opacity-60'
                }`}
                style={{ height: `${(pct / maxPct) * 72}px` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 sm:gap-1.5">
        {data.counts.map((_, digit) => (
          <div key={digit} className="flex-1 text-center">
            <span className={`text-[10px] sm:text-xs font-bold font-mono ${
              digit === liveDigit
                ? `${DIGIT_TEXT_COLORS[digit]} animate-pulse`
                : digit === data.hotDigit
                ? 'text-foreground'
                : digit === data.coldDigit
                ? 'text-muted-foreground/50'
                : 'text-muted-foreground'
            }`}>
              {digit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircleView({ data, liveDigit }: { data: DigitDistribution; liveDigit?: number | null }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {data.percentages.map((pct, digit) => {
        const isLive = digit === liveDigit;
        const isHot = digit === data.hotDigit;
        const isCold = digit === data.coldDigit;
        const size = isHot ? 'w-12 h-12 sm:w-14 sm:h-14' : isCold ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12';

        return (
          <div key={digit} className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center" style={{ height: '60px' }}>
              <div
                className={`
                  ${size} rounded-full flex items-center justify-center font-black text-white
                  transition-all duration-300
                  ${DIGIT_COLORS[digit]}
                  ${isLive ? `ring-2 ring-offset-2 ring-offset-background ${DIGIT_RING_COLORS[digit]} animate-pulse scale-110` : ''}
                  ${!isLive && isCold ? 'opacity-40' : ''}
                  ${!isLive && !isHot && !isCold ? 'opacity-70' : ''}
                `}
              >
                <span className={`${isHot ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>{digit}</span>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function DigitDistributionPanel({ data, circleMode = false, liveDigit }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {circleMode ? (
        <CircleView data={data} liveDigit={liveDigit} />
      ) : (
        <BarView data={data} liveDigit={liveDigit} />
      )}
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
