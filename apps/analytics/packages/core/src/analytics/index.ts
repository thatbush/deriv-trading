/**
 * Analytics computation functions derived from a sliding window of raw tick prices.
 *
 * All functions are pure — they take a prices array and return derived stats.
 * Suitable for use in read-only analytics dashboards and in-tool insight panels.
 *
 * IMPORTANT: These are descriptive statistics over historical ticks only.
 * Synthetic indices are random processes — past distributions do not predict
 * future outcomes. Do not present these as trading recommendations.
 */

export interface DigitDistribution {
  /** Count of occurrences for digits 0-9. */
  counts: number[];
  /** Percentage of occurrences for digits 0-9. */
  percentages: number[];
  /** Which digit appeared most frequently. */
  hotDigit: number;
  /** Which digit appeared least frequently. */
  coldDigit: number;
  /** Total ticks in the window. */
  totalTicks: number;
}

export interface EvenOddStats {
  evenCount: number;
  oddCount: number;
  evenPercent: number;
  oddPercent: number;
  totalTicks: number;
}

export interface OverUnderStats {
  overCount: number;
  underCount: number;
  equalCount: number;
  overPercent: number;
  underPercent: number;
  barrier: number;
  totalTicks: number;
}

export interface MatchDifferStats {
  matchCount: number;
  differCount: number;
  matchPercent: number;
  differPercent: number;
  digit: number;
  totalTicks: number;
}

export interface RiseFallStats {
  riseCount: number;
  fallCount: number;
  flatCount: number;
  risePercent: number;
  fallPercent: number;
  /** Average price change per tick (absolute). */
  avgMove: number;
  totalTicks: number;
}

export interface StreakStats {
  /** Currently running streak. */
  current: {
    type: 'even' | 'odd' | 'rise' | 'fall' | 'none';
    length: number;
  };
  /** Longest even/odd streak seen in the window. */
  longestEven: number;
  longestOdd: number;
  /** Longest rise/fall streak in the window (consecutive higher/lower prices). */
  longestRise: number;
  longestFall: number;
}

export interface RollingHistoryEntry {
  digit: number;
  price: number;
  isEven: boolean;
  /** Whether this tick was higher than the previous one. */
  isRise: boolean | null;
}

/** Extract the last digit from a price given the pip size (decimal places). */
function lastDigit(price: number, pipSize: number): number {
  const str = price.toFixed(pipSize);
  return parseInt(str[str.length - 1], 10);
}

/** Compute digit distribution (0-9 counts and percentages) over a price window. */
export function computeDigitDistribution(prices: number[], pipSize: number): DigitDistribution {
  const counts = new Array(10).fill(0);
  for (const p of prices) counts[lastDigit(p, pipSize)]++;

  const total = prices.length;
  const percentages = counts.map((c) => (total > 0 ? (c / total) * 100 : 0));

  let hotDigit = 0;
  let coldDigit = 0;
  for (let i = 1; i < 10; i++) {
    if (counts[i] > counts[hotDigit]) hotDigit = i;
    if (counts[i] < counts[coldDigit]) coldDigit = i;
  }

  return { counts, percentages, hotDigit, coldDigit, totalTicks: total };
}

/** Compute even/odd split over a price window. */
export function computeEvenOdd(prices: number[], pipSize: number): EvenOddStats {
  let evenCount = 0;
  for (const p of prices) {
    if (lastDigit(p, pipSize) % 2 === 0) evenCount++;
  }
  const total = prices.length;
  const oddCount = total - evenCount;
  return {
    evenCount,
    oddCount,
    evenPercent: total > 0 ? (evenCount / total) * 100 : 0,
    oddPercent: total > 0 ? (oddCount / total) * 100 : 0,
    totalTicks: total,
  };
}

/** Compute over/under a barrier digit over a price window. */
export function computeOverUnder(prices: number[], pipSize: number, barrier: number): OverUnderStats {
  let overCount = 0;
  let underCount = 0;
  let equalCount = 0;
  for (const p of prices) {
    const d = lastDigit(p, pipSize);
    if (d > barrier) overCount++;
    else if (d < barrier) underCount++;
    else equalCount++;
  }
  const total = prices.length;
  return {
    overCount,
    underCount,
    equalCount,
    overPercent: total > 0 ? (overCount / total) * 100 : 0,
    underPercent: total > 0 ? (underCount / total) * 100 : 0,
    barrier,
    totalTicks: total,
  };
}

/** Compute match/differ stats for a chosen digit over a price window. */
export function computeMatchDiffer(prices: number[], pipSize: number, digit: number): MatchDifferStats {
  let matchCount = 0;
  for (const p of prices) {
    if (lastDigit(p, pipSize) === digit) matchCount++;
  }
  const total = prices.length;
  const differCount = total - matchCount;
  return {
    matchCount,
    differCount,
    matchPercent: total > 0 ? (matchCount / total) * 100 : 0,
    differPercent: total > 0 ? (differCount / total) * 100 : 0,
    digit,
    totalTicks: total,
  };
}

/** Compute rise/fall stats over a price window (for accumulators & rise-fall context). */
export function computeRiseFall(prices: number[]): RiseFallStats {
  if (prices.length < 2) {
    return { riseCount: 0, fallCount: 0, flatCount: 0, risePercent: 0, fallPercent: 0, avgMove: 0, totalTicks: prices.length };
  }
  let riseCount = 0;
  let fallCount = 0;
  let flatCount = 0;
  let totalMove = 0;
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) riseCount++;
    else if (diff < 0) fallCount++;
    else flatCount++;
    totalMove += Math.abs(diff);
  }
  const comparisons = prices.length - 1;
  return {
    riseCount,
    fallCount,
    flatCount,
    risePercent: (riseCount / comparisons) * 100,
    fallPercent: (fallCount / comparisons) * 100,
    avgMove: totalMove / comparisons,
    totalTicks: prices.length,
  };
}

/** Compute streak statistics over a price window. */
export function computeStreaks(prices: number[], pipSize: number): StreakStats {
  if (prices.length === 0) {
    return {
      current: { type: 'none', length: 0 },
      longestEven: 0,
      longestOdd: 0,
      longestRise: 0,
      longestFall: 0,
    };
  }

  let longestEven = 0;
  let longestOdd = 0;
  let longestRise = 0;
  let longestFall = 0;

  let curEven = 0;
  let curOdd = 0;
  let curRise = 0;
  let curFall = 0;

  for (let i = 0; i < prices.length; i++) {
    const d = lastDigit(prices[i], pipSize);
    if (d % 2 === 0) {
      curEven++;
      curOdd = 0;
    } else {
      curOdd++;
      curEven = 0;
    }
    if (curEven > longestEven) longestEven = curEven;
    if (curOdd > longestOdd) longestOdd = curOdd;

    if (i > 0) {
      if (prices[i] > prices[i - 1]) {
        curRise++;
        curFall = 0;
      } else if (prices[i] < prices[i - 1]) {
        curFall++;
        curRise = 0;
      }
      if (curRise > longestRise) longestRise = curRise;
      if (curFall > longestFall) longestFall = curFall;
    }
  }

  // Determine current streak type from the end of the window
  let current: StreakStats['current'] = { type: 'none', length: 0 };
  if (curEven > 0 && curEven >= curOdd) {
    current = { type: 'even', length: curEven };
  } else if (curOdd > 0) {
    current = { type: 'odd', length: curOdd };
  }
  // Rise/fall overrides if longer
  if (curRise > current.length) {
    current = { type: 'rise', length: curRise };
  } else if (curFall > current.length) {
    current = { type: 'fall', length: curFall };
  }

  return { current, longestEven, longestOdd, longestRise, longestFall };
}

/** Build a rolling history of the last N entries for display. */
export function computeRollingHistory(
  prices: number[],
  pipSize: number,
  n: number
): RollingHistoryEntry[] {
  const window = prices.slice(-n);
  return window.map((price, i) => {
    const digit = lastDigit(price, pipSize);
    const prev = i > 0 ? window[i - 1] : null;
    return {
      digit,
      price,
      isEven: digit % 2 === 0,
      isRise: prev !== null ? price > prev : null,
    };
  });
}
