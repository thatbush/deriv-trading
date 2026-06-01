import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          { source: '/accumulators', destination: 'http://localhost:3001/' },
          { source: '/accumulators/:path*', destination: 'http://localhost:3001/:path*' },
          { source: '/rise-fall', destination: 'http://localhost:3002/' },
          { source: '/rise-fall/:path*', destination: 'http://localhost:3002/:path*' },
          { source: '/digits', destination: 'http://localhost:3003/' },
          { source: '/digits/:path*', destination: 'http://localhost:3003/:path*' },
        ],
        afterFiles: [],
        fallback: [],
      };
    }
    return { beforeFiles: [], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
