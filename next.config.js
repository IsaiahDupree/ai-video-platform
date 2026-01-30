/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  // Enable React 18 features
  reactStrictMode: true,

  // Configure for standalone deployment
  output: 'standalone',

  // Turbopack config
  turbopack: {},

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Ignore missing compositor packages in production builds
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@remotion\/compositor-/,
      })
    );

    if (!isServer) {
      // On the client, skip Remotion entirely
      config.externals = {
        ...config.externals,
        '@remotion/bundler': '@remotion/bundler',
        '@remotion/renderer': '@remotion/renderer',
      };

      // Also alias them for webpack
      config.resolve.alias = {
        ...config.resolve.alias,
        '@remotion/bundler': false,
        '@remotion/renderer': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
