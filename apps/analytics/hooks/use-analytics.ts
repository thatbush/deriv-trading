'use client';

import { useMemo } from 'react';
import {
  computeDigitDistribution,
  computeEvenOdd,
  computeOverUnder,
  computeMatchDiffer,
  computeRiseFall,
  computeStreaks,
  computeRollingHistory,
} from '@deriv/core';
import type {
  DigitDistribution,
  EvenOddStats,
  OverUnderStats,
  MatchDifferStats,
  RiseFallStats,
  StreakStats,
  RollingHistoryEntry,
} from '@deriv/core';

export interface AnalyticsData {
  distribution: DigitDistribution;
  evenOdd: EvenOddStats;
  overUnder: OverUnderStats;
  matchDiffer: MatchDifferStats;
  riseFall: RiseFallStats;
  streaks: StreakStats;
  history: RollingHistoryEntry[];
}

export function useAnalytics(
  prices: number[],
  pipSize: number,
  windowSize: number,
  overUnderBarrier: number,
  matchDigit: number
): AnalyticsData {
  return useMemo(() => {
    const window = prices.slice(-windowSize);
    return {
      distribution: computeDigitDistribution(window, pipSize),
      evenOdd: computeEvenOdd(window, pipSize),
      overUnder: computeOverUnder(window, pipSize, overUnderBarrier),
      matchDiffer: computeMatchDiffer(window, pipSize, matchDigit),
      riseFall: computeRiseFall(window),
      streaks: computeStreaks(window, pipSize),
      history: computeRollingHistory(window, pipSize, 50),
    };
  }, [prices, pipSize, windowSize, overUnderBarrier, matchDigit]);
}
