'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSmartChartsApi } from '@/hooks/use-smartcharts-api';
import { useSmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import { useAccumulatorTrading } from '../hooks/use-accumulator-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { AccumulatorView } from '../components/accumulator-view';
import type { DerivWS } from '@deriv/core';

/**
 * SmartCharts owns its quote subscriptions internally and only (re)subscribes on
 * mount. When the shared WebSocket is swapped — e.g. the public→authenticated
 * upgrade after SHELL_AUTH arrives, or an account switch — the chart's existing
 * subscription is left bound to the dead socket and the feed silently stops.
 *
 * This returns a generation counter that increments whenever the live WS
 * instance changes, so the chart can key off it and remount onto the new socket.
 */
function useWsGeneration(ws: DerivWS | null): number {
  const [generation, setGeneration] = useState(0);
  const prevWs = useRef<DerivWS | null>(ws);
  useEffect(() => {
    if (ws && prevWs.current && ws !== prevWs.current) {
      setGeneration((g) => g + 1);
    }
    prevWs.current = ws;
  }, [ws]);
  return generation;
}

function AccumulatorPage() {
  const logoSrc = useLogoSrc();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;

  const trading = useAccumulatorTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });

  const { chartData } = useSmartChartChartData(trading.ws, trading.isConnected, trading.symbols);
  const { getQuotes, subscribeQuotes, unsubscribeQuotes } = useSmartChartsApi(trading.ws);
  const wsGeneration = useWsGeneration(trading.ws);

  return (
    <AccumulatorView
      chartKey={wsGeneration}
      authState={authState}
      accounts={accounts}
      activeAccount={activeAccount}
      onLogin={login}
      onSignUp={signUp}
      onLogout={logout}
      onSwitchAccount={switchAccount}
      logoSrc={logoSrc}
      isConnected={trading.isConnected}
      isLoading={trading.isLoading}
      error={trading.error}
      activeSymbol={trading.activeSymbol}
      selectSymbol={trading.selectSymbol}
      growthRate={trading.growthRate}
      setGrowthRate={trading.setGrowthRate}
      growthRateOptions={trading.growthRateOptions}
      stake={trading.stake}
      setStake={trading.setStake}
      takeProfit={trading.takeProfit}
      setTakeProfit={trading.setTakeProfit}
      proposal={trading.proposal}
      buyContract={trading.buyContract}
      isBuying={trading.isBuying}
      buyResult={trading.buyResult}
      buyError={trading.buyError}
      clearBuyResult={trading.clearBuyResult}
      openPositions={trading.openPositions}
      sellContract={trading.sellContract}
      sellingId={trading.sellingId}
      chartData={chartData}
      getQuotes={getQuotes}
      subscribeQuotes={subscribeQuotes}
      unsubscribeQuotes={unsubscribeQuotes}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <AccumulatorPage />
    </Suspense>
  );
}
