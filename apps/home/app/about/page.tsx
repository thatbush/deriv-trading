import type { Metadata } from 'next';
import { SUB_APPS } from '@/lib/sub-apps';
import { PageFooter } from '@/components/page-footer';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Binary Matix — a professional trading interface for synthetic indices built on the Deriv API. Version history, tech stack, and support details.',
  alternates: { canonical: 'https://binarymatix.com/about' },
  openGraph: {
    url: 'https://binarymatix.com/about',
    title: 'About | Binary Matix',
    description:
      'Professional trading tools for synthetic indices built on the Deriv API. Digits, Accumulators, Rise & Fall, and live analytics in one place.',
  },
};

const APP_DETAILS: Record<string, string> = {
  digits: 'Predict the last digit of the next tick',
  accumulators: 'Compound your stake every tick in range',
  'rise-fall': 'Simple directional trades with defined payout',
  analytics: 'Digit stats, even/odd splits, tick history',
};

export default function About() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] px-4 py-8 max-w-lg mx-auto w-full gap-4 pb-16">

      {/* App identity */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Binary Matix</h1>
            <p className="text-xs text-zinc-400">Last updated: June 2026</p>
          </div>
          <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1">
            v1.1.0 (Beta)
          </span>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">
          A trading interface for synthetic indices built on the Deriv API. Digits, Accumulators, Rise &amp; Fall, and live market analytics in one place.
        </p>

        <div className="flex flex-col gap-1 pt-1">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Technologies</p>
          <div className="flex flex-wrap gap-2">
            {['Next.js', 'TypeScript', 'Deriv API', 'WebSocket', 'Tailwind CSS', 'Vercel'].map((t) => (
              <span key={t} className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 text-zinc-500 dark:text-zinc-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* App details */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Application Details</h2>
        {[
          { label: 'Version', value: '1.1.0 (Beta)' },
          { label: 'Build', value: 'Production' },
          { label: 'API', value: 'Deriv WebSocket API v3' },
          { label: 'Platform', value: 'Web (Mobile + Desktop)' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0">
            <span className="text-xs text-zinc-400">{row.label}</span>
            <span className="text-xs font-semibold text-[var(--foreground)]">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Key Features</h2>
        {SUB_APPS.map((app) => (
          <div key={app.key} className="flex items-start gap-3">
            <span className={`text-xl w-9 h-9 flex items-center justify-center text-center shrink-0 rounded-lg ${app.brand.iconBg} ${app.brand.accent}`}>{app.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{app.label}</p>
              <p className="text-xs text-zinc-400">{APP_DETAILS[app.key]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Support</h2>
        <a href="mailto:support@binarymatix.com" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--foreground)] transition-colors">
          <span className="text-xl w-9 h-9 flex items-center justify-center text-center shrink-0 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">✉</span> support@binarymatix.com
        </a>
        <a href="https://wa.me/447426734754" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--foreground)] transition-colors">
          <span className="text-xl w-9 h-9 flex items-center justify-center text-center shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">✆</span> +44 7426 734754
        </a>
      </div>

      <PageFooter />
    </div>
  );
}
