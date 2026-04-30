import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  },
  images: {
    remotePatterns: [
      {
        hostname: 'loremflickr.com',
        protocol: 'https',
      },
      {
        hostname: 'picsum.photos',
        protocol: 'https',
      },
    ],
  },
}

export default nextConfig
