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
    contracts_array?: unknown[];
    /** Chart-surface children, e.g. <FastMarker> overlays. */
    children?: React.ReactNode;
  }

  export const SmartChart: React.FC<SmartChartProps>;

  export interface ChartTitleProps {
    onChange?: (symbol: string) => void;
  }

  export const ChartTitle: React.FC<ChartTitleProps>;

  // ── Toolbar widgets (floating chart toolbar) ──────────────────────────────
  export interface ChartModeProps {
    onChartType?: (chartType: string) => void;
    onGranularity?: (granularity: number) => void;
    portalNodeId?: string;
  }
  export const ChartMode: React.FC<ChartModeProps>;
  export const Views: React.FC<ChartModeProps>;
  // These dialogs portal their content into the DOM node with id `portalNodeId`.
  export interface PortalWidgetProps {
    portalNodeId?: string;
  }
  export const StudyLegend: React.FC<PortalWidgetProps>;
  export const DrawTools: React.FC<PortalWidgetProps>;
  export const Share: React.FC<PortalWidgetProps>;
  export const ToolbarWidget: React.FC<{
    position?: 'top' | 'bottom';
    children?: React.ReactNode;
  }>;

  // ── Marker API ────────────────────────────────────────────────────────────
  export interface FastMarkerRefApi {
    setPosition: (pos: { epoch: number | null; price: number | null }) => void;
    div: HTMLDivElement;
  }
  export interface FastMarkerProps {
    markerRef: (ref: FastMarkerRefApi | null) => void;
    className?: string;
    children?: React.ReactNode;
  }
  export const FastMarker: React.FC<FastMarkerProps>;
  export const Marker: React.FC<FastMarkerProps>;
}
