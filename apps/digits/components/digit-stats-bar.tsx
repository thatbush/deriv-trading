'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DigitStats } from '../lib/types';

interface DigitStatsBarProps {
  digitStats: DigitStats;
  selectedDigit: number;
  onDigitSelect: (digit: number) => void;
  currentDigit?: number | null;
}

export function DigitStatsBar({
  digitStats,
  selectedDigit,
  onDigitSelect,
  currentDigit,
}: DigitStatsBarProps) {
  const maxPct = Math.max(...digitStats.percentages);
  const minPct = Math.min(...digitStats.percentages);

  return (
    <div className="h-full flex flex-col min-h-0">
      <span className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
        Last digit prediction
      </span>
      <div className="flex-1 flex items-center min-h-0">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 place-items-center w-full pt-2">
        {digitStats.percentages.map((pct, digit) => {
          const isSelected = digit === selectedDigit;
          const isHighest = digitStats.totalTicks > 0 && pct === maxPct;
          const isLowest = digitStats.totalTicks > 0 && pct === minPct;

          const isCurrent = digit === currentDigit;

          return (
            <div key={digit} className="flex flex-col items-center gap-1 sm:gap-1.5">
              <div className="relative">
                {isCurrent && (
                  <>
                    {/* Glow behind diamond */}
                    <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 rounded-[2px] bg-primary/30 blur-[3px] z-0" />
                    {/* Diamond pip */}
                    <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-primary shadow-[0_0_6px_1px_rgb(var(--primary)/0.5)] rounded-[2px] z-10" />
                  </>
                )}
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onDigitSelect(digit)}
                  className={cn(
                    'w-11 h-11 sm:w-14 sm:h-14 text-base sm:text-xl font-semibold rounded-lg p-0 transition-all duration-150',
                    !isSelected && 'bg-muted/50 border-muted-foreground/20',
                    isCurrent && !isSelected && 'border-primary/70 bg-primary/10 text-primary ring-1 ring-primary/30 ring-offset-1 ring-offset-background',
                    isCurrent && isSelected && 'shadow-[0_0_12px_2px_rgb(var(--primary)/0.35)]',
                  )}
                >
                  {digit}
                </Button>
              </div>
              <span
                className={cn(
                  'text-xs font-mono',
                  isHighest && 'text-green-500 font-semibold',
                  isLowest && 'text-red-500 font-semibold',
                  !isHighest && !isLowest && 'text-muted-foreground'
                )}
              >
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
