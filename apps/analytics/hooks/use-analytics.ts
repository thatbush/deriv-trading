'use client';

import { useMemo } from 'react';
import {
  computeDigitDistribution,
  computeEvenOdd,
  computeOverUnder,
  computeStreaks,
  computeRollingHistory,
} from '@deriv/core';
import type {
  DigitDistribution,
  EvenOddStats,
  OverUnderStats,
  StreakStats,
  RollingHistoryEntry,
} from '@deriv/core';

export interface AnalyticsData {
  distribution: DigitDistribution;
  evenOdd: EvenOddStats;
  overUnder: OverUnderStats;
  streaks: StreakStats;
  history: RollingHistoryEntry[];
}

export function useAnalytics(
  prices: number[],
  pipSize: number,
  windowSize: number,
  overUnderBarrier: number
): AnalyticsData {
  return useMemo(() => {
    const window = prices.slice(-windowSize);
    return {
      distribution: computeDigitDistribution(window, pipSize),
      evenOdd: computeEvenOdd(window, pipSize),
      overUnder: computeOverUnder(window, pipSize, overUnderBarrier),
      streaks: computeStreaks(window, pipSize),
      history: computeRollingHistory(window, pipSize, 50),
    };
  }, [prices, pipSize, windowSize, overUnderBarrier]);
}
