'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  ChartTitle,
  SmartChart,
  setSmartChartsPublicPath,
} from '@deriv/deriv-charts';
import '@deriv/deriv-charts/dist/smartcharts.css';
import type { DerivWS } from '@deriv/core';
import {
  getMarketDisplayName,
  getSubmarketDisplayName,
  getSubgroupDisplayName,
} from '@/lib/active-symbols-display-names';

interface RawActiveSymbol {
  underlying_symbol?: string;
  symbol?: string;
  underlying_symbol_name?: string;
  display_name?: string;
  market?: string;
  market_display_name?: string;
  submarket?: string;
  submarket_display_name?: string;
  subgroup?: string;
  subgroup_display_name?: string;
  pip_size?: number;
  pip?: number;
  [k: string]: unknown;
}

/**
 * The Deriv `options` WS endpoint returns active_symbols WITHOUT the
 * `*_display_name` fields and with `underlying_symbol`/`pip_size` instead of the
 * `symbol`/`pip` SmartCharts reads. Pristine @deriv/deriv-charts then crashes on
 * `submarket_display_name.localeCompare(...)` / `pip.toString()`. Enrich every
 * symbol so all fields SmartCharts touches are defined.
 */
function enrichActiveSymbols(response: Record<string, unknown>): Record<string, unknown> {
  const list = response?.active_symbols as RawActiveSymbol[] | undefined;
  if (!Array.isArray(list)) return response;
  const active_symbols = list.map(s => {
    const symbol = s.symbol ?? s.underlying_symbol ?? '';
    const market = s.market ?? '';
    const submarket = s.submarket ?? '';
    const subgroup = s.subgroup ?? '';
    return {
      ...s,
      symbol,
      display_name: s.display_name ?? s.underlying_symbol_name ?? symbol,
      market,
      market_display_name: s.market_display_name ?? getMarketDisplayName(market),
      submarket,
      submarket_display_name: s.submarket_display_name ?? getSubmarketDisplayName(submarket),
      subgroup,
      subgroup_display_name: s.subgroup_display_name ?? getSubgroupDisplayName(subgroup),
      pip: s.pip ?? s.pip_size ?? 0.01,
    };
  });
  return { ...response, active_symbols };
}

/**
 * The Deriv `options` `trading_times` response keys each symbol entry by
 * `underlying_symbol`, but @deriv/deriv-charts builds its internal
 * `_tradingTimesMap` from a `symbol` field. Without it the map keys become
 * `undefined` and SmartCharts crashes on `_tradingTimesMap[symbol].delay_amount`
 * ("Symbol not in _tradingTimesMap"). Copy underlying_symbol → symbol on every
 * leaf entry so the map keys resolve.
 */
function enrichTradingTimes(response: Record<string, unknown>): Record<string, unknown> {
  const tt = response?.trading_times as
    | { markets?: Array<{ submarkets?: Array<{ symbols?: RawActiveSymbol[] }> }> }
    | undefined;
  if (!tt?.markets) return response;
  for (const market of tt.markets) {
    for (const submarket of market.submarkets ?? []) {
      for (const sym of submarket.symbols ?? []) {
        if (!sym.symbol && sym.underlying_symbol) sym.symbol = sym.underlying_symbol;
      }
    }
  }
  return response;
}

// SmartCharts lazy-loads its chunks + Flutter chart app relative to this path.
// The copy-smartcharts-assets script places `@deriv/deriv-charts/dist/*` under
// `public/js/smartcharts/` (and the Flutter asset bundle at `public/assets/`),
// matching Deriv's own working template layout.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
setSmartChartsPublicPath(`${basePath}/js/smartcharts/`);

export interface SmartChartWrapperProps {
  /** Unique chart instance id (persists indicators/layout to localStorage). */
  chartId: string;
  /** Stable key — remounts the chart when the underlying WS is swapped. */
  symbolKey: string;
  symbol: string | undefined;
  isConnectionOpened: boolean;
  isMobile: boolean;
  /** The shared Deriv WebSocket. SmartCharts drives all its own requests through it. */
  ws: DerivWS | null;
  /** Called when the user picks a symbol from the built-in ChartTitle market browser. */
  onSymbolChange?: (symbol: string) => void;
  /** Whether SmartCharts should expect a live subscription feed. Defaults to true. */
  isLive?: boolean;
  /** Default granularity (0 = ticks, 60 = 1m candles, etc.). Defaults to 0. */
  defaultGranularity?: number;
}

/**
 * Thin wrapper over `@deriv/deriv-charts`'s `<SmartChart>`, wired the way Deriv's
 * own working template wires it: SmartCharts orchestrates all of its own data
 * (active_symbols, trading_times, ticks_history) and we just hand it a transport
 * via `requestAPI` (one-shot) and `requestSubscribe` (streaming) over our shared
 * WebSocket. No `chartData` / `getQuotes` / `feedCall` — that newer
 * smartcharts-champion contract was the source of the blank-chart / stuck-loader
 * / dead-dropdown bugs, so we match the documented request-based API instead.
 */
export function SmartChartWrapper({
  chartId,
  symbolKey,
  symbol,
  isConnectionOpened,
  isMobile,
  ws,
  onSymbolChange,
  isLive = true,
  defaultGranularity = 0,
}: SmartChartWrapperProps) {
  const [chartType] = useState<string>('line');
  const [granularity] = useState(defaultGranularity);

  const { resolvedTheme } = useTheme();
  // Read from the DOM immediately so the chart never gets the wrong theme on first render.
  const chartTheme =
    (resolvedTheme ??
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light')) === 'dark'
      ? 'dark'
      : 'light';

  // Keep the latest ws in a ref so the request callbacks below stay stable while
  // always talking to the current socket.
  const wsRef = useRef<DerivWS | null>(ws);
  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  // Track active chart subscriptions so we can forget them on symbol change /
  // unmount, avoiding leaked tick streams.
  const subsRef = useRef<Array<() => void>>([]);
  useEffect(() => {
    return () => {
      subsRef.current.forEach(unsub => unsub());
      subsRef.current = [];
    };
  }, []);

  // SmartCharts fires its first requests (active_symbols, trading_times) as soon
  // as it mounts — often BEFORE the WS has finished its handshake. The `ws`
  // object exists but `readyState !== OPEN`, so `send()` throws "WebSocket is not
  // connected", SmartCharts catches it and does NOT retry → the chart hangs on
  // "Retrieving Market Symbols…" forever (the reported bug; toggling devtools
  // happened to coincide with a late retry). Fix: wait for the socket to actually
  // be OPEN before sending, so the very first request succeeds.
  const waitForConnection = useCallback(async (timeoutMs = 15000): Promise<boolean> => {
    const ws = wsRef.current;
    if (!ws) return false;
    if (ws.isConnected) return true;
    return new Promise<boolean>(resolve => {
      const start = Date.now();
      const id = setInterval(() => {
        if (wsRef.current?.isConnected) {
          clearInterval(id);
          resolve(true);
        } else if (Date.now() - start > timeoutMs || !wsRef.current) {
          clearInterval(id);
          resolve(false);
        }
      }, 100);
    });
  }, []);

  // One-shot request: SmartCharts calls this for active_symbols, trading_times,
  // ticks_history (history), etc. We enrich active_symbols/trading_times with the
  // fields the Deriv options endpoint omits (else SmartCharts crashes on
  // `localeCompare` / `delay_amount`).
  const requestAPI = useCallback(
    async (request: Record<string, unknown>) => {
      if (!(await waitForConnection()) || !wsRef.current) return {};
      const response = (await wsRef.current.send(request)) as Record<string, unknown>;
      if ('active_symbols' in request) return enrichActiveSymbols(response);
      if ('trading_times' in request) return enrichTradingTimes(response);
      return response;
    },
    [waitForConnection]
  );

  // Streaming request: SmartCharts passes a request + callback; we forward every
  // streamed message back. Matches the original template's MarketIsClosed guard.
  const requestSubscribe = useCallback(
    async (request: Record<string, unknown>, callback: (response: unknown) => void) => {
      if (!(await waitForConnection()) || !wsRef.current) return;
      wsRef.current
        .subscribe(request, (response: Record<string, unknown>) => {
          const err = response?.error as { code?: string } | undefined;
          if (err?.code === 'MarketIsClosed') return callback([]);
          callback(response);
        })
        .then(({ unsubscribe }) => {
          subsRef.current.push(unsubscribe);
        })
        .catch(() => {});
    },
    [waitForConnection]
  );

  const settings = useMemo(
    () => ({
      language: 'en',
      theme: chartTheme,
      isHighestLowestMarkerEnabled: false,
      countdown: true,
      assetInformation: true,
      position: 'bottom',
    }),
    [chartTheme]
  );

  // SmartCharts' Flutter renderer sizes its drawing surface from its host
  // element and re-measures via its OWN internal ResizeObserver — NOT the window
  // `resize` event. On first load / reload / route-nav the host can be measured
  // before layout settles, so the surface inits wrong and the chart never paints
  // (stuck on "Retrieving Market Symbols…"). Toggling devtools "fixes" it because
  // it changes the actual element dimensions, which Flutter's observer picks up —
  // a synthetic window resize does NOT, since no dimension actually changes.
  //
  // So the nudge must cause a REAL dimension change. We momentarily shrink the
  // container by 1px and restore it on the next frame, forcing a genuine reflow
  // Flutter's ResizeObserver reacts to. Repeat until a canvas actually paints.
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let painted = false;

    const hasCanvas = () =>
      Array.from(el.querySelectorAll('canvas')).some(
        c => (c as HTMLCanvasElement).width > 50 && (c as HTMLCanvasElement).height > 50
      );

    // Real reflow on the FLUTTER HOST element (the thing whose ResizeObserver
    // Flutter listens to). Briefly add 1px to its height, restore next frame.
    // Falls back to the wrapper if the host isn't mounted yet.
    const reflow = () => {
      const host =
        (el.querySelector('.smartcharts') as HTMLElement | null) ??
        (el.querySelector('flutter-view') as HTMLElement | null) ??
        el;
      const prev = host.style.height;
      const h = host.getBoundingClientRect().height;
      if (h > 0) {
        host.style.height = `${h + 1}px`;
        requestAnimationFrame(() => {
          host.style.height = prev;
        });
      } else {
        // Container itself still 0-height — nudge the wrapper to force layout.
        const pw = el.style.paddingBottom;
        el.style.paddingBottom = '1px';
        requestAnimationFrame(() => {
          el.style.paddingBottom = pw;
        });
      }
    };

    let elapsed = 0;
    const poll = setInterval(() => {
      elapsed += 400;
      if (painted || elapsed > 20000) {
        clearInterval(poll);
        return;
      }
      if (hasCanvas()) {
        painted = true;
        clearInterval(poll);
        return;
      }
      reflow();
    }, 400);

    return () => clearInterval(poll);
  }, [symbolKey, symbol]);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full overflow-clip rounded-md border border-border/50 dark:border-white/[0.08] bg-background"
    >
      <SmartChart
        key={symbolKey}
        id={chartId}
        barriers={[]}
        chartControlsWidgets={null}
        enabledChartFooter={false}
        chartStatusListener={() => {}}
        toolbarWidget={() => <></>}
        chartType={chartType}
        isMobile={isMobile}
        enabledNavigationWidget={!isMobile}
        granularity={granularity}
        requestAPI={requestAPI}
        requestForget={() => {}}
        requestForgetStream={() => {}}
        requestSubscribe={requestSubscribe}
        settings={settings}
        symbol={symbol}
        topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
        isConnectionOpened={isConnectionOpened}
        isLive={isLive}
      />
    </div>
  );
}
