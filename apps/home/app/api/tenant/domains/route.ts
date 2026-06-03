import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Hard-coded domains that are always allowed regardless of DB state.
// Covers the shell's own Vercel deployment and local dev.
const ALWAYS_ALLOWED = [
  'binarymatix.com',
  'deriv-trading-home.vercel.app',
  'localhost',
  '127.0.0.1',
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trading_apps')
      .select('custom_domain')
      .eq('is_active', true)
      .not('custom_domain', 'is', null);

    const tenantDomains = error || !data
      ? []
      : data.map((r: { custom_domain: string }) => r.custom_domain).filter(Boolean);

    const domains = Array.from(new Set([...ALWAYS_ALLOWED, ...tenantDomains]));

    return NextResponse.json(
      { domains },
      {
        headers: {
          // Cache at the edge for 5 minutes — new tenants propagate within that window
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    // DB unreachable — return the safe static fallback so sub-apps stay functional
    return NextResponse.json(
      { domains: ALWAYS_ALLOWED },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
