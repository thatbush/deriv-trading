import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@deriv/core'],
  turbopack: {
    resolveAlias: {
      '@deriv/core': '../accumulators/packages/core/src',
    },
  },
  // No rewrites: sub-apps are loaded directly from their own origins inside the
  // shell iframe (see lib/sub-apps.ts). Proxying /digits etc. through the home
  // app would collide with the catch-all shell routes and recurse the shell.
};

export default nextConfig;
