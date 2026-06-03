import { NextRequest, NextResponse } from 'next/server';

const SHELL_DOMAINS_URL = 'https://trader.spiritb.uk/api/tenant/domains';

// Deriv developer portal — always allowed for /preview/ routes, independent of tenant system
const PREVIEW_FRAME_ANCESTORS =
  'https://developers.deriv.com https://staging-developers.deriv.com https://*.deriv-api-v2.pages.dev http://localhost:*';

// In-process cache so we don't hit the shell on every request within the same edge instance
let cachedDomains: string[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches shell Cache-Control

async function getAllowedDomains(): Promise<string[]> {
  if (cachedDomains && Date.now() < cacheExpiresAt) return cachedDomains;
  try {
    const res = await fetch(SHELL_DOMAINS_URL, { next: { revalidate: 300 } });
    const { domains } = await res.json() as { domains: string[] };
    cachedDomains = domains;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return domains;
  } catch {
    // Shell unreachable — fall back to cached value or safe static list
    return cachedDomains ?? ['binarymatix.com', 'deriv-trading-home.vercel.app', 'localhost'];
  }
}

function extractRefererHost(req: NextRequest): string | null {
  const referer = req.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // /preview/ routes are for the Deriv developer portal — use static CSP
  if (pathname.startsWith('/preview/')) {
    res.headers.set('Content-Security-Policy', `frame-ancestors ${PREVIEW_FRAME_ANCESTORS}`);
    return res;
  }

  const refererHost = extractRefererHost(req);
  const allowedDomains = await getAllowedDomains();

  const isLocalhost = refererHost === 'localhost' || refererHost === '127.0.0.1';

  const isAllowed =
    !refererHost || // direct navigation (no referer) — browser enforces CSP, not us
    isLocalhost ||
    allowedDomains.includes(refererHost);

  if (isAllowed && refererHost) {
    // For localhost use the full referer origin (preserves http:// and port).
    // For production use https:// + hostname — tightest valid policy.
    const referer = req.headers.get('referer')!;
    const frameAncestor = isLocalhost
      ? new URL(referer).origin
      : `https://${refererHost}`;
    res.headers.set('Content-Security-Policy', `frame-ancestors ${frameAncestor}`);
  } else if (isAllowed) {
    res.headers.set('Content-Security-Policy', `frame-ancestors 'self'`);
  } else {
    res.headers.set('Content-Security-Policy', `frame-ancestors 'none'`);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
