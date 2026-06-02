export default function Contact() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)]">

      <section className="flex flex-col px-6 pt-16 pb-10 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          Contact
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 leading-tight">
          Say hello.
        </h1>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed">
          Whether it's a question, an issue, or just feedback, feel free to reach out.
        </p>

        <div className="flex flex-col gap-4">
          <a
            href="mailto:support@binarymatix.com"
            className="group flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✉</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-[var(--foreground)] group-hover:underline">
                support@binarymatix.com
              </p>
            </div>
          </a>

          <a
            href="https://wa.me/447426734754"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✆</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-0.5">WhatsApp / Phone</p>
              <p className="text-sm font-medium text-[var(--foreground)] group-hover:underline">
                +44 7426 734754
              </p>
            </div>
          </a>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Response time</p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            We usually reply within a day. If it's urgent, WhatsApp is quicker.
          </p>
        </div>
      </section>

      <section className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-500">Risk notice.</span>{' '}
            Trading derivatives is risky. You can lose more than you put in. Binary Matix does not give investment advice.
          </p>
        </div>
      </section>

    </div>
  );
}
