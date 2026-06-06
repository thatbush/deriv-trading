'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ActiveSymbol, DerivWS } from '@deriv/core';
import {
  getMarketDisplayName,
  getSubmarketDisplayName,
  getSubgroupDisplayName,
} from '@/lib/active-symbols-display-names';

export interface SmartChartsSymbol {
  symbol: string;
  display_name: string;
  exchange_is_open: 0 | 1;
  is_trading_suspended: 0 | 1;
  market: string;
  market_display_name: string;
  pip: number;
  subgroup: string;
  subgroup_display_name: string;
  submarket: string;
  submarket_display_name: string;
  symbol_type: string;
}

export type TradingTimesMap = Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;

export interface SmartChartChartData {
  tradingTimes: TradingTimesMap;
  activeSymbols: SmartChartsSymbol[];
}

interface TradingTimesResponse {
  trading_times?: {
    markets?: Array<{
      submarkets?: Array<{
        symbols?: Array<{
          underlying_symbol?: string;
          symbol?: string;
          times: { open: string[]; close: string[] };
        }>;
      }>;
    }>;
  };
}

/**
 * Transforms the Deriv `trading_times: 'today'` response into the simplified
 * map SmartCharts' TradingTimes store expects. Every symbol the chart might
 * render needs an entry — otherwise `getDelayedMinutes()` throws on
 * `undefined.delay_amount` when the chart calls `fetchInitialData`.
 */
function buildTradingTimesMap(response: TradingTimesResponse): TradingTimesMap {
  const markets = response?.trading_times?.markets;
  if (!markets) return {};

  const map: TradingTimesMap = {};
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 11);

  for (const market of markets) {
    market.submarkets?.forEach(submarket => {
      submarket.symbols?.forEach(symbolObj => {
        const symbol = symbolObj.underlying_symbol || symbolObj.symbol;
        const { times } = symbolObj;
        if (!symbol || !times) return;
        const { open, close } = times;
        const isOpenAllDay =
          open.length === 1 && open[0] === '00:00:00' && close[0] === '23:59:59';
        const isClosedAllDay = open.length === 1 && open[0] === '--' && close[0] === '--';

        let isOpen = isOpenAllDay;
        let openTime = '';
        let closeTime = '';

        if (!isClosedAllDay && open.length > 0 && close.length > 0) {
          openTime = `${dateStr}${open[0]}Z`;
          closeTime = `${dateStr}${close[0]}Z`;
          const openDate = new Date(openTime);
          const closeDate = new Date(closeTime);
          isOpen = now >= openDate && now < closeDate;
        }

        map[symbol] = { isOpen, openTime, closeTime };
      });
    });
  }
  return map;
}

/**
 * Produces the `chartData` SmartCharts expects — a combined payload of
 * `activeSymbols` (reshaped from `ActiveSymbol`) and `tradingTimes` (fetched
 * from the `trading_times: 'today'` endpoint). Returns `undefined` until both
 * parts are ready, so the chart mounts with a complete map and its internal
 * `getDelayedMinutes()` / `isFeedUnavailable()` calls don't crash.
 */
export function useSmartChartChartData(
  ws: DerivWS | null,
  isConnected: boolean,
  symbols: ActiveSymbol[]
): { chartData: SmartChartChartData | undefined } {
  const [tradingTimes, setTradingTimes] = useState<TradingTimesMap | undefined>();

  // Fetch `trading_times` whenever we have a live socket. This is the gate for
  // `chartData` (and therefore whether the chart mounts at all), so it must not
  // be allowed to hang. In the iframe the socket can be `isConnected` but not
  // yet authorized when this first fires, and the response can be silently
  // dropped — leaving `tradingTimes` undefined forever and the chart stuck on a
  // skeleton ("loads sometimes"). Guard with a timeout + retry so a dropped
  // call recovers instead of wedging.
  useEffect(() => {
    if (!ws || !isConnected) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const attempt = () => {
      let settled = false;
      // If the call neither resolves nor rejects within 8s, retry.
      const timeout = setTimeout(() => {
        if (cancelled || settled) return;
        settled = true;
        retryTimer = setTimeout(attempt, 0);
      }, 8000);

      ws.send({ trading_times: 'today' })
        .then(response => {
          if (cancelled || settled) return;
          settled = true;
          clearTimeout(timeout);
          const map = buildTradingTimesMap(response as TradingTimesResponse);
          // SmartCharts only (re)ingests trading times when the *stringified*
          // value differs from what it last saw, and only acts on it once its
          // internal store is initialised. Delivering the real map as the very
          // first value races that init: the change is observed before the store
          // is ready, then never re-observed, so the chart hangs at "Retrieving
          // Trading Times..." until something else (e.g. a symbol switch) yields
          // a new value — exactly the reported symptom.
          //
          // Fix: seed an empty map first (lets the chart mount + initialise its
          // store with a known `"{}"` value), then deliver the real map on the
          // next tick. The real map stringifies differently from `"{}"`, so the
          // library's `JSON.stringify(next) !== prev` check reliably fires with
          // the store ready.
          setTradingTimes({});
          setTimeout(() => {
            if (cancelled) return;
            setTradingTimes(map);
          }, 1200);
        })
        .catch(() => {
          if (cancelled || settled) return;
          settled = true;
          clearTimeout(timeout);
          // Fall back to an empty map so the chart can still mount; symbols get
          // synthesized tradingTimes entries below.
          setTradingTimes({});
        });
    };

    attempt();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [ws, isConnected]);

  const chartData = useMemo((): SmartChartChartData | undefined => {
    if (symbols.length === 0 || !tradingTimes) return undefined;
    // Pristine @deriv-com/smartcharts-champion@1.9.12 reads these fields without null
    // guards: `submarket_display_name.localeCompare(...)` and `pip.toString().length`
    // crash if either is missing. Keep every field defined.
    const activeSymbols: SmartChartsSymbol[] = symbols.map(s => ({
      symbol: s.underlying_symbol,
      display_name: s.underlying_symbol_name ?? s.underlying_symbol,
      exchange_is_open: s.exchange_is_open as 0 | 1,
      is_trading_suspended: s.is_trading_suspended as 0 | 1,
      market: s.market ?? '',
      market_display_name: s.market_display_name ?? getMarketDisplayName(s.market ?? ''),
      pip: s.pip_size ?? 0.01,
      subgroup: s.subgroup ?? '',
      subgroup_display_name: s.subgroup_display_name ?? getSubgroupDisplayName(s.subgroup ?? ''),
      submarket: s.submarket ?? '',
      submarket_display_name: s.submarket_display_name ?? getSubmarketDisplayName(s.submarket ?? ''),
      symbol_type: s.underlying_symbol_type ?? '',
    }));
    // Ensure every activeSymbol has a tradingTimes entry. Pristine v1.9.12's
    // `getDelayedMinutes()` does `_tradingTimesMap?.[symbol].delay_amount` — if
    // `symbol` is missing from the map, `.delay_amount` throws on undefined.
    const filledTradingTimes: TradingTimesMap = { ...tradingTimes };
    for (const s of activeSymbols) {
      if (!filledTradingTimes[s.symbol]) {
        filledTradingTimes[s.symbol] = {
          isOpen: !!s.exchange_is_open,
          openTime: '',
          closeTime: '',
        };
      }
    }
    return { tradingTimes: filledTradingTimes, activeSymbols };
  }, [tradingTimes, symbols]);

  return { chartData };
}
