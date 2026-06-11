'use client';

import { useEffect, useState } from 'react';

// Bump this key if the wording changes and you want previously-acknowledged users
// to see the updated warning again.
const ACK_KEY = 'bm-risk-warning-ack-v1';

/**
 * One-per-device risk warning shown on first load of the shell. Acknowledgement is
 * stored in localStorage so it never reappears on the same device. Renders nothing
 * until mounted on the client (avoids SSR/hydration mismatch on localStorage).
 */
export function RiskWarningModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(ACK_KEY) !== 'true') setOpen(true);
    } catch {
      // localStorage unavailable (private mode / blocked) — show it this load.
      setOpen(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(ACK_KEY, 'true');
    } catch {
      /* ignore — best effort */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-warning-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop — non-dismissable: the user must acknowledge. */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2
          id="risk-warning-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Risk Warning
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          The products offered on this website include Options, Contracts for
          Difference (&ldquo;<strong>CFDs</strong>&rdquo;), and other complex
          derivatives. Trading Options may not be suitable for everyone. Trading
          CFDs carries a high level of risk since leverage can work both to your
          advantage and disadvantage. As a result, the products offered on the
          website may not be suitable for all investors because of the risk of
          losing all of your invested capital. You should never invest money that
          you cannot afford to lose and never trade with borrowed money. Before
          trading in the complex products offered, please be sure to understand the
          risks involved.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={acknowledge}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
