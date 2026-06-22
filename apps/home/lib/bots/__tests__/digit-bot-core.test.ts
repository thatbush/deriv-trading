import { describe, it, expect } from 'vitest';
import { buildProposal, sanitizeStake, evalStop } from '@/lib/bots/digit-bot-core';
import type { DigitPreset } from '@/lib/bots/inbuilt-presets';

const over5: DigitPreset = { id: 'over-5', label: 'Over 5', contractType: 'DIGITOVER', barrier: 5 };
const even: DigitPreset = { id: 'even', label: 'Even', contractType: 'DIGITEVEN' };

describe('buildProposal', () => {
  it('includes barrier for over/under', () => {
    const p = buildProposal({ stake: 10, currency: 'USD', symbol: 'R_100', duration: 5, preset: over5 });
    expect(p).toMatchObject({
      proposal: 1, amount: 10, basis: 'stake', contract_type: 'DIGITOVER',
      currency: 'USD', symbol: 'R_100', duration: 5, duration_unit: 't', barrier: '5',
    });
  });
  it('omits barrier for even/odd', () => {
    const p = buildProposal({ stake: 10, currency: 'USD', symbol: 'R_100', duration: 5, preset: even });
    expect(p.contract_type).toBe('DIGITEVEN');
    expect('barrier' in p).toBe(false);
  });
});

describe('sanitizeStake', () => {
  it('rounds to 2dp and accepts >= 1', () => {
    expect(sanitizeStake(10.005)).toBe(10.01);
    expect(sanitizeStake(1)).toBe(1);
  });
  it('rejects NaN, infinite, and < 1', () => {
    expect(sanitizeStake(NaN)).toBeNull();
    expect(sanitizeStake(Infinity)).toBeNull();
    expect(sanitizeStake(0.5)).toBeNull();
  });
});

describe('evalStop', () => {
  it('stops on maxRuns first', () => {
    expect(evalStop({ runs: 5, sessionPnl: 0 }, { maxRuns: 5 })).toMatch(/max/i);
  });
  it('stops on take profit', () => {
    expect(evalStop({ runs: 2, sessionPnl: 12 }, { takeProfit: 10 })).toMatch(/profit/i);
  });
  it('stops on stop loss (negative pnl)', () => {
    expect(evalStop({ runs: 2, sessionPnl: -12 }, { stopLoss: 10 })).toMatch(/loss/i);
  });
  it('returns null when no condition met', () => {
    expect(evalStop({ runs: 1, sessionPnl: 3 }, { takeProfit: 10, stopLoss: 10, maxRuns: 5 })).toBeNull();
  });
});
