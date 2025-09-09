/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: './', // Explicitly set root to silence warning
  },
  webpack: (config) => {
    // Only apply webpack config when not using Turbopack
    if (process.env.TURBOPACK) {
      return config; // Skip webpack modifications for Turbopack
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;