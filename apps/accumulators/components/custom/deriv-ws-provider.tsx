'use client';

import { createContext, useContext, useEffect } from 'react';
import { useDerivWS } from '@deriv/core';
import { useAuth } from '@/hooks/use-auth';
import type { DerivWS } from '@deriv/core';
import type { UseAuthReturn } from '@/hooks/use-auth';

/**
 * Subscribe to the live balance stream on the (authenticated) trading socket and
 * forward updates to the shell via postMessage, so the shell header balance stays
 * live without the shell needing its own second authenticated connection.
 */
function useBalanceBridge(
  ws: DerivWS | null,
  isConnected: boolean,
  isAuthenticated: boolean
) {
  useEffect(() => {
    if (!ws || !isConnected || !isAuthenticated) return;
    if (typeof window === 'undefined' || window.parent === window) return;

    let unsubscribe: (() => void) | null = null;

    const post = (balance: number | string, loginid: string, currency?: string) => {
      window.parent.postMessage(
        { type: 'SHELL_BALANCE', accountId: loginid, balance: String(balance), currency },
        '*'
      );
    };

    ws.subscribe({ balance: 1 }, (data) => {
      const b = data.balance as { balance: number; loginid: string; currency: string } | undefined;
      if (b && b.loginid) post(b.balance, b.loginid, b.currency);
    })
      .then((sub) => { unsubscribe = sub.unsubscribe; })
      .catch(() => {});

    return () => {
      unsubscribe?.();
    };
  }, [ws, isConnected, isAuthenticated]);
}

interface DerivWSContextValue {
  ws: DerivWS | null;
  isConnected: boolean;
  isExhausted: boolean;
  auth: UseAuthReturn;
}

const DerivWSContext = createContext<DerivWSContextValue | null>(null);

/**
 * Maintains a single WebSocket connection and auth state above all page components
 * so navigation between pages (e.g. main → reports → back) does not tear down
 * and recreate the connection.
 */
export function DerivWSProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { ws, isConnected, isExhausted } = useDerivWS({
    url: auth.wsUrl,
    accountId: auth.activeAccountId ?? undefined,
  });

  useBalanceBridge(ws, isConnected, !!auth.wsUrl);

  return (
    <DerivWSContext.Provider value={{ ws, isConnected, isExhausted, auth }}>
      {children}
    </DerivWSContext.Provider>
  );
}

export function useDerivWSContext(): DerivWSContextValue {
  const ctx = useContext(DerivWSContext);
  if (!ctx) {
    throw new Error('useDerivWSContext must be used within a DerivWSProvider');
  }
  return ctx;
}
