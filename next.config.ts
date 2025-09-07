import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add turbopack.root configuration to fix workspace root warning
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
