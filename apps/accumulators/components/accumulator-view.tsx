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
  DerivWS,
} from '@deriv/core';
import type { GrowthRate } from '../lib/types';
import type { AccumulatorProposalInfo } from '../hooks/use-accumulator-proposal';
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

  // Chart — SmartCharts drives its own data over this shared socket.
  ws: DerivWS | null;
  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;

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
  ws,
  isLive,
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
    <main
      className="bg-background lg:min-h-screen lg:overflow-y-auto"
      style={{ display: 'grid', gridTemplateRows: '42dvh 1fr auto', height: '100dvh' }}
    >
      {/* Zone 1: Chart.
          Only ONE chart instance may exist in the DOM at a time — SmartCharts'
          Flutter engine is a singleton keyed by `id`. Rendering both the mobile
          and desktop charts (toggled via CSS) mounts two instances that collide
          on the single flutter-view; one gets a 0×0 surface and never paints.
          So gate each slot on `isMobile` and never mount both. */}
      <div className="px-3 pt-2 pb-1 overflow-hidden lg:hidden">
        {ws && isMobile ? (
          <AccumulatorChart
            symbolKey={`accumulator-chart-${chartKey}`}
            symbol={activeSymbol?.underlying_symbol}
            isConnectionOpened={isConnected}
            isMobile={isMobile}
            ws={ws}
            onSymbolChange={selectSymbol}
            isLive={isLive}
            barriers={chartBarriers}
            contractsArray={contractMarkers}
          />
        ) : (
          <Skeleton className="h-full w-full rounded-md" />
        )}
      </div>

      {/* Zone 2: Scrollable form */}
      <div className="overflow-y-auto overscroll-contain border-t border-border px-3 pt-3 pb-2 lg:hidden">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <Card>
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
              {/* Buy button now lives in the scrollable form (mobile) so the
                  footer can be the pinned bottom bar instead. */}
              <div className="mt-4">
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

      {/* Zone 3: Footer — pinned at bottom, mobile only */}
      <div className="px-3 py-2 border-t border-border bg-background text-center lg:hidden">
        <Footer />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block lg:col-start-1 lg:row-start-1 lg:row-end-4 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-[1fr_400px] gap-6 items-start">
          <div className="h-[min(33.6rem,66vh)] min-h-[384px]">
            {ws && !isMobile ? (
              <AccumulatorChart
                symbolKey={`accumulator-chart-${chartKey}`}
                symbol={activeSymbol?.underlying_symbol}
                isConnectionOpened={isConnected}
                isMobile={isMobile}
                ws={ws}
                onSymbolChange={selectSymbol}
                isLive={isLive}
                barriers={chartBarriers}
                contractsArray={contractMarkers}
              />
            ) : (
              <Skeleton className="h-full w-full rounded-md" />
            )}
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-[min(33.6rem,66vh)] min-h-[384px] w-full rounded-xl" />
            ) : (
              <Card className="h-[min(33.6rem,66vh)] min-h-[384px] overflow-y-auto">
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
                  <div className="mt-4">
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
        </div>
        <div className="py-2 text-center">
          <Footer />
        </div>
      </div>
    </main>
  );
}
