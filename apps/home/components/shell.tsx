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

  const handleNavClick = useCallback((item: typeof NAV_ITEMS[number]) => {
    if (isDev && item.devPort !== null) {
      window.open(`http://localhost:${item.devPort}/`, '_blank');
      setSidebarOpen(false);
      return;
    }
    navigate(item.path);
  }, [isDev, navigate]);

  const activeItem = NAV_ITEMS.find((n) => n.path === activePath) ?? NAV_ITEMS[0];

  return (
    <div className="h-dvh bg-black text-white overflow-hidden relative">

      {/* Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer — slides in over everything including the iframe */}
      <nav className={[
        'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-zinc-950 border-r border-zinc-800',
        'transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800 flex-shrink-0">
          <Image src="/bm-logo-w.jpeg" alt="Binarymatix" width={24} height={24} className="rounded object-contain" />
          <span className="font-semibold text-sm tracking-wide">Binarymatix</span>
          <button
            className="ml-auto p-1 rounded text-zinc-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
                <span className={`text-base w-5 text-center ${isActive && 'accent' in item ? item.accent : ''}`}>
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
          {isDev && <p className="text-[10px] text-zinc-600 mb-2 font-mono">DEV MODE</p>}
          <p className="text-xs text-zinc-600 leading-relaxed">
            Trading derivatives involves risk.
          </p>
        </div>
      </nav>

      {/* Hamburger trigger — floats over the top-left of whatever is rendered */}
      <button
        className="fixed top-3 left-3 z-30 flex items-center justify-center w-8 h-8 rounded-lg bg-black/70 backdrop-blur-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Full-viewport content — home page or iframe */}
      {activePath === '/' ? (
        <div className="h-full overflow-y-auto">{children}</div>
      ) : (
        <iframe
          key={activePath}
          src={activePath}
          className="w-full h-full border-0"
          title={activeItem.label}
        />
      )}
    </div>
  );
}
