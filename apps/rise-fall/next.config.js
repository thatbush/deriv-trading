/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@deriv/core'],
  allowedDevOrigins: ['192.168.1.68'],
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://deriv-trading-rise-fall.vercel.app' : undefined,
}

module.exports = nextConfig
