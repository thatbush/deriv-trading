'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AuthState, DerivAccount } from '@deriv/core';

interface ShellHeaderProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  onMenuClick: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

function formatBalance(balance: string) {
  return Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ShellHeader({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  onMenuClick,
  theme,
  onThemeToggle,
}: ShellHeaderProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Image src="/bm-logo-w.jpeg" alt="Binary Matix" width={28} height={28} className="rounded object-contain" />
        <span className="font-semibold text-sm text-zinc-900 dark:text-white tracking-wide hidden sm:block">Binary Matix</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 110 10A5 5 0 0112 7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {isAuthenticated && activeAccount && (
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
            >
              <div>
                <p className={`text-xs font-medium ${activeAccount.account_type === 'demo' ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {activeAccount.account_type === 'demo' ? 'Demo' : 'Real'}
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                  {formatBalance(activeAccount.balance)} {activeAccount.currency}
                </p>
              </div>
              <svg
                className={`w-3 h-3 text-zinc-400 transition-transform ${switcherOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute right-0 mt-1 w-56 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-50 p-1">
                  {accounts.map((account) => (
                    <button
                      key={account.account_id}
                      onClick={() => { onSwitchAccount(account.account_id); setSwitcherOpen(false); }}
                      className={`w-full text-left rounded-md px-3 py-2 transition-colors ${
                        account.account_id === activeAccount.account_id
                          ? 'bg-zinc-100 dark:bg-zinc-800'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <p className={`text-xs font-medium ${account.account_type === 'demo' ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {account.account_type === 'demo' ? 'Demo account' : 'Real account'}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {formatBalance(account.balance)} {account.currency}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-sm bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              disabled={isAuthenticating}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isAuthenticating ? 'Logging in…' : 'Log in'}
            </button>
            <button
              onClick={onSignUp}
              disabled={isAuthenticating}
              className="px-3 py-1.5 rounded-lg text-sm bg-zinc-900 dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
