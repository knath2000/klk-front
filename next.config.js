const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: path.resolve(__dirname), // Use absolute path
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'klk-front.vercel.app',
      },
    ],
  },

  // Performance & build optimizations
  // swcMinify removed (Next 15+ manages SWC minification by default)
  productionBrowserSourceMaps: false,
  experimental: {
    // Help tree-shake heavy packages like framer-motion and lucide-react
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);