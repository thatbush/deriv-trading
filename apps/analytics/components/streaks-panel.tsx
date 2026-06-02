'use client';

import type { StreakStats } from '@deriv/core';

interface Props {
  data: StreakStats;
}

const TYPE_LABELS: Record<string, string> = {
  even: 'Even',
  odd: 'Odd',
  rise: 'Rise',
  fall: 'Fall',
  none: '—',
};

const TYPE_COLORS: Record<string, string> = {
  even: 'text-emerald-500',
  odd: 'text-orange-500',
  rise: 'text-blue-500',
  fall: 'text-pink-500',
  none: 'text-muted-foreground',
};

function StreakRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

export function StreaksPanel({ data }: Props) {
  const { current, longestEven, longestOdd, longestRise, longestFall } = data;
  const currentColor = TYPE_COLORS[current.type] ?? 'text-muted-foreground';

  return (
    <div className="flex flex-col gap-3">
      {/* Current streak */}
      <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Current streak</p>
          <p className={`text-lg font-bold ${currentColor}`}>
            {current.type !== 'none' ? TYPE_LABELS[current.type] : 'No streak'}
          </p>
        </div>
        {current.type !== 'none' && (
          <span className={`text-4xl font-black tabular-nums ${currentColor}`}>
            {current.length}
          </span>
        )}
      </div>

      {/* Longest streaks in window */}
      <p className="text-[11px] text-muted-foreground">Longest runs in this sample</p>
      <div className="divide-y divide-border">
        <StreakRow label="Even in a row" value={longestEven} color="text-emerald-500" />
        <StreakRow label="Odd in a row" value={longestOdd} color="text-orange-500" />
        <StreakRow label="Rising ticks" value={longestRise} color="text-blue-500" />
        <StreakRow label="Falling ticks" value={longestFall} color="text-pink-500" />
      </div>
    </div>
  );
}
