export default function About() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)]">

      <section className="flex flex-col px-6 pt-16 pb-10 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-4">
          About
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6 leading-tight">
          We built the interface<br />we wanted to trade on.
        </h1>
        <div className="flex flex-col gap-5 text-sm text-zinc-500 leading-relaxed">
          <p>
            Binarymatix sits on top of the Deriv API. Deriv runs the exchange, handles your funds, and executes the trades. We just built a cleaner way to access it.
          </p>
          <p>
            The tools here (Digits, Accumulators, Rise &amp; Fall, and the Analytics page) are built around how synthetic index traders actually work. Quick decisions, small positions, needing to know what the last 30 ticks looked like without digging through menus.
          </p>
          <p>
            The analytics page shows live stats on recent ticks: which digits are landing, even/odd splits, over/under counts, tick history. It's all based on what already happened. We don't predict anything and we won't pretend to.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Live data', detail: 'Tick feeds come straight from Deriv. Nothing is cached or delayed on our end.' },
            { label: 'No signals', detail: 'The stats show history. What you do with that is up to you.' },
            { label: 'Your account', detail: 'We never touch your money. Everything goes through your Deriv account directly.' },
          ].map((item) => (
            <div key={item.label} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <p className="font-semibold mb-2 text-[var(--foreground)]">{item.label}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-500">Risk notice.</span>{' '}
            Trading derivatives is risky. You can lose more than you put in. Past results don't mean future results. Don't trade money you can't afford to lose. Binarymatix does not give investment advice.
          </p>
        </div>
      </section>

    </div>
  );
}
