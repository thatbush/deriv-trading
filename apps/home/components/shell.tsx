'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ShellHeader } from './shell-header';

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
  const auth = useAuth();
  const [activePath, setActivePath] = useState<NavPath>('/');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Apply theme class to <html> so Tailwind dark: variants work in the shell
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Sync active path from browser URL
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

  // Push current auth + theme state into an iframe
  const pushToIframe = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'PREVIEW_BRANDING', theme }, '*');
    iframe.contentWindow.postMessage({
      type: 'SHELL_AUTH',
      wsUrl: auth.wsUrl,
      accountId: auth.activeAccountId,
      authState: auth.authState,
      accounts: auth.accounts,
      activeAccount: auth.activeAccount,
    }, '*');
  }, [theme, auth.wsUrl, auth.activeAccountId, auth.authState, auth.accounts, auth.activeAccount]);

  // When sub-app iframe signals ready, push current state
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') {
        pushToIframe(iframeRef.current);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [pushToIframe]);

  // Re-push whenever auth or theme changes (iframe already loaded)
  useEffect(() => {
    pushToIframe(iframeRef.current);
  }, [pushToIframe]);

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
    <div className="flex flex-col h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden">
      <ShellHeader
        authState={auth.authState}
        accounts={auth.accounts}
        activeAccount={auth.activeAccount}
        onLogin={auth.login}
        onSignUp={auth.signUp}
        onLogout={auth.logout}
        onSwitchAccount={auth.switchAccount}
        onMenuClick={() => setSidebarOpen(true)}
        theme={theme}
        onThemeToggle={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar drawer */}
        <nav className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800',
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}>
          <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                    isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white',
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

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            {isDev && <p className="text-[10px] text-zinc-400 mb-2 font-mono">DEV MODE</p>}
            <p className="text-xs text-zinc-400 leading-relaxed">Trading derivatives involves risk.</p>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {activePath === '/' ? (
            <div className="h-full overflow-y-auto">{children}</div>
          ) : (
            <iframe
              key={activePath}
              ref={iframeRef}
              src={activePath}
              className="w-full h-full border-0"
              title={activeItem.label}
            />
          )}
        </main>
      </div>
    </div>
  );
}
