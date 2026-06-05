'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/custom/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { TradeControls, BuyButton } from './trade-controls';
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
    /* ─── Mobile: 3-zone flex column filling 100dvh ─────────────────────────
     *   Zone 1 (chart)   shrink-0, fixed 42dvh
     *   Zone 2 (form)    flex-1, overflow-y-auto — scrolls independently
     *   Zone 3 (button)  shrink-0, always visible at bottom
     * ─── Desktop: normal 2-column grid, natural page height ─────────────── */
    <main className="flex flex-col bg-background h-dvh overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-y-auto">

      {/* ── Desktop centring wrapper ── */}
      <div className="flex flex-col flex-1 min-h-0 w-full lg:max-w-7xl lg:mx-auto lg:px-4 lg:py-6 lg:flex-none">

        {/* ── Two-column grid on desktop / single flex column on mobile ── */}
        <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start">

          {/* Zone 1: Chart */}
          <div className="shrink-0 px-3 pt-2 pb-1 lg:p-0">
            <div className="h-[42dvh] lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
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

          {/* Zone 2 + 3 column: scrollable form + pinned button on mobile */}
          <div className="flex flex-col flex-1 min-h-0 border-t border-border lg:border-t-0">

            {/* Zone 2: Form — scrolls on mobile */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-2 lg:overflow-visible lg:p-0">
              {isLoading ? (
                <Skeleton className="h-40 w-full rounded-xl lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]" />
              ) : (
                <Card className="lg:overflow-y-auto lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
                  <CardContent className="pt-4 pb-4">
                    <TradeControls
                      growthRate={growthRate}
                      onGrowthRateChange={setGrowthRate}
                      growthRateOptions={growthRateOptions}
                      stake={stake}
                      onStakeChange={setStake}
                      takeProfit={takeProfit}
                      onTakeProfitChange={setTakeProfit}
                      proposal={proposal}
                      buyResult={buyResult}
                      buyError={buyError}
                      onClearBuyResult={clearBuyResult}
                      activePosition={activeAccuPosition}
                    />
                    <InsightPanel prices={prices} pipSize={pipSize} />
                    {/* Desktop: buy button inside the card */}
                    <div className="hidden lg:block mt-4">
                      <BuyButton
                        proposal={proposal}
                        isConnected={isConnected}
                        isBuying={isBuying}
                        onBuy={buyContract}
                        activePosition={activeAccuPosition}
                        onClose={sellContract}
                        isClosing={sellingId === activeAccuPosition?.contract_id}
                        isAuthenticated={authState === 'authenticated'}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Zone 3: Buy button — mobile only, pinned at bottom */}
            <div className="shrink-0 px-3 py-3 border-t border-border bg-background lg:hidden">
              <BuyButton
                proposal={proposal}
                isConnected={isConnected}
                isBuying={isBuying}
                onBuy={buyContract}
                activePosition={activeAccuPosition}
                onClose={sellContract}
                isClosing={sellingId === activeAccuPosition?.contract_id}
                isAuthenticated={authState === 'authenticated'}
              />
            </div>

          </div>
        </div>
      </div>

      <div className="hidden lg:block py-2 text-center shrink-0">
        <Footer />
      </div>
    </main>
  );
}
