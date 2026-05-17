/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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

module.exports = nextConfig
