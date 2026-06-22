import { hasBarrier, type DigitPreset } from './inbuilt-presets';

export interface StopConditions {
  takeProfit?: number;
  stopLoss?: number;
  maxRuns?: number;
}

export interface ProposalArgs {
  stake: number;
  currency: string;
  symbol: string;
  duration: number;
  preset: DigitPreset;
}

export function buildProposal(args: ProposalArgs): Record<string, unknown> {
  const { stake, currency, symbol, duration, preset } = args;
  const req: Record<string, unknown> = {
    proposal: 1,
    amount: stake,
    basis: 'stake',
    contract_type: preset.contractType,
    currency,
    symbol,
    duration,
    duration_unit: 't',
  };
  if (hasBarrier(preset) && preset.barrier !== undefined) {
    req.barrier = String(preset.barrier);
  }
  return req;
}

export function sanitizeStake(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 100) / 100;
  return rounded >= 1 ? rounded : null;
}

export function evalStop(
  state: { runs: number; sessionPnl: number },
  c: StopConditions,
): string | null {
  if (c.maxRuns !== undefined && state.runs >= c.maxRuns) {
    return `Reached max runs (${c.maxRuns})`;
  }
  if (c.takeProfit !== undefined && state.sessionPnl >= c.takeProfit) {
    return `Take profit hit (+${state.sessionPnl.toFixed(2)})`;
  }
  if (c.stopLoss !== undefined && state.sessionPnl <= -c.stopLoss) {
    return `Stop loss hit (${state.sessionPnl.toFixed(2)})`;
  }
  return null;
}
