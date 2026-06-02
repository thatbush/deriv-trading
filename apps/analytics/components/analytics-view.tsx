'use client';

import { useState } from 'react';
import type { ActiveSymbol, Tick } from '@deriv/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { DigitDistributionPanel } from './digit-distribution-panel';
import { EvenOddPanel } from './even-odd-panel';
import { StreaksPanel } from './streaks-panel';
import { HistoryStrip } from './history-strip';
import { useAnalytics } from '@/hooks/use-analytics';
import { Footer } from '@/components/custom/footer';

const WINDOW_OPTIONS = [
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: '1000', value: 1000 },
];

interface AnalyticsViewProps {
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  currentTick: Tick | null;
  prices: number[];
  pipSize: number;
  isLoading: boolean;
  isConnected: boolean;
}

export function AnalyticsView({
  symbols,
  activeSymbol,
  selectSymbol,
  currentTick,
  prices,
  pipSize,
  isLoading,
  isConnected,
}: AnalyticsViewProps) {
  const [windowSize, setWindowSize] = useState(500);
  const [overUnderBarrier, setOverUnderBarrier] = useState(5);

  const analytics = useAnalytics(prices, pipSize, windowSize, overUnderBarrier);

  const livePriceStr = currentTick?.quote?.toFixed(pipSize) ?? '—';
  const liveDigit = currentTick ? parseInt(currentTick.quote.toFixed(pipSize).slice(-1), 10) : null;

  return (
    <main className="flex flex-col bg-background min-h-dvh">
      <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-4 sm:py-6 flex flex-col gap-4 pb-16">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            {isLoading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              <SymbolSelector
                symbols={symbols}
                activeSymbol={activeSymbol}
                onSymbolChange={selectSymbol}
              />
            )}
          </div>

          {/* Live tick + window selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {currentTick && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">Live</span>
                <span className="font-mono text-sm font-semibold">{livePriceStr}</span>
                {liveDigit !== null && (
                  <span className={`text-lg font-black w-7 text-center ${liveDigit % 2 === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {liveDigit}
                  </span>
                )}
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sample size:</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {WINDOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setWindowSize(opt.value)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${windowSize === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Sample count + disclaimer */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <p className="text-xs text-muted-foreground">
                Based on the last <span className="font-semibold">{analytics.distribution.totalTicks.toLocaleString()}</span> ticks · updates live
                {analytics.distribution.totalTicks < windowSize && <span className="ml-1 text-amber-500">(collecting data…)</span>}
              </p>
              <span className="hidden sm:block text-muted-foreground/40">·</span>
              <p className="text-xs text-muted-foreground/60">Past outcomes do not predict future results.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">Which digit landed most?</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <DigitDistributionPanel data={analytics.distribution} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">Even or Odd?</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <EvenOddPanel
                    evenOdd={analytics.evenOdd}
                    overUnder={analytics.overUnder}
                    barrier={overUnderBarrier}
                    onBarrierChange={setOverUnderBarrier}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">What&apos;s on a run?</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <StreaksPanel data={analytics.streaks} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">Recent tick history</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <HistoryStrip history={analytics.history} />
                </CardContent>
              </Card>
            </div>

          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-2 text-center bg-background/80 backdrop-blur-sm">
        <Footer />
      </div>
    </main>
  );
}
