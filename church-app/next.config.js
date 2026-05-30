/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,

  // Rewrite /sitemap.xml → /api/sitemap so Google gets pure XML from an API
  // route, not an HTML-wrapped Next.js page. This is the fix for the
  // "Failed to fetch" error in Google Search Console.
  async rewrites() {
    return [
      {
        source:      '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'ddqdfilyncsgedphdzok.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256],
    unoptimized: false,
  },
}

module.exports = nextConfig
