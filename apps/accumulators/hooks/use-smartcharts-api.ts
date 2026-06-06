'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DerivWS } from '@deriv/core';

export interface SmartChartsSubscribeParams {
  symbol: string;
  granularity?: number;
  style?: string;
}

export interface SmartChartsGetQuotesParams {
  symbol: string;
  granularity?: number;
  count?: number;
  start?: number;
  end?: number;
}

export interface UseSmartChartsApiReturn {
  getQuotes: (params: SmartChartsGetQuotesParams) => Promise<unknown>;
  subscribeQuotes: (
    params: SmartChartsSubscribeParams,
    callback: (quote: Record<string, unknown>) => void
  ) => () => void;
  unsubscribeQuotes: (request?: { symbol?: string; granularity?: number }) => void;
}

export function useSmartChartsApi(ws: DerivWS | null): UseSmartChartsApiReturn {
  const wsRef = useRef<DerivWS | null>(ws);
  const subscriptionRefs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  useEffect(() => {
    return () => {
      for (const unsub of Object.values(subscriptionRefs.current)) {
        unsub();
      }
      subscriptionRefs.current = {};
    };
  }, []);

  const getQuotes = useCallback(
    async ({ symbol, granularity, count, start, end }: SmartChartsGetQuotesParams) => {
      if (!wsRef.current) throw new Error('WebSocket not connected');
      const request: Record<string, unknown> = {
        ticks_history: symbol,
        style: granularity ? 'candles' : 'ticks',
        count: count ?? 1000,
        end: end ? String(end) : 'latest',
        adjust_start_time: 1,
      };
      if (granularity) request.granularity = granularity;
      if (start) request.start = String(start);
      return wsRef.current.send(request);
    },
    []
  );

  const subscribeQuotes = useCallback(
    (
      { symbol, granularity, style }: SmartChartsSubscribeParams,
      callback: (quote: Record<string, unknown>) => void
    ): (() => void) => {
      if (!wsRef.current) return () => { };
      const key = `${symbol}-${granularity ?? 0}`;

      // Guard against duplicate subscriptions for the same symbol+granularity.
      // SmartCharts can call subscribeQuotes twice (remount / StrictMode double
      // invoke); a second identical `ticks_history ... subscribe:1` triggers the
      // API's `AlreadySubscribed` error, the failed call never sets an unsub fn,
      // and the live subscription leaks — leaving the chart stuck loading.
      if (subscriptionRefs.current[key]) {
        subscriptionRefs.current[key]();
        delete subscriptionRefs.current[key];
      }

      const request: Record<string, unknown> = {
        ticks_history: symbol,
        // Precedence: `style || granularity ? a : b` parses as
        // `(style || granularity) ? a : b`, wrongly yielding 'candles' for a tick
        // stream. Resolve style explicitly so ticks request ticks.
        style: style ?? (granularity ? 'candles' : 'ticks'),
        adjust_start_time: 1,
        count: 1,
        end: 'latest',
      };
      if (granularity) request.granularity = granularity;

      let unsubscribeFn: () => void = () => { };

      wsRef.current.subscribe(request, (response: Record<string, unknown>) => {
        if (response.tick) {
          const tick = response.tick as { epoch: number; quote: number };
          callback({
            Date: new Date(tick.epoch * 1000).toISOString(),
            Close: tick.quote,
            tick,
            DT: new Date(tick.epoch * 1000),
          });
        }
        if (response.ohlc) {
          const ohlc = response.ohlc as {
            open_time: number;
            open: string;
            high: string;
            low: string;
            close: string;
          };
          callback({
            Date: new Date(ohlc.open_time * 1000).toISOString(),
            Open: parseFloat(ohlc.open),
            High: parseFloat(ohlc.high),
            Low: parseFloat(ohlc.low),
            Close: parseFloat(ohlc.close),
            ohlc,
            DT: new Date(ohlc.open_time * 1000),
          });
        }
      })
        .then(({ unsubscribe }) => {
          unsubscribeFn = unsubscribe;
          subscriptionRefs.current[key] = unsubscribe;
        })
        .catch(() => { });

      return () => {
        unsubscribeFn();
        delete subscriptionRefs.current[key];
      };
    },
    []
  );

  const unsubscribeQuotes = useCallback((request?: { symbol?: string; granularity?: number }) => {
    if (!request?.symbol) return;
    const key = `${request.symbol}-${request.granularity ?? 0}`;
    const unsubscribe = subscriptionRefs.current[key];
    if (unsubscribe) {
      unsubscribe();
      delete subscriptionRefs.current[key];
    }
  }, []);

  return {
    getQuotes,
    subscribeQuotes,
    unsubscribeQuotes,
  };
}
