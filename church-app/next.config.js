/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ddqdfilyncsgedphdzok.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
}

module.exports = nextConfig
