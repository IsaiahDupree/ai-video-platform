/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React 18 features
  reactStrictMode: true,

  // Configure for standalone deployment
  output: 'standalone',

  // Turbopack config (silence warning)
  turbopack: {},

  // Image optimization
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
