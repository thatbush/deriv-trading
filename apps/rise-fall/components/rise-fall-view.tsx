'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/custom/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { TradeControls, BuyButton } from './trade-controls';
import { InsightPanel } from './insight-panel';
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  ProposalInfo,
  BuyResult,
  DerivWS,
} from '@deriv/core';
import type { Direction, DurationSelectUnit, DurationOption } from '../lib/types';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { OpenPosition } from '../lib/types';

const RiseFallChart = dynamic(() => import('./rise-fall-chart').then(m => m.RiseFallChart), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-md border border-border/50 dark:border-white/[0.08] bg-muted/30" />
  ),
});

export interface RiseFallViewProps {
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
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;

  // Trade controls
  direction: Direction;
  setDirection: (direction: Direction) => void;
  allowEquals: boolean;
  setAllowEquals: (value: boolean) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  durationOptions: DurationOption[];
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  proposal: ProposalInfo | null;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data (elevated to page so preview can inject frozen mocks)
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;
  /**
   * Unix epoch (seconds) to freeze the chart at. When set, SmartCharts renders
   * a static historical snapshot and never sets up a live subscription.
   */
  endEpoch?: number;

  // Branding (used by preview route; no-op in the real app)
  logoSrc?: string;
  appName?: string;
  prices?: number[];
  pipSize?: number;
}

export function RiseFallView({
  chartKey,
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  ws,
  isConnected,
  isLoading,
  error,
  activeSymbol,
  selectSymbol,
  direction,
  setDirection,
  allowEquals,
  setAllowEquals,
  stake,
  setStake,
  duration,
  setDuration,
  durationOptions,
  durationUnit,
  setDurationUnit,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  proposal,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
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
}: RiseFallViewProps) {
  const isMobile = useIsMobile();
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);

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
    <main className="flex flex-col bg-background h-dvh overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-y-auto">

      <div className="flex flex-col flex-1 min-h-0 w-full lg:max-w-7xl lg:mx-auto lg:px-4 lg:py-6 lg:flex-none">
        <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start">

          {/* Zone 1: Chart */}
          <div className="shrink-0 px-3 pt-2 pb-1 lg:p-0">
            <div className="h-[42dvh] lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
              {chartData ? (
                <RiseFallChart
                  symbolKey={`rise-fall-chart-${chartKey}`}
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
                  contractsArray={contractMarkers}
                />
              ) : (
                <Skeleton className="h-full w-full rounded-md" />
              )}
            </div>
          </div>

          {/* Zone 2 + 3 column */}
          <div className="flex flex-col flex-1 min-h-0 border-t border-border lg:border-t-0">

            {/* Zone 2: Form — scrolls on mobile */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-2 lg:overflow-visible lg:p-0">
              {isLoading ? (
                <Skeleton className="h-40 w-full rounded-xl lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]" />
              ) : (
                <Card className="lg:overflow-y-auto lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
                  <CardContent className="pt-4 pb-4">
                    <TradeControls
                      direction={direction}
                      onDirectionChange={setDirection}
                      allowEquals={allowEquals}
                      onAllowEqualsChange={setAllowEquals}
                      isConnected={isConnected}
                      stake={stake}
                      onStakeChange={setStake}
                      duration={duration}
                      onDurationChange={setDuration}
                      durationOptions={durationOptions}
                      durationUnit={durationUnit}
                      onDurationUnitChange={setDurationUnit}
                      endDate={endDate}
                      onEndDateChange={setEndDate}
                      endTime={endTime}
                      onEndTimeChange={setEndTime}
                      ws={ws}
                      activeSymbol={activeSymbol}
                      proposal={proposal}
                      buyResult={buyResult}
                      buyError={buyError}
                      onClearBuyResult={clearBuyResult}
                    />
                    <InsightPanel prices={prices} pipSize={pipSize} />
                    {/* Desktop: buy button inside the card */}
                    <div className="hidden lg:block mt-4">
                      <BuyButton
                        proposal={proposal}
                        isConnected={isConnected}
                        isBuying={isBuying}
                        onBuy={buyContract}
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
