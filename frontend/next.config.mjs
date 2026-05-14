/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.ggpht.com' },
      { protocol: 'https', hostname: 'media.tenor.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    // Reduce file watcher limits in dev mode to prevent EMFILE errors
    if (!isServer) {
      config.watchOptions = {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: ['**/node_modules', '**/.next', '**/dist'],
      };
    }
    return config;
  },
};

export default nextConfig;
