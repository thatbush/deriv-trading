'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ShellHeader } from './shell-header';
import { SUB_APPS, matchSubApp, buildIframeSrc } from '@/lib/sub-apps';
import { TenantContext, useTenantLoader } from '@/hooks/use-tenant';

const STATIC_NAV_START = [
  { label: 'Home', path: '/', icon: '⌂', accent: 'text-zinc-400', accentDim: 'text-zinc-600 dark:text-zinc-500' },
];
const STATIC_NAV_END = [
  { label: 'Bots', path: '/bots', icon: '⚙', accent: 'text-violet-400', accentDim: 'text-violet-600 dark:text-violet-500' },
  { label: 'About', path: '/about', icon: '❋', accent: 'text-pink-400', accentDim: 'text-pink-600 dark:text-pink-500' },
  { label: 'Contact', path: '/contact', icon: '✆', accent: 'text-sky-400', accentDim: 'text-sky-600 dark:text-sky-500' },
];

interface ShellProps {
  children: React.ReactNode;
  isDev: boolean;
}

export function Shell({ children, isDev }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, ready } = useTenantLoader();
  const auth = useAuth(tenant, ready);

  // Only show sub-apps the tenant has enabled
  const navItems = useMemo(() => [
    ...STATIC_NAV_START,
    ...SUB_APPS
      .filter((a) => tenant.enabledApps.includes(a.key))
      .map((a) => ({ label: a.label, path: a.path, icon: a.icon, accent: a.brand.accent, accentDim: a.brand.accentDim })),
    ...STATIC_NAV_END,
  ], [tenant.enabledApps]);

  const activeApp = matchSubApp(pathname);
  const isSubApp = activeApp !== null;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('bm-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // The iframe src is derived from the active app + pathname. We compute it once
  // per active app and hold it, so the sub-app's *internal* navigation (which we
  // mirror into the address bar) doesn't force-reload the iframe.
  const [iframeSrc, setIframeSrc] = useState<string>(() =>
    activeApp ? buildIframeSrc(activeApp, pathname, isDev) : ''
  );
  const loadedAppKey = useRef<string | null>(activeApp?.key ?? null);

  // When the active sub-app changes (or first mount of one), (re)build the src.
  useEffect(() => {
    if (activeApp && activeApp.key !== loadedAppKey.current) {
      loadedAppKey.current = activeApp.key;
      setIframeSrc(buildIframeSrc(activeApp, pathname, isDev));
    }
    if (!activeApp) loadedAppKey.current = null;
  }, [activeApp, pathname, isDev]);

  // Apply theme class to <html> and persist choice
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('bm-theme', theme);
  }, [theme]);

  // Push theme + branding + auth into the iframe. When `freshOtp` is true, mint a
  // brand-new single-use OTP for this iframe instead of reusing the stored wsUrl.
  const pushToIframe = useCallback(async (iframe: HTMLIFrameElement | null, freshOtp = false) => {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'PREVIEW_BRANDING',
      theme,
      primaryColor: tenant.primaryColor,
      appName: tenant.brandName,
      logo: tenant.logoUrl ?? undefined,
    }, '*');

    let wsUrl = auth.wsUrl;
    if (freshOtp && auth.authState === 'authenticated') {
      wsUrl = (await auth.getFreshWsUrl()) ?? auth.wsUrl;
    }
    // The iframe may have been swapped out while we awaited the OTP fetch.
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'SHELL_AUTH',
      wsUrl,
      accountId: auth.activeAccountId,
      authState: auth.authState,
      accounts: auth.accounts,
      activeAccount: auth.activeAccount,
    }, '*');
  }, [theme, tenant, auth]);

  // Listen for messages from sub-app iframes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') {
        // New iframe is up and asking for state — give it a freshly-minted OTP.
        // Only push once tenant config is resolved so branding is correct.
        if (ready) pushToIframe(iframeRef.current, true);
      }
      // Sub-app reports its own *internal* pathname (e.g. /reports). Mirror it into
      // the shell address bar as /digits/reports so the URL + back button stay correct.
      if (e.data?.type === 'SHELL_NAVIGATE' && typeof e.data.path === 'string' && activeApp) {
        const internal = e.data.path as string;
        const shellPath = internal === '/' ? activeApp.path : activeApp.path + internal;
        if (shellPath !== pathname) {
          router.replace(shellPath, { scroll: false });
        }
      }
      // Sub-app streams a live balance from its trading socket — update the header.
      if (e.data?.type === 'SHELL_BALANCE' && typeof e.data.balance === 'string' && typeof e.data.accountId === 'string') {
        auth.updateBalance(e.data.accountId, e.data.balance);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [pushToIframe, router, activeApp, pathname, auth, ready]);

  // Re-push whenever auth or theme changes (iframe already mounted)
  useEffect(() => {
    pushToIframe(iframeRef.current);
  }, [pushToIframe]);

  const navigateTo = useCallback((path: string) => {
    setSidebarOpen(false);
    router.push(path);
  }, [router]);

  const activeNavPath = activeApp?.path ?? pathname;

  return (
    <TenantContext.Provider value={tenant}>
    <div className="flex flex-col h-dvh bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
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
            'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-[var(--background)] border-r border-zinc-200 dark:border-zinc-800/60',
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
            {navItems.map((item) => {
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
                  <span className={`text-base w-5 text-center ${item.accent ? (isActive ? item.accent : item.accentDim) : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            {isDev && <p className="text-[10px] text-zinc-400 mb-2 font-mono">DEV MODE</p>}
            <p className="text-xs text-zinc-400 leading-relaxed">Version 1.1.0 (Beta)</p>
          </div>
        </nav>

        {/* Content area */}
        <main className="flex-1 overflow-hidden">
          {isSubApp && activeApp ? (
            <iframe
              key={activeApp.key}
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full border-0"
              title={activeApp.label}
            />
          ) : (
            <div className="h-full overflow-y-auto">{children}</div>
          )}
        </main>
      </div>
    </div>
    </TenantContext.Provider>
  );
}
