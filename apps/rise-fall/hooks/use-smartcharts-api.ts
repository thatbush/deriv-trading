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

/**
 * One live WS tick/candle subscription per `symbol-granularity` key, shared
 * across all callers. SmartCharts calls `subscribeQuotes` for the same symbol
 * twice in quick succession (StrictMode double-invoke / remount), ~10ms apart —
 * before the first subscribe's promise resolves. A naive "is it already
 * subscribed?" check (which can only read state set in `.then()`) loses that
 * race and fires a second identical `ticks_history…subscribe:1`, which the API
 * rejects with `AlreadySubscribed`. That rejection both raises a toast and makes
 * SmartCharts treat the feed as failed, so the chart never renders ("sometimes
 * it loads" = the two calls happened not to overlap).
 *
 * Fix: register the key *synchronously* on the first call and fan the single
 * underlying subscription's quotes out to every callback. Subsequent callers for
 * the same key attach to the existing entry instead of opening a new socket sub.
 */
interface SharedSub {
  // Reference count, not a Set: SmartCharts subscribes for the same key twice
  // with the *same* callback reference, then unsubscribes one. A Set would
  // collapse the identical callbacks into one entry, so the first unsubscribe
  // would empty it and `forget` the live feed — leaving the chart stuck at
  // "Retrieving Chart Data…". Counting refs keeps the feed alive until every
  // subscribe has been matched by an unsubscribe.
  refCount: number;
  emit: (quote: Record<string, unknown>) => void; // fans to the active callback
  callback: (quote: Record<string, unknown>) => void;
  forget: (() => void) | null; // set once the WS subscribe resolves
  cancelled: boolean;          // true once the last caller has unsubscribed
}

export function useSmartChartsApi(ws: DerivWS | null): UseSmartChartsApiReturn {
  const wsRef = useRef<DerivWS | null>(ws);
  const subsRef = useRef<Record<string, SharedSub>>({});

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  useEffect(() => {
    return () => {
      for (const sub of Object.values(subsRef.current)) {
        sub.cancelled = true;
        sub.refCount = 0;
        sub.forget?.();
      }
      subsRef.current = {};
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

      // If a subscription for this key already exists (pending or live), bump its
      // ref count instead of opening a second WS subscribe — registered
      // synchronously so it wins the ~10ms race that previously produced a
      // duplicate subscribe and `AlreadySubscribed`. Refresh the active callback
      // to the latest (they're functionally identical for the same key).
      const existing = subsRef.current[key];
      if (existing) {
        existing.refCount += 1;
        existing.callback = callback;
        let released = false;
        return () => {
          if (released) return;
          released = true;
          existing.refCount -= 1;
          if (existing.refCount <= 0) {
            existing.cancelled = true;
            existing.forget?.();
            if (subsRef.current[key] === existing) delete subsRef.current[key];
          }
        };
      }

      const sub: SharedSub = {
        refCount: 1,
        callback,
        emit: (quote) => sub.callback(quote),
        forget: null,
        cancelled: false,
      };
      subsRef.current[key] = sub;

      const request: Record<string, unknown> = {
        ticks_history: symbol,
        // Precedence matters: `style || granularity ? a : b` parses as
        // `(style || granularity) ? a : b`, which wrongly yields 'candles' for a
        // tick stream (style='ticks' is truthy). Resolve style explicitly so a
        // tick subscription actually requests ticks — otherwise SmartCharts waits
        // for ohlc candles that never arrive ("Retrieving Chart Data..." forever).
        style: style ?? (granularity ? 'candles' : 'ticks'),
        adjust_start_time: 1,
        count: 1,
        end: 'latest',
      };
      if (granularity) request.granularity = granularity;

      const emit = sub.emit;

      wsRef.current.subscribe(request, (response: Record<string, unknown>) => {
        if (response.tick) {
          const tick = response.tick as { epoch: number; quote: number };
          emit({
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
          emit({
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
          sub.forget = unsubscribe;
          // Caller(s) already gone before the subscribe resolved — forget now.
          if (sub.cancelled) unsubscribe();
        })
        .catch(() => {
          // Subscribe failed — drop the entry so a later attempt can retry.
          if (subsRef.current[key] === sub) delete subsRef.current[key];
        });

      let released = false;
      return () => {
        if (released) return;
        released = true;
        sub.refCount -= 1;
        if (sub.refCount <= 0) {
          sub.cancelled = true;
          sub.forget?.();
          if (subsRef.current[key] === sub) delete subsRef.current[key];
        }
      };
    },
    []
  );

  const unsubscribeQuotes = useCallback((request?: { symbol?: string; granularity?: number }) => {
    if (!request?.symbol) return;
    const key = `${request.symbol}-${request.granularity ?? 0}`;
    const sub = subsRef.current[key];
    if (sub) {
      sub.cancelled = true;
      sub.refCount = 0;
      sub.forget?.();
      delete subsRef.current[key];
    }
  }, []);

  return {
    getQuotes,
    subscribeQuotes,
    unsubscribeQuotes,
  };
}
