'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ShellHeader } from './shell-header';

const SUB_APP_PATHS = ['/digits', '/accumulators', '/rise-fall'] as const;
type SubAppPath = typeof SUB_APP_PATHS[number];

const NAV_ITEMS = [
  { label: 'Home',         path: '/',             icon: '⌂', accent: '',                  devPort: null },
  { label: 'Digits',       path: '/digits',       icon: '#', accent: 'text-emerald-400',  devPort: 3003 },
  { label: 'Accumulators', path: '/accumulators', icon: '↑', accent: 'text-violet-400',   devPort: 3001 },
  { label: 'Rise & Fall',  path: '/rise-fall',    icon: '↕', accent: 'text-orange-400',   devPort: 3002 },
] as const;

function getSubAppBase(pathname: string): SubAppPath | null {
  return SUB_APP_PATHS.find((p) => pathname === p || pathname.startsWith(p + '/')) ?? null;
}

interface ShellProps {
  children: React.ReactNode;
  isDev: boolean;
}

export function Shell({ children, isDev }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  const subAppBase = getSubAppBase(pathname);
  const isSubApp = subAppBase !== null;

  // iframeSrc: initialise from the current pathname so deep links work on first load.
  // After that, only update it when the user explicitly navigates via the sidebar.
  const [iframeSrc, setIframeSrc] = useState<string>(pathname);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Apply theme class to <html> so Tailwind dark: variants work in the shell chrome
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Push auth + theme into the iframe
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

  // Listen for messages from sub-app iframes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') {
        pushToIframe(iframeRef.current);
      }
      // Sub-app reports its full pathname (e.g. /rise-fall/reports).
      // Update the Next.js URL so the address bar and back button work correctly.
      if (e.data?.type === 'SHELL_NAVIGATE' && typeof e.data.path === 'string') {
        router.replace(e.data.path as string, { scroll: false });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [pushToIframe, router]);

  // Re-push whenever auth or theme changes (iframe already mounted)
  useEffect(() => {
    pushToIframe(iframeRef.current);
  }, [pushToIframe]);

  const navigateTo = useCallback((path: string) => {
    setSidebarOpen(false);
    if (isDev) {
      const item = NAV_ITEMS.find((n) => n.path === path);
      if (item && item.devPort !== null) {
        window.open(`http://localhost:${item.devPort}/`, '_blank');
        return;
      }
    }
    setIframeSrc(path);
    router.push(path);
  }, [isDev, router]);

  const activeNavPath = subAppBase ?? '/';

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
        onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar drawer */}
        <nav
          className={[
            'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800',
            'transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
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
              const isActive = activeNavPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className={[
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors w-full',
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white',
                  ].join(' ')}
                >
                  <span className={`text-base w-5 text-center ${isActive && item.accent ? item.accent : ''}`}>
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

        {/* Content area */}
        <main className="flex-1 overflow-hidden">
          {isSubApp ? (
            <iframe
              key={subAppBase}
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full border-0"
              title={NAV_ITEMS.find((n) => n.path === subAppBase)?.label ?? 'App'}
            />
          ) : (
            <div className="h-full overflow-y-auto">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
