import { buildProposal, evalStop, type StopConditions } from './digit-bot-core';
import type { DigitPreset } from './inbuilt-presets';

export interface BotState {
  runs: number;
  sessionPnl: number;
  lastProfit: number | null;
  state: 'running' | 'stopped';
}

export interface RunDigitBotOpts {
  wsUrl: string;
  symbol: string;
  stake: number;
  duration: number;
  currency: string;
  preset: DigitPreset;
  stops: StopConditions;
  onUpdate: (s: BotState) => void;
  onStop: (reason: string) => void;
}

const APP_ID = '65715';
void APP_ID;

export function runDigitBot(opts: RunDigitBotOpts): { stop: () => void } {
  const ws = new WebSocket(opts.wsUrl);
  let cancelled = false;
  let finished = false;
  let runs = 0;
  let sessionPnl = 0;
  let currentContractId: number | null = null;

  const finish = (reason: string) => {
    if (finished) return;
    finished = true;
    opts.onStop(reason);
    try { ws.close(); } catch { /* noop */ }
  };

  const startRound = () => {
    if (cancelled) { finish('Stopped'); return; }
    ws.send(JSON.stringify(buildProposal({
      stake: opts.stake, currency: opts.currency, symbol: opts.symbol,
      duration: opts.duration, preset: opts.preset,
    })));
  };

  ws.onopen = () => ws.send(JSON.stringify({ authorize: '1' }));
  ws.onerror = () => finish('Connection error');
  ws.onclose = () => { if (!finished) { finished = true; opts.onStop('Disconnected'); } };

  ws.onmessage = (ev) => {
    let data: Record<string, unknown>;
    try { data = JSON.parse(ev.data as string); } catch { return; }

    if (data.error) {
      finish(`Error: ${(data.error as { message?: string }).message ?? 'unknown'}`);
      return;
    }
    if (data.authorize) { startRound(); return; }

    if (data.proposal) {
      const p = data.proposal as { id: string; ask_price: number };
      ws.send(JSON.stringify({ buy: p.id, price: p.ask_price }));
      return;
    }
    if (data.buy) {
      const b = data.buy as { contract_id: number };
      currentContractId = b.contract_id;
      ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: b.contract_id, subscribe: 1 }));
      return;
    }
    if (data.proposal_open_contract) {
      const c = data.proposal_open_contract as {
        contract_id: number; is_sold?: number; is_expired?: number; status?: string; profit?: number;
      };
      if (c.contract_id !== currentContractId) return;
      const settled = !!c.is_sold || !!c.is_expired || (c.status && c.status !== 'open');
      if (!settled) return;

      ws.send(JSON.stringify({ forget_all: 'proposal_open_contract' }));
      const profit = typeof c.profit === 'number' ? c.profit : 0;
      runs += 1;
      sessionPnl += profit;
      currentContractId = null;
      opts.onUpdate({ runs, sessionPnl, lastProfit: profit, state: 'running' });

      const reason = cancelled ? 'Stopped' : evalStop({ runs, sessionPnl }, opts.stops);
      if (reason) { finish(reason); return; }
      startRound();
    }
  };

  return { stop: () => { cancelled = true; } };
}
