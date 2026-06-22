'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthContext } from '@/hooks/use-auth-context';
import { PageFooter } from '@/components/page-footer';

interface Prediction {
  market: string;
  timeframe: string;
  risePercent: number;
  fallPercent: number;
  text: string;
}

type Dir = 'RISE' | 'FALL';
type Toast = { kind: 'success' | 'error'; msg: string };

function marketTextToSymbol(market: string): string | null {
  const m = market.toLowerCase();

  if (m.includes('vol') || m.includes('volatility')) {
    const is1s = m.includes('1s') || m.includes('1hz');
    for (const n of ['100', '75', '50', '25', '10']) {
      if (m.includes(n)) return is1s ? `1HZ${n}V` : `R_${n}`;
    }
    if (!is1s) {
      for (const n of ['300', '200', '150']) {
        if (m.includes(n)) return `R_${n}`;
      }
    }
    return null;
  }

  if (m.includes('eur') && m.includes('usd')) return 'frxEURUSD';
  if (m.includes('gbp') && m.includes('usd')) return 'frxGBPUSD';
  if (m.includes('aud') && m.includes('usd')) return 'frxAUDUSD';
  if (m.includes('usd') && m.includes('jpy')) return 'frxUSDJPY';

  if (m.includes('btc') || m.includes('bitcoin')) return 'cryBTCUSD';
  if (m.includes('eth') || m.includes('ethereum')) return 'cryETHUSD';
  if (m.includes('ltc') || m.includes('litecoin')) return 'cryLTCUSD';

  return null;
}

function durationToMinutes(tf: string): number {
  const value = parseInt(tf, 10);
  if (Number.isNaN(value)) return 5;
  const unit = tf.slice(-1).toLowerCase();
  if (unit === 'm') return value;
  if (unit === 'h') return value * 60;
  if (unit === 'd') return value * 1440;
  return 5;
}

function parseAnalysis(text: string): Prediction {
  const market = text.match(/market:?\s*([^,\n]+)/i)?.[1]?.trim() || 'Unknown Market';

  const tfRaw = text.match(/timeframe:?\s*([^,\n]+)/i)?.[1] ?? '';
  let timeframe = '5m';
  const tfl = tfRaw.toLowerCase();
  const num = (def: number) => parseInt(tfl.match(/\d+/)?.[0] ?? String(def), 10);
  if (tfl.includes('minute') || tfl.includes('min')) timeframe = `${num(5)}m`;
  else if (tfl.includes('hour') || tfl.includes('hr')) timeframe = `${num(1)}h`;
  else if (tfl.includes('day')) timeframe = `${num(1)}d`;

  const risePercent = parseInt(text.match(/rise:?\s*(\d+)%/i)?.[1] ?? '50', 10);
  const fallPercent = parseInt(text.match(/fall:?\s*(\d+)%/i)?.[1] ?? '50', 10);

  return { market, timeframe, risePercent, fallPercent, text };
}

export default function AiBots() {
  const { authState, activeAccount, getFreshWsUrl } = useAuthContext();
  const isAuthed = authState === 'authenticated';

  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pred, setPred] = useState<Prediction | null>(null);
  const [amount, setAmount] = useState(10);
  const [trading, setTrading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirm, setConfirm] = useState<Dir | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((kind: Toast['kind'], msg: string) => {
    setToast({ kind, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setPred(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/bots/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Analysis failed');
        return;
      }
      setPred(parseAnalysis(data.text));
    } catch {
      showToast('error', 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const runTrade = async (dir: Dir) => {
    if (!pred) return;
    if (!isAuthed || !activeAccount) {
      showToast('error', 'Log in to place trades');
      return;
    }
    const symbol = marketTextToSymbol(pred.market);
    if (!symbol) {
      showToast('error', `Market "${pred.market}" not recognized`);
      return;
    }
    // Sanitize stake: Deriv rejects NaN/non-finite/zero and excess precision.
    const stake = Math.round(amount * 100) / 100;
    if (!Number.isFinite(stake) || stake < 1) {
      showToast('error', 'Enter a valid amount (min 1)');
      return;
    }

    setTrading(true);
    const wsUrl = await getFreshWsUrl();
    if (!wsUrl) {
      showToast('error', 'Not authenticated');
      setTrading(false);
      return;
    }

    const ws = new WebSocket(wsUrl);
    let settled = false;
    const finish = (kind: Toast['kind'], msg: string) => {
      if (settled) return;
      settled = true;
      showToast(kind, msg);
      setTrading(false);
      try { ws.close(); } catch {}
    };

    ws.onopen = () => ws.send(JSON.stringify({ authorize: '1' }));
    ws.onerror = () => finish('error', 'Connection error');
    ws.onclose = () => { if (!settled) { settled = true; setTrading(false); } };
    ws.onmessage = (ev) => {
      let data: Record<string, unknown>;
      try { data = JSON.parse(ev.data); } catch { return; }
      if (data.error) {
        finish('error', (data.error as { message?: string }).message || 'Trade error');
        return;
      }
      if (data.authorize) {
        ws.send(JSON.stringify({
          proposal: 1,
          amount: stake,
          basis: 'stake',
          contract_type: dir === 'RISE' ? 'CALL' : 'PUT',
          currency: activeAccount.currency,
          underlying_symbol: symbol,
          duration: durationToMinutes(pred.timeframe),
          duration_unit: 'm',
        }));
      } else if (data.proposal) {
        const p = data.proposal as { id: string; ask_price: number };
        ws.send(JSON.stringify({ buy: p.id, price: p.ask_price }));
      } else if (data.buy) {
        const b = data.buy as { transaction_id: number };
        finish('success', `Trade placed (${dir}) — #${b.transaction_id}`);
      }
    };
  };

  const attemptTrade = (dir: Dir) => {
    if (!pred) return;
    const against =
      (dir === 'RISE' && pred.fallPercent > pred.risePercent) ||
      (dir === 'FALL' && pred.risePercent > pred.fallPercent);
    if (against) setConfirm(dir);
    else runTrade(dir);
  };

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] pb-14">
      <section className="flex flex-col px-6 pt-16 pb-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 dark:text-violet-400 text-xl font-bold">✦</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            AI Market Analysis
          </h1>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Upload a chart screenshot and let AI analyze it. The AI only advises — you place the trade.
        </p>
      </section>

      <section className="px-6 pb-10 max-w-2xl mx-auto w-full">
        {/* Darker themed card — matches Rise & Fall card-over-background look */}
        <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-4 sm:p-5 space-y-5">
          {/* Account strip */}
          <div className="rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-4 text-sm">
            {isAuthed && activeAccount ? (
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {activeAccount.account_type === 'demo' ? 'Demo' : 'Real'} · {activeAccount.account_id}
                </span>
                <span className="font-semibold">
                  {activeAccount.balance} {activeAccount.currency}
                </span>
              </div>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">Log in (top-right) to place trades.</span>
            )}
          </div>

          {/* Upload */}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center hover:border-[rgb(0,195,144)] transition-colors"
          >
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Chart preview" className="mx-auto max-h-64 rounded-lg" />
                <p className="text-xs text-zinc-500 mt-3">Tap to change image</p>
              </>
            ) : (
              <p className="text-sm text-zinc-500">Tap to upload a chart screenshot</p>
            )}
          </button>

          {image && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="w-full rounded-full bg-[rgb(0,195,144)] hover:bg-[rgb(0,175,130)] disabled:opacity-60 text-white font-semibold py-3 transition-colors"
            >
              {analyzing ? 'Analyzing…' : 'Analyze chart'}
            </button>
          )}

          {/* Prediction */}
          {pred && (
            <div className="rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{pred.market}</p>
                  <p className="text-xs text-zinc-500">Timeframe: {pred.timeframe}</p>
                </div>
                <div className="text-right text-sm font-semibold">
                  <p className="text-emerald-500">Rise {pred.risePercent}%</p>
                  <p className="text-red-500">Fall {pred.fallPercent}%</p>
                </div>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {pred.text}
              </p>

              <label className="block text-sm">
                <span className="text-zinc-500">Amount</span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => { const n = Number(e.target.value); setAmount(Number.isFinite(n) ? n : 0); }}
                  className="mt-1 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => attemptTrade('RISE')}
                  disabled={trading || !isAuthed}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 transition-colors"
                >
                  {trading ? 'Processing…' : `Rise (${pred.timeframe})`}
                </button>
                <button
                  onClick={() => attemptTrade('FALL')}
                  disabled={trading || !isAuthed}
                  className="rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 transition-colors"
                >
                  {trading ? 'Processing…' : `Fall (${pred.timeframe})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <PageFooter />

      {/* Against-prediction modal */}
      {confirm && pred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--background)] border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <p className="text-sm leading-relaxed">
              AI favors {confirm === 'RISE' ? 'FALL' : 'RISE'} (
              {confirm === 'RISE' ? pred.fallPercent : pred.risePercent}%) /{' '}
              {confirm === 'RISE' ? 'RISE' : 'FALL'} (
              {confirm === 'RISE' ? pred.risePercent : pred.fallPercent}%) — you chose {confirm}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => { const d = confirm; setConfirm(null); runTrade(d); }}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-2 font-semibold transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
            toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
