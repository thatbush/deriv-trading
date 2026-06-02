'use client';

import { createContext, useContext } from 'react';
import { useDerivWS } from '@deriv/core';
import type { DerivWS } from '@deriv/core';

interface AnalyticsWSContextValue {
  ws: DerivWS | null;
  isConnected: boolean;
}

const AnalyticsWSContext = createContext<AnalyticsWSContextValue | null>(null);

/**
 * Public-only WebSocket connection for the analytics app.
 * Analytics only reads market data (ticks, symbols) — no auth, no OTP, no trading.
 */
export function AnalyticsWSProvider({ children }: { children: React.ReactNode }) {
  const { ws, isConnected } = useDerivWS();

  return (
    <AnalyticsWSContext.Provider value={{ ws, isConnected }}>
      {children}
    </AnalyticsWSContext.Provider>
  );
}

export function useAnalyticsWSContext(): AnalyticsWSContextValue {
  const ctx = useContext(AnalyticsWSContext);
  if (!ctx) throw new Error('useAnalyticsWSContext must be used within AnalyticsWSProvider');
  return ctx;
}
