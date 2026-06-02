import type { Metadata } from 'next';
import { PageFooter } from '@/components/page-footer';

export const metadata: Metadata = {
  title: 'Trading Bots',
  description: 'Automated trading bots for synthetic indices — coming soon to Binary Matix.',
  alternates: { canonical: 'https://binarymatix.com/bots' },
};

const PLANNED = [
  {
    icon: '↕',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: 'Rise & Fall Bot',
    detail: 'Automatically place directional trades based on configurable signal rules.',
  },
  {
    icon: '#',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Digits Bot',
    detail: 'Run digit prediction strategies continuously with stake and stop-loss controls.',
  },
  {
    icon: '↑',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Accumulators Bot',
    detail: 'Set target multipliers and auto-cashout rules for accumulator contracts.',
  },
  {
    icon: '⚙',
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: 'Custom Strategy Builder',
    detail: 'Compose multi-step strategies with conditions, branching, and risk limits — no code required.',
  },
];

export default function Bots() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] pb-14">

      <section className="flex flex-col px-6 pt-16 pb-10 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Coming soon
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 dark:text-violet-400 text-xl font-bold">⚙</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Trading Bots
          </h1>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Automate your strategies without writing a single line of code. Set your rules, define your risk, and let the bot run.
        </p>
      </section>

      {/* Status banner */}
      <section className="px-6 pb-10 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 p-5 flex gap-4 items-start">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 dark:text-violet-400 text-base">🔧</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">In active development</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The bots module is being built. Check this page later for updates, or reach out to support if you have a bot idea you'd like to see implemented!
            </p>
          </div>
        </div>
      </section>

      
      <PageFooter />
    </div>
  );
}
