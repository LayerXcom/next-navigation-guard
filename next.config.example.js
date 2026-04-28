// Example Next.js configuration to replace next/link with next-navigation-guard's Link
// This works with both Webpack and Turbopack

const path = require('path');

module.exports = {
  // For Webpack (Next.js default bundler)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace next/link with our wrapper
        'next/link': path.resolve(__dirname, 'node_modules/next-navigation-guard/dist/link-wrapper.js'),
      };
    }
    return config;
  },
  
  // For Turbopack (now stable)
  turbopack: {
    resolveAlias: {
      // Replace next/link with our wrapper
      'next/link': 'next-navigation-guard/dist/link-wrapper.js',
    },
  },
};