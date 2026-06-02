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
  /** Full brand color theme used on the homepage card and shell nav icon */
  brand: {
    accent: string;       // icon text color (active nav)
    accentDim: string;    // icon text color (inactive nav)
    iconBg: string;       // icon background on homepage card
    hoverBorder: string;  // hover border on homepage card
    linkColor: string;    // "Open →" link color on homepage card
  };
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
    brand: {
      // primary: rgb(0 81 255) — blue
      accent: 'text-blue-500',
      accentDim: 'text-blue-700 dark:text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      hoverBorder: 'hover:border-blue-500',
      linkColor: 'text-blue-600 dark:text-blue-400',
    },
    devOrigin: 'http://localhost:3003',
    prodOrigin: 'https://binarymatix.vercel.app',
  },
  {
    key: 'accumulators',
    label: 'Accumulators',
    path: '/accumulators',
    icon: '↑',
    brand: {
      // primary: rgb(255 174 38) — amber
      accent: 'text-amber-400',
      accentDim: 'text-amber-600 dark:text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-950',
      hoverBorder: 'hover:border-amber-400',
      linkColor: 'text-amber-600 dark:text-amber-400',
    },
    devOrigin: 'http://localhost:3001',
    prodOrigin: 'https://deriv-trading.vercel.app',
  },
  {
    key: 'rise-fall',
    label: 'Rise & Fall',
    path: '/rise-fall',
    icon: '↕',
    brand: {
      // primary: rgb(0 195 144) — emerald
      accent: 'text-emerald-400',
      accentDim: 'text-emerald-600 dark:text-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950',
      hoverBorder: 'hover:border-emerald-400',
      linkColor: 'text-emerald-600 dark:text-emerald-400',
    },
    devOrigin: 'http://localhost:3002',
    prodOrigin: 'https://deriv-trading-rise-fall.vercel.app',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: '◎',
    brand: {
      // primary: rgb(0 81 255) — blue (same as digits)
      accent: 'text-blue-500',
      accentDim: 'text-blue-700 dark:text-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      hoverBorder: 'hover:border-blue-500',
      linkColor: 'text-blue-600 dark:text-blue-400',
    },
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
