'use client';

import { useRouter } from 'next/navigation';
import { SUB_APPS } from '@/lib/sub-apps';

const TOOL_DESCRIPTIONS: Record<string, { description: string; detail: string }> = {
  digits: {
    description: 'Predict the last digit of the next tick.',
    detail: 'Fast-paced, tick-by-tick trading on synthetic indices.',
  },
  accumulators: {
    description: 'Grow your stake every tick that stays in range.',
    detail: 'Compounding returns for as long as the market holds.',
  },
  'rise-fall': {
    description: 'Predict whether the market will rise or fall.',
    detail: 'Simple directional trades with defined risk and payout.',
  },
  analytics: {
    description: 'Analyse your trading history and performance.',
    detail: 'Charts, win rates, and streak data across all your trades.',
  },
};

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)]">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Powered by Deriv API
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 max-w-xl leading-tight">
          Trade smarter,<br />on your terms.
        </h1>
        <p className="text-base text-zinc-500 max-w-sm mb-8 leading-relaxed">
          Professional trading tools for synthetic indices, no complexity. Just clean charts and fast execution.
        </p>
        <button
          onClick={() => router.push('/digits')}
          className="px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
        >
          Start trading
        </button>
      </section>

      {/* Tool cards */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-6">
          Available tools
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUB_APPS.filter((app) => app.key !== 'analytics').map((app) => {
            const desc = TOOL_DESCRIPTIONS[app.key];
            return (
              <button
                key={app.path}
                onClick={() => router.push(app.path)}
                className={`group flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-left ${app.brand.hoverBorder} hover:shadow-sm transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl ${app.brand.iconBg} flex items-center justify-center mb-4 flex-shrink-0`}>
                  <span className={`${app.brand.linkColor} text-lg font-bold`}>{app.icon}</span>
                </div>
                <p className="font-semibold mb-1 text-[var(--foreground)]">{app.label}</p>
                <p className="text-sm text-zinc-500 mb-1">{desc?.description}</p>
                <p className="text-xs text-zinc-400 mb-4 flex-1">{desc?.detail}</p>
                <span className={`text-xs font-medium ${app.brand.linkColor} group-hover:underline`}>
                  Open →
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Risk disclaimer */}
      <section className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-500">Risk disclosure.</span>{' '}
            Trading derivatives involves a high level of risk and may not be suitable for all investors. You could lose more than your initial investment. Past performance is not indicative of future results. Only trade with money you can afford to lose. Binary Matix does not provide investment advice.
          </p>
        </div>
      </section>

    </div>
  );
}
