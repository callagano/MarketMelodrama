/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Enhanced development settings for auto-preview
  experimental: {
    // Enable fast refresh for better development experience
    fastRefresh: true,
  },
  // Development server configuration
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // Webpack configuration for faster builds
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize for development speed
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
};

module.exports = nextConfig; 