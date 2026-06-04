'use client';

import type { RiseFallStats, StreakStats } from '@deriv/core';

interface Props {
  data: RiseFallStats;
  streaks: StreakStats;
}

function StatBar({ leftLabel, leftPct, rightLabel, rightPct, leftColor, rightColor }: {
  leftLabel: string; leftPct: number;
  rightLabel: string; rightPct: number;
  leftColor: string; rightColor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel} <span className="font-semibold text-foreground">{leftPct.toFixed(1)}%</span></span>
        <span>{rightLabel} <span className="font-semibold text-foreground">{rightPct.toFixed(1)}%</span></span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        <div className={`${leftColor} transition-all duration-500`} style={{ width: `${leftPct}%` }} />
        <div className={`${rightColor} flex-1 transition-all duration-500`} />
      </div>
    </div>
  );
}

export function RiseFallPanel({ data, streaks }: Props) {
  const currentIsRiseFall = streaks.current.type === 'rise' || streaks.current.type === 'fall';

  return (
    <div className="flex flex-col gap-5">
      {/* Rise / Fall split */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tick direction</span>
        <StatBar
          leftLabel="Rise"
          leftPct={data.risePercent}
          rightLabel="Fall"
          rightPct={data.fallPercent}
          leftColor="bg-emerald-500"
          rightColor="bg-red-500"
        />
        {data.flatCount > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Flat: {data.flatCount} ticks ({((data.flatCount / (data.totalTicks - 1)) * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* Avg move */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Avg move per tick</span>
        <p className="text-xl font-semibold tabular-nums">{data.avgMove.toFixed(5)}</p>
        <p className="text-[11px] text-muted-foreground">Mean absolute price change across {data.totalTicks - 1} tick transitions</p>
      </div>

      {/* Current & longest streaks */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Direction streaks</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-0.5">Longest rise</p>
            <p className="text-lg font-bold text-emerald-500">{streaks.longestRise}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[11px] text-muted-foreground mb-0.5">Longest fall</p>
            <p className="text-lg font-bold text-red-500">{streaks.longestFall}</p>
          </div>
        </div>
        {currentIsRiseFall && (
          <div className={`rounded-lg px-3 py-2 ${streaks.current.type === 'rise' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs font-semibold">
              <span className={streaks.current.type === 'rise' ? 'text-emerald-500' : 'text-red-500'}>
                {streaks.current.type === 'rise' ? '↑ Rising' : '↓ Falling'}
              </span>
              <span className="text-muted-foreground ml-1">— {streaks.current.length} ticks in a row</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
