import type { NextConfig } from 'next';
import { RETIRED_COUNTRY_SLUGS } from './src/lib/countries';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg'],
  output: 'standalone',
  // Country pages retired for lack of real mobile stock — send old links (and
  // their search rankings) to the locations list instead of a 404.
  redirects: async () =>
    RETIRED_COUNTRY_SLUGS.map((slug) => ({
      source: `/mobile-proxies/${slug}`,
      destination: '/#locations',
      permanent: true,
    })),
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store' },
      ],
    },
  ],
};

export default nextConfig;
