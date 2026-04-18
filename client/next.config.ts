import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a self-contained build under .next/standalone — required for
  // running with `node server.js` directly in production (no npm wrapper).
  output: 'standalone',
};

export default nextConfig;
