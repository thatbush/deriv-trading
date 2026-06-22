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
  const { authState, activeAccount, getFreshWsUrl, updateBalance } = useAuthContext();
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
      onUpdate: (s, balanceAfter) => {
        setStatus(s);
        if (balanceAfter && activeAccount) updateBalance(activeAccount.account_id, balanceAfter);
      },
      onStop: (reason, balanceAfter) => {
        setRunning(false);
        setStatus((prev) => (prev ? { ...prev, state: 'stopped' } : prev));
        if (balanceAfter && activeAccount) updateBalance(activeAccount.account_id, balanceAfter);
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
