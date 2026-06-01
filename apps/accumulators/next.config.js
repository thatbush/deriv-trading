/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@deriv/core'],
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://deriv-trading.vercel.app' : undefined,
}

module.exports = nextConfig
