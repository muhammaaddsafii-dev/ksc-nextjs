/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'https://be-ksc-278881327745.asia-southeast1.run.app',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.kurniasylva.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig