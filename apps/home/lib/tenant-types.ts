export type SubAppKey = 'digits' | 'accumulators' | 'rise-fall' | 'analytics';
export const ALL_SUB_APPS: SubAppKey[] = ['digits', 'accumulators', 'rise-fall', 'analytics'];

export interface TenantConfig {
  appId: string;
  redirectUri: string;
  scopes: string;
  faqAffiliateLink: string | null;
  affiliateLink: string | null;
  brandName: string;
  supportEmail: string | null;
  supportWhatsapp: string | null;
  logoUrl: string | null;
  primaryColor: string;
  enabledApps: SubAppKey[];
}
