/**
 * Sub-app registry.
 *
 * The shell loads each sub-app inside an iframe pointed *directly* at the
 * sub-app's own origin. This is deliberate: if the iframe were pointed at a
 * path the home app also serves (e.g. `/digits`), the home layout would wrap
 * it in <Shell> again, recursing into an infinite stack of shell headers.
 *
 * - `path`   — the shell-owned URL shown in the address bar (the home app has a
 *              catch-all page at this route that renders nothing but the shell chrome).
 * - `origin` — where the iframe actually loads the sub-app from.
 */

export interface SubApp {
  key: 'digits' | 'accumulators' | 'rise-fall' | 'analytics';
  label: string;
  path: string;
  icon: string;
  accent: string;
  /** Dev origin (own dev server) */
  devOrigin: string;
  /** Production origin (dedicated Vercel deployment) */
  prodOrigin: string;
}

export const SUB_APPS: SubApp[] = [
  {
    key: 'digits',
    label: 'Digits',
    path: '/digits',
    icon: '#',
    accent: 'text-emerald-400',
    devOrigin: 'http://localhost:3003',
    prodOrigin: 'https://binarymatix.vercel.app',
  },
  {
    key: 'accumulators',
    label: 'Accumulators',
    path: '/accumulators',
    icon: '↑',
    accent: 'text-violet-400',
    devOrigin: 'http://localhost:3001',
    prodOrigin: 'https://deriv-trading.vercel.app',
  },
  {
    key: 'rise-fall',
    label: 'Rise & Fall',
    path: '/rise-fall',
    icon: '↕',
    accent: 'text-orange-400',
    devOrigin: 'http://localhost:3002',
    prodOrigin: 'https://deriv-trading-rise-fall.vercel.app',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: '◎',
    accent: 'text-sky-400',
    devOrigin: 'http://localhost:3004',
    // TODO: replace with your Vercel deployment URL after creating the analytics project
    prodOrigin: 'https://binarymatix-analytics.vercel.app',
  },
];

/** Match a shell pathname (e.g. `/digits/reports`) to its sub-app. */
export function matchSubApp(pathname: string): SubApp | null {
  return SUB_APPS.find((a) => pathname === a.path || pathname.startsWith(a.path + '/')) ?? null;
}

/**
 * Build the iframe src for a sub-app given the shell's current pathname.
 * Strips the shell base segment so the sub-app receives its own internal path.
 * e.g. shell `/digits/reports` + digits origin → `https://…/reports`
 */
export function buildIframeSrc(app: SubApp, pathname: string, isDev: boolean): string {
  const origin = isDev ? app.devOrigin : app.prodOrigin;
  const internalPath = pathname.slice(app.path.length) || '/';
  return origin + internalPath;
}
