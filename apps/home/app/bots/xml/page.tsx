import type { Metadata } from 'next';
import { PageFooter } from '@/components/page-footer';

export const metadata: Metadata = {
  title: 'XML Bots',
  description: 'Import and run XML strategy bots for synthetic indices — coming soon to Binary Matix.',
  alternates: { canonical: 'https://binarymatix.com/bots/xml' },
};

export default function XmlBots() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] pb-14">

      <section className="flex flex-col px-6 pt-16 pb-10 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Coming soon
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">&lt;/&gt;</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            XML Bots
          </h1>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Upload your own XML strategy files and run them directly. Bring strategies built elsewhere into Binary Matix.
        </p>
      </section>

      {/* Status banner */}
      <section className="px-6 pb-10 max-w-2xl mx-auto w-full">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-5 flex gap-4 items-start">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-base">🔧</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">In active development</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              XML bot support is being built. Check this page later for updates, or reach out to support if you have an idea you'd like to see implemented!
            </p>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
