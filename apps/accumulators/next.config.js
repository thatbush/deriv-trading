/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@deriv/core'],
  allowedDevOrigins: ['192.168.1.68'],
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://deriv-trading.vercel.app' : undefined,
}

module.exports = nextConfig
