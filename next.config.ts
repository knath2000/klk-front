import type { NextConfig } from "next";

// This file is deprecated as a standalone config. Delegate to the canonical JS config
// to avoid having multiple conflicting Next.js configs.
const nextConfig = require('./next.config.js') as NextConfig;
export default nextConfig;
