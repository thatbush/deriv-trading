/** @type {import('next').NextConfig} */
const nextConfig = {
  // SmartCharts' Flutter renderer does not survive React StrictMode's dev-only
  // mount→unmount→remount cycle (its chart subscribe never re-fires, leaving the
  // chart blank in dev). Disable StrictMode so dev matches prod behaviour.
  reactStrictMode: false,
  transpilePackages: ['@deriv/core'],
  allowedDevOrigins: ['192.168.1.68'],
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://deriv-trading.vercel.app' : undefined,
}

module.exports = nextConfig
