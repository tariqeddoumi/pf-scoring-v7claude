/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  // Skip static generation for API routes
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
