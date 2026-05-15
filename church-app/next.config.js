/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'ddqdfilyncsgedphdzok.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256],
    // Allow unoptimized for avatar URLs that carry cache-bust query params
    unoptimized: false,
  },
}

module.exports = nextConfig
