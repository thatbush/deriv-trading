'use client';

import { Suspense } from 'react';
import { useActiveSymbols, useTicks } from '@deriv/core';
import { useAnalyticsWSContext } from '@/components/custom/deriv-ws-provider';
import { AnalyticsView } from '../components/analytics-view';

const DIGIT_CONTRACT_TYPES = ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'];

function AnalyticsPage() {
  const { ws, isConnected } = useAnalyticsWSContext();

  const { symbols, activeSymbol, selectSymbol, isLoading } = useActiveSymbols(ws, isConnected, DIGIT_CONTRACT_TYPES);
  const { currentTick, prices, pipSize } = useTicks(ws, isConnected, activeSymbol);

  return (
    <AnalyticsView
      symbols={symbols}
      activeSymbol={activeSymbol}
      selectSymbol={selectSymbol}
      currentTick={currentTick}
      prices={prices}
      pipSize={pipSize}
      isLoading={isLoading}
      isConnected={isConnected}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <AnalyticsPage />
    </Suspense>
  );
}
