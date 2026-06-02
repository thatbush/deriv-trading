'use client';

import type { RollingHistoryEntry } from '@deriv/core';

interface Props {
  history: RollingHistoryEntry[];
}

export function HistoryStrip({ history }: Props) {
  if (history.length === 0) {
    return <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">Waiting for ticks…</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Direction row */}
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {history.map((entry, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            {entry.isRise === null ? (
              <span className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground">—</span>
            ) : (
              <span className={`text-sm ${entry.isRise ? 'text-blue-500' : 'text-pink-500'}`}>
                {entry.isRise ? '↑' : '↓'}
              </span>
            )}
            <div
              className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold
                ${entry.isEven
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                }
              `}
            >
              {entry.digit}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/30 mr-1" />Even</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-500/30 mr-1" />Odd</span>
        <span><span className="text-blue-500 mr-1">↑</span>Rise</span>
        <span><span className="text-pink-500 mr-1">↓</span>Fall</span>
      </div>
    </div>
  );
}
