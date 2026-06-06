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

  /** Passed to SmartChart. Set to false for a frozen preview. Defaults to true. */
  isLive?: boolean;

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
  isLive,
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
    /*
     * Mobile: natural block flow — the whole page (iframe) scrolls. We do NOT
     * try to constrain the iframe to the viewport: iOS Safari ignores iframe
     * height and grows the frame to fit its content (WebKit bug #149264), which
     * silently breaks any inner `overflow:auto` scroll container and makes
     * touch/scroll intermittent. So instead the chart is a fixed-height block,
     * the controls flow beneath it, and the buy button scrolls with the page.
     * Desktop: two-column grid for chart + controls (unchanged).
     */
    <main className="bg-background lg:min-h-screen lg:overflow-y-auto">
      {/* Mobile: chart (fixed height block).
          Only ONE chart instance may exist in the DOM at a time — SmartCharts'
          Flutter engine is a singleton keyed by `id`. Rendering both the mobile
          and desktop charts (toggled via CSS) mounts two instances with the same
          id; they collide on the single flutter-view and one gets a 0×0 surface
          (desktop showed blank, mobile broke on reload). So gate each slot on
          `isMobile` and never mount both. */}
      <div className="h-[340px] px-3 pt-2 pb-1 lg:hidden">
        {ws && isMobile ? (
          <RiseFallChart
            symbolKey={`rise-fall-chart-${chartKey}`}
            symbol={activeSymbol?.underlying_symbol}
            isConnectionOpened={isConnected}
            isMobile={isMobile}
            ws={ws}
            onSymbolChange={selectSymbol}
            isLive={isLive}
            contractsArray={contractMarkers}
          />
        ) : (
          <Skeleton className="h-full w-full rounded-md" />
        )}
      </div>

      {/* Mobile: controls (natural height, flow with page) */}
      <div className="border-t border-border px-3 pt-3 pb-2 lg:hidden">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <Card>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile: buy button — sticky to viewport bottom so it stays reachable
          while the page scrolls, without relying on a fixed-height grid. */}
      <div className="sticky bottom-0 z-10 px-3 py-3 border-t border-border bg-background lg:hidden">
        <BuyButton
          proposal={proposal}
          isConnected={isConnected}
          isBuying={isBuying}
          onBuy={buyContract}
          isAuthenticated={authState === 'authenticated'}
        />
      </div>

      {/* Desktop layout — spans all 3 rows, overrides the grid */}
      <div className="hidden lg:block lg:col-start-1 lg:row-start-1 lg:row-end-4 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-[1fr_400px] gap-6 items-start">
          <div className="h-[min(33.6rem,66vh)] min-h-[384px]">
            {ws && !isMobile ? (
              <RiseFallChart
                symbolKey={`rise-fall-chart-${chartKey}`}
                symbol={activeSymbol?.underlying_symbol}
                isConnectionOpened={isConnected}
                isMobile={isMobile}
                ws={ws}
                onSymbolChange={selectSymbol}
                isLive={isLive}
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
                  <div className="mt-4">
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
        </div>
        <div className="py-2 text-center">
          <Footer />
        </div>
      </div>
    </main>
  );
}
