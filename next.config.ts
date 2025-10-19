import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow cross-origin requests from EC2 public IP
  experimental: {
    allowedDevOrigins: ['http://3.93.171.8:3000', 'http://localhost:3000', 'http://speakeasy.health:3000'],
  },

  // Production configuration
  output: 'standalone',

  // Suppress warnings for known issues
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  }
}

export default nextConfig
