'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initiateLogin,
  initiateSignUp,
  handleOAuthCallback,
  refreshAccessToken,
  fetchAccounts,
  getWebSocketOTP,
  logout as coreLogout,
  getAuthInfo,
  getStoredAuthInfoRaw,
  getDerivAccounts,
  getActiveLoginId,
  setActiveLoginId,
  setAccountType,
  clearAllAuthData,
  parseReferralLink,
} from '@deriv/core';
import type { AuthInfo, DerivAccount, AuthState, AuthConfig } from '@deriv/core';
import type { TenantConfig } from '@/lib/tenant-types';

function buildAuthConfig(tenant: TenantConfig): AuthConfig {
  const config: AuthConfig = {
    clientId: tenant.appId,
    redirectUri: tenant.redirectUri,
  };

  if (tenant.scopes) {
    config.scopes = tenant.scopes.split(',').map((s) => s.trim()).join(' ');
  }

  if (tenant.faqAffiliateLink) {
    const referral = parseReferralLink(tenant.faqAffiliateLink);
    if (referral) {
      config.affiliateToken      = referral.affiliateToken;
      config.affiliateTokenParam = referral.affiliateTokenParam;
      config.utmCampaign         = referral.utmCampaign;
      config.utmSource           = referral.utmSource;
      config.utmMedium           = referral.utmMedium;
    }
  }

  return config;
}

export interface UseAuthReturn {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  activeAccountId: string | null;
  wsUrl: string | undefined;
  login: () => Promise<void>;
  signUp: () => Promise<void>;
  logout: () => void;
  switchAccount: (accountId: string) => Promise<void>;
  /** Update an account's balance live (e.g. from a sub-app balance stream). */
  updateBalance: (accountId: string, balance: string) => void;
  /** Mint a fresh single-use OTP WebSocket URL for the active account. */
  getFreshWsUrl: () => Promise<string | undefined>;
  error: string | null;
}

export function useAuth(tenant: TenantConfig, tenantReady = true): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') return 'unauthenticated';
    if (getAuthInfo()) return 'authenticated';
    // Expired access token but a refresh token exists → we'll restore on init.
    // Start in 'authenticating' so the header doesn't flash logged-out.
    const raw = getStoredAuthInfoRaw();
    if (raw?.refresh_token) return 'authenticating';
    return 'unauthenticated';
  });
  const [accounts, setAccounts] = useState<DerivAccount[]>(() => {
    if (typeof window === 'undefined') return [];
    return getDerivAccounts() ?? [];
  });
  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return getActiveLoginId() ?? null;
  });
  const [wsUrl, setWsUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);
  const activeAccountIdRef = useRef<string | null>(null);
  const tabHiddenAtRef = useRef<number | null>(null);

  // Fetch OTP WebSocket URL for an account
  const fetchOTPUrl = useCallback(async (accountId: string, authInfo: AuthInfo): Promise<string> => {
    return getWebSocketOTP(accountId, authInfo, buildAuthConfig(tenant).clientId);
  }, [tenant]);

  // Fetch a FRESH single-use OTP WebSocket URL for the current account.
  // OTP URLs are consumed on connect, so each iframe that wants to open an
  // authenticated socket needs its own freshly-minted URL — reusing the stored
  // `wsUrl` for a second iframe (e.g. after navigating away and back) hands it a
  // spent token and the authenticated connection silently fails.
  const getFreshWsUrl = useCallback(async (): Promise<string | undefined> => {
    const authInfo = getAuthInfo();
    const accountId = activeAccountIdRef.current ?? getActiveLoginId();
    if (!authInfo || !accountId) return undefined;
    try {
      return await fetchOTPUrl(accountId, authInfo);
    } catch {
      return undefined;
    }
  }, [fetchOTPUrl]);

  // Complete auth: fetch accounts → get OTP → set WS URL
  const completeAuth = useCallback(async (authInfo: AuthInfo) => {
    const fetchedAccounts = await fetchAccounts(authInfo, buildAuthConfig(tenant).clientId);
    setAccounts(fetchedAccounts);

    if (fetchedAccounts.length > 0) {
      const firstAccount = fetchedAccounts[0];
      setActiveAccountId(firstAccount.account_id);

      const otpUrl = await fetchOTPUrl(firstAccount.account_id, authInfo);
      setWsUrl(otpUrl);
    }

    setAuthState('authenticated');
  }, [tenant, fetchOTPUrl]);

  // Initialize: check for OAuth callback or existing session.
  // Waits until tenant.appId is present so the correct clientId is used — prevents
  // the OAuth PKCE verification racing against the tenant config fetch.
  useEffect(() => {
    if (!tenantReady || !tenant.appId || initRef.current) return;

    const init = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      // Phase 3-5: Handle OAuth callback
      if (code) {
        // Only lock initRef after a successful exchange — 2FA flows redirect twice
        // (intermediate code then final code). If we lock on the first redirect and
        // the exchange fails, the second redirect would be silently ignored.
        setAuthState('authenticating');
        try {
          const authInfo = await handleOAuthCallback(window.location.href, buildAuthConfig(tenant));
          initRef.current = true;
          // Strip ?code= from the URL immediately so a soft navigation back to /
          // doesn't re-trigger this handler with a spent code.
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.toString());
          await completeAuth(authInfo);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setAuthState('error');
          clearAllAuthData();
          // Don't set initRef — allow the next redirect (e.g. 2FA second leg) to retry
        }
        return;
      }

      // No code in URL — lock init so session restore only runs once
      initRef.current = true;

      // Check for existing session. Read the raw (possibly-expired) auth so an
      // expired access token with a still-valid refresh token can be restored —
      // getAuthInfo() returns null on expiry and would drop refreshable sessions.
      const storedAuth = getStoredAuthInfoRaw();
      if (storedAuth) {
        // Check if token is expired
        if (storedAuth.expires_at && Date.now() / 1000 > storedAuth.expires_at) {
          // Try to refresh
          if (!storedAuth.refresh_token) {
            clearAllAuthData();
            setAuthState('unauthenticated');
            return;
          }
          setAuthState('authenticating');
          try {
            const refreshed = await refreshAccessToken(
              storedAuth.refresh_token,
              buildAuthConfig(tenant).clientId
            );
            await completeAuth(refreshed);
          } catch {
            // Refresh failed — fall back to unauthenticated (public WS)
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
          return;
        }

        // Valid stored session — restore accounts and get fresh OTP
        const storedAccounts = getDerivAccounts();
        if (storedAccounts && storedAccounts.length > 0) {
          setAccounts(storedAccounts);
          const loginId = getActiveLoginId() ?? storedAccounts[0].account_id;
          setActiveAccountId(loginId);

          try {
            const otpUrl = await fetchOTPUrl(loginId, storedAuth);
            setWsUrl(otpUrl);
            setAuthState('authenticated');
          } catch {
            // OTP fetch failed — token may be invalid, clear and fallback
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
        } else {
          // Have auth info but no accounts — re-fetch
          try {
            await completeAuth(storedAuth);
          } catch {
            clearAllAuthData();
            setAuthState('unauthenticated');
          }
        }
      }
    };

    init();
  }, [tenantReady, tenant.appId, completeAuth, fetchOTPUrl]);

  // Keep ref in sync so visibility handler always has the current account ID
  useEffect(() => {
    activeAccountIdRef.current = activeAccountId;
  }, [activeAccountId]);

  // Refresh the OTP WebSocket URL when returning to the tab after >30s of inactivity.
  // OTP URLs are single-use, so a stale URL will cause reconnect failures.
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        tabHiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = tabHiddenAtRef.current;
      if (!hiddenAt || Date.now() - hiddenAt < 30_000) return;
      tabHiddenAtRef.current = null;

      const accountId = activeAccountIdRef.current;
      const authInfo = getAuthInfo();
      if (!authInfo || !accountId) return;

      try {
        const otpUrl = await fetchOTPUrl(accountId, authInfo);
        setWsUrl(otpUrl);
      } catch {
        clearAllAuthData();
        setAuthState('unauthenticated');
        setWsUrl(undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState, fetchOTPUrl]);

  // Phase 1: Initiate login — standard PKCE flow, no attribution params
  const login = useCallback(async () => {
    await initiateLogin(buildAuthConfig(tenant));
  }, [tenant]);

  // Initiate sign-up — adds prompt=registration and partner attribution params
  const signUp = useCallback(async () => {
    await initiateSignUp(buildAuthConfig(tenant));
  }, [tenant]);

  // Logout: close WS (handled by useDerivWS cleanup), clear storage, reset state
  const logout = useCallback(() => {
    coreLogout();
    setAccounts([]);
    setActiveAccountId(null);
    setWsUrl(undefined);
    setAuthState('unauthenticated');
    setError(null);
  }, []);

  // Account switch: fetch new OTP first, then update accountId and wsUrl together
  // so reconnectKey and url change in the same render cycle with the correct OTP.
  const switchAccount = useCallback(async (accountId: string) => {
    const authInfo = getAuthInfo();
    if (!authInfo) return;

    try {
      const account = accounts.find((a) => a.account_id === accountId);
      if (account) setAccountType(account.account_type);
      // Fetch OTP before updating accountId so reconnectKey and url are consistent
      const otpUrl = await fetchOTPUrl(accountId, authInfo);
      setActiveLoginId(accountId);
      setActiveAccountId(accountId);
      setWsUrl(otpUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account switch failed');
    }
  }, [fetchOTPUrl, accounts]);

  // Update a single account's balance in place (from a live balance stream).
  // No-op if the value is unchanged so we don't trigger needless re-renders.
  const updateBalance = useCallback((accountId: string, balance: string) => {
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.account_id === accountId);
      if (idx === -1 || prev[idx].balance === balance) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], balance };
      return next;
    });
  }, []);

  const activeAccount = accounts.find((acc) => acc.account_id === activeAccountId) ?? accounts[0] ?? null;

  return {
    authState,
    accounts,
    activeAccount,
    activeAccountId,
    wsUrl,
    login,
    signUp,
    logout,
    switchAccount,
    updateBalance,
    getFreshWsUrl,
    error,
  };
}
