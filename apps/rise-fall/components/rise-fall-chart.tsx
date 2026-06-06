'use client';

import { SmartChartWrapper } from '@/components/custom/smart-chart';
import type { ContractMarker } from '@/lib/chart-markers';
import type { DerivWS } from '@deriv/core';

export interface RiseFallChartProps {
  symbolKey: string;
  symbol: string | undefined;
  isConnectionOpened: boolean;
  isMobile: boolean;
  ws: DerivWS | null;
  onSymbolChange?: (symbol: string) => void;
  isLive?: boolean;
  /** Contract markers (entry/exit spots) for live trades. */
  contractsArray?: ContractMarker[];
}

export function RiseFallChart(props: RiseFallChartProps) {
  return (
    <SmartChartWrapper
      chartId="rise-fall-chart"
      defaultGranularity={0}
      {...props}
    />
  );
}
