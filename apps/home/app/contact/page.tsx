'use client';

import { PageFooter } from '@/components/page-footer';
import { useTenant } from '@/hooks/use-tenant';

export default function Contact() {
  const tenant = useTenant();
  const email = tenant.supportEmail ?? 'support@binarymatix.com';
  const whatsapp = tenant.supportWhatsapp ?? 'https://wa.me/447426734754';
  const whatsappDisplay = whatsapp.replace('https://wa.me/', '+').replace(/(\d{2})(\d+)/, '$1 $2');

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] pb-14">

      <section className="flex flex-col px-6 pt-16 pb-10 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Contact
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 leading-tight">
          Say hello.
        </h1>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed">
          Whether it&apos;s a question, an issue, or just feedback, feel free to reach out.
        </p>

        <div className="flex flex-col gap-4">
          <a
            href={`mailto:${email}`}
            className="group flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-2xl p-5 hover:border-sky-400 dark:hover:border-sky-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center flex-shrink-0">
              <span className="text-lg text-sky-600 dark:text-sky-400">✉</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-[var(--foreground)] group-hover:underline">{email}</p>
            </div>
          </a>

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
              <span className="text-lg text-emerald-600 dark:text-emerald-400">✆</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">WhatsApp / Phone</p>
              <p className="text-sm font-medium text-[var(--foreground)] group-hover:underline">{whatsappDisplay}</p>
            </div>
          </a>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-2xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-600 dark:text-amber-400 text-base">⚡</span>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-1">Response time</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              We usually reply within a day. If it&apos;s urgent, WhatsApp is quicker.
            </p>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
