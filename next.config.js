/** @type {import('next').NextConfig} */

// Parse Supabase hostname safely (NEXT_PUBLIC_SUPABASE_URL may not be set during CI build)
let supabaseHostname = '*.supabase.co';
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {}

const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  images: {
    remotePatterns: [
      // Supabase storage
      { protocol: 'https', hostname: supabaseHostname },
      // Fallback for any supabase project
      { protocol: 'https', hostname: '**.supabase.co' },
      // Unsplash for hotel hero images
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,

  // Silence non-critical warnings in CI
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/api/webhooks/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/api/health',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

module.exports = nextConfig;
