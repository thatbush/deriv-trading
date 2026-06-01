'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: '⌂', devPort: null },
  { label: 'Digits', path: '/digits', icon: '#', accent: 'text-emerald-400', devPort: 3003 },
  { label: 'Accumulators', path: '/accumulators', icon: '↑', accent: 'text-violet-400', devPort: 3001 },
  { label: 'Rise & Fall', path: '/rise-fall', icon: '↕', accent: 'text-orange-400', devPort: 3002 },
] as const;

type NavPath = (typeof NAV_ITEMS)[number]['path'];

// Passed from layout via a server component — true when NODE_ENV === 'development'
interface ShellProps {
  children: React.ReactNode;
  isDev: boolean;
}

export function Shell({ children, isDev }: ShellProps) {
  const [activePath, setActivePath] = useState<NavPath>('/');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const p = window.location.pathname;
      const match = NAV_ITEMS.find((n) => p === n.path || p.startsWith(n.path + '/'));
      setActivePath(match ? match.path : '/');
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = useCallback((path: NavPath) => {
    if (path !== activePath) {
      window.history.pushState(null, '', path);
      setActivePath(path);
    }
    setSidebarOpen(false);
  }, [activePath]);

  const activeItem = NAV_ITEMS.find((n) => n.path === activePath) ?? NAV_ITEMS[0];

  // In dev, sub-apps run on their own ports so iframes hit CORS.
  // Open them in a new tab instead, with the shell still providing navigation context.
  const handleNavClick = useCallback((item: typeof NAV_ITEMS[number]) => {
    if (isDev && item.devPort !== null) {
      window.open(`http://localhost:${item.devPort}/?embedded=0`, '_blank');
      setSidebarOpen(false);
      return;
    }
    navigate(item.path);
  }, [isDev, navigate]);

  return (
    <div className="flex flex-col h-dvh bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 flex-shrink-0 z-30 bg-black">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 rounded text-zinc-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/bm-logo-w.jpeg" alt="Binarymatix" width={28} height={28} className="rounded object-contain" />
          <span className="font-semibold text-sm tracking-wide">Binarymatix</span>
        </div>
        {activePath !== '/' && (
          <span className={`text-sm font-medium ${activeItem.accent ?? 'text-zinc-400'}`}>
            {activeItem.label}
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <nav className={[
          'fixed lg:relative inset-y-0 left-0 z-20 flex flex-col w-52 border-r border-zinc-800 bg-black pt-14 lg:pt-0',
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}>
          <div className="flex flex-col gap-1 p-3 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors w-full',
                    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
                  ].join(' ')}
                >
                  <span className={`text-base w-5 text-center ${isActive ? (item.accent ?? '') : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isDev && item.devPort !== null && (
                    <span className="ml-auto text-[10px] text-zinc-600">↗</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-zinc-800">
            {isDev && (
              <p className="text-[10px] text-zinc-600 mb-2 font-mono">DEV MODE</p>
            )}
            <p className="text-xs text-zinc-600 leading-relaxed">
              Trading derivatives involves risk.
            </p>
          </div>
        </nav>

        <main className="flex-1 overflow-hidden relative">
          {activePath === '/' ? (
            <div className="h-full overflow-y-auto">{children}</div>
          ) : (
            <iframe
              key={activePath}
              src={`${activePath}?embedded=1`}
              className="w-full h-full border-0"
              title={activeItem.label}
            />
          )}
        </main>
      </div>
    </div>
  );
}
