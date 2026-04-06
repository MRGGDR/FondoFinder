/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Cache GeoJSON estáticos por 7 días — rara vez cambian
        source: '/:file*.geojson',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use file-based source maps instead of eval() wrappers.
      // This prevents "Invalid or unexpected token" SyntaxErrors caused
      // by partially-written bundles when the dev server is interrupted.
      config.devtool = 'cheap-module-source-map'
    }
    return config
  },
}

module.exports = withPWA(nextConfig)
