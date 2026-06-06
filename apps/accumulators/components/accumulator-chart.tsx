'use client';

import { SmartChartWrapper } from '@/components/custom/smart-chart';
import type { ChartBarrier } from '@/components/custom/smart-chart';
import type { DerivWS } from '@deriv/core';

export interface AccumulatorChartProps {
  symbolKey: string;
  symbol: string | undefined;
  isConnectionOpened: boolean;
  isMobile: boolean;
  ws: DerivWS | null;
  onSymbolChange?: (symbol: string) => void;
  isLive?: boolean;
  barriers?: ChartBarrier[];
}

export function AccumulatorChart(props: AccumulatorChartProps) {
  return (
    <SmartChartWrapper
      chartId="accumulator-chart"
      defaultGranularity={0}
      {...props}
    />
  );
}
