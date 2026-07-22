import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const nextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory can't
  // make Next resolve `.next` (and file tracing) against the wrong root.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'developer.accuweather.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
