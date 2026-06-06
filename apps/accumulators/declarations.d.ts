declare module '@deriv/deriv-charts' {
  import type * as React from 'react';

  export function setSmartChartsPublicPath(path: string): void;

  export interface SmartChartProps {
    id?: string;
    barriers?: unknown[];
    chartControlsWidgets?: React.ReactNode | null;
    enabledChartFooter?: boolean;
    chartStatusListener?: (status: boolean) => void;
    toolbarWidget?: () => React.ReactNode;
    chartType?: string;
    isMobile?: boolean;
    enabledNavigationWidget?: boolean;
    granularity?: number;
    requestAPI?: (request: Record<string, unknown>) => Promise<unknown>;
    requestForget?: () => void;
    requestForgetStream?: () => void;
    requestSubscribe?: (
      request: Record<string, unknown>,
      callback: (response: unknown) => void
    ) => void;
    settings?: {
      assetInformation?: boolean;
      countdown?: boolean;
      isHighestLowestMarkerEnabled?: boolean;
      language?: string;
      position?: string;
      theme?: string;
    };
    symbol?: string;
    topWidgets?: () => React.ReactNode;
    isConnectionOpened?: boolean;
    isLive?: boolean;
  }

  export const SmartChart: React.FC<SmartChartProps>;

  export interface ChartTitleProps {
    onChange?: (symbol: string) => void;
  }

  export const ChartTitle: React.FC<ChartTitleProps>;
}
