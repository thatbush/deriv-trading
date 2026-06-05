'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/custom/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { TradeControls } from './trade-controls';
import { InsightPanel } from './insight-panel';
import type { ChartBarrier } from '@/components/custom/smart-chart';
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  BuyResult,
} from '@deriv/core';
import type { GrowthRate } from '../lib/types';
import type { AccumulatorProposalInfo } from '../hooks/use-accumulator-proposal';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { OpenPosition } from '../lib/types';

const AccumulatorChart = dynamic(
  () => import('./accumulator-chart').then(m => m.AccumulatorChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-md border border-border/50 dark:border-white/[0.08] bg-muted/30" />
    ),
  }
);

export interface AccumulatorViewProps {
  /** Increments when the underlying WS is swapped, forcing the chart to remount
   *  and re-subscribe its quote feed onto the new socket. */
  chartKey: number;
  // Auth
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;

  // Connection / loading
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;

  // Trade controls
  growthRate: GrowthRate;
  setGrowthRate: (rate: GrowthRate) => void;
  growthRateOptions: { value: number; label: string }[];
  stake: string;
  setStake: (value: string) => void;
  takeProfit: string;
  setTakeProfit: (value: string) => void;
  proposal: AccumulatorProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;
  /** Unix epoch (seconds) to freeze the chart at. */
  endEpoch?: number;

  // Branding (used by preview route; no-op in the real app)
  logoSrc?: string;
  appName?: string;
  /** Raw tick prices for the inline market insight panel. */
  prices?: number[];
  pipSize?: number;
}

export function AccumulatorView({
  chartKey,
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  isConnected,
  isLoading,
  error,
  activeSymbol,
  selectSymbol,
  growthRate,
  setGrowthRate,
  growthRateOptions,
  stake,
  setStake,
  takeProfit,
  setTakeProfit,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
  sellContract,
  sellingId,
  chartData,
  getQuotes,
  subscribeQuotes,
  unsubscribeQuotes,
  isLive,
  endEpoch,
  logoSrc,
  appName,
  prices = [],
  pipSize = 2,
}: AccumulatorViewProps) {
  const isMobile = useIsMobile();
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);

  // Accumulators only allow 1 trade at a time — find the active ACCU position for the current symbol
  const activeAccuPosition = openPositions.find(
    (p) => p.contract_type === 'ACCU' && p.underlying_symbol === activeSymbol?.underlying_symbol
  ) ?? null;

  const chartBarriers = useMemo<ChartBarrier[]>(() => {
    if (!proposal?.highBarrier || !proposal?.lowBarrier) return [];
    const color = proposal.hasCrossedBarrier ? '#cc2e3d' : '#008832';
    return [{
      shade: 'BETWEEN',
      high: proposal.highBarrier,
      low: proposal.lowBarrier,
      relative: false,
      draggable: false,
      hideBarrierLine: false,
      hideOffscreenBarrier: true,
      hideOffscreenLine: true,
      hidePriceLabel: false,
      color,
      shadeColor: color,
    }];
  }, [proposal?.highBarrier, proposal?.lowBarrier, proposal?.hasCrossedBarrier]);

  if (error) {
    return (
      <main className="flex flex-col bg-background items-center justify-center px-4 min-h-dvh">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col bg-background h-dvh overflow-hidden lg:h-auto lg:overflow-visible lg:min-h-screen">

      {/* Mobile: two-row flex column filling dvh. Desktop: normal page flow. */}
      <div className="flex flex-col flex-1 min-h-0 lg:block lg:flex-none lg:max-w-7xl lg:mx-auto lg:px-3 lg:py-2 lg:gap-2">
        <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_400px] lg:gap-4">

          {/* Chart — fixed height on mobile, natural on desktop */}
          <div className="shrink-0 flex flex-col px-3 pt-2 pb-2 lg:px-0 lg:py-0">
            <div className="h-[45dvh] lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
              {chartData ? (
                <AccumulatorChart
                  symbolKey={`accumulator-chart-${chartKey}`}
                  symbol={activeSymbol?.underlying_symbol}
                  isConnectionOpened={isConnected}
                  isMobile={isMobile}
                  chartData={chartData}
                  getQuotes={getQuotes}
                  subscribeQuotes={subscribeQuotes}
                  unsubscribeQuotes={unsubscribeQuotes}
                  onSymbolChange={selectSymbol}
                  isLive={isLive}
                  endEpoch={endEpoch}
                  barriers={chartBarriers}
                  contractsArray={contractMarkers}
                />
              ) : (
                <Skeleton className="h-full w-full rounded-md" />
              )}
            </div>
          </div>

          {/* Controls — scrollable, fills remaining space on mobile */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 border-t border-border pt-3 pb-24 lg:border-t-0 lg:pt-0 lg:pb-0 lg:overflow-visible lg:flex-none flex flex-col gap-3">
            {isLoading ? (
              <Skeleton className="lg:h-[min(33.6rem,66vh)] lg:min-h-[384px] h-48 w-full rounded-xl" />
            ) : (
              <Card className="lg:h-[min(33.6rem,66vh)] lg:min-h-[384px] lg:overflow-y-auto">
                <CardContent className="pt-4">
                  <TradeControls
                    growthRate={growthRate}
                    onGrowthRateChange={setGrowthRate}
                    growthRateOptions={growthRateOptions}
                    isConnected={isConnected}
                    stake={stake}
                    onStakeChange={setStake}
                    takeProfit={takeProfit}
                    onTakeProfitChange={setTakeProfit}
                    proposal={proposal}
                    onBuy={buyContract}
                    isBuying={isBuying}
                    buyResult={buyResult}
                    buyError={buyError}
                    onClearBuyResult={clearBuyResult}
                    activePosition={activeAccuPosition}
                    onClose={sellContract}
                    isClosing={sellingId === activeAccuPosition?.contract_id}
                    isAuthenticated={authState === 'authenticated'}
                  />
                  <InsightPanel prices={prices} pipSize={pipSize} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer — sits in the scroll gutter (pb-24) on mobile, not fixed-overlaid */}
      <div className="hidden lg:block py-2 text-center">
        <Footer />
      </div>
    </main>
  );
}
