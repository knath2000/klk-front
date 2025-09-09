const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;