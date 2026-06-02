'use client';

import { useState } from 'react';
import type { ActiveSymbol, Tick } from '@deriv/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { DigitDistributionPanel } from './digit-distribution-panel';
import { Grid2X2, BarChart2 } from 'lucide-react';
import { EvenOddPanel } from './even-odd-panel';
import { StreaksPanel } from './streaks-panel';
import { HistoryStrip } from './history-strip';
import { useAnalytics } from '@/hooks/use-analytics';
import { Footer } from '@/components/custom/footer';

const WINDOW_OPTIONS = [
  { label: '15', value: 15 },
  { label: '30', value: 30 },
  { label: '60', value: 60 },
  { label: '90', value: 90 },
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
  const [windowSize, setWindowSize] = useState(30);
  const [circleMode, setCircleMode] = useState(false);
  const [overUnderBarrier, setOverUnderBarrier] = useState(5);

  const analytics = useAnalytics(prices, pipSize, windowSize, overUnderBarrier);

  const livePriceStr = currentTick?.quote?.toFixed(pipSize) ?? '—';
  const liveDigit = currentTick ? parseInt(currentTick.quote.toFixed(pipSize).slice(-1), 10) : null;

  return (
    <main className="flex flex-col bg-background min-h-dvh">
      <div className="w-full max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-6 flex flex-col gap-3 sm:gap-4 pb-20">

        {/* Header row */}
        <div className="flex flex-col gap-2">
          {/* Row 1: Symbol selector + live tick */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                <SymbolSelector
                  symbols={symbols}
                  activeSymbol={activeSymbol}
                  onSymbolChange={selectSymbol}
                />
              )}
            </div>

            {currentTick && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground hidden sm:block">Live</span>
                <span className="font-mono text-xs sm:text-sm font-semibold">{livePriceStr}</span>
                {liveDigit !== null && (
                  <span className={`text-base sm:text-lg font-black w-6 text-center ${liveDigit % 2 === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {liveDigit}
                  </span>
                )}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              </div>
            )}
          </div>

          {/* Row 2: Sample size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Ticks:</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {WINDOW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWindowSize(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${windowSize === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
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
            <p className="text-xs text-muted-foreground">
              Last <span className="font-semibold">{analytics.distribution.totalTicks.toLocaleString()}</span> ticks · live
              {analytics.distribution.totalTicks < windowSize && <span className="ml-1 text-amber-500">(collecting…)</span>}
              <span className="ml-2 text-muted-foreground/50">Past results don&apos;t predict future outcomes.</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Which digit landed most?</CardTitle>
                    <button
                      onClick={() => setCircleMode((v) => !v)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={circleMode ? 'Switch to bars' : 'Switch to circles'}
                    >
                      {circleMode ? <BarChart2 size={14} /> : <Grid2X2 size={14} />}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <DigitDistributionPanel
                    data={analytics.distribution}
                    circleMode={circleMode}
                    liveDigit={liveDigit}
                  />
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
