/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@deriv/core'],
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_APP_URL ?? '') : undefined,
}

module.exports = nextConfig