'use client';

import { useCallback } from 'react';

const TOOLS = [
  {
    label: 'Digits',
    path: '/digits',
    icon: '#',
    description: 'Predict the last digit of the next tick.',
    iconBg: 'bg-emerald-950',
    iconColor: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-600',
    linkColor: 'text-emerald-500',
  },
  {
    label: 'Accumulators',
    path: '/accumulators',
    icon: '↑',
    description: 'Grow your stake every tick that stays in range.',
    iconBg: 'bg-violet-950',
    iconColor: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500',
    linkColor: 'text-violet-400',
  },
  {
    label: 'Rise & Fall',
    path: '/rise-fall',
    icon: '↕',
    description: 'Predict whether the market will rise or fall.',
    iconBg: 'bg-orange-950',
    iconColor: 'text-orange-400',
    hoverBorder: 'hover:border-orange-500',
    linkColor: 'text-orange-400',
  },
] as const;

export default function Home() {
  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-semibold mb-1">Trading tools</h1>
        <p className="text-zinc-500 mb-8 text-sm">Powered by Deriv API. Choose a market to start.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {TOOLS.map((tool) => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className={`group border border-zinc-300 dark:border-zinc-800 rounded-2xl p-5 text-left ${tool.hoverBorder} transition-colors`}
            >
              <div className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center mb-4`}>
                <span className={`${tool.iconColor} text-lg`}>{tool.icon}</span>
              </div>
              <p className="font-medium mb-1">{tool.label}</p>
              <p className="text-sm text-zinc-500 mb-4">{tool.description}</p>
              <span className={`text-sm ${tool.linkColor} group-hover:underline`}>Open →</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-400">
          Trading derivatives involves risk. Only trade with money you can afford to lose.
        </p>
      </div>
    </div>
  );
}
