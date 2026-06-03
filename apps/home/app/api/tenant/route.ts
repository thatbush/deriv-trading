import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { type SubAppKey, type TenantConfig, ALL_SUB_APPS } from '@/lib/tenant-types';

export type { SubAppKey, TenantConfig };

// Binarymatix defaults — used when no DB row matches the request domain,
// or when the DB is unreachable. Keeps the current client live at all times.
const BINARYMATIX_DEFAULTS: TenantConfig = {
  appId:            process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '',
  redirectUri:      process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? 'https://binarymatix.com/callback',
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

function extractHost(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-host');
  if (forwarded) return forwarded.split(',')[0].trim().toLowerCase();
  const host = req.headers.get('host') ?? '';
  return host.split(':')[0].toLowerCase();
}

export async function GET(req: NextRequest) {
  const host = extractHost(req);

  if (host === 'localhost' || host === '127.0.0.1') {
    return NextResponse.json(BINARYMATIX_DEFAULTS);
  }

  try {
    const { data, error } = await supabase
      .from('trading_apps')
      .select('deriv_app_id, deriv_redirect_uri, deriv_oauth_scopes, faq_affiliate_link, affiliate_link, brand_name, support_email, support_whatsapp, logo_url, primary_color, enabled_apps')
      .eq('custom_domain', host)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json(BINARYMATIX_DEFAULTS);
    }

    const config: TenantConfig = {
      appId:            data.deriv_app_id,
      redirectUri:      data.deriv_redirect_uri,
      scopes:           data.deriv_oauth_scopes ?? 'trade',
      faqAffiliateLink: data.faq_affiliate_link ?? BINARYMATIX_DEFAULTS.faqAffiliateLink,
      affiliateLink:    data.affiliate_link ?? BINARYMATIX_DEFAULTS.affiliateLink,
      brandName:        data.brand_name ?? 'Binary Matix',
      supportEmail:     data.support_email ?? null,
      supportWhatsapp:  data.support_whatsapp ?? null,
      logoUrl:          data.logo_url ?? null,
      primaryColor:     data.primary_color ?? '#0051ff',
      enabledApps:      (data.enabled_apps as SubAppKey[]) ?? ALL_SUB_APPS,
    };

    return NextResponse.json(config);
  } catch {
    return NextResponse.json(BINARYMATIX_DEFAULTS);
  }
}
