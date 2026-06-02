'use client';

import { useRouter } from 'next/navigation';

const TOOLS = [
  {
    label: 'Digits',
    path: '/digits',
    icon: '#',
    description: 'Predict the last digit of the next tick.',
    detail: 'Fast-paced, tick-by-tick trading on synthetic indices.',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-500',
    linkColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Accumulators',
    path: '/accumulators',
    icon: '↑',
    description: 'Grow your stake every tick that stays in range.',
    detail: 'Compounding returns for as long as the market holds.',
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-500',
    linkColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Rise & Fall',
    path: '/rise-fall',
    icon: '↕',
    description: 'Predict whether the market will rise or fall.',
    detail: 'Simple directional trades with defined risk and payout.',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverBorder: 'hover:border-orange-500',
    linkColor: 'text-orange-600 dark:text-orange-400',
  },
] as const;

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
          {TOOLS.map((tool) => (
            <button
              key={tool.path}
              onClick={() => router.push(tool.path)}
              className={`group flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-left ${tool.hoverBorder} hover:shadow-sm transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4 flex-shrink-0`}>
                <span className={`${tool.iconColor} text-lg font-bold`}>{tool.icon}</span>
              </div>
              <p className="font-semibold mb-1 text-[var(--foreground)]">{tool.label}</p>
              <p className="text-sm text-zinc-500 mb-1">{tool.description}</p>
              <p className="text-xs text-zinc-400 mb-4 flex-1">{tool.detail}</p>
              <span className={`text-xs font-medium ${tool.linkColor} group-hover:underline`}>
                Open →
              </span>
            </button>
          ))}
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
