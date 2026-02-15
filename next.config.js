/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['mapbox-gl'],
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'geotiff']
  },
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
