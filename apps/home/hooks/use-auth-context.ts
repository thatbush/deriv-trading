'use client';

import { createContext, useContext } from 'react';
import type { UseAuthReturn } from './use-auth';

export const AuthContext = createContext<UseAuthReturn | null>(null);

export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within the shell AuthContext provider');
  return ctx;
}
