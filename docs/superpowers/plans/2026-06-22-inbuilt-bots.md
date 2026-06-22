# Inbuilt Bots (`/bots/inbuilt`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/bots/inbuilt` coming-soon stub with a page of preset digit-contract bots that repeatedly trade with flat stake until a take-profit / stop-loss / max-runs condition (or manual Stop) is hit.

**Architecture:** Fully client-side in `apps/home`, reusing the AI page's auth pattern (`useAuthContext` + `getFreshWsUrl`). A framework-agnostic engine (`digit-bot.ts`) drives a single authenticated WebSocket through a buy→settle→repeat loop, tracking each contract's settled `profit` via a `proposal_open_contract` subscription. Self-contained — no imports from `apps/digits`, no server.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Deriv WebSocket API (app_id 65715), Vitest (already configured in `apps/home`).

**Spec:** `docs/superpowers/specs/2026-06-22-inbuilt-bots-design.md`

## Global Constraints

- All trading via Deriv WebSocket API, app_id `65715` (matches the rest of the platform).
- `apps/home` has NO shadcn/ui components and only `--background`/`--foreground` CSS vars. Use raw Tailwind. Match the AI page / Rise & Fall darker-card look: card `bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10`, insets `bg-zinc-200/60 dark:bg-zinc-800`, primary pill `rounded-full bg-[rgb(0,195,144)]`.
- Bash is Git Bash on Windows; prefix commands with `cd /c/Users/busie/deriv-trading/apps/home && ...`.
- Tests live at `apps/home/lib/**/*.test.ts`; run with `npm test` from `apps/home`.
- Terse code, minimal comments (per `apps/home/AGENTS.md`).
- Stake sanitization: finite, ≥ 1, rounded to 2dp (same rule as the AI page).
- Stop-condition check order: maxRuns → takeProfit → stopLoss.

---

## Task 1: Presets data + bot types

**Files:**
- Create: `apps/home/lib/bots/inbuilt-presets.ts`
- Test: `apps/home/lib/bots/__tests__/inbuilt-presets.test.ts`

**Interfaces:**
- Produces:
  - `type DigitContractType = 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD'`
  - `interface DigitPreset { id: string; label: string; contractType: DigitContractType; barrier?: number }`
  - `const INBUILT_PRESETS: DigitPreset[]`
  - `function hasBarrier(p: DigitPreset): boolean` — true for OVER/UNDER, false for EVEN/ODD

- [ ] **Step 1: Write the failing test**

Create `apps/home/lib/bots/__tests__/inbuilt-presets.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { INBUILT_PRESETS, hasBarrier } from '@/lib/bots/inbuilt-presets';

describe('INBUILT_PRESETS', () => {
  it('contains the seeded presets with correct contract types/barriers', () => {
    const byLabel = Object.fromEntries(INBUILT_PRESETS.map((p) => [p.label, p]));
    expect(byLabel['Under 9']).toMatchObject({ contractType: 'DIGITUNDER', barrier: 9 });
    expect(byLabel['Over 5']).toMatchObject({ contractType: 'DIGITOVER', barrier: 5 });
    expect(byLabel['Even']).toMatchObject({ contractType: 'DIGITEVEN' });
    expect(byLabel['Even'].barrier).toBeUndefined();
  });

  it('has unique ids', () => {
    const ids = INBUILT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('hasBarrier', () => {
  it('true for over/under, false for even/odd', () => {
    expect(hasBarrier({ id: 'a', label: 'Over 5', contractType: 'DIGITOVER', barrier: 5 })).toBe(true);
    expect(hasBarrier({ id: 'b', label: 'Even', contractType: 'DIGITEVEN' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npm test`
Expected: FAIL ("Cannot find module '@/lib/bots/inbuilt-presets'").

- [ ] **Step 3: Write the implementation**

Create `apps/home/lib/bots/inbuilt-presets.ts`:
```ts
export type DigitContractType = 'DIGITOVER' | 'DIGITUNDER' | 'DIGITEVEN' | 'DIGITODD';

export interface DigitPreset {
  id: string;
  label: string;
  contractType: DigitContractType;
  barrier?: number;
}

export const INBUILT_PRESETS: DigitPreset[] = [
  { id: 'over-0', label: 'Over 0', contractType: 'DIGITOVER', barrier: 0 },
  { id: 'over-5', label: 'Over 5', contractType: 'DIGITOVER', barrier: 5 },
  { id: 'under-9', label: 'Under 9', contractType: 'DIGITUNDER', barrier: 9 },
  { id: 'under-5', label: 'Under 5', contractType: 'DIGITUNDER', barrier: 5 },
  { id: 'even', label: 'Even', contractType: 'DIGITEVEN' },
  { id: 'odd', label: 'Odd', contractType: 'DIGITODD' },
];

export function hasBarrier(p: DigitPreset): boolean {
  return p.contractType === 'DIGITOVER' || p.contractType === 'DIGITUNDER';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/home/lib/bots/inbuilt-presets.ts apps/home/lib/bots/__tests__/inbuilt-presets.test.ts
git commit -m "feat: inbuilt bot presets"
```
(End commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

## Task 2: Pure helpers — proposal shaping + stop evaluation

These are the two pieces of `digit-bot.ts` worth unit-testing in isolation, extracted as
pure functions so the engine (Task 3) composes them.

**Files:**
- Create: `apps/home/lib/bots/digit-bot-core.ts`
- Test: `apps/home/lib/bots/__tests__/digit-bot-core.test.ts`

**Interfaces:**
- Consumes: `DigitPreset`, `hasBarrier` from `./inbuilt-presets`.
- Produces:
  - `interface StopConditions { takeProfit?: number; stopLoss?: number; maxRuns?: number }`
  - `interface ProposalArgs { stake: number; currency: string; symbol: string; duration: number; preset: DigitPreset }`
  - `function buildProposal(args: ProposalArgs): Record<string, unknown>` — the Deriv `proposal` request object (barrier present only when `hasBarrier`).
  - `function sanitizeStake(n: number): number | null` — finite & ≥1 → rounded 2dp; else null.
  - `function evalStop(state: { runs: number; sessionPnl: number }, c: StopConditions): string | null` — returns a stop reason string or null. Order: maxRuns → takeProfit → stopLoss.

- [ ] **Step 1: Write the failing test**

Create `apps/home/lib/bots/__tests__/digit-bot-core.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npm test`
Expected: FAIL ("Cannot find module '@/lib/bots/digit-bot-core'").

- [ ] **Step 3: Write the implementation**

Create `apps/home/lib/bots/digit-bot-core.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/home/lib/bots/digit-bot-core.ts apps/home/lib/bots/__tests__/digit-bot-core.test.ts
git commit -m "feat: digit bot core helpers (proposal, stake, stop eval)"
```
(End commit message with the Co-Authored-By trailer.)

---

## Task 3: Bot engine (WebSocket loop)

**Files:**
- Create: `apps/home/lib/bots/digit-bot.ts`

**Interfaces:**
- Consumes: `buildProposal`, `evalStop`, `StopConditions` from `./digit-bot-core`; `DigitPreset` from `./inbuilt-presets`.
- Produces:
  - `interface BotState { runs: number; sessionPnl: number; lastProfit: number | null; state: 'running' | 'stopped' }`
  - `interface RunDigitBotOpts { wsUrl: string; symbol: string; stake: number; duration: number; currency: string; preset: DigitPreset; stops: StopConditions; onUpdate: (s: BotState) => void; onStop: (reason: string) => void }`
  - `function runDigitBot(opts: RunDigitBotOpts): { stop: () => void }`

- [ ] **Step 1: Write the implementation**

Create `apps/home/lib/bots/digit-bot.ts`:
```ts
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
```

- [ ] **Step 2: Verify it typechecks**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

NOTE: The OTP socket authenticates on connect; this sends `{authorize:'1'}` first (same as the
AI page). If live testing (Task 5) shows the socket never emits `authorize`, change `ws.onopen`
to call `startRound()` directly. This is the one behavior to confirm live.

- [ ] **Step 3: Commit**

```bash
git add apps/home/lib/bots/digit-bot.ts
git commit -m "feat: digit bot websocket loop engine"
```
(End commit message with the Co-Authored-By trailer.)

---

## Task 4: The `/bots/inbuilt` page

**Files:**
- Modify (replace contents): `apps/home/app/bots/inbuilt/page.tsx`

**Interfaces:**
- Consumes: `INBUILT_PRESETS`, `DigitPreset` from `@/lib/bots/inbuilt-presets`; `sanitizeStake` from `@/lib/bots/digit-bot-core`; `runDigitBot`, `BotState` from `@/lib/bots/digit-bot`; `useAuthContext` from `@/hooks/use-auth-context`.

- [ ] **Step 1: Replace the page**

Replace the entire contents of `apps/home/app/bots/inbuilt/page.tsx`:
```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { useAuthContext } from '@/hooks/use-auth-context';
import { PageFooter } from '@/components/page-footer';
import { INBUILT_PRESETS, type DigitPreset } from '@/lib/bots/inbuilt-presets';
import { sanitizeStake } from '@/lib/bots/digit-bot-core';
import { runDigitBot, type BotState } from '@/lib/bots/digit-bot';

const SYMBOLS = [
  { value: 'R_10', label: 'Volatility 10' },
  { value: 'R_25', label: 'Volatility 25' },
  { value: 'R_50', label: 'Volatility 50' },
  { value: 'R_75', label: 'Volatility 75' },
  { value: 'R_100', label: 'Volatility 100' },
  { value: '1HZ100V', label: 'Volatility 100 (1s)' },
];

type Toast = { kind: 'success' | 'error'; msg: string };
const numOrUndef = (s: string) => (s.trim() === '' ? undefined : Number(s));

export default function InbuiltBots() {
  const { authState, activeAccount, getFreshWsUrl } = useAuthContext();
  const isAuthed = authState === 'authenticated';

  const [preset, setPreset] = useState<DigitPreset>(INBUILT_PRESETS[0]);
  const [symbol, setSymbol] = useState('R_100');
  const [stake, setStake] = useState('10');
  const [duration, setDuration] = useState('5');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [maxRuns, setMaxRuns] = useState('');

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<BotState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const botRef = useRef<{ stop: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((kind: Toast['kind'], msg: string) => {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const run = async () => {
    if (!isAuthed || !activeAccount) { showToast('error', 'Log in to run bots'); return; }
    const cleanStake = sanitizeStake(Number(stake));
    if (cleanStake === null) { showToast('error', 'Enter a valid stake (min 1)'); return; }
    const dur = Math.min(Math.max(parseInt(duration, 10) || 5, 1), 10);

    setRunning(true);
    setStatus({ runs: 0, sessionPnl: 0, lastProfit: null, state: 'running' });
    const wsUrl = await getFreshWsUrl();
    if (!wsUrl) { showToast('error', 'Not authenticated'); setRunning(false); return; }

    botRef.current = runDigitBot({
      wsUrl, symbol, stake: cleanStake, duration: dur, currency: activeAccount.currency, preset,
      stops: { takeProfit: numOrUndef(takeProfit), stopLoss: numOrUndef(stopLoss), maxRuns: numOrUndef(maxRuns) },
      onUpdate: (s) => setStatus(s),
      onStop: (reason) => {
        setRunning(false);
        setStatus((prev) => (prev ? { ...prev, state: 'stopped' } : prev));
        showToast(reason.startsWith('Error') || reason.includes('loss') ? 'error' : 'success', reason);
      },
    });
  };

  const stop = () => botRef.current?.stop();

  const inputCls = 'mt-1 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm';

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] pb-14">
      <section className="flex flex-col px-6 pt-16 pb-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-600 dark:text-amber-400 text-xl font-bold">★</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">Inbuilt Bots</h1>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Pick a ready-made bot and run it. It trades continuously until your stop conditions are hit.
        </p>
      </section>

      <section className="px-6 pb-10 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-4 sm:p-5 space-y-5">
          {/* Account strip */}
          <div className="rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-4 text-sm">
            {isAuthed && activeAccount ? (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {activeAccount.account_type === 'demo' ? 'Demo' : 'Real'} · {activeAccount.account_id}
                </span>
                <span className="font-semibold">{activeAccount.balance} {activeAccount.currency}</span>
              </div>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">Log in (top-right) to run bots.</span>
            )}
          </div>

          {/* Preset grid */}
          <div className="grid grid-cols-3 gap-2">
            {INBUILT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p)}
                disabled={running}
                className={`rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                  preset.id === p.id
                    ? 'bg-[rgb(0,195,144)] text-white'
                    : 'bg-zinc-200/60 dark:bg-zinc-800 hover:bg-zinc-300/60 dark:hover:bg-zinc-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Settings */}
          <div className="rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-4 grid grid-cols-2 gap-3">
            <label className="block text-sm col-span-2">
              <span className="text-zinc-500">Market</span>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={running} className={inputCls}>
                {SYMBOLS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-zinc-500">Stake</span>
              <input type="number" min={1} step="0.01" value={stake} onChange={(e) => setStake(e.target.value)} disabled={running} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-500">Duration (ticks)</span>
              <input type="number" min={1} max={10} value={duration} onChange={(e) => setDuration(e.target.value)} disabled={running} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-500">Take profit (opt)</span>
              <input type="number" min={0} step="0.01" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} disabled={running} className={inputCls} />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-500">Stop loss (opt)</span>
              <input type="number" min={0} step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} disabled={running} className={inputCls} />
            </label>
            <label className="block text-sm col-span-2">
              <span className="text-zinc-500">Max runs (opt)</span>
              <input type="number" min={1} value={maxRuns} onChange={(e) => setMaxRuns(e.target.value)} disabled={running} className={inputCls} />
            </label>
          </div>

          {/* Status */}
          {status && (
            <div className="rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-4 text-sm flex items-center justify-between">
              <span className="text-zinc-500">Runs: <span className="font-semibold text-[var(--foreground)]">{status.runs}</span></span>
              <span className="text-zinc-500">
                Session P/L:{' '}
                <span className={`font-semibold ${status.sessionPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {status.sessionPnl.toFixed(2)} {activeAccount?.currency ?? ''}
                </span>
              </span>
              <span className="text-zinc-500">{status.state}</span>
            </div>
          )}

          {/* Run / Stop */}
          {running ? (
            <button onClick={stop} className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-colors">
              Stop bot
            </button>
          ) : (
            <button onClick={run} disabled={!isAuthed} className="w-full rounded-full bg-[rgb(0,195,144)] hover:bg-[rgb(0,175,130)] disabled:opacity-60 text-white font-semibold py-3 transition-colors">
              Run {preset.label}
            </button>
          )}
        </div>
      </section>

      <PageFooter />

      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (If `activeAccount` field names differ, the authoritative shape is
`{ account_id, account_type, currency, balance }`.)

- [ ] **Step 3: Verify it lints**

Run: `cd /c/Users/busie/deriv-trading/apps/home && npx eslint app/bots/inbuilt/page.tsx`
Expected: no errors (pre-existing project warnings elsewhere are fine).

- [ ] **Step 4: Commit**

```bash
git add apps/home/app/bots/inbuilt/page.tsx
git commit -m "feat: inbuilt bots page"
```
(End commit message with the Co-Authored-By trailer.)

---

## Task 5: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Run the app**

Run from `apps/home`: `npm run dev`. Open `http://localhost:3000/bots/inbuilt`.

- [ ] **Step 2: Switch to a DEMO account**

Log in (top-right), switch the shell header to a **demo** account. Never verify with real funds.

- [ ] **Step 3: Run a preset with Max runs = 3**

Pick "Under 9", symbol Volatility 100, stake 10, duration 5, Max runs 3. Tap Run.
Expected: Runs increments 1→2→3, Session P/L updates each settle, bot auto-stops with
"Reached max runs (3)" toast. **Confirm the `{authorize:'1'}` handshake works** — if Runs
never increments and nothing happens, apply the Task 3 Step 2 fallback (call `startRound()`
directly in `ws.onopen`) and re-test.

- [ ] **Step 4: Verify take-profit and stop-loss**

Run with a small Take profit (e.g. 1) — expect it to stop once cumulative P/L ≥ 1.
Run with a small Stop loss (e.g. 1) — expect it to stop once cumulative P/L ≤ -1.

- [ ] **Step 5: Verify manual Stop**

Run with no stop conditions; tap Stop. Expect it to stop after the current contract settles
(not instantly — this is expected for tick contracts).

- [ ] **Step 6: Final commit (only if fixes were applied)**

```bash
git add -A
git commit -m "fix: inbuilt bots e2e verification adjustments"
```
(End commit message with the Co-Authored-By trailer.)

---

## Notes for the implementer

- Deriv API only, app_id `65715`. OTP socket from `getFreshWsUrl()` authenticates on connect.
- Self-contained in `apps/home`; do NOT import from `apps/digits`.
- The `proposal_open_contract` subscription is how each contract's `profit` is read — this is
  the one mechanism that's new versus the fire-and-forget AI page.
- Do not add martingale, server-side running, or persistence — all out of scope.
