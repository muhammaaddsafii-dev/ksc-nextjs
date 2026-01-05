/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.kurniasylva.com',
      },
    ],
  },
}

module.exports = nextConfig