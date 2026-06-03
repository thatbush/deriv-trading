'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type TenantConfig, ALL_SUB_APPS } from '@/lib/tenant-types';

// Binarymatix defaults — used immediately on first render before the fetch
// resolves, so auth never starts with empty strings.
const DEFAULTS: TenantConfig = {
  appId:            process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '',
  redirectUri:      process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? (typeof window !== 'undefined' ? window.location.origin : ''),
  scopes:           process.env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES ?? 'trade',
  faqAffiliateLink: 'https://partners.deriv.com/rx?sidc=D9666FA0-8DB9-456A-AC4B-93AB866CCD13&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU60461',
  affiliateLink:    'https://partners.deriv.com/rx?sidi=AEF10871-3EA1-41BD-AA0A-C4505628F09E&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU60461',
  brandName:        'Binary Matix',
  supportEmail:     'support@binarymatix.com',
  supportWhatsapp:  'https://wa.me/447426734754',
  logoUrl:          null,
  primaryColor:     '#0051ff',
  enabledApps:      ALL_SUB_APPS,
};

export const TenantContext = createContext<TenantConfig>(DEFAULTS);

export function useTenant(): TenantConfig {
  return useContext(TenantContext);
}

// null = still loading, TenantConfig = resolved
export function useTenantLoader(): { tenant: TenantConfig; ready: boolean } {
  const [config, setConfig] = useState<TenantConfig>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/tenant')
      .then((r) => r.json())
      .then((data: TenantConfig) => {
        if (data?.appId) setConfig(data);
      })
      .catch(() => {
        // Network failure — keep defaults, client stays functional
      })
      .finally(() => setReady(true));
  }, []);

  return { tenant: config, ready };
}
