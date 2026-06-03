'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUB_APPS } from '@/lib/sub-apps';
import { useTenant } from '@/hooks/use-tenant';

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
};

const STATS = [
  { value: '3', label: 'Trading tools' },
  { value: '24/7', label: 'Market access' },
  { value: '<100ms', label: 'Execution' },
  { value: 'Free', label: 'Platform fees' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign in with Deriv',
    body: "Authenticate via Deriv's official OAuth 2.0. No passwords stored — grant access in seconds, revoke it anytime.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    accent: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    step: '02',
    title: 'Choose your tool',
    body: 'Digits, Accumulators, or Rise & Fall. Each is a focused interface built for that contract type — no noise.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    accent: 'text-violet-500 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-950',
  },
  {
    step: '03',
    title: 'Set stake & execute',
    body: "Configure your prediction, set your stake, and trade. Balance updates in real time. You're always in control.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    accent: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
  },
];

const FEATURES = [
  {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    title: 'OAuth secured',
    body: "Deriv's own OAuth 2.0 — we never see your password. Revoke access anytime from your Deriv settings.",
  },
  {
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    title: 'Fast execution',
    body: 'Trades hit the Deriv API in under 100ms. No lag between your decision and the market.',
  },
  {
    iconBg: 'bg-sky-50 dark:bg-sky-950',
    iconColor: 'text-sky-600 dark:text-sky-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>,
    title: 'Live analytics',
    body: 'Digit frequency, even/odd splits, tick history, and win rate — updating live as the market moves.',
  },
  {
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
    title: 'Trade history',
    body: 'Every contract logged. Review performance, spot patterns, and sharpen your strategy over time.',
  },
  {
    iconBg: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    title: 'Trading bots',
    body: 'Automated strategies coming soon. Set rules, define risk limits, let the bot run while you step away.',
  },
  {
    iconBg: 'bg-pink-50 dark:bg-pink-950',
    iconColor: 'text-pink-600 dark:text-pink-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    title: 'Zero fees',
    body: 'The platform is completely free. Your only cost is the stake you put into each trade.',
  },
];

const FAQ: Array<{
  q: string;
  a: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  cta?: { label: string };
  pinned?: boolean;
}> = [
  {
    q: 'Do I need a Deriv account?',
    a: "Yes. This platform connects to your Deriv account via their official OAuth system. You're redirected to Deriv to log in — we never see your password.",
    iconBg: 'bg-yellow-50 dark:bg-yellow-950',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  },
  {
    q: "My old Deriv account isn't working. Why?",
    a: 'Older Deriv accounts created before the OAuth upgrade are not compatible with the new authentication system. You need to create a new Deriv account.',
    iconBg: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    cta: { label: 'Create a new Deriv account' },
    pinned: true,
  },
  {
    q: 'Is this free to use?',
    a: 'Completely free. You only need funds in your Deriv account to place trades. No platform fees, no subscriptions.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    q: 'Which contract types are supported?',
    a: 'Digits (match/differ/over/under/even/odd), Accumulators, and Rise & Fall. More contract types and automated strategies are in development.',
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    q: 'Are my funds safe?',
    a: 'Your funds stay in your Deriv account at all times. This platform never holds or moves money — it only places trades via the access you grant.',
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  },
  {
    q: 'Is there a mobile app?',
    a: 'This is a progressive web app. Open it in any browser on iOS or Android and add it to your home screen — no app store needed.',
    iconBg: 'bg-sky-50 dark:bg-sky-950',
    iconColor: 'text-sky-600 dark:text-sky-400',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" /></svg>,
  },
];

function FaqSection() {
  const [open, setOpen] = useState<string | null>(null);
  const tenant = useTenant();

  return (
    <section className="px-6 pb-20 max-w-3xl mx-auto w-full">
      <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-3">FAQ</p>
      <h2 className="text-2xl font-light tracking-tight mb-8 text-[var(--foreground)]">Got questions? <span className="font-semibold">We have answers.</span></h2>
      <div className="flex flex-col gap-2">
        {FAQ.map((item) => {
          const isPinned = item.pinned === true;
          const isOpen = isPinned || open === item.q;

          return (
            <div
              key={item.q}
              className={[
                'rounded-2xl border overflow-hidden transition-all duration-200',
                isPinned
                  ? 'border-orange-200 dark:border-orange-800/60 bg-orange-50/60 dark:bg-orange-950/30'
                  : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50',
              ].join(' ')}
            >
              {/* Header row */}
              <button
                onClick={() => !isPinned && setOpen(isOpen ? null : item.q)}
                className={[
                  'w-full flex items-center gap-4 p-5 text-left',
                  isPinned ? 'cursor-default' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors',
                ].join(' ')}
              >
                <span className={`w-8 h-8 flex items-center justify-center shrink-0 rounded-lg ${item.iconBg} ${item.iconColor}`}>
                  {item.icon}
                </span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isPinned ? 'text-orange-700 dark:text-orange-300' : 'text-[var(--foreground)]'}`}>
                    {item.q}
                  </p>
                  {isPinned && (
                    <span className="shrink-0 text-[10px] font-semibold tracking-wide uppercase bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 rounded-full px-2 py-0.5">
                      Read this first
                    </span>
                  )}
                </div>
                {!isPinned && (
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-5 pb-5 pl-[4.25rem]">
                  <p className={`text-sm leading-relaxed font-light ${isPinned ? 'text-orange-700/80 dark:text-orange-300/80' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {item.a}
                  </p>
                  {item.cta && tenant.faqAffiliateLink && (
                    <a
                      href={tenant.faqAffiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {item.cta.label} →
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const tenant = useTenant();

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)]">

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="w-[600px] h-[300px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl -translate-y-1/4" />
        </div>

        <span className="relative inline-flex items-center gap-2 text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live · Powered by Deriv API
        </span>

        <h1 className="relative text-[2.75rem] sm:text-[4rem] font-light tracking-tight mb-6 max-w-2xl leading-[1.1] text-[var(--foreground)]">
          Synthetic indices trading,{' '}
          <span className="font-semibold">built to be fast.</span>
        </h1>

        <p className="relative text-[15px] text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 leading-relaxed font-light">
          Professional tools for Digits, Accumulators, and Rise & Fall contracts. Clean interface, real-time data, zero platform fees.
        </p>

        <div className="relative flex flex-wrap items-center justify-center gap-3 mb-16">
          <button
            onClick={() => router.push('/digits')}
            className="px-6 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-white transition-colors shadow-sm"
          >
            Start trading
          </button>
          {tenant.affiliateLink && (
            <a
              href={tenant.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Become an affiliate
            </a>
          )}
        </div>

        {/* Stats — inline, no boxes */}
        <div className="relative flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-8 sm:gap-12">
              <div className="text-center">
                <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{s.value}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 tracking-wide">{s.label}</p>
              </div>
              {i < STATS.length - 1 && <div className="hidden sm:block w-px h-8 bg-zinc-200 dark:bg-zinc-800" />}
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/60" />
      </div>

      {/* How it works */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-3">How it works</p>
        <h2 className="text-2xl font-light tracking-tight mb-12 text-[var(--foreground)]">Up and trading in <span className="font-semibold">three steps.</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${step.iconBg} ${step.accent} flex items-center justify-center flex-shrink-0`}>
                  {step.icon}
                </div>
                <span className="text-[11px] font-mono font-medium text-zinc-300 dark:text-zinc-600">{step.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] mb-1.5">{step.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/60" />
      </div>

      {/* Tool cards */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-3">Trading tools</p>
        <h2 className="text-2xl font-light tracking-tight mb-10 text-[var(--foreground)]">Everything you need, <span className="font-semibold">nothing you don't.</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUB_APPS.filter((app) => app.key !== 'analytics').map((app) => {
            const desc = TOOL_DESCRIPTIONS[app.key];
            return (
              <button
                key={app.path}
                onClick={() => router.push(app.path)}
                className={`group flex flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 text-left ${app.brand.hoverBorder} hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className={`w-9 h-9 rounded-xl ${app.brand.iconBg} flex items-center justify-center mb-4 flex-shrink-0`}>
                  <span className={`${app.brand.linkColor} text-base font-bold`}>{app.icon}</span>
                </div>
                <p className="text-sm font-semibold mb-1 text-[var(--foreground)]">{app.label}</p>
                <p className="text-xs text-zinc-500 mb-1 leading-relaxed">{desc?.description}</p>
                <p className="text-xs text-zinc-400 mb-4 flex-1 leading-relaxed font-light">{desc?.detail}</p>
                <span className={`text-xs font-medium ${app.brand.linkColor} group-hover:underline`}>
                  Open →
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/60" />
      </div>

      {/* Features */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-3">Platform</p>
        <h2 className="text-2xl font-light tracking-tight mb-10 text-[var(--foreground)]">Built on a <span className="font-semibold">solid foundation.</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-3">
              <div className={`w-8 h-8 rounded-lg ${f.iconBg} ${f.iconColor} flex items-center justify-center flex-shrink-0`}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{f.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/60" />
      </div>

      {/* Coming soon — Bots */}
      <section className="px-6 py-16 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-6">Coming soon</p>
        <button
          onClick={() => router.push('/bots')}
          className="group w-full flex items-center gap-4 bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700/80 rounded-2xl p-5 text-left hover:border-violet-400 dark:hover:border-violet-700 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-violet-500 dark:text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">Trading Bots</p>
            <p className="text-xs text-zinc-500 font-light">Automate your strategies — no coding required.</p>
          </div>
          <span className="text-[11px] font-medium bg-violet-50 dark:bg-violet-950 text-violet-500 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 shrink-0">
            In development
          </span>
        </button>
      </section>

      {/* Affiliate CTA */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 dark:text-zinc-500 mb-2">Affiliate programme</p>
            <p className="text-lg font-semibold text-white dark:text-zinc-900 mb-1">Earn with {tenant.brandName}.</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 font-light leading-relaxed">
              Refer traders to Deriv through our affiliate programme and earn commission on every trade they make. No cap, no expiry.
            </p>
          </div>
          {tenant.affiliateLink && (
            <a
              href={tenant.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Join now →
            </a>
          )}
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* Risk disclaimer */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800/60" />
      </div>
      <section className="px-6 py-10 max-w-3xl mx-auto w-full">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">Risk disclosure.</span>{' '}
          Deriv offers complex derivatives, such as options and contracts for difference (“CFDs”). These products may not be suitable for all clients, and trading them puts you at risk. Please make sure that you understand the following risks before trading Deriv products: a) you may lose some or all of the money you invest in the trade, b) if your trade involves currency conversion, exchange rates will affect your profit and loss. You should never trade with borrowed money or with money that you cannot afford to lose.
        </p>
      </section>

    </div>
  );
}
