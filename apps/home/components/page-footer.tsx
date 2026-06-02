export function PageFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 py-3 text-center bg-[var(--background)]/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 pointer-events-none">
      <p className="text-xs tracking-wide text-zinc-400">
        Powered by <span className="font-semibold text-zinc-600 dark:text-zinc-300">Binary Matix</span>
      </p>
    </div>
  );
}
