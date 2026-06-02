export default function About() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] px-4 py-8 max-w-lg mx-auto w-full gap-4">

      {/* App identity */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Binarymatix</h1>
            <p className="text-xs text-zinc-400">Last updated: June 2026</p>
          </div>
          <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full px-3 py-1">
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
        {[
          { icon: '#', label: 'Digits Trading', detail: 'Predict the last digit of the next tick' },
          { icon: '↑', label: 'Accumulators', detail: 'Compound your stake every tick in range' },
          { icon: '↕', label: 'Rise & Fall', detail: 'Simple directional trades with defined payout' },
          { icon: '◎', label: 'Live Analytics', detail: 'Digit stats, even/odd splits, tick history' },
        ].map((f) => (
          <div key={f.label} className="flex items-start gap-3">
            <span className="text-base w-6 text-center text-zinc-400 shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{f.label}</p>
              <p className="text-xs text-zinc-400">{f.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[var(--foreground)]">Support</h2>
        <a href="mailto:support@binarymatix.com" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--foreground)] transition-colors">
          <span>✉</span> support@binarymatix.com
        </a>
        <a href="https://wa.me/447426734754" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[var(--foreground)] transition-colors">
          <span>✆</span> +44 7426 734754
        </a>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-zinc-400 pb-4">
        © 2026 Binarymatix. Powered by Deriv API.
      </p>

    </div>
  );
}
