import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-medium">
            BM
          </div>
          <span className="text-sm text-zinc-400 tracking-widest uppercase">Binary Matix</span>
        </div>

        <h1 className="text-4xl font-semibold mb-2">Trading tools</h1>
        <p className="text-zinc-400 mb-10">Powered by Deriv API. Choose a market to start.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <Link href="/digits" className="group border border-zinc-800 rounded-2xl p-5 hover:border-emerald-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
              <span className="text-emerald-400 text-lg">#</span>
            </div>
            <p className="font-medium mb-1">Digits</p>
            <p className="text-sm text-zinc-400 mb-4">Predict the last digit of the next tick.</p>
            <span className="text-sm text-emerald-500 group-hover:underline">Open →</span>
          </Link>

          <Link href="/accumulators" className="group border border-zinc-800 rounded-2xl p-5 hover:border-violet-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-950 flex items-center justify-center mb-4">
              <span className="text-violet-400 text-lg">↑</span>
            </div>
            <p className="font-medium mb-1">Accumulators</p>
            <p className="text-sm text-zinc-400 mb-4">Grow your stake every tick that stays in range.</p>
            <span className="text-sm text-violet-400 group-hover:underline">Open →</span>
          </Link>

          <Link href="/rise-fall" className="group border border-zinc-800 rounded-2xl p-5 hover:border-orange-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-orange-950 flex items-center justify-center mb-4">
              <span className="text-orange-400 text-lg">↕</span>
            </div>
            <p className="font-medium mb-1">Rise & Fall</p>
            <p className="text-sm text-zinc-400 mb-4">Predict whether the market will rise or fall.</p>
            <span className="text-sm text-orange-400 group-hover:underline">Open →</span>
          </Link>

        </div>

        <p className="text-xs text-zinc-600">
          Trading derivatives involves risk. Only trade with money you can afford to lose.
        </p>

      </div>
    </main>
  )
}