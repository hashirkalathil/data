import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY', // Prevent clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff', // Prevent MIME-type sniffing
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
